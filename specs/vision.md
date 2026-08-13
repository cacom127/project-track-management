# Vision / Requirements — Current Truth

> Mô tả bài toán kinh doanh, đối tượng dùng, và phạm vi ở mức tổng quan
> nhất — KHÔNG nói đến công nghệ (đó là việc của `architecture.md`). Đây là
> file thường được viết ĐẦU TIÊN khi khởi tạo dự án (xem
> `changes/000-project-genesis/proposal.md`).

## 1. Bài toán

<Mô tả ngắn: khách hàng/công ty đang gặp vấn đề gì, dự án này giải quyết
như thế nào>

## 2. Đối tượng sử dụng

| Đối tượng          | Vai trò/nhu cầu chính                     |
|----------------------|----------------------------------------------|
| <vd: Nhân viên kho> | <vd: Quét RFID, xác nhận nhập/xuất hàng>    |
| <vd: Quản lý>       | <vd: Xem báo cáo tồn kho tổng hợp>          |

## 3. Phạm vi (Scope)

### Trong phạm vi (MVP)
- <liệt kê tính năng chính>

### Ngoài phạm vi (giai đoạn sau)
- <liệt kê rõ để tránh scope creep — AI agent không tự mở rộng ra các mục
  ở đây khi implement>

## 4. Success criteria

<Đo được, vd: "80% nhân viên kho dùng thành thạo sau 1 buổi training",
"Giảm thời gian kiểm kê từ 2 giờ xuống 20 phút">

## 5. Ràng buộc đã biết từ đầu

- Ràng buộc hợp đồng/pháp lý: <vd: APPI, data residency Nhật>
- Ràng buộc timeline/budget: <nếu có, ghi ngắn>
- Ràng buộc tích hợp: <vd: phải tương thích thiết bị RFID hiện có của khách>

## 6. Lịch sử thay đổi

| Ngày       | Ticket ID           | Thay đổi                    |
|------------|----------------------|--------------------------------|
| YYYY-MM-DD | 000-project-genesis | Khởi tạo vision/requirement ban đầu |
