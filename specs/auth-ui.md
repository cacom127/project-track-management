# Module: Auth — UI (Current Truth)

> Layout/state/hành vi tương tác của module `auth`. Token màu/font/
> component xem `DESIGN.md` — file này KHÔNG lặp lại giá trị màu/font
> cụ thể, chỉ tham chiếu tên token.

## 1. Danh sách màn hình thuộc module này

| Màn hình              | Route/Screen name       | Mô tả ngắn                              |
|------------------------|---------------------------|--------------------------------------------|
| Login                  | `/login`                  | Đăng nhập bằng email/password (SRP)         |
| Đổi mật khẩu lần đầu   | (state trên `/login`)     | Bắt buộc khi account `FORCE_CHANGE_PASSWORD`|
| Header (toàn app)      | (component dùng chung)    | Hiện email/role, nút Đăng xuất              |

---

## 2. Màn hình: Login

### 2.1 Layout

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

### 2.2 Trạng thái màn hình (state matrix)

| Trạng thái | Hiển thị |
|---|---|
| Mặc định | Form trống, `button-primary` enabled |
| Đang submit | `button-primary` + `input-field` disabled, spinner trong nút |
| Lỗi sai email/mật khẩu | `input-field-error` dưới password field |
| Lỗi khác (network/Cognito 5xx) | Toast lỗi chung, form giữ nguyên dữ liệu |

### 2.3 Text/message (tiếng Nhật)

| Trường hợp Cognito | Message hiển thị |
|---|---|
| `NotAuthorizedException` (sai email/mật khẩu) | `メールアドレスまたはパスワードが正しくありません` |
| `UserNotFoundException` (email không tồn tại) | `メールアドレスまたはパスワードが正しくありません` (dùng chung message với sai mật khẩu — không lộ thông tin email có tồn tại hay không) |
| Lỗi khác/network | `エラーが発生しました。しばらくしてから再度お試しください` |
| Nút submit | `ログイン` |

### 2.4 Hành vi tương tác (EARS)

- **[UI-AUTH-01-1]** When user nhấn "ログイン" với email/password đã
  nhập, the system shall chuyển sang trạng thái "Đang submit" và gọi
  SRP auth flow thẳng tới Cognito (không qua backend).
- **[UI-AUTH-01-2]** When Cognito trả về challenge
  `NEW_PASSWORD_REQUIRED`, the system shall chuyển sang màn "Đổi mật
  khẩu lần đầu" — KHÔNG coi đây là lỗi.
- **[UI-AUTH-01-3]** When Cognito trả lỗi
  `NotAuthorizedException`/`UserNotFoundException`, the system shall
  hiện message tương ứng ở bảng 2.3, dưới password field, KHÔNG xoá nội
  dung email đã nhập.
- **[UI-AUTH-01-4]** While đang ở trạng thái "Đang submit", the system
  shall disable toàn bộ input field và nút "ログイン".

---

## 3. Màn hình: Đổi mật khẩu lần đầu

> State hiển thị thay Login sau challenge `NEW_PASSWORD_REQUIRED` —
> KHÔNG phải route riêng.

### 3.1 Layout

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

### 3.2 Trạng thái màn hình

| Trạng thái | Hiển thị |
|---|---|
| Mặc định | Form trống, nút disabled đến khi 2 field khớp nhau + đạt password policy |
| Đang submit | Nút + input disabled, spinner trong nút |
| Lỗi policy (`InvalidPasswordException`) | `input-field-error` dưới field mật khẩu mới |
| Lỗi 2 field không khớp | `input-field-error` dưới field xác nhận, chặn submit trước khi gọi Cognito |

### 3.3 Text/message (tiếng Nhật)

| Trường hợp | Message hiển thị |
|---|---|
| `InvalidPasswordException` | `パスワードの条件を満たしていません（8文字以上、大文字・小文字・数字を含む）` |
| 2 field không khớp | `パスワードが一致しません` |
| Nút submit | `設定する` |

### 3.4 Hành vi tương tác (EARS)

- **[UI-AUTH-02-1]** When user nhập mật khẩu mới hợp lệ (khớp 2 field,
  đạt policy) và nhấn "設定する", the system shall gọi
  `completeNewPasswordChallenge` và, nếu thành công, đăng nhập luôn
  (nhận token, chuyển vào app) — không bắt đăng nhập lại lần 2.
- **[UI-AUTH-02-2]** When Cognito từ chối mật khẩu mới
  (`InvalidPasswordException`), the system shall hiện message tương
  ứng ngay dưới field mật khẩu mới, giữ nguyên màn hình.

---

## 4. Route guard & Header (áp dụng toàn app)

### 4.1 Hành vi tương tác (EARS)

- **[UI-AUTH-03-1]** When người dùng chưa có token hợp lệ trong
  `localStorage` và truy cập bất kỳ route nào khác `/login`, the system
  shall redirect về `/login`.
- **[UI-AUTH-03-2]** While đã đăng nhập, the system shall hiển thị
  email và role (`admin`/`member`, đọc từ claim `cognito:groups` trong
  ID token — không có group nào thì coi là `member`) ở header.
- **[UI-AUTH-03-3]** When user nhấn "Đăng xuất", the system shall xoá
  toàn bộ token khỏi `localStorage` và redirect về `/login`.

## 5. Test mapping

| ID | Test case tương ứng |
|---|---|
| UI-AUTH-01-1..4 | `TC-UI-AUTH-01: Test màn Login đủ 4 trạng thái (mặc định/submit/lỗi/disable khi submit)` |
| UI-AUTH-02-1..2 | `TC-UI-AUTH-02: Test màn Đổi mật khẩu lần đầu — thành công vào thẳng app, sai password policy hiện lỗi` |
| UI-AUTH-03-1..3 | `TC-UI-AUTH-03: Test route guard (chưa login bị đá về /login), hiển thị header đúng email/role, logout xoá token` |

## 6. Tham chiếu thiết kế

- Design token dùng: `input-field`, `input-field-error`, `button-primary`
  (xem `DESIGN.md`).

## 7. Lịch sử thay đổi

| Ngày       | Ticket ID              | Thay đổi                                    |
|------------|--------------------------|-----------------------------------------------|
| 2026-08-17 | CHANGE-005-auth-module  | Khởi tạo: màn Login, Đổi mật khẩu lần đầu, Header/route guard |

<!-- Trỏ về changes/_archive/CHANGE-005-auth-module/ để xem đầy đủ proposal/plan gốc -->
