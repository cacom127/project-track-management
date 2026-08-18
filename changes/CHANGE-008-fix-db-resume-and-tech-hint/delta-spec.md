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
