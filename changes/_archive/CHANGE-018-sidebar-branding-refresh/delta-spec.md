# Delta Spec — Logo/favicon VPM + làm mới UI Sidebar

- **Ticket ID**: CHANGE-018-sidebar-branding-refresh
- **Module bị ảnh hưởng**: `specs/architecture.md` (mục App Shell), `DESIGN.md`
  (component Navigation Sidebar)
- **Loại thay đổi**: ☐ Thêm mới &nbsp; ☑ Sửa &nbsp; ☐ Xoá

## 1. Yêu cầu thay đổi (EARS notation)

- **[ARCH-SHELL-01] (MỚI)** The system shall use the uploaded VPM icon
  (`frontend/src/assets/vpm_icon_transparent.png`) as the browser
  favicon (`frontend/public/favicon.png`, thay favicon mặc định của Vite
  trong `frontend/index.html`).

- **[ARCH-SHELL-02] (MỚI)** The Sidebar shall render a header area at
  the top showing the VPM logo (`frontend/public/logo.png`), không kèm
  text, ngăn cách với nav item bằng `border-bottom` (`outline-variant`).

- **[ARCH-SHELL-03] (SỬA)**
  - Cũ: Sidebar item chỉ hiển thị text, không có icon; nền active/hover
    full-bleed sát viền trái-phải sidebar.
  - Mới: mỗi Sidebar item hiển thị 1 icon SVG inline (tự vẽ, cùng phong
    cách với icon inline sẵn có trong `ProjectList.tsx` — KHÔNG thêm
    icon library mới, xem CLAUDE.md mục 2 về runtime dependency) bên
    trái text, cách nhau theo `spacing.sm`; nền active/hover bo góc
    (`rounded.DEFAULT`) và có margin ngang, không còn full-bleed.

## 1b. Thay đổi Data Model (nếu có)

Không có — thay đổi thuần UI/asset, không đụng entity/bảng nào.

## 2. Acceptance criteria / Test mapping

| ID            | Test case tương ứng (file/tên)                                   |
|---------------|--------------------------------------------------------------------|
| ARCH-SHELL-01 | `TC-SHELL-01: index.html trỏ favicon.png` (manual/build check)     |
| ARCH-SHELL-02 | `Sidebar.test.tsx: renders logo header`                            |
| ARCH-SHELL-03 | `Sidebar.test.tsx: renders nav icon next to label`                 |

## 3. Ghi chú cho AI agent khi implement

- Nguồn ảnh: `frontend/src/assets/vpm_icon_transparent.png` (do user
  upload, đã chuyển vào đây cùng chỗ với asset nguồn khác như `hero.png`)
  — copy (giữ nguyên bản gốc) thành `frontend/public/favicon.png` và
  `frontend/public/logo.png`.
- Không thêm dependency icon library (lucide-react, react-icons...) —
  tự viết SVG inline theo đúng pattern hiện có (`stroke="currentColor"`,
  `aria-hidden="true"`, kích thước ~18-20px) để icon đổi màu theo
  active/hover state qua CSS `color`, không cần prop riêng.
- Cập nhật `DESIGN.md` mục "Navigation Sidebar" (thêm phần header/logo,
  icon trong item, bo góc active/hover) TRƯỚC hoặc CÙNG lúc sửa CSS —
  không để code và `DESIGN.md` lệch nhau (CLAUDE.md mục 3).
- Cập nhật `specs/architecture.md` mục "App Shell (frontend)" (câu mô tả
  Sidebar) khi fold.
- Chỉ 1 nav item hiện tại (`プロジェクト一覧` → `/projects`) — icon phù
  hợp: dạng list/folder tài liệu (gợi ý, không bắt buộc chính xác hình
  dạng).
