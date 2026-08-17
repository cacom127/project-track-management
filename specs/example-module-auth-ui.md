# Module: Auth — UI (Current Truth)

> Ví dụ mẫu cho UI feature spec, tách riêng khỏi `specs/example-module-auth.md`
> vì module có nhiều màn hình. Copy & đổi tên khi cần (vd `specs/inventory-ui.md`).
> Token màu/font/component xem `DESIGN.md` — file này KHÔNG lặp lại giá trị
> màu/font cụ thể, chỉ tham chiếu tên token.
>
> Nếu module chỉ có 1 màn hình đơn giản, không cần tách file riêng — chỉ
> cần thêm mục `## UI` vào `specs/<module>.md` (xem ví dụ trong
> `example-module-auth.md` mục 5).

## 1. Danh sách màn hình thuộc module này

| Màn hình         | Route/Screen name      | Mô tả ngắn                        |
|-------------------|--------------------------|--------------------------------------|
| Login             | `/login`                | Đăng nhập bằng email/password        |
| Reset Password    | `/reset-password`        | Gửi link/OTP đặt lại mật khẩu        |
| Account Locked    | (modal/toast trên Login) | Thông báo khi tài khoản bị khoá      |

---

## 2. Màn hình: Login

### 2.1 Layout

```
┌─────────────────────────────┐
│         [Logo]               │
│                               │
│  Email:    [input-field]    │
│  Password: [input-field]    │
│                               │
│  [ button-primary "Đăng nhập" ] │
│  Quên mật khẩu? →             │
└─────────────────────────────┘
```

- Component dùng: `input-field`, `button-primary` (xem `DESIGN.md`).
- Layout: single-column, căn giữa màn hình, max-width 360px (mobile:
  full width - `spacing.md` padding 2 bên).

### 2.2 Trạng thái màn hình (state matrix)

| Trạng thái                  | Hiển thị                                                  |
|--------------------------------|----------------------------------------------------------------|
| Mặc định                      | Form trống, `button-primary` ở trạng thái enabled              |
| Đang submit                   | `button-primary-disabled` + loading spinner trong nút          |
| Lỗi sai tài khoản/mật khẩu    | Text đỏ dưới password field: message từ `AUTH_001` (xem `specs/cross-cutting/error-handling.md`) |
| Tài khoản bị khoá              | Chuyển sang state "Account Locked" (mục 4)                     |

### 2.3 Hành vi tương tác (EARS)

- **[UI-AUTH-01-1]** When user nhấn "Đăng nhập" với email/password hợp
  lệ, the system shall chuyển sang trạng thái "Đang submit" và gọi API
  `POST /auth/login`.
- **[UI-AUTH-01-2]** When API trả về lỗi `AUTH_001`, the system shall
  hiện lỗi dưới password field, KHÔNG xoá nội dung email đã nhập.
- **[UI-AUTH-01-3]** When API trả về lỗi `AUTH_002` (account locked), the
  system shall chuyển sang state "Account Locked" (mục 4), không hiện lỗi
  dạng text thông thường.
- **[UI-AUTH-01-4]** While đang ở trạng thái "Đang submit", the system
  shall disable toàn bộ input field để tránh sửa trong lúc chờ.

---

## 3. Màn hình: Reset Password

### 3.1 Layout

```
┌─────────────────────────────┐
│ ← Đặt lại mật khẩu            │
│                               │
│  Email: [input-field]        │
│  [ button-primary "Gửi link" ] │
│  Quay lại đăng nhập →         │
└─────────────────────────────┘
```

### 3.2 Trạng thái màn hình

| Trạng thái              | Hiển thị                                              |
|----------------------------|------------------------------------------------------------|
| Mặc định                  | Form trống, nút disabled đến khi có email hợp lệ format    |
| Đang gửi                  | Nút hiện loading spinner                                   |
| Thành công                | Toast "Đã gửi link, kiểm tra email" + quay về Login        |
| Lỗi email không tồn tại   | Text đỏ dưới field, message từ `AUTH_003`                  |

### 3.3 Hành vi tương tác (EARS)

- **[UI-AUTH-05-1]** When user nhấn "Gửi link" với email hợp lệ format,
  the system shall hiện trạng thái "Đang gửi" và gọi API
  `POST /auth/reset-password`.
- **[UI-AUTH-05-2]** When API trả về thành công, the system shall hiện
  toast thành công và tự động quay về màn hình Login sau 2 giây.
- **[UI-AUTH-05-3]** When API trả lỗi `AUTH_003`, the system shall hiện
  lỗi ngay dưới field email, KHÔNG hiện toast.

---

## 4. State: Account Locked (không phải màn hình riêng — modal/banner trên Login)

### 4.1 Layout

```
┌─────────────────────────────┐
│  ⚠ Tài khoản đang bị khoá     │
│  Vui lòng thử lại sau 15 phút │
│  [ Đóng ]                     │
└─────────────────────────────┘
```

### 4.2 Hành vi tương tác (EARS)

- **[UI-AUTH-02-1]** While tài khoản đang ở trạng thái locked, the system
  shall disable nút "Đăng nhập" trên màn hình Login.

---

## 5. Tham chiếu thiết kế

- Figma: `<link tới frame Login/Reset Password nếu có>`
- Design token dùng: `button-primary`, `input-field`, `input-field-error`
  (xem `DESIGN.md`)
- Ảnh/mockup chỉ là tài liệu THAM KHẢO — nguồn chân lý là nội dung EARS +
  state matrix ở trên (xem lý do trong hội thoại/CLAUDE.md).

## 6. Lịch sử thay đổi

| Ngày       | Ticket ID   | Thay đổi                                        |
|------------|-------------|-----------------------------------------------------|
| YYYY-MM-DD | CHANGE-1   | Khởi tạo: màn hình Login                            |
| YYYY-MM-DD | CHANGE-50  | Thêm màn hình Reset Password (UI-AUTH-05-*)         |

<!-- Trỏ về changes/_archive/CHANGE-XXX/ để xem đầy đủ proposal/plan gốc -->
