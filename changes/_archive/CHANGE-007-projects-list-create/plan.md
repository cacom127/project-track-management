# Plan — CHANGE-007-projects-list-create

- **Ticket ID**: CHANGE-007-projects-list-create
- **Dựa trên**: `proposal.md` cùng thư mục

## 1. Kiến trúc / thiết kế kỹ thuật

Không đổi kiến trúc hệ thống (`specs/architecture.md`) — thêm module
nghiệp vụ `projects` chạy trong cùng Lambda FastAPI đã có, dùng Aurora
Serverless v2 qua RDS Data API (production) / PostgreSQL local (dev),
đúng nguyên tắc cô lập DB access (`app.core.db`).

```
[React SPA] --GET/POST /projects, GET /tech-tags--> [API Gateway]
        --> [Lambda FastAPI] --> [Aurora Serverless v2 / local Postgres]
```

Bảng mới (khớp `specs/data-model.md` mục 1, không cần sửa file đó):

```
projects (id, customer_name, project_name, description, start_date,
          end_date NULL, is_ongoing, team_size NULL, total_man_month NULL,
          source_note, created_by, created_at, updated_at)

tech_tags (id, name UNIQUE)
project_tech_tags (project_id FK, tag_id FK)          -- bảng nối N-N

project_types (id, code UNIQUE)                        -- catalog cố định,
                                                        -- seed 5 dòng qua
                                                        -- migration, KHÔNG
                                                        -- cho tạo thêm qua API
project_project_types (project_id FK, project_type_id FK)  -- bảng nối N-N
```

## 2. Quyết định kỹ thuật quan trọng

| Quyết định | Lý do |
|---|---|
| Dùng bảng catalog + bảng nối cho `technologies`/`project_types`, KHÔNG dùng cột JSON array | Khớp đúng ER diagram đã thống nhất sẵn trong `specs/data-model.md` (từ `CHANGE-002-architecture`) — tránh phải sửa data-model.md, giữ nhất quán quyết định kiến trúc trước đó. Đổi lại: filter/search phức tạp hơn 1 chút (JOIN thay vì JSON containment) nhưng vẫn đơn giản ở quy mô dữ liệu này. |
| `tech_tags` tự tạo record mới khi user nhập tag chưa tồn tại (qua `POST /projects`, không cần endpoint riêng để tạo tag) | Đúng yêu cầu "multi-select + cho phép thêm mới tự do" mà không cần thêm 1 API CRUD riêng cho tag — tạo tag là side-effect của việc tạo project. |
| `project_types` là catalog CỐ ĐỊNH, seed sẵn 5 dòng qua Alembic migration, `POST /projects` chỉ được chọn trong 5 giá trị có sẵn (400 nếu khác) | `project_type` là enum nghiệp vụ cố định theo `vision.md`, không phải tag tự do như `technologies` — không cho tạo thêm qua app, tránh dữ liệu rác. |
| Filter theo `technology`: AND giữa nhiều giá trị (dự án phải có ĐỦ các tag được chọn). Filter theo `project_type`: OR giữa nhiều giá trị (dự án có BẤT KỲ loại nào được chọn) | Ngữ nghĩa tự nhiên khi search: "tìm dự án dùng React VÀ AWS" nhưng "tìm dự án offshore HOẶC ses". |
| Thêm `GET /tech-tags?q=` cho autocomplete | FE cần gợi ý tag đã tồn tại khi user gõ — tránh tạo trùng tag na ná nhau (`React` vs `react`, xử lý case-insensitive ở tầng query). |
| Pagination kiểu offset (`page`/`page_size`), không cursor-based | Quy mô dữ liệu nhỏ (vài chục-vài trăm dự án), offset đơn giản đủ dùng, không cần cursor phức tạp. |
| Search debounce 300ms phía FE trước khi gọi API | Tránh gọi API mỗi keystroke, giảm tải Lambda/Aurora không cần thiết. |
| `is_ongoing=true` bắt buộc `end_date=null` (validate 2 chiều ở backend, không chỉ tin FE) | Backend không được tin dữ liệu chỉ validate ở FE — tránh dữ liệu mâu thuẫn nếu có client khác gọi thẳng API. |
| Query DB bằng raw SQL string qua `DBSession`/`get_db_session` có sẵn, KHÔNG dùng SQLAlchemy ORM model | Kiến trúc hiện tại (từ `CHANGE-006`) đã chốt: production chạy qua RDS Data API, không có ORM tương thích cả 2 nhánh local/Data API — mọi query trong repo đều là SQL string thuần đi qua interface `DBSession` chung. |
| Áp migration lên Aurora production bằng script riêng (`alembic upgrade head --sql` sinh SQL → chạy từng câu qua Data API `boto3`), không chạy `alembic upgrade head` trực tiếp | Production không có kết nối trực tiếp tới Aurora (không VPC/bastion) — chỉ Data API dùng được. Khác với `CHANGE-006` (baseline rỗng, làm tay 1 lần), ticket này có DDL thật nên cần script tái dùng được cho các migration sau này. |

## 3. Rủi ro / đánh đổi (trade-off)

- Bảng nối N-N làm query List phức tạp hơn (cần GROUP_CONCAT/array_agg
  để gộp tags/types về lại 1 dòng project) — chấp nhận được ở quy mô dữ
  liệu nội bộ này.
- Case-insensitive matching cho `tech_tags.name` cần index phù hợp
  (`LOWER(name)` hoặc citext) để tránh tạo tag trùng khác hoa/thường —
  ghi rõ ở T2 khi implement.
- ~~`array_agg` (Postgres ARRAY) qua RDS Data API có thể trả `arrayValue`
  (cấu trúc lồng) thay vì string đơn giản, chưa test được ở môi trường
  dev~~ — **đã xác nhận KHÔNG xảy ra** khi verify thật trên production
  (T12): tạo project có `technologies`/`project_types`, xem lại
  `GET /projects` hiển thị đúng, không cần fix `_parse_data_api_records`.

## 4. Migration / rollback

- Cần migration: Có — Alembic tạo 5 bảng mới + seed `project_types`.
  Rollback: `alembic downgrade` xoá bảng (an toàn vì chưa có dữ liệu
  thật nào phụ thuộc — đây là bảng hoàn toàn mới).

## 5. Định nghĩa "Done" cho bước Plan này

- [x] Đã xác nhận thiết kế với Technical owner (namlp) — qua trao đổi
      trực tiếp trong phiên brainstorm.
- [x] Đã cập nhật `delta-spec.md` tương ứng với thiết kế này.
