# Proposal — CHANGE-009-app-shell-and-projects-ui-refresh

- **Ticket ID**: CHANGE-009-app-shell-and-projects-ui-refresh
- **Size**: Medium (chỉ frontend, không đổi API/data model, nhưng ảnh
  hưởng nhiều màn hình + thêm 1 layout dùng chung mới — sidebar).
- **Người đề xuất**: namlp
- **Ngày**: 2026-08-18

## 1. Vấn đề / lý do cần thay đổi

Sau khi deploy `CHANGE-007-projects-list-create` thật, người dùng
(namlp) nhận xét UI "trông thô sơ". Tự rà soát lại cho thấy đây không
chỉ là cảm giác — có những khoảng trống thật so với `DESIGN.md` và UX
best practice:

- `DESIGN.md` (mục Layout & Spacing) đã định nghĩa "Sidebar cố định
  240px" từ đầu dự án, nhưng chưa từng được implement — `auth` module
  chỉ làm Header ngang.
- Filter công nghệ/loại hình ở màn List dùng `<select multiple>` gốc
  trình duyệt — yêu cầu giữ Ctrl/Cmd để chọn nhiều, không có gợi ý,
  UX kém.
- Không có breakpoint responsive nào (`DESIGN.md` định nghĩa 3
  breakpoint nhưng CSS hiện tại không có `@media` nào).
- Màn Tạo dự án là danh sách field phẳng, không phân nhóm, không đơn vị
  cho field số, không có nút Huỷ.
- Ô search tái dùng nhầm class `.input-field` (thiết kế cho form) khiến
  trông "lạc quẻ" trong toolbar ngang.
- 種別/技術 hiển thị dạng text nối dấu phẩy thay vì badge.

## 2. Mục tiêu (Goal)

- Thêm sidebar dọc 240px (đúng token đã có sẵn trong `DESIGN.md`),
  Header ngang giữ nguyên vai trò hiện tại.
- Màn List: tách hàng tiêu đề (title + nút hành động chính) khỏi hàng
  toolbar (search + filter); thay `<select multiple>` bằng dropdown
  filter tự thiết kế (checkbox list, hiển thị rõ đang chọn gì); 種別/技術
  hiển thị dạng badge, phân biệt màu theo NHÓM (không theo từng giá
  trị) — 種別 dùng tông `secondary` nhạt, 技術 dùng tông `tertiary` nhạt.
- Màn Tạo dự án: phân nhóm field theo card (基本情報/期間・規模/分類), dấu
  `*` bắt buộc màu `error`, thêm đơn vị cho field số (名/人月), thêm nút
  Huỷ, giới hạn max-width nội dung.
- Thêm breakpoint responsive theo đúng 3 mức đã định nghĩa trong
  `DESIGN.md`.

## 3. Ngoài phạm vi (Non-goals)

- KHÔNG đổi API/backend, KHÔNG đổi data model.
- KHÔNG thêm màu/token mới ngoài palette đã có trong `DESIGN.md` — chỉ
  dùng lại các token có sẵn nhưng chưa từng dùng tới (`secondary-container`,
  `tertiary-container`, sidebar 240px).
- KHÔNG làm Edit/Delete/Detail (vẫn để ticket riêng sau).
- KHÔNG đổi routing path hiện có (`/projects`, `/projects/new`).
- KHÔNG làm custom date-picker (giữ `<input type="date">` mặc định
  trình duyệt).

## 4. Ảnh hưởng

- Module liên quan: `projects` (UI), cross-cutting layout (component
  `Sidebar` dùng chung cho mọi module sau này).
- Ảnh hưởng khách hàng Nhật cần thông báo trước: Không.
- Ảnh hưởng dữ liệu hiện có: Không (chỉ frontend).
- Ảnh hưởng hạ tầng: Không — không cần deploy lại backend/CDK, chỉ
  `npm run build` + `cdk deploy` để đẩy `frontend/dist` mới (hoặc chỉ
  invalidate CloudFront nếu quy trình deploy tách riêng).

## 5. Phương án thay thế đã xem xét

Đã cân nhắc dùng thư viện UI component (vd Radix/Headless UI) cho
dropdown filter thay vì tự viết — chốt **tự viết component nhỏ**
(không thêm dependency mới) vì nhu cầu đơn giản (dropdown + checkbox
list), tránh việc phải freshness-check + học API thư viện ngoài cho 1
component nhỏ (xem `plan.md` mục 2).
