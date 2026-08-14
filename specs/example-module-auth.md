# Module: Auth — Current Truth

> Ví dụ mẫu cho 1 file spec trong `specs/`. Copy file này và đổi tên khi
> tạo spec cho module khác (vd `specs/inventory.md`, `specs/billing.md`).

## 1. Mục đích module

Quản lý xác thực người dùng và phân quyền truy cập cho toàn hệ thống.

## 2. Yêu cầu hiện tại (Requirements — EARS notation)

- **[AUTH-01]** When a user submits valid credentials, the system shall
  issue a session token valid for 8 hours.
- **[AUTH-02]** When a user fails login 5 times within 1 minute, the
  system shall lock the account for 15 minutes.
- **[AUTH-03]** While a session token is expired, the system shall reject
  all authenticated API requests with HTTP 401.
- **[AUTH-04]** The system shall support role-based access control with
  roles: `admin`, `store_staff`, `viewer`.

> Mỗi ID (AUTH-01, AUTH-02...) dùng để trace từ test case ngược lại yêu cầu,
> và để `delta-spec.md` tham chiếu khi có thay đổi (vd "Sửa AUTH-02: giảm
> xuống 3 lần thử").

## 3. Ràng buộc kỹ thuật đã chốt

- Token: JWT, ký bằng <thuật toán>, secret rotate mỗi <X> ngày.
- Không lưu password dạng plaintext hoặc hash yếu (MD5/SHA1).

## 4. Data Model (field-level — module này SỞ HỮU entity User, Session)

> Xem `specs/data-model.md` mục 2 để biết entity nào thuộc module nào.
> Đây là nơi DUY NHẤT định nghĩa field chi tiết của User/Session — không
> lặp lại ở `specs/data-model.md`.

### User
| Field    | Type   | Constraint                     |
|----------|--------|----------------------------------|
| id       | uuid   | PK                                |
| email    | string | unique, not null                 |
| password | string | hashed (bcrypt), not null         |
| role     | enum   | admin / store_staff / viewer      |

### Session
| Field       | Type     | Constraint                        |
|-------------|----------|--------------------------------------|
| id          | uuid     | PK                                    |
| user_id     | uuid     | FK → User.id, cascade delete          |
| expires_at  | datetime | not null                              |

### Ràng buộc dữ liệu (EARS notation)

- **[DM-AUTH-01]** The `User.email` field shall be unique across the
  system.
- **[DM-AUTH-02]** When a `User` is deleted, the system shall
  cascade-delete all associated `Session` records.
- **[DM-AUTH-03]** The system shall not allow `Session.expires_at` to be
  set in the past at creation time.

## 5. UI (tuỳ chọn — nếu module đơn giản, không cần tách file *-ui.md riêng)

- Xem `DESIGN.md` cho token màu/font/component dùng chung.
- Layout, state, hành vi tương tác chi tiết của từng màn hình auth: xem
  file riêng `specs/auth-ui.md` nếu module có nhiều màn hình.

## 6. Lịch sử thay đổi module này

| Ngày       | Ticket ID    | Thay đổi                                    |
|------------|--------------|-----------------------------------------------|
| YYYY-MM-DD | CHANGE-XXX  | Thêm AUTH-04 (role-based access control)      |

<!-- Trỏ về changes/_archive/CHANGE-XXX/ để xem đầy đủ proposal/plan gốc -->
