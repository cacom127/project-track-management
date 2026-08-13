# Plan — <Tên thay đổi ngắn>

> Chỉ cần cho size Medium (khuyến khích)/Large (bắt buộc). Người viết:
> Technical owner / Dev lead — dịch `proposal.md` (business) thành quyết
> định kỹ thuật cụ thể.

- **Ticket ID**: <TICKET-123>
- **Dựa trên**: `proposal.md` cùng thư mục

## 1. Kiến trúc / thiết kế kỹ thuật

<Mô tả module nào bị đụng tới, thêm/sửa API nào, thay đổi DB schema nào>

```
<sơ đồ đơn giản nếu cần, hoặc mô tả luồng dữ liệu>
```

## 2. Quyết định kỹ thuật quan trọng

| Quyết định                     | Lý do                                   |
|----------------------------------|-------------------------------------------|
| <vd: dùng Redis để lưu OTP>     | <vd: cần TTL tự động, tránh cron dọn DB>  |

## 3. Rủi ro / đánh đổi (trade-off)

<Nếu có, ghi ngắn rủi ro kỹ thuật và cách giảm thiểu>

## 4. Migration / rollback

- Cần migration dữ liệu: <Có/Không — nếu có, mô tả ngắn cách rollback>

## 5. Định nghĩa "Done" cho bước Plan này

- [ ] Đã xác nhận thiết kế với Technical owner
- [ ] Đã cập nhật `delta-spec.md` tương ứng với thiết kế này
