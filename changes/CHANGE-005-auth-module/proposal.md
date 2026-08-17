# Proposal — CHANGE-005-auth-module

> Nối luồng đăng nhập thật (login, đổi mật khẩu lần đầu, logout, bảo vệ
> route) vào Cognito User Pool đã deploy từ `CHANGE-006-deploy-production`.

- **Ticket ID**: CHANGE-005-auth-module
- **Size**: Medium (thêm module mới, nhưng dùng hạ tầng Cognito đã có
  sẵn — không đổi kiến trúc). Có kèm `plan.md` dù không bắt buộc với
  Medium (mục 6 `CLAUDE.md`) — vì ticket có vài quyết định kỹ thuật đánh
  đổi (thư viện FE, nơi lưu token, cấu trúc route API Gateway) cần lưu
  lại rationale, và có đụng `infra/` (CDK).
- **Người đề xuất**: namlp
- **Ngày**: 2026-08-17

## 1. Vấn đề / lý do cần thay đổi

Cognito User Pool đã được deploy thật từ `CHANGE-006`, nhưng chưa nối
vào flow đăng nhập thật trong app — chưa có màn login, chưa có route
nào được bảo vệ (API Gateway `$default` hiện forward mọi request kể cả
`/health` mà không cần JWT). Cần làm module `auth` để có thể bắt đầu
xây các module nghiệp vụ khác (`projects`, `reporting`) dựa trên user
đã đăng nhập.

## 2. Mục tiêu (Goal)

- Người dùng đăng nhập được bằng email + password (SRP) qua Cognito,
  không qua backend.
- Tài khoản mới tạo (`FORCE_CHANGE_PASSWORD`) bị bắt đổi mật khẩu ngay
  lần đăng nhập đầu tiên trước khi vào app.
- Sau khi login, mọi route (trừ `/health`) trên API Gateway yêu cầu JWT
  hợp lệ (Cognito Authorizer) — request thiếu/sai token bị chặn ở tầng
  API Gateway, không tới Lambda.
- FE có route guard: chưa đăng nhập → luôn về `/login`; đã đăng nhập →
  hiển thị email + role (`admin`/`member`) ở header.
- Logout xóa token khỏi trình duyệt, quay về `/login`.

## 3. Ngoài phạm vi (Non-goals)

- KHÔNG có màn "quên mật khẩu" (chỉ có bắt đổi mật khẩu lần đầu).
- KHÔNG có màn admin tạo/quản lý user qua UI — tạo user mới vẫn làm thủ
  công qua **AWS Console** (Cognito → User pools → `project-track-users`
  → Create user), xem hướng dẫn chi tiết ở `delta-spec.md`.
- KHÔNG phân quyền admin/member ở bất kỳ route backend nào — chưa có
  route nghiệp vụ nào cần phân biệt (sẽ làm khi tới module `projects`).
- KHÔNG tự động refresh token khi hết hạn — hết hạn thì bắt đăng nhập
  lại (token sống 4 tiếng, xem `plan.md`).
- KHÔNG revoke token khi logout (`GlobalSignOut`) — chỉ xóa ở phía FE.

## 4. Ảnh hưởng

- Module liên quan: `auth` (mới, xem `specs/architecture.md` mục 2 —
  đã có tên module nhưng chưa có spec).
- Ảnh hưởng khách hàng Nhật cần thông báo trước: Không (nội bộ, chưa có
  người dùng thật ngoài team).
- Ảnh hưởng dữ liệu hiện có (migration): Không.
- Ảnh hưởng hạ tầng: Có — sửa `UserPoolClient` (thêm thời hạn token) và
  `HttpApi` (route tường minh thay vì `$default`, gắn JWT Authorizer)
  trong `infra/stacks/main_stack.py`. Cần `cdk deploy` lại.
- Chi phí AWS: không đổi (Cognito Authorizer không tính phí riêng ngoài
  API Gateway request đã tính sẵn).

## 5. Phương án thay thế đã xem xét

Xem chi tiết ở `plan.md` cùng ticket này — đã brainstorm trực tiếp và
chốt: lưu token ở `localStorage` (không dùng httpOnly cookie vì phức
tạp cross-domain CloudFront/API Gateway không tương xứng lợi ích), FE
gọi thẳng Cognito bằng `amazon-cognito-identity-js` (không dùng
`aws-amplify` — nặng hơn không cần thiết), lấy user info bằng cách
decode ID token phía FE (không thêm endpoint `GET /auth/me`).
