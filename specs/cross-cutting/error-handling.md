# Error Handling — Current Truth

> Cross-cutting concern — áp dụng cho MỌI module, không thuộc riêng module
> nào. Nguyên tắc tổng quát nằm trong `CLAUDE.md` mục 2; file này chứa
> chiến lược chi tiết + catalog error code dùng chung toàn hệ thống.

## 1. Chiến lược xử lý lỗi (EARS notation)

- **[ERR-01]** When an unhandled exception occurs, the system shall
  return HTTP 500 with a generic message ("Đã có lỗi xảy ra, vui lòng thử
  lại"), and log full stack trace internally — KHÔNG trả stack trace ra
  client.
- **[ERR-02]** When input validation fails, the system shall return
  HTTP 400 with an error code từ catalog (mục 2) kèm message song ngữ.
- **[ERR-03]** When an external API call (3rd-party) fails, the system
  shall retry tối đa 3 lần với exponential backoff trước khi trả lỗi cho
  client.
- **[ERR-04]** While a known business-rule violation occurs (vd: tồn kho
  không đủ), the system shall return HTTP 409 với error code cụ thể,
  không dùng HTTP 500.

## 2. Catalog error code

> Quy ước đặt tên: `<MODULE>_<SỐ THỨ TỰ>`. Khi thêm error code mới, luôn
> đi qua `changes/<ticket-id>/delta-spec.md` như mọi thay đổi khác.

| Code       | HTTP | Message (VI)                  | Message (JP)                              |
|------------|------|--------------------------------|---------------------------------------------|
| AUTH_001   | 401  | Sai tài khoản hoặc mật khẩu    | メールアドレスまたはパスワードが正しくありません |
| AUTH_002   | 423  | Tài khoản đang bị khoá         | アカウントがロックされています               |
| INV_001    | 409  | Số lượng tồn kho không đủ      | 在庫数が不足しています                       |
| SYS_001    | 500  | Đã có lỗi xảy ra, vui lòng thử lại | エラーが発生しました。しばらくしてから再試行してください |

## 3. Trách nhiệm hiển thị lỗi (frontend)

- Lỗi field-level (400 validation) hiển thị ngay dưới field liên quan.
- Lỗi hệ thống (500) hiển thị dạng toast/snackbar, không chặn toàn màn hình.
- Xem thêm quy ước hiển thị theo từng UI cụ thể trong `specs/<module>-ui.md`.

## 4. Lịch sử thay đổi

| Ngày       | Ticket ID | Thay đổi                          |
|------------|-----------|--------------------------------------|
| YYYY-MM-DD | SIC_DEV-1 | Khởi tạo chiến lược + catalog ban đầu |
