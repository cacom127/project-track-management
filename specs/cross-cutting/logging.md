# Logging — Current Truth

> Cross-cutting concern — áp dụng cho MỌI module. Nguyên tắc tổng quát
> nằm trong `CLAUDE.md` mục 2; file này chứa convention chi tiết.

## 1. Log level — khi nào dùng

| Level | Khi dùng                                              |
|-------|----------------------------------------------------------|
| ERROR | Lỗi ảnh hưởng chức năng, cần alert/on-call xử lý         |
| WARN  | Bất thường nhưng hệ thống vẫn chạy tiếp (vd retry thành công lần 2) |
| INFO  | Sự kiện nghiệp vụ quan trọng (login, checkout, tạo đơn...) |
| DEBUG | Chi tiết kỹ thuật, chỉ bật ở dev/staging, KHÔNG bật ở production |

## 2. Format bắt buộc (structured JSON)

```json
{
  "timestamp": "2026-08-14T10:00:00+09:00",
  "traceId": "uuid-v4",
  "userId": "uuid hoặc null nếu chưa auth",
  "level": "INFO",
  "module": "auth",
  "message": "User logged in",
  "meta": { "loginMethod": "password" }
}
```

- **[LOG-01]** The system shall include `traceId` in every log entry
  originating from the same request, để trace xuyên suốt qua nhiều
  service (yêu cầu audit của khách hàng Nhật).
- **[LOG-02]** The system shall log all external API calls with
  request/response status for traceability (đối chiếu CLAUDE.md mục 2).

## 3. Dữ liệu KHÔNG được log (tuân thủ APPI)

- Password, token, OTP — dưới mọi hình thức (kể cả hash).
- Số thẻ tín dụng, thông tin thanh toán.
- Thông tin định danh cá nhân trần (CMND/CCCD, số điện thoại đầy đủ) —
  nếu cần, phải mask (vd: `090-****-1234`).

## 4. Nơi lưu trữ / retention

- Log tập trung tại: `<CloudWatch/ELK/...>` — xem thêm tại
  `specs/architecture.md` mục 3 (Ràng buộc hạ tầng).
- Thời gian lưu: <vd: 90 ngày cho INFO, 1 năm cho ERROR — theo yêu cầu hợp
  đồng nếu có>.

## 5. Lịch sử thay đổi

| Ngày       | Ticket ID | Thay đổi                  |
|------------|-----------|------------------------------|
| YYYY-MM-DD | SIC_DEV-1 | Khởi tạo convention logging |
