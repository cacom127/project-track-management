# Proposal — CHANGE-002-architecture

> Kiến trúc hạ tầng & nguyên tắc kỹ thuật nền tảng cho 実績管理システム.
> Tham chiếu: `specs/vision.md` (mục tiêu, phạm vi, ràng buộc đã chốt).

- **Ticket ID**: CHANGE-002-architecture
- **Size**: Large
- **Người đề xuất**: namlp
- **Ngày**: 2026-08-14

## 1. Vấn đề / mục tiêu

`vision.md` đã chốt yêu cầu nghiệp vụ; ticket này chốt **kiến trúc kỹ
thuật** để hiện thực hoá các ràng buộc quan trọng nhất:

- Chi phí hạ tầng AWS thấp nhất có thể (dự án thử nghiệm nội bộ).
- Vài chục người dùng, lượng truy cập thấp, không liên tục.
- Cần thống kê/dashboard đa chiều (theo năm, khách hàng, công nghệ, loại
  hình dự án) — đòi hỏi khả năng truy vấn linh hoạt.
- Sẵn sàng cho đa ngôn ngữ sau này mà không đổi schema/API.
- Chỉ cần 1 môi trường local (dev/test) + 1 môi trường production.

## 2. Các phương án đã cân nhắc

### 2.1. Lưu trữ dữ liệu

| Phương án | Ưu điểm | Nhược điểm | Quyết định |
|---|---|---|---|
| **Aurora Serverless v2 (PostgreSQL)** | Quan hệ → query/aggregate linh hoạt cho dashboard (GROUP BY theo năm/khách hàng/tech tự do, không cần thiết kế trước access pattern); hỗ trợ scale-to-0 ACU nên gần $0 khi idle | Chậm "wake up" vài giây sau thời gian dài không dùng | **✅ Chọn** |
| DynamoDB | Rẻ tuyệt đối, không có khái niệm idle cost | Phải thiết kế trước access pattern (GSI) cho từng loại thống kê; thêm loại báo cáo mới sau này tốn công thiết kế lại index, không hợp với nhu cầu "nghĩ ra câu hỏi báo cáo mới bất cứ lúc nào" | ❌ Loại |
| Single server (EC2/Lightsail + Postgres) | Đơn giản vận hành, chi phí cố định thấp | Chạy 24/7 dù không ai dùng (không phù hợp "gần $0 khi idle"); tự quản lý patching/backup | ❌ Loại |

### 2.2. Compute (backend)

| Phương án | Ưu điểm | Nhược điểm | Quyết định |
|---|---|---|---|
| **1 Lambda chạy FastAPI (Lambda-lith, qua Mangum)** | Tốc độ code nhanh (routing/validate có sẵn qua Pydantic, tự sinh OpenAPI docs), dev/test local dễ (`uvicorn` + `TestClient`), code dùng chung (DB session, auth dependency, error handler) viết 1 lần | Cold start cao hơn 1 chút (~300-500ms) so với Lambda thuần tối giản | **✅ Chọn** |
| Nhiều Lambda thuần, mỗi endpoint 1 function | Cold start nhanh hơn, tinh chỉnh riêng resource từng endpoint | Không có nhu cầu scale/tối ưu riêng từng endpoint ở quy mô này; tốn nhiều công viết lại validate/routing thủ công cho từng function | ❌ Loại |

Chi phí giữa 2 phương án compute **không khác nhau đáng kể** — Lambda tính
tiền theo số lần gọi + thời gian chạy, không theo số lượng function.

### 2.3. Xác thực người dùng

| Phương án | Ưu điểm | Nhược điểm | Quyết định |
|---|---|---|---|
| **AWS Cognito User Pool** | Free tier đủ lớn cho vài chục user; xử lý sẵn login/password/reset; API Gateway có Cognito Authorizer built-in, không cần tự verify JWT | Thêm 1 service AWS cần cấu hình | **✅ Chọn** |
| Tự viết auth (JWT + bảng users + hash password) | Đơn giản về khái niệm, không phụ thuộc service ngoài | Phải tự đảm bảo bảo mật (hash, reset password, rate limit login...) — effort không cần thiết cho use case nội bộ | ❌ Loại |

### 2.4. Infrastructure as Code

- **AWS CDK (Python)** — khớp stack Python quen thuộc, dễ đọc hơn
  CloudFormation thuần hoặc phải học thêm Terraform.

## 3. Kiến trúc được chọn

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

- **Frontend**: React (Vite) build tĩnh → S3 + CloudFront.
- **Backend**: 1 Lambda function, FastAPI + Mangum, viết bằng Python.
- **DB**: Aurora Serverless v2 (PostgreSQL), truy cập qua **RDS Data API**
  (Lambda gọi qua HTTPS, không tự quản lý connection pool — phù hợp
  serverless hơn kết nối trực tiếp qua VPC).
- **Auth**: Cognito User Pool; role (`admin`/`member`) lấy từ Cognito
  Group trong JWT claims — không lưu trùng ở DB để tránh 2 nguồn dữ liệu
  lệch nhau (bảng `users` local chỉ giữ `cognito_sub` + `display_name` để
  làm FK, xem chi tiết ở ticket auth riêng).
- **IaC**: AWS CDK (Python), 1 stack.

## 4. Quy ước dữ liệu nền tảng (`data-model.md`)

Áp dụng chung cho mọi module (`auth`, `projects`, và module tương lai):

- Primary key: **ID tự tăng (serial/bigint identity)** cho mọi bảng —
  đơn giản, dễ đọc/debug, đủ dùng cho quy mô nội bộ hiện tại (không cần
  tránh lộ số lượng record hay merge dữ liệu giữa nhiều nguồn). Có thể
  đổi sang UUID sau này nếu phát sinh nhu cầu (vd đồng bộ dữ liệu đa hệ
  thống) — không phải quyết định khó đổi ở quy mô này.
- Mọi bảng có `created_at` (timestamp), bảng có thể sửa có thêm
  `updated_at`.
- Migration tool: **Alembic** (đi kèm chuẩn với FastAPI/SQLAlchemy).
- Label/enum (vd loại dự án, mã lỗi) dùng **code cố định** (string ngắn,
  không dấu, snake_case) — không lưu chuỗi hiển thị đã dịch sẵn trong DB,
  để đổi/thêm ngôn ngữ sau này không cần migration (nguyên tắc i18n
  readiness, xem mục 5).

## 5. Nguyên tắc kỹ thuật xuyên suốt khác

- **i18n readiness**: mọi label/enum trả về dạng code, chuỗi hiển thị
  dịch ở resource file phía frontend. UI v1 chỉ có tiếng Nhật nhưng thêm
  ngôn ngữ sau này không cần đổi schema/API.
- **Logging**: chi tiết format/level/retention → `specs/cross-cutting/logging.md`
  (ticket riêng, chưa làm ở đây).
- **Error handling**: chi tiết catalog error code →
  `specs/cross-cutting/error-handling.md` (ticket riêng, chưa làm ở đây).
- **Môi trường**: chỉ 2 môi trường — local (docker-compose Postgres +
  `uvicorn` chạy FastAPI trực tiếp, không qua Lambda) và production (đầy
  đủ AWS stack ở trên). Không có staging.

## 6. Ngoài phạm vi ticket này

- Data model nghiệp vụ cụ thể của `auth` và `projects` (bảng `users`,
  `projects`, `tech_tags`...) — làm ở ticket riêng cho từng module.
- Chi tiết logging/error-handling catalog — làm ở ticket `cross-cutting`
  riêng.
- CI/CD pipeline cụ thể (chưa quyết định công cụ — GitHub Actions dự
  kiến nhưng chưa chốt).

## 7. Việc chưa quyết định

- CI/CD cụ thể dùng công cụ gì (đề xuất GitHub Actions, cần xác nhận).
- Có cần theo dõi cost bằng AWS Budget alert không (đề xuất có, ngưỡng
  cụ thể chưa chốt).
