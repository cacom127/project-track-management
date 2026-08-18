# Delta Spec — CHANGE-008-fix-db-resume-and-tech-hint

- **Ticket ID**: CHANGE-008-fix-db-resume-and-tech-hint
- **Module bị ảnh hưởng**: `specs/architecture.md` (cross-cutting, mục 4),
  `specs/projects-ui.md` (UI-PROJ-02-3)
- **Loại thay đổi**: ☐ Thêm mới &nbsp; ☒ Sửa &nbsp; ☐ Xoá

## 1. Yêu cầu thay đổi (EARS notation)

- **[ARCH-21] (MỚI)** When a RDS Data API call fails with
  `DatabaseResumingException` (Aurora Serverless v2 đang wake up sau
  auto-pause), the system shall retry up to 3 lần, chờ 2 giây giữa mỗi
  lần, trước khi trả lỗi cho client — áp dụng cho MỌI truy vấn DB qua
  `DataApiSession`, không riêng module nào.
- **[PROJ-13] (MỚI)** `POST /projects` shall explicitly cast `start_date`/
  `end_date` parameters to `::date` and `total_man_month` to `::numeric`
  in the SQL — RDS Data API does not implicitly cast bound `stringValue`/
  `doubleValue` parameters to the target column type the way local
  SQLAlchemy/psycopg does.
- **[UI-PROJ-02-3] (SỬA)**
  - Cũ: ô nhập technology không có hướng dẫn cách thêm tag.
  - Mới: ô nhập có placeholder "入力してEnterで追加（複数可）" + hint chữ
    nhỏ dưới field xác nhận rõ có thể thêm nhiều tag bằng Enter.

## 1c. Thay đổi UI

Chỉ 1 dòng UI đơn giản (placeholder + hint text), không tách file riêng
— ghi thẳng ở mục 1 trên (theo CLAUDE.md mục 5).

## 2. Acceptance criteria / Test mapping

| ID | Test case tương ứng (file/tên) |
|---|---|
| ARCH-21 | `TC-ARCH-21: DatabaseResumingException retry 3 lần rồi thành công / hết lượt vẫn raise` |
| PROJ-13 | Verify qua toàn bộ test hiện có (`test_repository.py`, `test_create_route.py`) — SQL có cast vẫn chạy đúng qua SQLAlchemy; verify Data API thật ở T3 (không mô phỏng được ở dev) |
| UI-PROJ-02-3 | (không có test tự động cho text tĩnh — verify bằng mắt) |

## 3. Ghi chú cho AI agent khi implement

- **Root cause (systematic-debugging)**: `POST /projects` trả `500`
  "Internal Server Error" (không phải JSON `{"detail":...}` — nghĩa là
  crash trước khi tới FastAPI exception handler). Traceback thật từ
  CloudWatch Logs xác nhận: `botocore.errorfactory.DatabaseResumingException`
  khi Aurora Serverless v2 đang resume sau auto-pause (capacity 0-1 ACU,
  `specs/architecture.md` mục 3 đã chấp nhận độ trễ này nhưng CHƯA từng
  implement retry — bug tiềm ẩn từ `CHANGE-006-deploy-production`, chỉ
  lộ ra khi `projects` là route ghi dữ liệu đầu tiên bị gọi sau Aurora
  idle lâu).
- Fix ở `app/core/db.py` (`DataApiSession.execute()`), KHÔNG riêng
  `app/projects/` — mọi module dùng DB qua Data API đều được hưởng lợi
  (bao gồm cả `GET /health` dù route đó tự bắt exception nên không lộ
  bug này ra).
- Nhận diện lỗi qua `exc.response["Error"]["Code"] ==
  "DatabaseResumingException"` (không dùng
  `client.exceptions.DatabaseResumingException` để tránh phải mock đúng
  class thật trong test — xem `_is_database_resuming` trong `db.py`).
- 3 lần retry, mỗi lần cách 2 giây (tổng tối đa ~6s chờ) — khớp kỳ vọng
  "vài giây wake up" đã ghi trong `specs/architecture.md` mục 3. Nếu sau
  này thấy 6s chưa đủ (Aurora resume lâu hơn), tăng
  `DB_RESUME_MAX_RETRIES`/`DB_RESUME_RETRY_DELAY_SECONDS` trong `db.py`.

**Bug thứ 2 phát hiện sau khi fix ARCH-21 (retry) — vẫn lỗi `500` nhưng
khác nguyên nhân hoàn toàn:**

- Traceback CloudWatch lần 2: `botocore.errorfactory.DatabaseErrorException:
  ... column "start_date" is of type date but expression is of type
  text; Hint: You will need to rewrite or cast the expression`. RDS
  Data API KHÔNG tự cast tham số `stringValue`/`doubleValue` sang kiểu
  cột đích (`date`/`numeric`) như psycopg/SQLAlchemy làm ở local — đây
  đúng là rủi ro "Data API khác hành vi local" đã cảnh báo ở
  `CHANGE-007` (dù lúc đó ghi nhầm là rủi ro của `array_agg`, thực tế
  lộ ra ở chỗ khác — parameter binding cho `date`/`numeric`).
- Fix: thêm `::date`/`::numeric` tường minh trong SQL `INSERT` của
  `create_project` (PROJ-13). LƯU Ý: phải viết `:start_date ::date` (CÓ
  khoảng trắng trước `::`) — viết dính liền `:start_date::date` khiến
  SQLAlchemy's `text()` KHÔNG nhận diện được đây là bind parameter (để
  nguyên literal trong SQL đã compile, gây lỗi syntax error hoàn toàn
  khác khi test lại ở SQLAlchemy/local — phát hiện qua chạy lại test
  suite ngay sau khi thêm cast, không phải giả định suông).
