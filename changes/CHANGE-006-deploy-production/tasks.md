# Tasks — CHANGE-006-deploy-production

> Dựa trên `delta-spec.md` + `plan.md` cùng thư mục.

- **Ticket ID**: CHANGE-006-deploy-production
- **Dựa trên**: `delta-spec.md` (+ `plan.md`)

## Checklist

- [x] **T1** — CDK: thêm Cognito User Pool + User Pool Client (SRP,
      self sign-up tắt) + Group `admin`

      - Liên quan: AUTH-01 (giữ lại từ thiết kế trước), ARCH-01 (Cognito)
      - File dự kiến: `infra/stacks/main_stack.py`
- [x] **T2** — CDK: thêm Aurora Serverless v2 (Data API bật, capacity

      0–1 ACU, credentials Secrets Manager tự sinh)
      - Liên quan: ARCH-03, ARCH-15, ARCH-17
      - File dự kiến: `infra/stacks/main_stack.py`
- [x] **T3** — CDK: thêm 2 S3 bucket (frontend hosting, attachments) +
      CloudFront distribution (Origin Access Control cho bucket frontend)

      - Liên quan: ARCH-01, ARCH-06, ARCH-19
      - File dự kiến: `infra/stacks/main_stack.py`
- [x] **T4** — Backend: `app/core/db.py` — thêm nhánh production dùng
      `boto3` `rds-data` client trực tiếp (không dùng
      `sqlalchemy-aurora-data-api`), chọn nhánh qua biến môi trường

      - Liên quan: ARCH-14, ARCH-16
      - File dự kiến: `backend/app/core/db.py`
- [x] **T5** — Backend: test cho nhánh Data API (mock `boto3` client) —
      case query thành công, case lỗi

      - Liên quan: ARCH-16
      - File dự kiến: `backend/tests/test_db_data_api.py`
- [x] **T6** — CDK: thêm Lambda (`PythonFunction`, bundle qua Docker) +
      IAM permission (Data API, Secrets Manager, S3 attachments)

      - Liên quan: ARCH-02, ARCH-18
      - File dự kiến: `infra/stacks/main_stack.py`
- [x] **T7** — CDK: thêm API Gateway HTTP API + JWT Authorizer (trỏ
      Cognito User Pool) + tích hợp Lambda

      - Liên quan: ARCH-02, ARCH-04
      - File dự kiến: `infra/stacks/main_stack.py`
- [x] **T8** — `cdk deploy` thật lần đầu (profile SSO `project-track`),
      xử lý lỗi phát sinh nếu có

      - Liên quan: ARCH-20
- [ ] **T9** — Chạy Alembic migration (baseline rỗng) lên Aurora thật —
      quyết định cách chạy cụ thể khi tới bước này (khả năng: Lambda
      invoke thủ công 1 lần chạy `alembic upgrade head`)

      - Liên quan: DM-G01, DM-G02
- [ ] **T10** — Frontend: build production trỏ `VITE_API_BASE_URL` vào
      URL API Gateway thật; CDK `BucketDeployment` đẩy build lên S3 +
      invalidate CloudFront
      
      - Liên quan: ARCH-01
      - File dự kiến: `infra/stacks/main_stack.py`, `frontend/.env.production`
- [ ] **T11** — Verify end-to-end: mở URL CloudFront thật, gọi
      `/health` qua API Gateway thật, xác nhận `{"status":"ok","db":"ok"}`
- [ ] **T12** — Fold `ARCH-15..20` vào `specs/architecture.md`, archive
      ticket vào `changes/_archive/`

## Trạng thái

| Trạng thái | Ngày cập nhật | Ghi chú |
|---|---|---|
| Chưa bắt đầu | 2026-08-16 | |
