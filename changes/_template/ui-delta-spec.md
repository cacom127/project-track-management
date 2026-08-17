# UI Delta Spec — <Tên thay đổi ngắn>

> **OPTIONAL** — chỉ tạo file này khi ticket đụng NHIỀU màn hình/luồng UI
> phức tạp, cần tách riêng để Dev frontend/Designer review độc lập với
> `delta-spec.md` (backend). Nếu chỉ 1-2 dòng UI đơn giản, thêm thẳng vào
> mục "## 1c. Thay đổi UI" trong `delta-spec.md`, KHÔNG cần file riêng.
>
> Khi merge, nội dung này fold vào `specs/<module>-ui.md` (tạo file mới
> nếu chưa tồn tại). KHÔNG fold vào `DESIGN.md` — file đó chỉ chứa
> token/component atomic, không chứa layout/behavior riêng từng ticket.

- **Ticket ID**: <CHANGE-123>
- **Module UI bị ảnh hưởng**: `specs/<tên-module>-ui.md`

## 1. Màn hình bị ảnh hưởng

<!-- Liệt kê ngắn — màn hình nào MỚI, màn hình nào SỬA -->
- Reset Password (MỚI)
- Login (SỬA — thêm state "Account Locked")

## 2. Layout (chỉ cho màn hình MỚI hoặc SỬA)

```
<ASCII wireframe hoặc mô tả ngắn layout>
```

- Component dùng: <tham chiếu tên token trong DESIGN.md, KHÔNG ghi giá trị>

## 3. Trạng thái màn hình (state matrix — chỉ phần thay đổi)

| Trạng thái | Hiển thị |
|---|---|
| <trạng thái mới/sửa> | <mô tả> |

## 4. Hành vi tương tác (EARS — đánh dấu MỚI/SỬA/XOÁ)

- **[UI-AUTH-05-1] (MỚI)** When user nhấn "Gửi link" với email hợp lệ
  format, the system shall hiện trạng thái "Đang gửi" và gọi API
  `POST /auth/reset-password`.

## 5. Test mapping

| ID | Test case tương ứng |
|---|---|
| UI-AUTH-05-1 | `TC-AUTH-UI-01: ...` |

## 6. Tham chiếu thiết kế (nếu có)

- Figma: <link — chỉ để tham khảo, không phải nguồn chân lý>
