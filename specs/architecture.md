# Architecture — Current Truth

> File này mô tả TRẠNG THÁI HIỆN TẠI đã chốt của kiến trúc hệ thống.
> Không ghi ở đây các đề xuất đang bàn — những cái đó thuộc về `changes/`.
> File này chỉ được cập nhật KHI một `changes/<ticket-id>/delta-spec.md`
> liên quan đến kiến trúc được merge.

## 1. Tổng quan hệ thống

<Sơ đồ / mô tả ngắn hệ thống đang có — tên các service chính, vai trò của
từng service>

```
[Mobile App (Flutter)] --> [API Gateway] --> [Backend Service] --> [DB]
                                       └----> [3rd-party integration]
```

## 2. Danh sách module/domain

| Module      | Vai trò                          | Spec chi tiết                  |
|-------------|-----------------------------------|---------------------------------|
| auth        | Xác thực, phân quyền              | `specs/auth.md`                 |
| inventory   | Quản lý tồn kho / RFID            | `specs/inventory.md`            |
| ...         | ...                                | ...                              |

## 3. Ràng buộc hạ tầng

- Môi trường: AWS (region: <ap-northeast-1>...)
- Data residency: <tuân thủ APPI — dữ liệu khách hàng Nhật lưu ở đâu>
- CI/CD: <pipeline gì, gate nào bắt buộc>

## 4. Lịch sử thay đổi kiến trúc lớn

| Ngày       | Ticket ID       | Thay đổi                        |
|------------|-----------------|-----------------------------------|
| YYYY-MM-DD | TICKET-XXX     | <mô tả ngắn thay đổi kiến trúc>  |

<!-- Mỗi dòng ở đây trỏ về changes/_archive/TICKET-XXX/ để xem đầy đủ lý do -->
