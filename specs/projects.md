# Module: Projects — Current Truth

> File này mô tả TRẠNG THÁI HIỆN TẠI đã chốt của module `projects`.
> Không ghi ở đây các đề xuất đang bàn — những cái đó thuộc về `changes/`.

## 1. Mục đích module

CRUD thông tin dự án đã/đang thực hiện với khách hàng Nhật (`specs/vision.md`
mục 2). Ticket đầu tiên (`CHANGE-007-projects-list-create`) chỉ làm
**List + Create** — sửa/xoá, xem chi tiết, file đính kèm, và phân quyền
theo role đều để dành ticket sau.

## 2. Yêu cầu hiện tại (Requirements — EARS notation)

- **[PROJ-01]** When an authenticated user requests `GET /projects`, the
  system shall return a paginated list of projects (`page`, `page_size`,
  default `page_size=20`) ordered by `created_at` descending by default.
- **[PROJ-02]** When `GET /projects` includes query param `q`, the
  system shall filter to projects whose `customer_name`, `project_name`,
  `description`, or any associated tech tag name contains `q`
  (case-insensitive).
- **[PROJ-03]** When `GET /projects` includes one or more `technology`
  query params, the system shall filter to projects that have ALL of
  the specified tech tags (AND semantics).
- **[PROJ-04]** When `GET /projects` includes one or more `project_type`
  query params, the system shall filter to projects that have ANY of
  the specified project types (OR semantics).
- **[PROJ-05]** When an authenticated user submits `POST /projects`
  with valid data, the system shall create a new project record and
  return `201` with the created object.
- **[PROJ-06]** `POST /projects` shall require `customer_name`,
  `project_name`, and `start_date`; missing any of these shall return
  `400`.
- **[PROJ-07]** When `is_ongoing` is `true`, the system shall reject
  (`400`) a request where `end_date` is not `null` — validated
  server-side regardless of what the client sends.
- **[PROJ-08]** When `POST /projects` includes `project_types` values
  outside the fixed catalog (`offshore`, `ses`, `lab`, `new_dev`,
  `maintenance`), the system shall return `400`.
- **[PROJ-09]** When `POST /projects` includes `technologies` values
  that do not yet exist as a tech tag, the system shall create the tag
  automatically (case-insensitive match against existing tags before
  creating a new one, to avoid near-duplicate tags).
- **[PROJ-10]** The system shall record `created_by` (Cognito user
  identifier) on every project at creation time, for future edit/delete
  permission checks (not enforced yet).
- **[PROJ-11]** When an authenticated user requests
  `GET /tech-tags?q=<keyword>`, the system shall return existing tag
  names matching `<keyword>` (case-insensitive), for autocomplete.
- **[PROJ-12]** Every route under this module shall require a valid
  JWT (enforced globally since `CHANGE-005-auth-module`); no
  role-based restriction is applied to `GET`/`POST /projects` yet.

## 3. Ràng buộc kỹ thuật đã chốt

- `technologies`/`project_types` lưu qua bảng catalog + bảng nối N-N
  (`tech_tags`/`project_types` + bảng nối tương ứng) — KHÔNG dùng cột
  JSON array, để khớp đúng ER diagram đã thống nhất sẵn trong
  `specs/data-model.md` (từ `CHANGE-002-architecture`).
- `project_types` là catalog **cố định** (5 dòng, seed qua migration) —
  không có API tạo thêm dòng. `tech_tags` tự tạo record mới khi user
  nhập tag chưa tồn tại (side-effect của `POST /projects`, không có
  endpoint `POST /tech-tags` riêng).
- Filter `technology`: AND giữa nhiều giá trị. Filter `project_type`:
  OR giữa nhiều giá trị.
- Query DB bằng raw SQL string qua `DBSession`/`get_db_session`
  (`app/core/db.py`) — KHÔNG dùng SQLAlchemy ORM model, vì production
  chạy qua RDS Data API (không có ORM tương thích cả 2 nhánh
  local/Data API).
- Áp dụng migration lên Aurora production qua
  `backend/scripts/apply_migration_via_data_api.py` (sinh SQL bằng
  `alembic upgrade <rev>:head --sql`, chạy qua RDS Data API
  `begin/commit/rollback_transaction`) — production không có kết nối
  trực tiếp tới Aurora (không VPC/bastion). Script PHẢI chạy dạng module
  (`uv run python -m scripts.apply_migration_via_data_api` từ thư mục
  `backend/`), cần `AWS_PROFILE`/`AWS_DEFAULT_REGION`/`DB_CLUSTER_ARN`/
  `DB_SECRET_ARN` tường minh trong terminal chạy — xem docstring trong
  file đó. `DbClusterArn`/`DbSecretArn` lấy từ `CfnOutput` của CDK stack.
- `app/core/auth.py` (`get_current_user_id`): lấy Cognito `sub` —
  production đọc từ `request.scope["aws.event"]` (Mangum giữ nguyên
  Lambda event, claims đã được API Gateway JWT Authorizer verify trước
  khi forward); local dev decode thẳng payload JWT từ header
  `Authorization` KHÔNG verify chữ ký (không có ranh giới bảo mật thật ở
  local, cùng cách tiếp cận với `decodeIdToken()` phía frontend). Dùng
  chung cho MỌI route cần biết "ai đang gọi", không riêng module này.
- Validation error trả `400` (không phải `422` mặc định của FastAPI) —
  exception handler global cho `RequestValidationError` trong
  `app/main.py`, áp dụng cho MỌI route có request body. Lỗi từ
  `model_validator` raise `ValueError` thường phải bọc qua
  `fastapi.encoders.jsonable_encoder` trước khi trả JSON (raw exception
  object trong `ctx.error` không serialize trực tiếp được).
- `app/core/db.py`: `execute()` trả `list[dict[str, Any]]` nhất quán ở
  CẢ 2 nhánh (trước đây nhánh SQLAlchemy trả thẳng `CursorResult`, không
  lộ ra vì `health` chỉ chạy `SELECT 1`); `commit()` tường minh (no-op ở
  Data API, `session.commit()` thật ở SQLAlchemy).
- `backend/tests/conftest.py`: fixture `db_session` dùng SAVEPOINT
  (nested transaction) để mỗi test tự rollback dù code gọi `db.commit()`
  thật — dùng Postgres thật (local qua docker-compose), không chỉ mock.
  CI cần chạy `alembic upgrade head` trước `pytest`.

## 4. Data Model

Entity thuộc module này (field-level chi tiết — xem `specs/data-model.md`
mục 1/2 cho ER diagram tổng quan/bảng mapping):

- **`projects`**: `id` (PK, bigint identity), `customer_name` (string,
  not null), `project_name` (string, not null), `description` (text,
  nullable), `start_date` (date, not null), `end_date` (date, nullable),
  `is_ongoing` (bool, not null, default false), `team_size` (int,
  nullable), `total_man_month` (decimal, nullable), `source_note` (text,
  nullable), `created_by` (string — Cognito `sub`, not null),
  `created_at`/`updated_at` (timestamp, theo `DM-G02`).
- **`tech_tags`**: `id` (PK), `name` (string, unique case-insensitive
  qua index `lower(name)`).
- **`project_tech_tags`** (bảng nối N-N `projects`↔`tech_tags`):
  `project_id` (FK), `tag_id` (FK).
- **`project_types`**: `id` (PK), `code` (string, unique) — catalog cố
  định, seed đúng 5 dòng: `offshore`, `ses`, `lab`, `new_dev`,
  `maintenance`.
- **`project_project_types`** (bảng nối N-N `projects`↔`project_types`):
  `project_id` (FK), `project_type_id` (FK).

## 5. UI

Layout, state, hành vi tương tác chi tiết: xem `specs/projects-ui.md`.

## 6. Lịch sử thay đổi module này

| Ngày       | Ticket ID                       | Thay đổi                                          |
|------------|-----------------------------------|-------------------------------------------------------|
| 2026-08-18 | CHANGE-007-projects-list-create  | Khởi tạo module: List + Create (PROJ-01..12), chưa có Edit/Delete/Detail/file đính kèm |

<!-- Trỏ về changes/_archive/CHANGE-007-projects-list-create/ để xem đầy đủ proposal/plan gốc -->
