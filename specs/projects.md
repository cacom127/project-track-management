# Module: Projects — Current Truth

> File này mô tả TRẠNG THÁI HIỆN TẠI đã chốt của module `projects`.
> Không ghi ở đây các đề xuất đang bàn — những cái đó thuộc về `changes/`.

## 1. Mục đích module

CRUD thông tin dự án đã/đang thực hiện với khách hàng Nhật (`specs/vision.md`
mục 2). Ticket đầu tiên (`CHANGE-007-projects-list-create`) chỉ làm
**List + Create**; `CHANGE-010-project-detail-edit-delete` bổ sung
**Detail/Edit/Delete** (soft delete); `CHANGE-011-project-attachments`
bổ sung **ảnh đính kèm** (tối đa 10 ảnh/dự án). Phân quyền theo role vẫn
để dành ticket sau.

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
- **[PROJ-13]** `POST /projects` shall explicitly cast `start_date`/
  `end_date` parameters to `::date` and `total_man_month` to
  `::numeric` in the SQL — RDS Data API does not implicitly cast bound
  parameters to the target column type the way local SQLAlchemy/psycopg
  does (bug thật gặp lúc deploy, xem
  `changes/_archive/CHANGE-008-fix-db-resume-and-tech-hint/`).
- **[PROJ-14]** When an authenticated user requests
  `GET /projects/{id}`, the system shall return the full project object
  (same shape as `ProjectOut`), or `404` if the id does not exist or is
  soft-deleted.
- **[PROJ-15]** When an authenticated user submits `PUT /projects/{id}`
  with valid data, the system shall replace all fields of the project
  (full replace, kể cả `technologies`/`project_types` — xoá hết mapping
  cũ rồi insert lại theo payload mới) and return `200`. Áp dụng lại
  validation của `POST /projects` (PROJ-06/07/08); trả `404` nếu id
  không tồn tại/đã bị xoá.
- **[PROJ-16]** When an authenticated user submits
  `DELETE /projects/{id}`, the system shall soft-delete the project
  (set `deleted_at = now()`, KHÔNG xoá bảng nối `project_tech_tags`/
  `project_project_types` để giữ lịch sử) and return `204`. Trả `404`
  nếu id không tồn tại/đã bị xoá.
- **[PROJ-17]** `GET /projects` (list) shall exclude soft-deleted
  projects (`deleted_at IS NOT NULL`) from both `items` and `total`.
- **[PROJ-18]** When an authenticated user submits
  `POST /projects/{id}/attachments/presign` with `{file_name,
  content_type}`, the system shall validate `content_type` ∈
  (`image/jpeg`, `image/png`, `image/webp`) and that the project has
  fewer than 10 attachments, then return a presigned S3 PUT URL +
  `s3_key`. Trả `400` nếu vi phạm, `404` nếu project không tồn tại/đã
  bị xoá.
- **[PROJ-19]** When the client confirms an upload via
  `POST /projects/{id}/attachments` with `{s3_key, file_name,
  content_type, size_bytes}`, the system shall re-validate the 10-image
  limit and `size_bytes` ≤ 5MB, insert an `attachments` record, and
  return it with a presigned GET URL. Trả `400` nếu vi phạm.
- **[PROJ-20]** When an authenticated user requests
  `GET /projects/{id}/attachments`, the system shall return all
  attachments of that project, each with a freshly-generated presigned
  GET URL.
- **[PROJ-21]** When an authenticated user submits
  `DELETE /projects/{id}/attachments/{attachment_id}`, the system shall
  delete both the S3 object and the DB record (hard delete). Trả `404`
  nếu attachment không tồn tại hoặc không thuộc `project_id`.

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
- **Ảnh đính kèm (CHANGE-011)**: upload qua presigned URL 2 bước
  (`app/core/s3.py` bọc riêng boto3 S3 client, tương tự cách
  `app/core/db.py` bọc DB access — test mock ở module này, không gọi S3
  thật vì không có S3 emulator local): FE lấy presigned PUT URL từ
  `/presign`, upload thẳng lên S3, rồi gọi `/attachments` (confirm) để
  ghi DB + nhận lại presigned GET URL hiển thị. Bucket
  (`ATTACHMENTS_BUCKET_NAME` env var, output CDK `AttachmentsBucketName`)
  private hoàn toàn, không qua CloudFront. Giới hạn 10 ảnh/dự án, 5MB/
  ảnh, jpg/png/webp — validate cả lúc presign lẫn lúc confirm (chống
  race condition upload đồng thời). Màn Detail chỉ xem ảnh (read-only),
  chỉ Edit mới thêm/xoá được.

## 4. Data Model

Entity thuộc module này (field-level chi tiết — xem `specs/data-model.md`
mục 1/2 cho ER diagram tổng quan/bảng mapping):

- **`projects`**: `id` (PK, bigint identity), `customer_name` (string,
  not null), `project_name` (string, not null), `description` (text,
  nullable), `start_date` (date, not null), `end_date` (date, nullable),
  `is_ongoing` (bool, not null, default false), `team_size` (int,
  nullable), `total_man_month` (decimal, nullable), `source_note` (text,
  nullable), `created_by` (string — Cognito `sub`, not null),
  `created_at`/`updated_at` (timestamp, theo `DM-G02`), `deleted_at`
  (timestamptz, nullable — soft delete, `CHANGE-010`).
- **`tech_tags`**: `id` (PK), `name` (string, unique case-insensitive
  qua index `lower(name)`).
- **`project_tech_tags`** (bảng nối N-N `projects`↔`tech_tags`):
  `project_id` (FK), `tag_id` (FK).
- **`project_types`**: `id` (PK), `code` (string, unique) — catalog cố
  định, seed đúng 5 dòng: `offshore`, `ses`, `lab`, `new_dev`,
  `maintenance`.
- **`project_project_types`** (bảng nối N-N `projects`↔`project_types`):
  `project_id` (FK), `project_type_id` (FK).
- **`attachments`** (`CHANGE-011`): `id` (PK), `project_id` (FK →
  `projects.id`), `s3_key` (string, unique), `file_name` (string),
  `content_type` (string), `size_bytes` (int), `created_by` (string —
  Cognito `sub`), `created_at` (timestamp). Hard delete (không có
  `deleted_at`) — khác `projects`.

## 5. UI

Layout, state, hành vi tương tác chi tiết: xem `specs/projects-ui.md`.

## 6. Lịch sử thay đổi module này

| Ngày       | Ticket ID                       | Thay đổi                                          |
|------------|-----------------------------------|-------------------------------------------------------|
| 2026-08-18 | CHANGE-007-projects-list-create  | Khởi tạo module: List + Create (PROJ-01..12), chưa có Edit/Delete/Detail/file đính kèm |
| 2026-08-18 | CHANGE-008-fix-db-resume-and-tech-hint | Fix bug thật: `POST /projects` thiếu cast `date`/`numeric` tường minh cho Data API (PROJ-13) |
| 2026-08-19 | CHANGE-010-project-detail-edit-delete | Thêm Detail/Edit/Delete (PROJ-14..17), soft delete qua `deleted_at` (DM-PROJ-05) |
| 2026-08-19 | CHANGE-011-project-attachments | Thêm ảnh đính kèm (PROJ-18..21), bảng `attachments` (DM-PROJ-06), presigned URL S3 |

<!-- Trỏ về changes/_archive/CHANGE-00X-.../ để xem đầy đủ proposal/plan gốc -->
