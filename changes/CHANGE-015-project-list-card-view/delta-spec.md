# Delta Spec — CHANGE-015-project-list-card-view

- **Ticket ID**: CHANGE-015-project-list-card-view
- **Module bị ảnh hưởng**: `specs/projects-ui.md`, `DESIGN.md`
- **Loại thay đổi**: ☑ Thêm mới &nbsp; ☐ Sửa &nbsp; ☐ Xoá

## 1. Yêu cầu thay đổi (EARS notation)

- **[UI-PROJ-01-15] (MỚI)** The List screen shall render 2 icon
  buttons (`☰` list / `⊞` card) right-aligned at the end of the toolbar
  row (`margin-left: auto`) that toggle the display mode of the project
  collection; the active mode's button shall render with a highlighted
  background.

- **[UI-PROJ-01-16] (MỚI)** The selected display mode (`list` | `card`)
  shall persist across visits via `localStorage` (key
  `projectListViewMode`), defaulting to **`card`** when unset/invalid
  (feedback thực tế: card là chế độ mong muốn mặc định, không phải
  list).

- **[UI-PROJ-01-17] (MỚI)** In `card` mode, the List screen shall
  render each project as a card (component `ProjectCard`) instead of a
  table row, laid out in a responsive grid
  (`repeat(auto-fill, minmax(280px, 1fr))`), using the SAME `items`/
  `total`/pagination/filter state as `list` mode (no separate API
  call, no separate filter/pagination behavior).

- **[UI-PROJ-01-18] (MỚI)** Each `ProjectCard` shall render, top to
  bottom:
  1. Avatar circle showing `customer_name`'s first character
     (background `primary`, text `on-primary`), with `customer_name`
     (bold) and `industry` (muted, "—" nếu null) beside it; a status
     badge (`進行中` nếu `is_ongoing`, `終了` nếu không) tại góc phải.
  2. `dev_process_phases` badges (variant `phase`, giống Detail), ẩn
     hàng nếu rỗng.
  3. `project_name` (bold, tối đa 2 dòng, ellipsis nếu dài hơn).
  4. Đường kẻ phân cách (`.project-card-divider`).
  5. A 2-column stat box (nền `surface-container-high`), nội dung CĂN
     GIỮA trong mỗi cột, showing `team_size`/`total_man_month` ("—" nếu
     null), cùng nội dung với `期間・規模` ở Detail.
  6. Formatted period text (dùng chung logic `formatPeriod` với List
     hiện có).
  7. `technologies` badges (tối đa 4, dư ra hiện `+{n}`).
  8. Đường kẻ phân cách (`.project-card-divider`).
  9. `project_types` badges dạng chấm tròn (`● label`), nền
     `secondary-container`/`on-secondary-container` — CÙNG màu
     `badge-type` ở List/Detail (SỬA — bản đầu dùng xám trung tính
     `surface-container-low`, không khớp màu 種別 ở Detail, feedback
     thực tế), chỉ khác kiểu hiển thị (chấm tròn thay vì badge đặc).
  - Toàn bộ card là 1 `<Link>` tới `/projects/:id` (click bất kỳ đâu
    trên card đều vào Detail — không có icon hành động riêng trên
    card).
  - Card border dùng `outline-variant` (giống `form-group-card`) +
    `box-shadow: 0 2px 4px rgba(0,0,0,0.08)` (cùng công thức shadow đã
    dùng cho `.filter-dropdown-panel`, tăng opacity 0.05→0.08) để card
    nổi khối rõ hơn so với nền trang mà không cần viền quá đậm —
    feedback thực tế qua 2 vòng chỉnh: thử `outline` (đậm) trước, quá
    gắt → quay lại `outline-variant`, dựa vào `box-shadow` để tạo chiều
    sâu thay vì viền đậm.
  - **Bug fix trong lúc chỉnh sửa**: `--color-outline` (`#74777f`, có
    trong `DESIGN.md`) chưa từng được khai báo trong `:root` của
    `index.css` — chỉ có `--color-outline-variant`. Đã bổ sung biến
    này (dù cuối cùng `.project-card` không dùng tới), để tránh bug
    tương tự (CSS var undefined → border vô hiệu, không lỗi rõ ràng)
    cho các lần dùng `outline` sau này.

## 1b. Thay đổi Data Model (nếu có)

Không có.

## 1c. UI chi tiết

**Status badge (mới, `ProjectCard` — KHÔNG tái dùng `badge-type`/
`badge-tech`/`badge-phase` vì ý nghĩa khác — trạng thái tiến độ, không
phải category dữ liệu):**

| Trạng thái | Background | Text |
|---|---|---|
| 進行中 (`is_ongoing`) | `tertiary-fixed` (`#9ff5c1`) | `on-tertiary-fixed-variant` (`#005231`) |
| 終了 (không `is_ongoing`) | `surface-container-high` (`#dee8ff`) | `on-surface-variant` (`#43474e`) |

Tái dùng đúng `-fixed` token của hệ tech (xanh lá = tích cực/đang chạy,
theo mô tả "Tertiary — Success" đã có trong `DESIGN.md` mục Colors) —
không thêm token mới cho ticket này.

`ProjectCard` component (`frontend/src/components/ProjectCard.tsx`):
- Props: `project: Project`.
- Toàn bộ nội dung bọc trong `<Link to={`/projects/${project.id}`} className="project-card">`.
- Tái dùng `Badge`, `formatPeriod` (chuyển thành hàm dùng chung, xem
  mục 3), `PROJECT_TYPE_LABELS`, `DEV_PROCESS_PHASE_LABELS`.

## 2. Acceptance criteria / Test mapping

| ID | Test case tương ứng |
|---|---|
| UI-PROJ-01-15 | `ProjectList.test.tsx`: 2 nút toggle hiện, click đổi mode |
| UI-PROJ-01-16 | `ProjectList.test.tsx`: mode lưu vào `localStorage`, đọc lại khi mount |
| UI-PROJ-01-17 | `ProjectList.test.tsx`: card mode render đúng số card = `items.length`, dùng chung filter/pagination |
| UI-PROJ-01-18 | `ProjectCard.test.tsx`: đủ các phần tử theo thứ tự, status badge đúng theo `is_ongoing`, click card điều hướng đúng |

## 3. Ghi chú cho AI agent khi implement

- `formatPeriod` hiện đang là hàm private trong `ProjectList.tsx` —
  chuyển ra `frontend/src/lib/formatPeriod.ts` (hoặc tương tự) để dùng
  chung giữa table row và `ProjectCard`, tránh lặp code.
- KHÔNG gọi API riêng cho card mode — chỉ đổi cách render `items` đã
  có sẵn từ state hiện tại của `ProjectList`.
- KHÔNG thêm icon edit/copy/delete trực tiếp trên card (khác ảnh mẫu
  ban đầu người dùng đưa ra) — hành động Sửa/Xoá vẫn chỉ có ở Detail,
  giữ đúng nguyên tắc đã chốt từ `CHANGE-010`.
- Không tự thêm field không có trong schema (mã khách hàng/dự án dạng
  `CL-xxx`/`PRJ-xxx`, người phụ trách "担当") — theo CLAUDE.md mục 8,
  không được bịa business data không có trong yêu cầu.
