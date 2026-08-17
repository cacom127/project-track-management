# Delta Spec — CHANGE-007-projects-list-create

- **Ticket ID**: CHANGE-007-projects-list-create
- **Module bị ảnh hưởng**: `specs/projects.md` (MỚI — chưa tồn tại)
- **Loại thay đổi**: ☒ Thêm mới &nbsp; ☐ Sửa &nbsp; ☐ Xoá

## 1. Yêu cầu thay đổi (EARS notation)

- **[PROJ-01] (MỚI)** When an authenticated user requests
  `GET /projects`, the system shall return a paginated list of projects
  (`page`, `page_size`, default `page_size=20`) ordered by `created_at`
  descending by default.
- **[PROJ-02] (MỚI)** When `GET /projects` includes query param `q`, the
  system shall filter to projects whose `customer_name`, `project_name`,
  `description`, or any associated tech tag name contains `q`
  (case-insensitive).
- **[PROJ-03] (MỚI)** When `GET /projects` includes one or more
  `technology` query params, the system shall filter to projects that
  have ALL of the specified tech tags (AND semantics).
- **[PROJ-04] (MỚI)** When `GET /projects` includes one or more
  `project_type` query params, the system shall filter to projects that
  have ANY of the specified project types (OR semantics).
- **[PROJ-05] (MỚI)** When an authenticated user submits
  `POST /projects` with valid data, the system shall create a new
  project record and return `201` with the created object.
- **[PROJ-06] (MỚI)** `POST /projects` shall require `customer_name`,
  `project_name`, and `start_date`; missing any of these shall return
  `400`.
- **[PROJ-07] (MỚI)** When `is_ongoing` is `true`, the system shall
  reject (`400`) a request where `end_date` is not `null` — validated
  server-side regardless of what the client sends.
- **[PROJ-08] (MỚI)** When `POST /projects` includes `project_types`
  values outside the fixed catalog (`offshore`, `ses`, `lab`, `new_dev`,
  `maintenance`), the system shall return `400`.
- **[PROJ-09] (MỚI)** When `POST /projects` includes `technologies`
  values that do not yet exist as a tech tag, the system shall create
  the tag automatically (case-insensitive match against existing tags
  before creating a new one, to avoid near-duplicate tags).
- **[PROJ-10] (MỚI)** The system shall record `created_by` (Cognito user
  identifier) on every project at creation time, for future edit/delete
  permission checks (not enforced in this ticket).
- **[PROJ-11] (MỚI)** When an authenticated user requests
  `GET /tech-tags?q=<keyword>`, the system shall return existing tag
  names matching `<keyword>` (case-insensitive), for autocomplete.
- **[PROJ-12] (MỚI)** Every route under this module shall require a
  valid JWT (already enforced globally since `CHANGE-005-auth-module`);
  no role-based restriction is applied to `GET`/`POST /projects` in this
  ticket.

## 1c. Thay đổi UI

Ticket này đụng 2 màn hình mới với state matrix riêng (List, Tạo dự án)
→ tách sang file riêng theo CLAUDE.md mục 5: xem `ui-delta-spec.md` cùng
thư mục. Khi merge, nội dung đó fold vào `specs/projects-ui.md` (file
mới).

## 1b. Thay đổi Data Model

> Entity đã có sẵn trong `specs/data-model.md` mục 1 (ER diagram) từ
> `CHANGE-002-architecture` — ticket này chỉ định nghĩa field-level chi
> tiết lần đầu trong `specs/projects.md`, KHÔNG đổi quan hệ giữa các
> bảng, nên KHÔNG cần sửa `specs/data-model.md`.

- **[DM-PROJ-01] (MỚI — bảng)** `projects`: `id` (PK, bigint identity),
  `customer_name` (string, not null), `project_name` (string, not null),
  `description` (text, nullable), `start_date` (date, not null),
  `end_date` (date, nullable), `is_ongoing` (bool, not null, default
  false), `team_size` (int, nullable), `total_man_month` (decimal,
  nullable), `source_note` (text, nullable), `created_by` (string —
  Cognito `sub`, not null), `created_at`/`updated_at` (timestamp, theo
  `DM-G02`).
- **[DM-PROJ-02] (MỚI — bảng)** `tech_tags`: `id` (PK), `name` (string,
  unique, case-insensitive).
- **[DM-PROJ-03] (MỚI — bảng nối)** `project_tech_tags`: `project_id`
  (FK → `projects.id`), `tag_id` (FK → `tech_tags.id`).
- **[DM-PROJ-04] (MỚI — bảng)** `project_types`: `id` (PK), `code`
  (string, unique) — catalog cố định, seed đúng 5 dòng qua migration:
  `offshore`, `ses`, `lab`, `new_dev`, `maintenance`. Không có API tạo
  thêm dòng.
- **[DM-PROJ-05] (MỚI — bảng nối)** `project_project_types`:
  `project_id` (FK → `projects.id`), `project_type_id` (FK →
  `project_types.id`).

## 2. Acceptance criteria / Test mapping

| ID | Test case tương ứng (file/tên) |
|---|---|
| PROJ-01 | `TC-PROJ-01: List trả đúng phân trang, sort mặc định` |
| PROJ-02 | `TC-PROJ-02: Search theo q khớp customer/project/description/tag` |
| PROJ-03 | `TC-PROJ-03: Filter technology — AND nhiều tag` |
| PROJ-04 | `TC-PROJ-04: Filter project_type — OR nhiều loại` |
| PROJ-05 | `TC-PROJ-05: Tạo project thành công trả 201` |
| PROJ-06 | `TC-PROJ-06: Thiếu field bắt buộc trả 400` |
| PROJ-07 | `TC-PROJ-07: is_ongoing=true kèm end_date trả 400` |
| PROJ-08 | `TC-PROJ-08: project_type ngoài enum trả 400` |
| PROJ-09 | `TC-PROJ-09: Tag mới tự tạo, tag trùng (khác hoa/thường) không tạo lại` |
| PROJ-10 | `TC-PROJ-10: created_by được set đúng theo JWT sub` |
| PROJ-11 | `TC-PROJ-11: Autocomplete tech-tags trả đúng kết quả khớp q` |
| PROJ-12 | `TC-PROJ-12: Gọi API không kèm JWT trả 401` |

## 3. Ghi chú cho AI agent khi implement

- Dùng `app.core.db` (module cô lập DB access có sẵn) — không tự mở
  connection/RDS Data API client riêng trong route handler.
- Migration bằng Alembic (theo `specs/data-model.md` mục 3) — file
  migration seed `project_types` phải idempotent (dùng `INSERT ...
  ON CONFLICT DO NOTHING` hoặc tương đương) để chạy lại an toàn.
- Case-insensitive match cho `tech_tags.name`: dùng `LOWER(name)` trong
  query so sánh/tạo mới, không dựa vào constraint DB case-sensitive mặc
  định của PostgreSQL.
- Không tạo endpoint `POST /tech-tags` riêng — tag chỉ được tạo như
  side-effect của `POST /projects` (xem `plan.md` mục 2).
- **Fix phát sinh ở `app/core/db.py` (T3)**: interface `DBSession` trước
  đây không nhất quán giữa 2 nhánh — nhánh Data API trả `list[dict]`,
  nhánh SQLAlchemy trả thẳng `CursorResult` (không lộ ra vì `health` chỉ
  chạy `SELECT 1` rồi bỏ qua kết quả). Đã chuẩn hoá `execute()` trả
  `list[dict]` ở CẢ 2 nhánh, và thêm `commit()` tường minh (no-op ở Data
  API, gọi `session.commit()` thật ở SQLAlchemy) — cần thiết vì
  `projects` là module đầu tiên thực sự ghi dữ liệu qua interface này.
- **Test infra mới (`backend/tests/conftest.py`)**: fixture `db_session`
  dùng SAVEPOINT (nested transaction) để mỗi test tự rollback dù code
  gọi `db.commit()` thật — tái dùng được cho mọi module sau này cần test
  với Postgres thật (không chỉ mock như `test_db_data_api.py`).
- **CI cần thêm bước `alembic upgrade head`** trước khi chạy `pytest`
  (trước đây không cần vì không có bảng nào để test) — đã cập nhật
  `.github/workflows/ci.yml`.
- **Rủi ro chưa verify được (theo dõi ở T12 — post-deploy smoke test)**:
  cột `technologies`/`project_types` trả về qua `array_agg` (Postgres
  ARRAY) — RDS Data API có thể trả field này dạng `arrayValue` (cấu trúc
  lồng) thay vì string đơn giản, khác hành vi ở local (SQLAlchemy). Cần
  gọi thật `GET /projects` trên production sau khi deploy để xác nhận
  `technologies`/`project_types` parse đúng, không tự tin chỉ vì test
  local pass.
- **Validation error trả `400` (PROJ-06/07/08)**: FastAPI mặc định trả
  `422` cho lỗi validate Pydantic body — thêm exception handler global
  cho `RequestValidationError` trong `app/main.py` để đổi thành `400`,
  khớp với catalog `ERR-02` (`specs/cross-cutting/error-handling.md`).
  Áp dụng cho MỌI route có request body, không riêng `projects`. Lưu ý:
  `exc.errors()` khi validator custom raise `ValueError` thường (trong
  `model_validator`) chứa field `ctx.error` là raw exception object,
  KHÔNG serialize JSON trực tiếp được — phải bọc qua
  `fastapi.encoders.jsonable_encoder` trước khi trả response.
- **`app/core/auth.py` (mới)**: dependency `get_current_user_id` lấy
  Cognito `sub` — production đọc từ `request.scope["aws.event"]` (Mangum
  giữ nguyên Lambda event, claims đã được API Gateway JWT Authorizer
  verify trước khi forward); local dev decode thẳng payload JWT từ
  header `Authorization` KHÔNG verify chữ ký (không có ranh giới bảo mật
  thật ở local, cùng cách tiếp cận với `decodeIdToken()` phía frontend).
  Dùng chung cho MỌI route cần biết "ai đang gọi", không riêng `projects`.
