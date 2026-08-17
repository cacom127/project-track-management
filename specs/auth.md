# Module: Auth — Current Truth

> File này mô tả TRẠNG THÁI HIỆN TẠI đã chốt của module `auth`. Không
> ghi ở đây các đề xuất đang bàn — những cái đó thuộc về `changes/`.

## 1. Mục đích module

Đăng nhập/đăng xuất, đổi mật khẩu lần đầu, và bảo vệ route API — dựa
trên Cognito User Pool đã deploy hạ tầng ở `CHANGE-006-deploy-production`.
Vai trò (`admin`/`member`) lấy từ Cognito Group, không lưu trùng trong
DB ứng dụng (đúng `specs/architecture.md` mục 1).

## 2. Yêu cầu hiện tại (Requirements — EARS notation)

- **[AUTH-01]** The system shall authenticate users against the AWS
  Cognito User Pool using the SRP (Secure Remote Password) flow, called
  directly from the frontend — no login request passes through the
  backend/API Gateway.
- **[AUTH-02]** When a Cognito account is in status
  `FORCE_CHANGE_PASSWORD`, the system shall require the user to set a
  new password (via the Change Password screen) before granting access
  to the app.
- **[AUTH-03]** The system shall issue Cognito ID and Access tokens
  with a validity of 4 hours.
- **[AUTH-04]** The system's API Gateway shall require a valid
  Cognito-issued JWT (verified via `HttpJwtAuthorizer`) on every route
  except `GET /health`.
- **[AUTH-05]** When a request's JWT is missing, expired, or invalid,
  API Gateway shall reject the request with `401` before it reaches the
  Lambda function.
- **[AUTH-06]** The frontend shall use the Cognito **ID token** (not the
  Access token) as the `Authorization: Bearer` value when calling
  backend APIs.
- **[AUTH-07]** The frontend shall store obtained tokens in browser
  `localStorage`.
- **[AUTH-08]** When no valid token exists in `localStorage`, OR a
  backend call returns `401`, the frontend shall clear stored tokens
  and redirect to `/login`.
- **[AUTH-09]** The system shall NOT implement automatic token refresh
  using the Cognito refresh token — an expired token always requires a
  fresh login.
- **[AUTH-10]** New user accounts shall be created manually via AWS
  Console (Cognito User Pool → Create user) — the system does NOT
  provide an in-app UI for account creation.
- **[AUTH-11]** On logout, the system shall clear tokens from the
  frontend only — it shall NOT call Cognito `GlobalSignOut` to revoke
  the token server-side.
- **[AUTH-12]** The system's API Gateway (`HttpApi`) shall handle CORS
  preflight (`OPTIONS`) requests via its built-in `cors_preflight` —
  preflight requests shall NOT require a JWT and shall NOT reach the
  JWT Authorizer or the Lambda function.
- **[AUTH-13]** When running on Lambda (detected via the
  `AWS_LAMBDA_FUNCTION_NAME` environment variable), the backend shall
  NOT add its own CORS middleware — CORS for actual (non-preflight)
  responses in production is handled by API Gateway only, to avoid
  duplicate `Access-Control-Allow-Origin` headers. Local development
  (no API Gateway in front) keeps `CORSMiddleware`.
- **[AUTH-14]** The Cognito User Pool's password policy shall require:
  minimum 8 characters, at least 1 uppercase, 1 lowercase, and 1 digit
  — it shall NOT require a special/symbol character.

## 3. Ràng buộc kỹ thuật đã chốt

- Token lưu ở `localStorage` (không phải in-memory/httpOnly cookie) —
  chấp nhận đánh đổi XSS-risk để tránh phức tạp cross-domain
  CloudFront/API Gateway (xem lý do đầy đủ ở
  `changes/_archive/CHANGE-005-auth-module/plan.md`).
- FE gọi thẳng Cognito bằng thư viện `amazon-cognito-identity-js`
  (không dùng `aws-amplify` — nặng hơn không cần thiết).
- User info (email/role) lấy bằng cách decode payload ID token phía FE
  (không verify chữ ký — chỉ để hiển thị), không có endpoint
  `GET /auth/me`.
- Route bảo vệ ở API Gateway (`HttpApi`) khai báo method tường minh
  (GET/POST/PUT/PATCH/DELETE/HEAD) — **KHÔNG dùng `HttpMethod.ANY`**,
  vì `ANY` bao gồm cả `OPTIONS`, làm route (có authorizer) chiếm quyền
  xử lý preflight thay vì để `cors_preflight` tự trả lời (đã gặp bug
  thật lúc deploy — xem `changes/_archive/CHANGE-005-auth-module/tasks.md`
  T10). Quy tắc này áp dụng cho MỌI route thêm sau này, không riêng
  module `auth`.
- `vite.config.ts` cần `define: { global: "globalThis" }` —
  `amazon-cognito-identity-js` dùng biến Node `global`, trình duyệt
  không có, Vite không tự polyfill (khác Webpack). Thiếu dòng này sẽ
  crash toàn bộ app ngay khi load (`ReferenceError: global is not
  defined`), không phải lỗi riêng của module `auth` — bất kỳ code FE
  nào sau này cũng cần biết ràng buộc này nếu dùng thư viện Node khác.

## 4. Data Model

Module này **không sở hữu entity/bảng dữ liệu nào** — user/session
quản lý hoàn toàn bởi AWS Cognito (ngoài DB ứng dụng), vai trò lấy từ
Cognito Group trong JWT claims (đúng `specs/architecture.md` mục 1).

## 5. UI

Layout, state, hành vi tương tác chi tiết: xem `specs/auth-ui.md`.

## 6. Lịch sử thay đổi module này

| Ngày       | Ticket ID                | Thay đổi                                    |
|------------|---------------------------|-----------------------------------------------|
| 2026-08-17 | CHANGE-005-auth-module    | Khởi tạo module: login/logout/đổi mật khẩu lần đầu, bảo vệ route API Gateway (AUTH-01..14) |

<!-- Trỏ về changes/_archive/CHANGE-005-auth-module/ để xem đầy đủ proposal/plan gốc -->
