# Plan — CHANGE-006-deploy-production

> Dựa trên `proposal.md` cùng thư mục. Quyết định kỹ thuật cuối cùng —
> `delta-spec.md` sẽ viết cam kết nằm trong giới hạn ở đây.

- **Ticket ID**: CHANGE-006-deploy-production
- **Dựa trên**: `proposal.md` cùng thư mục

## 1. Kiến trúc / thiết kế kỹ thuật

```
[S3 (frontend build) + CloudFront] --(domain mặc định *.cloudfront.net)
        |
        v (gọi API, HTTPS)
[API Gateway HTTP API + JWT Authorizer (trỏ Cognito User Pool)]
        |
        v
[Lambda: FastAPI qua Mangum] --(boto3 rds-data client)--> [Aurora Serverless v2, Data API bật sẵn]
        |                                                          ^
        +--> [S3: bucket attachments (riêng, private)]             |
        |                                                  [Secrets Manager: DB credentials, tự sinh]
        +--> [Cognito User Pool: xác thực — chỉ deploy hạ tầng ở ticket này]
```

- Toàn bộ resource định nghĩa trong `infra/stacks/main_stack.py` (vẫn 1
  stack, chưa cần tách nhiều stack ở quy mô này).
- `cdk deploy` chạy thủ công từ local (profile SSO `project-track`),
  region `ap-northeast-1`.

## 2. Quyết định kỹ thuật quan trọng

| Quyết định | Lý do |
|---|---|
| Domain mặc định AWS (không custom domain) | Đơn giản, miễn phí, đã chốt ở câu hỏi trước |
| Aurora Serverless v2: min 0 ACU, max 1 ACU | Ưu tiên chi phí gần $0 khi idle, chấp nhận độ trễ wake-up vài giây — đã chốt |
| Aurora Data API bật sẵn (`enable_data_api=True`) | Đúng `ARCH-03` đã chốt — Lambda không cần VPC networking để nối DB |
| DB credentials qua Secrets Manager tự sinh (`rds.Credentials.from_generated_secret`) | Không hardcode password trong code/CDK, chuẩn bảo mật AWS |
| **KHÔNG dùng package `sqlalchemy-aurora-data-api`** (SQLAlchemy dialect cho Data API) | Đã kiểm tra: bản mới nhất (0.5.0) phát hành **2023-12-30** — quá 12 tháng, vi phạm `CLAUDE.md` mục 2 ("không dùng dependency chưa cập nhật trong 12 tháng gần nhất") |
| Thay vào đó: tự viết adapter mỏng dùng trực tiếp `boto3` `rds-data` client trong `app/core/db.py` | `boto3` được AWS maintain liên tục, không có vấn đề freshness. Đổi implementation của `get_db_session`-tương-đương (thực chất sẽ là 1 hàm `execute_sql(sql, params)` chung, không còn là SQLAlchemy `Session` thuần nữa ở nhánh production) — vẫn giữ đúng tinh thần `ARCH-14` (cô lập qua 1 module, chọn implementation qua biến môi trường) |
| Lambda packaging: `aws_cdk.aws_lambda_python_alpha.PythonFunction` | Tự bundle dependency (`psycopg[binary]`, `boto3`...) qua Docker cho đúng runtime Lambda (Linux) — đã kiểm tra version `2.265.0a0` (13/08/2026) khớp `aws-cdk-lib` đang dùng, đủ mới |
| API Gateway: HTTP API (không dùng REST API) + JWT Authorizer built-in trỏ Cognito | Rẻ hơn REST API, JWT Authorizer verify token tự động trước khi vào Lambda — không cần code Lambda authorizer riêng |
| 2 S3 bucket riêng (frontend, attachments) | Tách rõ mục đích — bucket frontend public (qua CloudFront OAC), bucket attachments private hoàn toàn |
| Frontend deploy qua CDK `BucketDeployment` (tự invalidate CloudFront cache) | Không cần script deploy riêng ngoài `cdk deploy`, mọi thứ trong 1 lệnh |
| Health-check endpoint dùng để verify cuối cùng | Đã có sẵn từ `CHANGE-003`, chỉ cần đổi nhánh DB access sang Data API khi chạy trên Lambda |

## 3. Rủi ro / đánh đổi (trade-off)

- **Đổi từ SQLAlchemy Session sang hàm `execute_sql` tự viết cho nhánh
  Data API** — nghĩa là code truy vấn DB ở production (Data API) và
  local (SQLAlchemy) sẽ không giống hệt nhau 100% cú pháp Python (khác
  API gọi), dù cùng chạy 1 câu SQL. Giảm thiểu: giữ interface bên ngoài
  module (`app.core.db`) nhất quán (hàm nhận SQL string + params, trả
  về rows) để code gọi ở nơi khác (routers) không cần biết đang chạy
  nhánh nào.
- **Lambda cold start + Aurora wake-up cộng dồn** — lần gọi đầu sau thời
  gian dài idle có thể chậm vài giây (cold start Lambda ~300-500ms +
  Aurora wake-up vài giây). Chấp nhận cho tool nội bộ, không có SLA
  khắt khe.
- **Deploy thật lần đầu có thể phát sinh lỗi permission/IAM** cần thử
  và sửa qua lại — chấp nhận vì đây vốn là bản chất của việc deploy hạ
  tầng mới lần đầu.

## 4. Migration / rollback

- Cần migration dữ liệu: **Có** — Alembic baseline (rỗng, đã có sẵn từ
  `CHANGE-003`) sẽ chạy trên Aurora thật lần đầu qua Data API (cần
  script/cách chạy `alembic upgrade head` nhắm vào Data API thay vì
  kết nối trực tiếp — sẽ quyết định cách làm cụ thể khi implement,
  ví dụ chạy qua 1 Lambda invoke thủ công hoặc qua bastion tạm thời).
- Rollback: `cdk destroy` xoá toàn bộ resource nếu cần huỷ — chưa có dữ
  liệu quan trọng nên an toàn để thử lại từ đầu nếu deploy sai.

## 5. Định nghĩa "Done" cho bước Plan này

- [x] Đã xác nhận thiết kế với Technical owner (namlp) — qua brainstorm
- [ ] Đã cập nhật `delta-spec.md` tương ứng với thiết kế này
