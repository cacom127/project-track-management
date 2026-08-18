# Proposal — Xem chi tiết / Sửa / Xoá dự án

- **Ticket ID**: CHANGE-010
- **Size**: Medium
- **Người đề xuất**: namlp
- **Ngày**: 2026-08-19

## 1. Vấn đề / lý do cần thay đổi

`CHANGE-007-projects-list-create` chỉ làm List + Create, cố tình để dành
Edit/Delete/Detail cho ticket sau (`specs/projects.md` mục 1). Giờ user
cần thao tác sửa thông tin dự án đã nhập sai/thiếu, và xoá dự án nhập
nhầm — hiện không có cách nào làm việc này ngoài sửa thẳng DB.

## 2. Mục tiêu (Goal)

- Xem chi tiết đầy đủ 1 dự án (List hiện chỉ hiển thị rút gọn, ellipsis).
- Sửa được toàn bộ field của 1 dự án đã tạo.
- Xoá được 1 dự án (soft delete, không mất dữ liệu).

## 3. Ngoài phạm vi (Non-goals)

- Không làm phân quyền theo role (ai cũng sửa/xoá được mọi dự án — giữ
  đúng hiện trạng `PROJ-12`, để dành ticket sau).
- Không làm khôi phục (restore) dự án đã xoá — chỉ ẩn khỏi List/Detail.
- Không làm audit log lịch sử thay đổi field (chỉ có `updated_at`).
- Không làm file đính kèm.

## 4. Ảnh hưởng

- Module liên quan: `specs/projects.md`, `specs/projects-ui.md`,
  `DESIGN.md` (thêm component Modal).
- Có ảnh hưởng khách hàng Nhật cần thông báo trước không: Không.
- Có ảnh hưởng dữ liệu hiện có (migration) không: Có — thêm cột
  `deleted_at` vào bảng `projects`.

## 5. Phương án thay thế đã xem xét

- Hard delete thay vì soft delete: bị loại vì rủi ro mất dữ liệu thật
  của khách hàng khi xoá nhầm, không khác biệt nhiều về effort.
- Sửa trực tiếp trên List (inline edit) thay vì màn Detail riêng: bị
  loại vì List đã rút gọn description, không đủ chỗ hiển thị/sửa đầy đủ
  field; Detail cũng là nơi tự nhiên để đặt nút Sửa/Xoá.
