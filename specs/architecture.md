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
- **File đính kèm**: S3 bucket riêng (`AttachmentsBucket`, private hoàn
  toàn, không qua CloudFront), upload qua presigned URL do backend cấp
  (tránh giới hạn payload của Lambda/API Gateway). Tên bucket truyền vào
  Lambda qua env var `ATTACHMENTS_BUCKET_NAME` (output CDK
  `AttachmentsBucketName`); CORS rule cho phép `PUT` từ CloudFront
  domain + `localhost:5173` (local dev). Hiện thực hoá đầu tiên ở
  `CHANGE-011-project-attachments` (module `projects`, ảnh dự án).
- **IaC**: AWS CDK (Python), 1 stack.
- **Cấu trúc source code**: `backend` (Python/FastAPI), `frontend`
  (React/Vite), `infra` (AWS CDK, Python) — nằm ngay tại repo root, ngang
  cấp `specs/`/`changes/`. 
- **Package manager**: `uv` cho `backend`/`infra` (Python), `npm` cho
  `frontend`.
- **App Shell (frontend)**: mọi route đã đăng nhập dùng chung layout
  Header (ngang, đã có từ `CHANGE-005`) + Sidebar (dọc, 240px cố định,
  `position: fixed` kéo dài hết chiều cao viewport, đè lên Header —
  component `Navigation Sidebar` trong `DESIGN.md`). Ẩn Sidebar ở
  viewport <768px. Chỉ 1 mục nav hiện tại ("プロジェクト一覧"), mở rộng
  khi có module mới (`reporting`...). Xem `CHANGE-009-app-shell-and-projects-ui-refresh`.
  Cũng render 1 `ToastHost` dùng chung (thông báo thành công sau
  Tạo/Sửa/Xoá — xem `specs/projects-ui.md` mục 6) — mọi module dùng
  chung component này, không tự implement riêng. Xem
  `CHANGE-010-project-detail-edit-delete`.

## 2. Danh sách module/domain

| Module      | Vai trò                                       | Spec chi tiết          |
|-------------|-------------------------------------------------|--------------------------|
| auth        | Xác thực, đồng bộ user với Cognito, phân quyền  | `specs/auth.md`, `specs/auth-ui.md` |
| projects    | CRUD dữ liệu dự án đã làm với khách hàng Nhật    | `specs/projects.md`, `specs/projects-ui.md` (List+Create+Detail+Edit+Delete+ảnh đính kèm xong) |
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
- **API Gateway CORS**: cấu hình qua `cors_preflight` ở tầng `HttpApi`
  (KHÔNG qua middleware ứng dụng cho request từ CloudFront) — mọi route
  bảo vệ bằng JWT Authorizer PHẢI khai báo method tường minh (GET/POST/
  PUT/PATCH/DELETE/HEAD), KHÔNG dùng `HttpMethod.ANY`, vì `ANY` bao gồm
  cả `OPTIONS` và sẽ khiến route (có authorizer) chiếm quyền xử lý
  preflight thay vì để API Gateway tự trả lời — gây `401` cho mọi
  preflight của trình duyệt (đã gặp bug thật lúc deploy `CHANGE-005`).
  Áp dụng cho MỌI route thêm sau này, không riêng module nào.

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
- **Truy vấn DB bằng raw SQL, KHÔNG dùng ORM**: `DBSession.execute(sql,
  params)` trả `list[dict[str, Any]]` nhất quán ở cả nhánh local
  (SQLAlchemy) và production (RDS Data API); `commit()` tường minh
  (no-op ở Data API, thật ở SQLAlchemy) — không dùng SQLAlchemy ORM
  model vì Data API không có ORM tương thích cả 2 nhánh (xem
  `CHANGE-007-projects-list-create`).
- **Migration lên production qua RDS Data API**: production không có
  kết nối trực tiếp tới Aurora (không VPC/bastion) — chạy
  `backend/scripts/apply_migration_via_data_api.py` (sinh SQL bằng
  `alembic upgrade <rev>:head --sql`, thực thi qua Data API
  `begin/commit/rollback_transaction`) thay vì `alembic upgrade head`
  trực tiếp. `DbClusterArn`/`DbSecretArn` lấy từ `CfnOutput` của CDK
  stack. Áp dụng cho MỌI migration sau này, không riêng module nào.
- **Xác thực "ai đang gọi" ở backend**: dependency `get_current_user_id`
  (`app/core/auth.py`) lấy Cognito `sub` — production đọc từ
  `request.scope["aws.event"]` (Mangum giữ nguyên Lambda event, claims
  đã được API Gateway JWT Authorizer verify trước khi forward); local
  dev decode thẳng payload JWT từ header `Authorization` không verify
  chữ ký. Dùng chung cho mọi route cần biết người gọi, không riêng
  module nào.
- **Validation error trả `400`**: exception handler global cho
  `RequestValidationError` trong `app/main.py` đổi `422` mặc định của
  FastAPI thành `400` (khớp `ERR-02`), áp dụng cho mọi route có request
  body — không riêng module nào.
- **Retry khi Aurora đang resume**: `DataApiSession.execute()` retry
  tối đa 3 lần (cách 2 giây) khi gặp `DatabaseResumingException`
  (Aurora Serverless v2 wake up sau auto-pause, mục 3) — nhận diện qua
  `exc.response["Error"]["Code"]`, không dựa vào
  `client.exceptions.DatabaseResumingException` (dễ mock sai trong
  test). Áp dụng cho MỌI truy vấn qua Data API, không riêng module nào.
  Bug thật gặp lúc deploy `CHANGE-007`: `POST /projects` trả `500`
  không có retry — xem `changes/_archive/CHANGE-008-fix-db-resume-and-tech-hint/`.
- **Parse response Data API — chuẩn hoá `isNull`/`arrayValue`**:
  `_parse_data_api_field()` PHẢI check riêng key `isNull` trước khi lấy
  giá trị (field NULL dạng `{"isNull": True}` — lấy đại
  `next(iter(field.values()))` sẽ ra nhầm `True`); PHẢI parse riêng key
  `arrayValue` (cột Postgres ARRAY, vd `array_agg`) thành `list` phẳng
  thay vì trả nguyên dict lồng. Cả 2 bug có từ `CHANGE-006` (viết
  `DataApiSession` lần đầu) nhưng chưa lộ ra vì `health` chỉ `SELECT 1`
  — chỉ phát hiện khi `projects` thực sự ghi/đọc dữ liệu NULL/ARRAY.
- **Cast tường minh cho tham số `date`/`numeric` qua Data API**: RDS
  Data API KHÔNG tự cast tham số `stringValue`/`doubleValue` sang kiểu
  cột đích như SQLAlchemy/psycopg ở local — SQL phải viết
  `:param ::date`/`:param ::numeric` tường minh (LƯU Ý: phải có khoảng
  trắng trước `::`, viết dính `:param::type` khiến SQLAlchemy `text()`
  không nhận diện được bind parameter).

## 5. Lịch sử thay đổi kiến trúc lớn

| Ngày       | Ticket ID              | Thay đổi                                                   |
|------------|--------------------------|--------------------------------------------------------------|
| 2026-08-14 | CHANGE-002-architecture | Chốt kiến trúc khởi tạo: Serverless (Lambda+FastAPI, Aurora Serverless v2, Cognito, S3+CloudFront, CDK Python) |
| 2026-08-15 | CHANGE-003-init-codebase | Chốt cấu trúc source code (`backend`/`frontend`/`infra` ở root), package manager (`uv`/`npm`), CI (GitHub Actions), hành vi `/health`, nguyên tắc cô lập DB access |
| 2026-08-17 | CHANGE-006-deploy-production | Deploy thật lần đầu lên AWS (`ap-northeast-1`): Cognito, Aurora Serverless v2 (0-1 ACU), Lambda, API Gateway, S3+CloudFront. Xác nhận `/health` chạy đúng end-to-end trên production thật |
| 2026-08-17 | CHANGE-005-auth-module | Bật JWT Authorizer thật cho mọi route (trừ `/health`), cấu hình CORS ở API Gateway (`cors_preflight`, route method tường minh — không dùng `ANY` vì chặn OPTIONS). Xác nhận login/đổi mật khẩu/logout E2E thật trên production |
| 2026-08-18 | CHANGE-007-projects-list-create | Module `projects` đầu tiên (List+Create): chốt nguyên tắc raw SQL qua `DBSession` (không ORM), migration production qua script Data API (`apply_migration_via_data_api.py`), dependency lấy user hiện tại từ JWT (`app/core/auth.py`), validation error trả 400 thay vì 422 mặc định |
| 2026-08-18 | CHANGE-008-fix-db-resume-and-tech-hint | Fix 3 bug thật phát hiện lúc deploy `CHANGE-007` (retry `DatabaseResumingException`, cast `date`/`numeric` tường minh, parse đúng `isNull`/`arrayValue` của Data API response) + 1 fix chủ động (array_agg) — tất cả áp dụng cho MỌI module qua Data API, không riêng `projects` |
| 2026-08-19 | CHANGE-009-app-shell-and-projects-ui-refresh | Thêm App Shell (Sidebar dọc 240px, dùng chung mọi route); cập nhật `DESIGN.md` (component Navigation Sidebar, Dropdown/Filter) |
| 2026-08-19 | CHANGE-010-project-detail-edit-delete | Module `projects`: thêm Detail/Edit/Delete (soft delete); thêm `ToastHost` dùng chung trong App Shell; cập nhật `DESIGN.md` (Modal, Toast, Action Button destructive) |
| 2026-08-19 | CHANGE-011-project-attachments | Hiện thực hoá ảnh đính kèm (S3 presigned URL, CORS + env var `ATTACHMENTS_BUCKET_NAME` cho Lambda); cập nhật `DESIGN.md` (Thumbnail Grid, Paste Zone) |

<!-- Mỗi dòng ở đây trỏ về changes/_archive/CHANGE-XXX/ để xem đầy đủ lý do -->
