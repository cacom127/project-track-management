# Plan — CHANGE-009-app-shell-and-projects-ui-refresh

- **Ticket ID**: CHANGE-009-app-shell-and-projects-ui-refresh
- **Dựa trên**: `proposal.md` cùng thư mục

## 1. Kiến trúc / thiết kế kỹ thuật

Chỉ đụng `frontend/` — không đổi `backend`/`infra`.

Component mới:

```
frontend/src/components/
  Sidebar.tsx (mới)       — nav dọc 240px, dùng chung mọi trang sau Header
  FilterDropdown.tsx (mới) — dropdown + checkbox list, thay <select multiple>
  Badge.tsx (mới)          — badge nhỏ, nhận variant "type"/"tech" để chọn màu

frontend/src/App.tsx        — bọc children trong layout Header+Sidebar+content
frontend/src/pages/ProjectList.tsx    — dùng FilterDropdown + Badge, tách title/toolbar
frontend/src/pages/ProjectCreate.tsx  — phân nhóm field theo card, thêm Huỷ
frontend/src/index.css      — sidebar layout, badge theo nhóm, responsive breakpoint
```

## 2. Quyết định kỹ thuật quan trọng

| Quyết định | Lý do |
|---|---|
| Tự viết `FilterDropdown` (button mở panel + checkbox list), KHÔNG thêm thư viện (Radix/Headless UI) | Nhu cầu đơn giản (dropdown + checkbox), tránh cost freshness-check + học API thư viện ngoài cho 1 component nhỏ — khớp CLAUDE.md mục 2 (tinh thần tối giản dependency). |
| Badge phân biệt màu theo NHÓM (種別=`secondary-container`, 技術=`tertiary-container`), không theo từng giá trị | User muốn phân biệt trực quan nhưng tránh "nhiều màu rối" — dùng đúng 2 token đã có sẵn trong `DESIGN.md` (`secondary-container`/`tertiary-container`), chưa từng dùng tới, không phát minh màu mới. |
| Sidebar 240px cố định, ẩn hẳn ở mobile (<768px, theo `DESIGN.md` breakpoint) thay vì thu gọn icon | `DESIGN.md` ghi "tablet: sidebar thu gọn còn icon" nhưng hiện tại chỉ có 1 mục nav — thu gọn icon cho 1 item không có giá trị thực; ẩn hẳn ở mobile, giữ nguyên ở tablet/desktop (đơn giản hơn, đúng tinh thần YAGNI). |
| Ô search: bỏ `.input-field`, viết class riêng `.search-box`, max-width 320px, icon SVG inline (không thêm icon library) | Tránh nhầm lẫn ngữ cảnh form/toolbar; icon SVG inline nhỏ, không cần thêm dependency. |
| `ProjectCreate` dùng `<section>` + class `.form-group-card` (border 1px, giống `.auth-card`) để phân nhóm field | Tái dùng pattern card đã có sẵn (`auth-card`), không tạo token mới. |
| Test hiện có (`ProjectList.test.tsx`/`ProjectCreate.test.tsx`) cần viết lại phần query filter (không còn `getByLabelText("技術でフィルタ")` dạng `<select>`) | Đổi cấu trúc DOM (dropdown thay vì native select) — cần cập nhật cách test tương tác (click mở dropdown, click checkbox) thay vì set `.selectedOptions`. |

## 3. Rủi ro / đánh đổi (trade-off)

- Thay đổi cấu trúc DOM của filter + toolbar → toàn bộ test tương tác
  với 2 màn hình này cần viết lại (không phải chỉ thêm test mới) — chấp
  nhận được, đổi lại UX tốt hơn hẳn.
- Sidebar 240px cố định trên desktop giảm không gian nội dung chính —
  chấp nhận được vì màn hình quản lý dữ liệu nội bộ, không tối ưu cho
  di động là chính.

## 4. Migration / rollback

- Không cần migration (không đổi DB). Rollback: revert commit, không
  ảnh hưởng dữ liệu.

## 5. Định nghĩa "Done" cho bước Plan này

- [x] Đã xác nhận thiết kế với Product owner (namlp) qua trao đổi trực
      tiếp trong phiên brainstorm.
- [x] Đã cập nhật `ui-delta-spec.md` tương ứng với thiết kế này.
