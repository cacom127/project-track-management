# Delta Spec — <Tên thay đổi ngắn>

> File BẮT BUỘC cho mọi thay đổi (Small/Medium/Large). Chỉ ghi PHẦN THAY ĐỔI
> so với spec hiện tại trong `specs/` — không viết lại toàn bộ spec module.
> Khi merge, nội dung này sẽ được gộp vào file tương ứng trong `specs/`
> (tạo file mới nếu chưa tồn tại — vd ticket khởi tạo dự án đầu tiên, khi
> `specs/` còn trống; lúc đó mọi mục ở đây đều là `(MỚI)`, không có ngoại
> lệ về flow — xem CLAUDE.md mục 4).

- **Ticket ID**: <TICKET-123>
- **Module bị ảnh hưởng**: `specs/<tên-module>.md`
- **Loại thay đổi**: ☐ Thêm mới &nbsp; ☐ Sửa &nbsp; ☐ Xoá

## 1. Yêu cầu thay đổi (EARS notation)

<!-- Nếu THÊM mới, đánh số tiếp theo ID cuối cùng trong specs/<module>.md -->
- **[AUTH-05] (MỚI)** When a user requests password reset, the system
  shall send a one-time link valid for 30 minutes.

<!-- Nếu SỬA, ghi rõ ID cũ và nội dung cũ/mới -->
- **[AUTH-02] (SỬA)**
  - Cũ: lock account sau 5 lần thử trong 1 phút.
  - Mới: lock account sau 3 lần thử trong 1 phút (theo yêu cầu security
    audit của khách hàng).

<!-- Nếu XOÁ, ghi rõ ID và lý do -->
- **[XXX-YY] (XOÁ)** — Lý do: <tính năng không còn dùng>

## 1b. Thay đổi Data Model (nếu có)

> Map đúng file — xem CLAUDE.md mục 4 (quy tắc ownership entity):
> - Chỉ thêm/sửa FIELD của entity đã tồn tại → ghi ở đây, fold vào
>   `specs/<module-sở-hữu>.md` mục "Data Model". KHÔNG động vào
>   `specs/data-model.md`.
> - THÊM/XOÁ hẳn 1 bảng, hoặc đổi quan hệ giữa các bảng → ghi thêm 1 dòng
>   cho `specs/data-model.md` (chỉ tên bảng + quan hệ, không field).

<!-- Ví dụ: thêm field vào bảng đã có (chỉ động vào module sở hữu) -->
- **[DM-AUTH-04] (MỚI — field)** Thêm field `User.phone` (string,
  nullable) — map vào `specs/example-module-auth.md` mục Data Model.

<!-- Ví dụ: thêm bảng mới (động vào CẢ module sở hữu LẪN data-model.md) -->
- **[DM-ORDERS-01] (MỚI — bảng)** Thêm bảng `Order`, `OrderItem` — map
  field-level vào `specs/orders.md` mục Data Model, VÀ thêm dòng quan hệ
  `USER ||--o{ ORDER : places` vào `specs/data-model.md` mục 1.

## 2. Acceptance criteria / Test mapping

| ID       | Test case tương ứng (file/tên)         |
|----------|-------------------------------------------|
| AUTH-05  | `TC-AUTH-15: Reset password qua email`   |
| AUTH-02  | `TC-AUTH-03: Lock account sau N lần sai`  |

## 3. Ghi chú cho AI agent khi implement

<Nếu có ràng buộc riêng cho thay đổi này mà constitution không cover, ghi
ở đây — vd: "chỉ sửa file X, không đụng vào Y">
