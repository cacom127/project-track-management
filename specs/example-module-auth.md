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

## 4. Lịch sử thay đổi module này

| Ngày       | Ticket ID    | Thay đổi                                    |
|------------|--------------|-----------------------------------------------|
| YYYY-MM-DD | SIC_DEV-XXX  | Thêm AUTH-04 (role-based access control)      |

<!-- Trỏ về changes/_archive/SIC_DEV-XXX/ để xem đầy đủ proposal/plan gốc -->
