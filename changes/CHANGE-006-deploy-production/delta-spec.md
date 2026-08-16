# Delta Spec — CHANGE-006-deploy-production

> Cam kết cuối cùng, nằm trong giới hạn kỹ thuật đã chốt ở `plan.md`.
> Phần lớn kiến trúc đã có criteria (`ARCH-01..14`) từ `CHANGE-002`/
> `CHANGE-003` — ticket này chỉ bổ sung tham số cụ thể mà các ticket
> trước chưa chốt (capacity Aurora, cách truy vấn Data API thật, domain,
> tool package Lambda).

- **Ticket ID**: CHANGE-006-deploy-production
- **Module bị ảnh hưởng**: `specs/architecture.md`
- **Loại thay đổi**: ☑ Thêm mới &nbsp; ☐ Sửa &nbsp; ☐ Xoá

## 1. Yêu cầu thay đổi (EARS notation)

- **[ARCH-15] (MỚI)** The Aurora Serverless v2 cluster shall be
  configured with a capacity range of minimum 0 ACU and maximum 1 ACU.
- **[ARCH-16] (MỚI)** The system shall access Aurora Data API in
  production via a direct `boto3` `rds-data` client call, wrapped
  behind `app.core.db` — NOT via a third-party SQLAlchemy dialect
  package, because the most actively-maintained such package
  (`sqlalchemy-aurora-data-api`) has not been updated in the last 12
  months, violating `CLAUDE.md` mục 2.
- **[ARCH-17] (MỚI)** Aurora database credentials shall be generated
  and stored in AWS Secrets Manager automatically (not hardcoded, not
  manually chosen).
- **[ARCH-18] (MỚI)** The system shall use `aws-cdk-lib`'s
  `aws_lambda_python_alpha.PythonFunction` construct to package the
  backend Lambda, bundling dependencies via Docker for the Lambda
  Linux runtime.
- **[ARCH-19] (MỚI)** The system shall use AWS-default domains for both
  the frontend (CloudFront default domain) and the API
  (`execute-api.amazonaws.com` default domain) — no custom domain in
  this ticket.
- **[ARCH-20] (MỚI)** Production deployment (`cdk deploy`) shall be run
  manually from a developer machine authenticated via AWS IAM Identity
  Center (SSO) — no automated CI/CD deploy pipeline in this ticket.

## 2. Acceptance criteria / Test mapping

| ID | Test case tương ứng |
|---|---|
| ARCH-15 | `TC-ARCH-15: Không dùng Aurora trong 1h → kiểm tra billing/metrics cho thấy ACU về 0` |
| ARCH-16 | `TC-ARCH-16: Gọi GET /health qua API Gateway thật → db: "ok" (Lambda đọc Aurora qua boto3 rds-data thành công)` |
| ARCH-17 | `TC-ARCH-17: Kiểm tra Secrets Manager có secret DB, không có password hardcode trong code/CDK` |
| ARCH-18 | `TC-ARCH-18: cdk deploy build Lambda package thành công qua Docker, không lỗi thiếu dependency runtime` |
| ARCH-19 | `TC-ARCH-19: URL CloudFront/API Gateway sau deploy là domain mặc định AWS, không phải custom domain` |
| ARCH-20 | `TC-ARCH-20: Review — không có workflow GitHub Actions nào chạy cdk deploy tự động` |

## 3. Ghi chú cho AI agent khi implement

- KHÔNG cài `sqlalchemy-aurora-data-api` dù có thể "tiện" hơn — đã kiểm
  tra và loại vì lý do freshness (`ARCH-16`). Tự viết wrapper quanh
  `boto3.client("rds-data")`.
- `app.core.db` cần expose 1 interface đủ chung để cả nhánh local
  (SQLAlchemy) và production (Data API) đều dùng được từ router — xem
  chi tiết cách tách trong `plan.md` mục 3 (rủi ro).
- Alembic migration lên Aurora thật: quyết định cách chạy cụ thể khi
  tới bước implement (vd Lambda invoke thủ công 1 lần) — chưa chốt
  cách làm chính xác ở bước spec này, sẽ note lại trong `tasks.md`.
