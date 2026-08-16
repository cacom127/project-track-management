# Architecture — Current Truth

> File này mô tả TRẠNG THÁI HIỆN TẠI đã chốt của kiến trúc hệ thống.
> Không ghi ở đây các đề xuất đang bàn — những cái đó thuộc về `changes/`.
> File này chỉ được cập nhật KHI một `changes/<change-id>/delta-spec.md`
> liên quan đến kiến trúc được merge.

## 1. Tổng quan hệ thống

```
[React SPA] --(CloudFront + S3)--
        |
        v (HTTPS, JWT trong header)
[API Gateway HTTP API + Cognito Authorizer]
        |
        v
[Lambda: FastAPI qua Mangum] --> [Aurora Serverless v2 (PostgreSQL), qua RDS Data API]
        |
        +--> [S3: file đính kèm dự án]
        |
        +--> [Cognito User Pool: login/JWT]
```

- **Frontend**: React (Vite), build tĩnh, host trên S3 + CloudFront.
- **Backend**: 1 Lambda function duy nhất chạy FastAPI (Python) qua
  adapter Mangum — không tách nhiều Lambda theo endpoint (xem lý do ở
  `changes/_archive/CHANGE-002-architecture/proposal.md`).
- **DB**: Aurora Serverless v2 (PostgreSQL), Lambda truy cập qua **RDS
  Data API** (không tự quản lý connection pool).
- **Auth**: AWS Cognito User Pool. Vai trò (`admin`/`member`) lấy từ
  Cognito Group trong JWT claims — không lưu trùng trong DB ứng dụng.
- **File đính kèm**: S3 bucket riêng, upload qua presigned URL do backend
  cấp (tránh giới hạn payload của Lambda/API Gateway).
- **IaC**: AWS CDK (Python), 1 stack.
- **Cấu trúc source code**: `backend` (Python/FastAPI), `frontend`
  (React/Vite), `infra` (AWS CDK, Python) — nằm ngay tại repo root, ngang
  cấp `specs/`/`changes/`. 
- **Package manager**: `uv` cho `backend`/`infra` (Python), `npm` cho
  `frontend`.

## 2. Danh sách module/domain

| Module      | Vai trò                                       | Spec chi tiết          |
|-------------|-------------------------------------------------|--------------------------|
| auth        | Xác thực, đồng bộ user với Cognito, phân quyền  | `specs/auth.md` (chưa có — làm ở ticket riêng) |
| projects    | CRUD dữ liệu dự án đã làm với khách hàng Nhật    | `specs/projects.md` (chưa có — làm ở ticket riêng) |
| reporting   | Thống kê/dashboard (theo năm, khách hàng, tech...) | `specs/reporting.md` (chưa có — làm ở ticket riêng) |
| export      | Export dữ liệu ra PowerPoint                    | Chưa spec — ưu tiên thấp, chưa quyết định chi tiết (xem `specs/vision.md` mục 4) |

## 3. Ràng buộc hạ tầng

- **Môi trường**: chỉ 2 môi trường —
  - `local`: docker-compose PostgreSQL + `uvicorn` chạy FastAPI trực
    tiếp (không qua Lambda), dùng cho dev/test.
  - `production`: đầy đủ AWS stack ở mục 1.
  - Không có môi trường staging.
- **Chi phí**: ưu tiên chi phí AWS thấp nhất — Aurora Serverless v2 scale
  về 0 ACU khi không dùng, Lambda/API Gateway/S3/CloudFront chỉ tính
  tiền theo lượng dùng thực tế. Chấp nhận độ trễ vài giây "wake up" của
  Aurora sau thời gian dài idle, đổi lại chi phí gần $0 lúc rảnh.
- **Data residency**: region `ap-northeast-1` (Tokyo) — đã deploy thật.
- **CI/CD**: **GitHub Actions** — chạy lint + test riêng cho `backend`,
  `frontend`, và `infra` (`cdk synth`) trên mọi pull request và mọi push
  vào branch mặc định. `cdk deploy` production hiện chạy **thủ công** từ
  máy dev (qua AWS IAM Identity Center/SSO) — chưa tự động hoá CI/CD deploy.
- **Aurora Serverless v2**: capacity **0–1 ACU**. Truy cập Data API ở
  production qua **`boto3` `rds-data` client trực tiếp** (KHÔNG dùng
  package `sqlalchemy-aurora-data-api` — bản mới nhất phát hành
  2023-12-30, quá 12 tháng, vi phạm `CLAUDE.md` mục 2).
- **Lambda packaging**: `aws_lambda_python_alpha.PythonFunction` (bundle
  qua Docker, dựa trên `uv.lock`). Loại bỏ khỏi gói deploy: package đã
  có sẵn trong Lambda runtime (`boto3`, `botocore`...) và package chỉ
  phục vụ chạy `uvicorn` server local (`uvicorn`, `uvloop`, `httptools`,
  `watchfiles`, `websockets`, `PyYAML`) — Lambda dùng Mangum gọi thẳng
  FastAPI app, không bao giờ chạy uvicorn thật.
- **Domain**: dùng domain mặc định AWS cho cả frontend (CloudFront) và
  API (API Gateway) — chưa có custom domain.

## 4. Nguyên tắc kỹ thuật xuyên suốt

- **i18n readiness**: mọi label/enum (loại dự án, mã lỗi...) trả về dạng
  code cố định; chuỗi hiển thị dịch ở resource file phía frontend, không
  lưu chuỗi đã dịch trong DB — cho phép thêm ngôn ngữ mới (tiếng Việt/
  Anh) sau này mà không cần đổi schema/API. UI v1 chỉ có tiếng Nhật.
- **Logging**: mọi request vào Lambda log dạng JSON (request_id, user_id,
  method, path, status_code, duration_ms) lên CloudWatch Logs, phục vụ
  audit theo yêu cầu khách hàng Nhật (`CLAUDE.md` mục 2). Chi tiết
  format/level/retention đầy đủ → `specs/cross-cutting/logging.md` (chưa
  làm — ticket riêng).
- **Error handling**: format lỗi chuẩn hoá `{ "error": { "code", "message" } }`,
  `code` cố định để FE tự dịch, không lộ chi tiết lỗi hệ thống ra client.
  Catalog đầy đủ error code → `specs/cross-cutting/error-handling.md`
  (chưa làm — ticket riêng).
- **Health-check**: endpoint `GET /health` trả `200` với body
  `{"status": "ok", "db": "<ok|error>"}` — không bao giờ trả `5xx` chỉ vì
  DB gián đoạn tạm thời; sự cố DB thể hiện qua field `db`, không qua mã
  trạng thái HTTP.
- **Cô lập truy cập DB**: mọi truy cập DB của backend đi qua 1 module
  duy nhất (`app.core.db`) — để khi deploy production đổi sang RDS Data
  API, chỉ cần thay implementation trong module này, không phải sửa
  code gọi DB rải rác nhiều nơi.

## 5. Lịch sử thay đổi kiến trúc lớn

| Ngày       | Ticket ID              | Thay đổi                                                   |
|------------|--------------------------|--------------------------------------------------------------|
| 2026-08-14 | CHANGE-002-architecture | Chốt kiến trúc khởi tạo: Serverless (Lambda+FastAPI, Aurora Serverless v2, Cognito, S3+CloudFront, CDK Python) |
| 2026-08-15 | CHANGE-003-init-codebase | Chốt cấu trúc source code (`backend`/`frontend`/`infra` ở root), package manager (`uv`/`npm`), CI (GitHub Actions), hành vi `/health`, nguyên tắc cô lập DB access |
| 2026-08-17 | CHANGE-006-deploy-production | Deploy thật lần đầu lên AWS (`ap-northeast-1`): Cognito, Aurora Serverless v2 (0-1 ACU), Lambda, API Gateway, S3+CloudFront. Xác nhận `/health` chạy đúng end-to-end trên production thật |

<!-- Mỗi dòng ở đây trỏ về changes/_archive/CHANGE-XXX/ để xem đầy đủ lý do -->
