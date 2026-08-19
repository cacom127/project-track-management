# Delta Spec — Ảnh đính kèm cho dự án

- **Ticket ID**: CHANGE-011
- **Module bị ảnh hưởng**: `specs/projects.md`, `specs/architecture.md`
- **Loại thay đổi**: ☑ Thêm mới

## 1. Yêu cầu thay đổi (EARS notation)

- **[PROJ-18] (MỚI)** When an authenticated user submits
  `POST /projects/{id}/attachments/presign` with `{file_name,
  content_type}`, the system shall validate `content_type` ∈
  (`image/jpeg`, `image/png`, `image/webp`) and that the project
  currently has fewer than 10 attachments, then return a presigned S3
  PUT URL + `s3_key` (hết hạn ngắn, vd 5 phút). Trả `400` nếu
  `content_type` không hợp lệ hoặc đã đủ 10 ảnh; `404` nếu project
  không tồn tại/đã bị xoá.
- **[PROJ-19] (MỚI)** When the client confirms an upload via
  `POST /projects/{id}/attachments` with `{s3_key, file_name,
  content_type, size_bytes}`, the system shall re-validate the 10-image
  limit (chống race condition upload đồng thời) and `size_bytes` ≤
  5MB, insert an `attachments` record, and return the created record
  including a presigned GET URL. Trả `400` nếu vượt giới hạn.
- **[PROJ-20] (MỚI)** When an authenticated user requests
  `GET /projects/{id}/attachments`, the system shall return all
  attachments of that project, each with a freshly-generated presigned
  GET URL (bucket private hoàn toàn, không có URL public cố định).
- **[PROJ-21] (MỚI)** When an authenticated user submits
  `DELETE /projects/{id}/attachments/{attachment_id}`, the system shall
  delete both the S3 object and the DB record (hard delete — khác hành
  vi soft-delete của `projects`). Trả `404` nếu attachment không tồn
  tại hoặc không thuộc `project_id` trong URL.

## 1b. Thay đổi Data Model

- **[DM-PROJ-06] (MỚI — bảng)** Thêm bảng `attachments`: `id` (PK),
  `project_id` (FK → `projects.id`), `s3_key` (string, unique),
  `file_name` (string), `content_type` (string), `size_bytes` (int),
  `created_by` (string — Cognito `sub`), `created_at` (timestamp).
  Field-level map vào `specs/projects.md` mục Data Model. Quan hệ
  `PROJECT ||--o{ ATTACHMENT` ĐÃ có sẵn trong `specs/data-model.md` từ
  `CHANGE-002-architecture` — KHÔNG cần sửa file đó (bảng/quan hệ không
  đổi, chỉ hiện thực hoá).

## 1c. Thay đổi UI

Xem `ui-delta-spec.md`.

## 1d. Thay đổi hạ tầng (CDK — `infra/`)

- Thêm CORS rule cho `attachments_bucket` (`_create_attachments_bucket`
  trong `main_stack.py`): cho phép `PUT` từ origin CloudFront
  (`https://{distribution.domain_name}`) và `http://localhost:5173`
  (local dev), `allowed_headers=["*"]`.
- Thêm env var `ATTACHMENTS_BUCKET_NAME` vào `_create_backend_function`
  (hiện Lambda CHƯA nhận tên bucket, dù đã có `grant_read_write`).
- Thêm `CfnOutput` cho tên bucket (`AttachmentsBucketName`) — dùng khi
  cấu hình `.env` local giống cách `DbClusterArn`/`DbSecretArn` đang
  được dùng.

## 2. Acceptance criteria / Test mapping

| ID      | Test case tương ứng                                            |
|---------|-------------------------------------------------------------------|
| PROJ-18 | `test_presign_attachment_validates_content_type`, `test_presign_attachment_rejects_when_at_limit` |
| PROJ-19 | `test_confirm_attachment_creates_record`, `test_confirm_attachment_rejects_when_at_limit` |
| PROJ-20 | `test_list_attachments_returns_presigned_urls` |
| PROJ-21 | `test_delete_attachment_removes_s3_and_db`, `test_delete_attachment_404_wrong_project` |

## 3. Ghi chú cho AI agent khi implement

- Bọc toàn bộ tương tác S3 (presign PUT/GET, delete object) qua 1 module
  riêng `app/core/s3.py` (giống `app/core/db.py` cho DB) — test mock ở
  module này, KHÔNG gọi S3 thật trong test (không có S3 emulator local).
- `s3_key` gợi ý format: `projects/{project_id}/{uuid4}.{ext}` (ext suy
  từ `content_type`) — tránh trùng tên file giữa các lần upload.
- Migration mới cần chạy qua `apply_migration_via_data_api.py` khi
  deploy production (nhắc user, KHÔNG tự chạy) — xem README.md mục
  "Deploy production" bước 5 (đã thêm ở CHANGE-010).
- CDK thay đổi (CORS/env var/output) cần `cdk deploy` lại — nhắc user,
  KHÔNG tự deploy.
