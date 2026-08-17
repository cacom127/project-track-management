# Tasks — CHANGE-005-auth-module

> Dựa trên `delta-spec.md` + `plan.md` cùng thư mục.

- **Ticket ID**: CHANGE-005-auth-module
- **Dựa trên**: `delta-spec.md` (+ `plan.md`)

## Checklist

- [x] **T1** — CDK: `_create_user_pool` — thêm `password_policy`
      (min 8, hoa/thường/số, KHÔNG bắt ký tự đặc biệt);
      `_create_user_pool_client` — thêm `id_token_validity` /
      `access_token_validity` = 4 giờ

      - Liên quan: AUTH-03, AUTH-14
      - File dự kiến: `infra/stacks/main_stack.py`
- [ ] **T2** — CDK: `_create_http_api` — bỏ `default_integration`, thêm
      `cors_configuration` (origin = domain CloudFront), khai báo route
      tường minh: `GET /health` (không authorizer) + `ANY /{proxy+}`
      (gắn `self.jwt_authorizer`)

      - Liên quan: AUTH-04, AUTH-05, AUTH-12
      - File dự kiến: `infra/stacks/main_stack.py`
- [ ] **T3** — Backend: `main.py` — chỉ `add_middleware(CORSMiddleware)`
      khi KHÔNG có biến môi trường `AWS_LAMBDA_FUNCTION_NAME` (viết test
      trước: mock `os.environ` 2 trường hợp, assert middleware có/không
      được add)

      - Liên quan: AUTH-13
      - File dự kiến: `backend/app/main.py`, `backend/tests/test_main.py`
- [ ] **T4** — Kiểm tra freshness `amazon-cognito-identity-js` (npm,
      ngày publish bản mới nhất) trước khi cài — đúng `CLAUDE.md` mục 2

      - Liên quan: (điều kiện tiên quyết cho T5)
- [ ] **T5** — Frontend: `src/lib/auth.ts` — wrapper SRP login,
      `completeNewPasswordChallenge`, đọc/ghi token `localStorage`,
      decode payload `idToken`, `logout()` (chỉ xoá local, không gọi
      Cognito) — viết unit test trước cho phần decode token + logic
      lưu/xoá `localStorage` (phần gọi Cognito thật mock SDK)

      - Liên quan: AUTH-01, AUTH-02, AUTH-06, AUTH-07, AUTH-09, AUTH-11
      - File dự kiến: `frontend/src/lib/auth.ts`, `frontend/src/lib/auth.test.ts`
- [ ] **T6** — Frontend: màn hình Login (`/login`) — layout, state
      matrix, message tiếng Nhật theo `delta-spec.md` mục 1c

      - Liên quan: UI-AUTH-01-1..4
      - File dự kiến: `frontend/src/pages/Login.tsx`, `frontend/src/pages/Login.test.tsx`
- [ ] **T7** — Frontend: màn hình Đổi mật khẩu lần đầu — layout, state
      matrix, message tiếng Nhật theo `delta-spec.md` mục 1c

      - Liên quan: UI-AUTH-02-1..2
      - File dự kiến: `frontend/src/pages/ChangePassword.tsx`, `frontend/src/pages/ChangePassword.test.tsx`
- [ ] **T8** — Frontend: route guard (redirect `/login` nếu chưa có
      token hợp lệ) + header hiển thị email/role (từ claim
      `cognito:groups`) + nút Đăng xuất

      - Liên quan: UI-AUTH-03-1..3
      - File dự kiến: `frontend/src/components/RouteGuard.tsx`, `frontend/src/components/Header.tsx` (tên file tuỳ theo cấu trúc hiện có)
- [ ] **T9** — Frontend: HTTP client dùng chung — tự gắn
      `Authorization: Bearer <idToken>` cho mọi request tới backend; khi
      nhận `401` thì xoá token + redirect `/login`

      - Liên quan: AUTH-06, AUTH-08
      - File dự kiến: `frontend/src/lib/apiClient.ts`
- [ ] **T10** — `cdk deploy` lại (profile SSO `project-track`) — verify
      preflight OPTIONS không bị 401 (`TC-AUTH-12`), response thật chỉ
      có đúng 1 header `Access-Control-Allow-Origin` (`TC-AUTH-13`)

      - Liên quan: AUTH-12, AUTH-13
- [ ] **T11** — Tạo 1 user test qua AWS Console (theo hướng dẫn mục 3),
      verify E2E thật trên URL CloudFront: login → bị bắt đổi mật khẩu
      → đổi thành công → vào app → thấy email/role ở header → logout →
      về lại `/login`

      - Liên quan: AUTH-01, AUTH-02, AUTH-10, AUTH-14, UI-AUTH-01..03
- [ ] **T12** — Fold `AUTH-01..14` vào `specs/auth.md` (tạo mới),
      `UI-AUTH-01..03` vào `specs/auth-ui.md` (tạo mới), cập nhật bảng
      module ở `specs/architecture.md` mục 2 (trỏ sang file spec vừa
      tạo thay vì "chưa có"), archive ticket vào `changes/_archive/`

## Trạng thái

| Trạng thái | Ngày cập nhật | Ghi chú |
|---|---|---|
| Chưa bắt đầu | 2026-08-17 | |
