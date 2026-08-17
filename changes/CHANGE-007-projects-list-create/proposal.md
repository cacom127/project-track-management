# Proposal — CHANGE-007-projects-list-create

- **Ticket ID**: CHANGE-007-projects-list-create
- **Size**: Medium (module mới nhưng không đổi kiến trúc hệ thống — dùng
  đúng entity đã phác thảo sẵn trong `specs/data-model.md` từ
  `CHANGE-002-architecture`). Có kèm `plan.md` vì có vài quyết định kỹ
  thuật cần lưu rationale (cách lưu công nghệ/loại hình, cách filter).
- **Người đề xuất**: namlp
- **Ngày**: 2026-08-17

## 1. Vấn đề / lý do cần thay đổi

`auth` module đã xong (`CHANGE-005`), người dùng đăng nhập được nhưng
chưa có tính năng nghiệp vụ nào. Theo `specs/vision.md`, mục tiêu chính
của hệ thống là lưu trữ/tra cứu thông tin dự án đã làm với khách hàng
Nhật — cần có nơi để tạo và xem danh sách dự án trước khi làm tiếp các
tính năng khác (sửa/xoá, thống kê).

## 2. Mục tiêu (Goal)

- Người dùng đã đăng nhập xem được danh sách toàn bộ dự án, có phân
  trang, tìm kiếm theo từ khoá (tên khách hàng/tên dự án/mô tả/công
  nghệ), và filter theo công nghệ + loại hình dự án.
- Người dùng đã đăng nhập tạo được dự án mới với đầy đủ field theo
  `vision.md` mục 4 (trừ file đính kèm).

## 3. Ngoài phạm vi (Non-goals)

- KHÔNG có màn sửa/xoá dự án (ticket riêng sau: `projects` Edit+Delete).
- KHÔNG có màn chi tiết dự án (detail view) — click vào row ở List chưa
  làm gì ở ticket này.
- KHÔNG có file đính kèm (upload S3 presigned URL) — ticket riêng sau.
- KHÔNG check quyền theo role — bất kỳ user đã login đều tạo được dự án
  (đúng theo `vision.md` mục 4, phân quyền sửa/xoá để dành ticket sau).
- KHÔNG có thống kê/dashboard (`reporting` — module riêng).
- KHÔNG ẩn tên khách hàng (masking khi export) — chưa có tính năng export.

## 4. Ảnh hưởng

- Module liên quan: `projects` (mới — xem `specs/architecture.md` mục 2,
  entity đã có sẵn trong `specs/data-model.md` nhưng chưa có
  `specs/projects.md` chính thức).
- Ảnh hưởng khách hàng Nhật cần thông báo trước: Không (nội bộ).
- Ảnh hưởng dữ liệu hiện có (migration): Có — tạo mới các bảng `projects`,
  `tech_tags`, `project_tech_tags`, `project_types`, `project_project_types`
  (chưa tồn tại), seed 5 dòng cố định vào `project_types`.
- Ảnh hưởng hạ tầng: Không (dùng đúng Aurora Serverless v2 + Lambda đã
  có sẵn, không đổi CDK stack).

## 5. Phương án thay thế đã xem xét

Xem chi tiết ở `plan.md`. Đã cân nhắc lưu `technologies`/`project_types`
dạng cột JSON array trên `projects` (đơn giản hơn) nhưng chốt dùng bảng
catalog + bảng nối để khớp đúng ER diagram đã thống nhất sẵn trong
`specs/data-model.md` (từ `CHANGE-002-architecture`) — tránh phải sửa
data-model.md và giữ nhất quán với quyết định kiến trúc trước đó.
