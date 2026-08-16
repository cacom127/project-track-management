# Proposal — CHANGE-006-deploy-production

> Deploy toàn bộ production stack lên AWS thật, theo đúng kiến trúc đã
> chốt ở `specs/architecture.md` — thay vì chỉ có CDK stack rỗng như
> hiện tại (`CHANGE-003`).

- **Ticket ID**: CHANGE-006-deploy-production
- **Size**: Large (đụng infra thật + backend + frontend, deploy AWS lần đầu)
- **Người đề xuất**: namlp
- **Ngày**: 2026-08-16

## 1. Vấn đề / lý do cần thay đổi

Hiện `infra/` chỉ có CDK stack rỗng (`CHANGE-003` chỉ verify `cdk
synth`, không deploy). Chưa có resource AWS thật nào tồn tại. Không có
hạ tầng thật thì không thể làm module `auth` (cần Cognito thật) hay bất
kỳ module nghiệp vụ nào chạy production thật. Ban đầu định làm riêng
`auth` trước rồi mới deploy, nhưng quyết định đổi lại: deploy full stack
trước để tránh phải viết code verify JWT tạm thời (throwaway) rồi sau
lại phải sửa lại khi có API Gateway thật.

## 2. Mục tiêu (Goal)

- `cdk deploy` thành công, tạo đủ: Cognito User Pool, Aurora Serverless
  v2 (Data API), Lambda (chạy FastAPI qua Mangum), API Gateway (HTTP
  API, JWT Authorizer trỏ Cognito), S3 (frontend + attachments),
  CloudFront.
- Gọi `GET /health` qua URL API Gateway thật → nhận
  `{"status": "ok", "db": "ok"}` (Lambda đọc được Aurora thật qua Data
  API).
- Mở URL CloudFront thật → thấy trang frontend build production, gọi
  được `/health` qua API Gateway thật.
- Chi phí gần $0 khi không ai dùng (Aurora min 0 ACU, Lambda/API
  Gateway/S3/CloudFront tính theo lượng dùng).

## 3. Ngoài phạm vi (Non-goals)

- KHÔNG tự động hoá CI/CD deploy (vẫn `cdk deploy` thủ công từ local).
- KHÔNG có custom domain (dùng domain mặc định AWS).
- KHÔNG làm màn hình login/logic nghiệp vụ auth (Cognito chỉ deploy hạ
  tầng, chưa nối vào flow đăng nhập thật trong app — đó là ticket
  riêng sau).
- KHÔNG set AWS Budget alert (có thể thêm sau nếu cần).

## 4. Ảnh hưởng

- Module liên quan: nền tảng (`specs/architecture.md`), không phải
  module nghiệp vụ cụ thể.
- Ảnh hưởng khách hàng Nhật cần thông báo trước: Không.
- Ảnh hưởng dữ liệu hiện có (migration): Có — Alembic baseline (rỗng)
  sẽ chạy trên Aurora thật lần đầu, chưa có dữ liệu nghiệp vụ nào.
- Chi phí AWS: phát sinh chi phí thật lần đầu (dù rất nhỏ) — Aurora
  Serverless v2, Lambda, API Gateway, S3, CloudFront đều theo mô hình
  pay-as-you-go, ước tính gần $0 ở mức sử dụng thử nghiệm nội bộ.

## 5. Phương án thay thế đã xem xét

Xem chi tiết ở `plan.md` cùng ticket này — các quyết định về Aurora
capacity, domain, CI/CD, và cách backend chuyển từ SQLAlchemy trực
tiếp (local) sang RDS Data API (production) đã được thảo luận trực
tiếp qua brainstorming.
