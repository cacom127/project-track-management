# Plan — CHANGE-005-auth-module

> Dựa trên `proposal.md` cùng thư mục. Quyết định kỹ thuật cuối cùng —
> `delta-spec.md` sẽ viết cam kết nằm trong giới hạn ở đây.

- **Ticket ID**: CHANGE-005-auth-module
- **Dựa trên**: `proposal.md` cùng thư mục

## 1. Kiến trúc / thiết kế kỹ thuật

```
[FE: /login] --(SRP, gọi thẳng Cognito, KHÔNG qua backend)--> [Cognito User Pool]
     |
     v (idToken/accessToken/refreshToken -> localStorage)
[FE: mọi request khác] --(Authorization: Bearer <idToken>)--> [API Gateway HTTP API]
                                                                      |
                                              route /health: KHÔNG authorizer
                                              route khác:   JWT Authorizer (Cognito) --> 401 nếu invalid
                                                                      |
                                                                      v
                                                              [Lambda: FastAPI/Mangum]
```

- FE lấy `email`/`cognito:groups` (role) bằng cách decode payload của
  `idToken` (không verify chữ ký phía FE — chỉ để hiển thị, không dùng
  để quyết định quyền truy cập dữ liệu thật).
- Backend không code verify JWT thủ công — API Gateway JWT Authorizer
  đã chặn request thiếu/sai token trước khi tới Lambda.

## 2. Quyết định kỹ thuật quan trọng

| Quyết định | Lý do |
|---|---|
| Lưu token ở `localStorage` (không phải in-memory hay httpOnly cookie) | httpOnly cookie phức tạp hơn do CloudFront/API Gateway khác domain (cần `SameSite=None; Secure` + backend tự set/verify cookie). In-memory không an toàn hơn localStorage trước XSS (JS vẫn đọc được), chỉ khác ở việc mất khi F5 — không đáng đánh đổi độ phức tạp refresh-flow cho hệ thống nội bộ ít user. |
| FE gọi thẳng Cognito bằng `amazon-cognito-identity-js`, không dùng `aws-amplify` | Chỉ cần đúng phần SRP/challenge — `amazon-cognito-identity-js` nhẹ hơn nhiều so với kéo theo cả `aws-amplify` (nhiều service không dùng tới). Cần kiểm tra freshness (`CLAUDE.md` mục 2) lúc implement — package thuộc `aws-amplify` org, được AWS maintain liên tục. |
| Lấy user info bằng decode `idToken` phía FE, không thêm endpoint `GET /auth/me` | Dữ liệu (email, role) đã có sẵn trong token, gọi thêm API là dư thừa. Nếu sau này cần dữ liệu mở rộng không có trong token (vd avatar lưu DB), có thể thêm endpoint riêng ở ticket khác. |
| Gửi **ID token** (không phải access token) làm Bearer token cho backend | API Gateway HTTP API JWT Authorizer verify theo claim `aud` — chỉ ID token có `aud` = `user_pool_client_id`; access token dùng claim `client_id` khác cấu trúc, không khớp cấu hình `jwt_audience` đang có sẵn. |
| `id_token_validity` / `access_token_validity` = 4 giờ (thay vì mặc định 1 giờ) | Theo yêu cầu — giảm tần suất phải đăng nhập lại trong ngày làm việc, vẫn trong giới hạn cho phép của Cognito (tối đa 24 giờ). |
| Hết hạn token: bắt đăng nhập lại, KHÔNG tự động refresh bằng `refreshToken` | Đơn giản (YAGNI) — 4 tiếng/lần là chấp nhận được cho tool nội bộ, tránh phải xử lý race-condition khi nhiều request cùng lúc nhận 401. |
| API Gateway: bỏ `default_integration` ở `$default`, khai báo route tường minh `GET /health` (không authorizer) + `ANY /{proxy+}` (JWT Authorizer) | `HttpApi` không áp được authorizer chọn lọc lên `$default` — phải tách route tường minh để `/health` giữ public (đúng ARCH-13: health-check không được yêu cầu auth) trong khi các route khác bắt buộc JWT. |
| CORS cấu hình ở tầng `HttpApi` (`cors_configuration`), KHÔNG dùng `CORSMiddleware` khi chạy trên Lambda | Nếu JWT Authorizer áp cho `ANY /{proxy+}`, request `OPTIONS` (preflight, trình duyệt KHÔNG gửi kèm `Authorization`) cũng sẽ bị chặn `401` trước khi tới Lambda → CORS hỏng hoàn toàn cho mọi API cần login. Cấu hình CORS ở API Gateway để nó tự trả lời preflight, không qua authorizer. Để tránh 2 lớp cùng set trùng header `Access-Control-Allow-Origin` (request thật), `backend/app/main.py` chỉ add `CORSMiddleware` khi **không** chạy trên Lambda (check biến `AWS_LAMBDA_FUNCTION_NAME` — Lambda runtime tự set sẵn). Local dev (gọi thẳng `localhost:8000`, không qua API Gateway) vẫn cần `CORSMiddleware` nên giữ nguyên nhánh này. |
| Backend không thêm route/code verify JWT | API Gateway đã verify chữ ký + `aud`/`iss` trước khi tới Lambda — code Lambda tự verify lại là dư thừa, không cần trong ticket này (chưa có route nào cần đọc claims để phân quyền). |
| Nới `password_policy` của `UserPool` trong CDK: chỉ bắt buộc hoa/thường/số, min 8 ký tự — bỏ yêu cầu ký tự đặc biệt (mặc định CDK có bật) | Message hiển thị lỗi policy ở FE đơn giản hơn (không cần giải thích "ký tự đặc biệt" mơ hồ với người dùng không rành). Đánh đổi: giảm nhẹ độ mạnh mật khẩu — chấp nhận được cho hệ thống nội bộ ít user. |
| Không phân quyền admin/member ở route backend nào | Chưa có route nghiệp vụ nào cần phân biệt (đúng Non-goals ở `proposal.md`) — để dành cho module `projects` sau này. |
| Tạo user mới: thủ công qua **AWS Console** (không dùng CLI, không làm UI) | Ngoài phạm vi ticket (Non-goals) — tránh phình to ticket auth cho 1 tác vụ hiếm khi làm. Console đơn giản hơn CLI cho thao tác 1-lần, không cần cài/config AWS CLI riêng cho việc này. |

## 3. Rủi ro / đánh đổi (trade-off)

- **`localStorage` không chống được XSS** — chấp nhận vì hệ thống nội
  bộ, ít user, ưu tiên đơn giản. Giảm thiểu bằng cách không innerHTML
  render dữ liệu chưa sanitize ở các module sau này.
- **Không tự động refresh token** — người dùng phải đăng nhập lại sau
  4 tiếng liên tục dùng app. Chấp nhận cho tool nội bộ, không có SLA
  "luôn đăng nhập" khắt khe.
- **Đổi cấu trúc route API Gateway** (`$default` → route tường minh) có
  thể ảnh hưởng hành vi hiện tại nếu có route ẩn nào đang phụ thuộc vào
  catch-all — rà lại toàn bộ route hiện có (chỉ có `/health` và
  catch-all FastAPI) trước khi đổi, nguy cơ thấp vì app còn nhỏ.
- **Audit logging cho sự kiện đăng nhập chưa đầy đủ** — login gọi thẳng
  Cognito từ FE, không qua Lambda, nên không có log JSON nào ghi lại
  theo cơ chế hiện tại (`architecture.md` mục 4, chỉ log request vào
  Lambda). Chấp nhận tạm thời cho ticket này (Cognito có log riêng qua
  CloudTrail data events nếu cần tra cứu sau); xử lý đầy đủ hơn (nếu
  cần) sẽ nằm ở ticket `specs/cross-cutting/logging.md` riêng — đúng quy
  ước "logging chi tiết là ticket riêng" đã ghi ở `CLAUDE.md` mục 2.

## 4. Migration / rollback

- Không có migration dữ liệu.
- Rollback: `cdk deploy` lại với code cũ (route `$default` + không giới
  hạn token validity) nếu phát sinh lỗi nghiêm trọng — không có dữ liệu
  người dùng thật bị ảnh hưởng bởi việc rollback này.

## 5. Định nghĩa "Done" cho bước Plan này

- [x] Đã xác nhận thiết kế với Technical owner (namlp) — qua brainstorm
- [ ] Đã cập nhật `delta-spec.md` tương ứng với thiết kế này
