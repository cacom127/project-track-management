# Delta Spec — CHANGE-005-auth-module

> Cam kết cuối cùng, nằm trong giới hạn kỹ thuật đã chốt ở `plan.md`.
> Module `auth` chưa có spec (`specs/auth.md` hiện chưa tồn tại) — toàn
> bộ mục dưới đây đánh dấu (MỚI).

- **Ticket ID**: CHANGE-005-auth-module
- **Module bị ảnh hưởng**: `specs/auth.md` (MỚI), `specs/auth-ui.md` (MỚI)
- **Loại thay đổi**: ☑ Thêm mới &nbsp; ☐ Sửa &nbsp; ☐ Xoá

## 1. Yêu cầu thay đổi (EARS notation)

- **[AUTH-01] (MỚI)** The system shall authenticate users against the
  AWS Cognito User Pool using the SRP (Secure Remote Password) flow,
  called directly from the frontend — no login request passes through
  the backend/API Gateway.
- **[AUTH-02] (MỚI)** When a Cognito account is in status
  `FORCE_CHANGE_PASSWORD`, the system shall require the user to set a
  new password (via the Change Password screen) before granting access
  to the app.
- **[AUTH-03] (MỚI)** The system shall issue Cognito ID and Access
  tokens with a validity of 4 hours.
- **[AUTH-04] (MỚI)** The system's API Gateway shall require a valid
  Cognito-issued JWT (verified via `HttpJwtAuthorizer`) on every route
  except `GET /health`.
- **[AUTH-05] (MỚI)** When a request's JWT is missing, expired, or
  invalid, API Gateway shall reject the request with `401` before it
  reaches the Lambda function.
- **[AUTH-06] (MỚI)** The frontend shall use the Cognito **ID token**
  (not the Access token) as the `Authorization: Bearer` value when
  calling backend APIs.
- **[AUTH-07] (MỚI)** The frontend shall store obtained tokens in
  browser `localStorage`.
- **[AUTH-08] (MỚI)** When no valid token exists in `localStorage`, OR
  a backend call returns `401`, the frontend shall clear stored tokens
  and redirect to `/login`.
- **[AUTH-09] (MỚI)** The system shall NOT implement automatic token
  refresh using the Cognito refresh token in this ticket — an expired
  token always requires a fresh login.
- **[AUTH-10] (MỚI)** New user accounts shall be created manually via
  AWS Console (Cognito User Pool → Create user) — the system shall NOT
  provide an in-app UI for account creation in this ticket.
- **[AUTH-11] (MỚI)** On logout, the system shall clear tokens from the
  frontend only — it shall NOT call Cognito `GlobalSignOut` to revoke
  the token server-side.
- **[AUTH-12] (MỚI)** The system's API Gateway (`HttpApi`) shall handle
  CORS preflight (`OPTIONS`) requests via its built-in
  `cors_configuration` — preflight requests shall NOT require a JWT and
  shall NOT reach the JWT Authorizer or the Lambda function.
- **[AUTH-13] (MỚI)** When running on Lambda (detected via the
  `AWS_LAMBDA_FUNCTION_NAME` environment variable), the backend shall
  NOT add its own CORS middleware — CORS for actual (non-preflight)
  responses in production is handled by API Gateway only, to avoid
  duplicate `Access-Control-Allow-Origin` headers. Local development
  (no API Gateway in front) keeps the existing `CORSMiddleware`.
- **[AUTH-14] (MỚI)** The Cognito User Pool's password policy shall
  require: minimum 8 characters, at least 1 uppercase, 1 lowercase, and
  1 digit — it shall NOT require a special/symbol character.

## 1c. Thay đổi UI

> Ghi thẳng ở đây (không tách `ui-delta-spec.md` riêng) — chỉ 2 màn
> hình, mỗi màn 2-3 trạng thái, chưa đủ phức tạp để tách file. Khi
> merge, nội dung này fold vào `specs/auth-ui.md` (file mới).

**Màn hình: Login (`/login`)**

### Layout

```
┌─────────────────────────────┐
│         [Logo]               │
│                               │
│  メールアドレス [input-field]   │
│  パスワード     [input-field]   │
│                               │
│  [ button-primary "ログイン" ] │
└─────────────────────────────┘
```

- Component dùng: `input-field`, `button-primary` (xem `DESIGN.md`),
  `input-field-error` khi có lỗi.
- Layout: single-column, căn giữa màn hình, max-width 360px.

### State matrix

| Trạng thái | Hiển thị |
|---|---|
| Mặc định | Form trống, `button-primary` enabled |
| Đang submit | `button-primary` + `input-field` disabled, spinner trong nút |
| Lỗi sai email/mật khẩu | `input-field-error` dưới password field |
| Lỗi khác (network/Cognito 5xx) | Toast lỗi chung, form giữ nguyên dữ liệu |

### Text/message (tiếng Nhật)

| Trường hợp Cognito | Message hiển thị |
|---|---|
| `NotAuthorizedException` (sai email/mật khẩu) | `メールアドレスまたはパスワードが正しくありません` |
| `UserNotFoundException` (email không tồn tại) | `メールアドレスまたはパスワードが正しくありません` (dùng chung message với sai mật khẩu — không lộ thông tin email có tồn tại hay không) |
| Lỗi khác/network | `エラーが発生しました。しばらくしてから再度お試しください` |
| Nút submit | `ログイン` |

- **[UI-AUTH-01-1] (MỚI)** When user nhấn "ログイン" với email/password
  đã nhập, the system shall chuyển sang trạng thái "Đang submit" và gọi
  SRP auth flow thẳng tới Cognito (không qua backend).
- **[UI-AUTH-01-2] (MỚI)** When Cognito trả về challenge
  `NEW_PASSWORD_REQUIRED`, the system shall chuyển sang màn "Đổi mật
  khẩu lần đầu" — KHÔNG coi đây là lỗi.
- **[UI-AUTH-01-3] (MỚI)** When Cognito trả lỗi
  `NotAuthorizedException`/`UserNotFoundException`, the system shall
  hiện message tương ứng ở bảng Text/message trên, dưới password field,
  KHÔNG xoá nội dung email đã nhập.
- **[UI-AUTH-01-4] (MỚI)** While đang ở trạng thái "Đang submit", the
  system shall disable toàn bộ input field và nút "ログイン".

**Màn hình: Đổi mật khẩu lần đầu (state, hiển thị thay Login sau challenge)**

### Layout

```
┌─────────────────────────────┐
│  新しいパスワードを設定してください │
│                               │
│  新しいパスワード [input-field]  │
│  確認用パスワード [input-field]  │
│                               │
│  [ button-primary "設定する" ] │
└─────────────────────────────┘
```

- Component dùng: `input-field`, `button-primary`, `input-field-error`.

### State matrix

| Trạng thái | Hiển thị |
|---|---|
| Mặc định | Form trống, nút disabled đến khi 2 field khớp nhau + đạt password policy |
| Đang submit | Nút + input disabled, spinner trong nút |
| Lỗi policy (`InvalidPasswordException`) | `input-field-error` dưới field mật khẩu mới |
| Lỗi 2 field không khớp | `input-field-error` dưới field xác nhận, chặn submit trước khi gọi Cognito |

### Text/message (tiếng Nhật)

| Trường hợp | Message hiển thị |
|---|---|
| `InvalidPasswordException` | `パスワードの条件を満たしていません（8文字以上、大文字・小文字・数字を含む）` |
| 2 field không khớp | `パスワードが一致しません` |
| Nút submit | `設定する` |

- **[UI-AUTH-02-1] (MỚI)** When user nhập mật khẩu mới hợp lệ (khớp 2
  field, đạt policy) và nhấn "設定する", the system shall gọi
  `completeNewPasswordChallenge` và, nếu thành công, đăng nhập luôn
  (nhận token, chuyển vào app) — không bắt đăng nhập lại lần 2.
- **[UI-AUTH-02-2] (MỚI)** When Cognito từ chối mật khẩu mới
  (`InvalidPasswordException`), the system shall hiện message tương
  ứng ngay dưới field mật khẩu mới, giữ nguyên màn hình.

**Route guard & Header (áp dụng toàn app, không phải 1 màn riêng)**

- **[UI-AUTH-03-1] (MỚI)** When người dùng chưa có token hợp lệ trong
  `localStorage` và truy cập bất kỳ route nào khác `/login`, the system
  shall redirect về `/login`.
- **[UI-AUTH-03-2] (MỚI)** While đã đăng nhập, the system shall hiển thị
  email và role (`admin`/`member`, đọc từ claim `cognito:groups` trong
  ID token — không có group nào thì coi là `member`) ở header.
- **[UI-AUTH-03-3] (MỚI)** When user nhấn "Đăng xuất", the system shall
  xoá toàn bộ token khỏi `localStorage` và redirect về `/login`.

## 2. Acceptance criteria / Test mapping

| ID | Test case tương ứng |
|---|---|
| AUTH-01 | `TC-AUTH-01: Login đúng email/password (SRP) → nhận đủ idToken/accessToken/refreshToken, không có request nào tới backend trong bước login` |
| AUTH-02 | `TC-AUTH-02: Login bằng account mới tạo (FORCE_CHANGE_PASSWORD) → nhận challenge NEW_PASSWORD_REQUIRED, không nhận token ngay` |
| AUTH-03 | `TC-AUTH-03: Decode payload token sau login → exp - iat ≈ 4 giờ (14400s)` |
| AUTH-04 | `TC-AUTH-04: Gọi route bất kỳ (trừ /health) không kèm Authorization header → 401 từ API Gateway` |
| AUTH-05 | `TC-AUTH-05: Gọi route với token hết hạn/sai chữ ký → 401, log CloudWatch cho thấy request KHÔNG tới Lambda` |
| AUTH-06 | `TC-AUTH-06: Kiểm tra network request thật từ FE → header Authorization dùng đúng idToken (so token payload, không phải accessToken)` |
| AUTH-07 | `TC-AUTH-07: Sau login, kiểm tra DevTools Application → localStorage có đủ 3 token` |
| AUTH-08 | `TC-AUTH-08: Xoá/sửa sai token trong localStorage → gọi app → redirect /login; Mock backend trả 401 → FE tự xoá token + redirect /login` |
| AUTH-09 | `TC-AUTH-09: Review code — không có lời gọi refresh-token nào tự động (chỉ có ở luồng login thủ công)` |
| AUTH-10 | `TC-AUTH-10 (manual): Thực hiện đúng các bước Console ở mục 3 → tạo được user mới, login được` |
| AUTH-11 | `TC-AUTH-11: Review code — logout chỉ xoá localStorage, không gọi GlobalSignOut/API nào tới Cognito` |
| AUTH-12 | `TC-AUTH-12: curl -X OPTIONS <api-url>/... với header preflight (Origin, Access-Control-Request-Method) → nhận 2xx kèm CORS header, KHÔNG bị 401` |
| AUTH-13 | `TC-AUTH-13: Gọi API thật (không phải OPTIONS) qua CloudFront → response chỉ có ĐÚNG 1 header Access-Control-Allow-Origin (không trùng lặp giá trị)` |
| AUTH-14 | `TC-AUTH-14: Tạo user mới trên Console với mật khẩu chỉ có hoa/thường/số (không ký tự đặc biệt) → được chấp nhận` |
| UI-AUTH-01-1..4 | `TC-UI-AUTH-01: Test màn Login đủ 4 trạng thái (mặc định/submit/lỗi/disable khi submit)` |
| UI-AUTH-02-1..2 | `TC-UI-AUTH-02: Test màn Đổi mật khẩu lần đầu — thành công vào thẳng app, sai password policy hiện lỗi` |
| UI-AUTH-03-1..3 | `TC-UI-AUTH-03: Test route guard (chưa login bị đá về /login), hiển thị header đúng email/role, logout xoá token` |

## 3. Hướng dẫn tạo user mới (AWS Console — thủ công, không tự động hoá)

1. AWS Console → **Cognito** → **User pools** → chọn `project-track-users`.
2. Tab **Users** → **Create user**.
3. Điền **Email address** (dùng làm username) → tick **Mark email address as verified**.
4. Chọn **Set a password** → nhập mật khẩu tạm → **KHÔNG** tick "Don't
   require this user to change their password at next sign-in" (để
   giữ mặc định bắt đổi mật khẩu lần đầu — kích hoạt `AUTH-02`).
5. **Create user**.
6. (Nếu cần quyền admin) Vào user vừa tạo → tab **Group memberships** →
   **Add to group** → chọn `admin` (đã có sẵn từ CDK). Không thêm vào
   group nào → mặc định là `member`.

## 4. Ghi chú cho AI agent khi implement

- Kiểm tra freshness `amazon-cognito-identity-js` trước khi `npm
  install` (đúng `CLAUDE.md` mục 2) — nếu bản mới nhất quá 12 tháng,
  quay lại hỏi phương án khác trước khi cài.
- `infra/stacks/main_stack.py`: sửa `_create_user_pool_client` (thêm
  `id_token_validity`/`access_token_validity`) và `_create_http_api`
  (bỏ `default_integration`, thêm `add_routes` tường minh cho
  `GET /health` không authorizer + `ANY /{proxy+}` có
  `self.jwt_authorizer`) — xem chi tiết rationale ở `plan.md` mục 2.
- Không thêm code verify JWT nào trong `backend/app/` — API Gateway lo
  hết phần này (đúng `plan.md` mục 2).
- Không thêm endpoint `GET /auth/me` hay bất kỳ route `/auth/*` nào ở
  backend — module này thuần frontend + hạ tầng CDK.
- `infra/stacks/main_stack.py`: `_create_http_api` phải thêm
  `cors_configuration=apigwv2.CorsPreflightOptions(...)` với origin =
  `f"https://{self.distribution.domain_name}"` — KHÔNG được để trống,
  nếu không preflight OPTIONS sẽ bị JWT Authorizer chặn (xem AUTH-12).
- `backend/app/main.py`: bọc `app.add_middleware(CORSMiddleware, ...)`
  trong `if not os.environ.get("AWS_LAMBDA_FUNCTION_NAME")` — chỉ thêm
  ở local dev, KHÔNG thêm khi chạy trên Lambda (xem AUTH-13). Có thể bỏ
  `cors_origins`/`CORS_ORIGINS` khỏi phần dùng cho production nếu không
  còn cần thiết, nhưng vẫn giữ cho nhánh local.
- `infra/stacks/main_stack.py`: `_create_user_pool` cần thêm
  `password_policy=cognito.PasswordPolicy(min_length=8,
  require_uppercase=True, require_lowercase=True, require_digits=True,
  require_symbols=False)` (xem AUTH-14) — nếu không set, CDK dùng mặc
  định có `require_symbols=True`, sai với message đã viết ở mục 1c.
