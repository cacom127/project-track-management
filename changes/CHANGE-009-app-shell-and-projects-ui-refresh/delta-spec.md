# Delta Spec — CHANGE-009-app-shell-and-projects-ui-refresh

- **Ticket ID**: CHANGE-009-app-shell-and-projects-ui-refresh
- **Module bị ảnh hưởng**: `specs/projects-ui.md`, `specs/architecture.md`
  (mục 1 — thêm layout shell dùng chung), `DESIGN.md` (thêm component
  atomic mới + nguyên tắc chung — mục 4 dưới)
- **Loại thay đổi**: ☐ Thêm mới &nbsp; ☒ Sửa &nbsp; ☐ Xoá

## 1. Yêu cầu thay đổi (EARS notation)

Ticket này KHÔNG đổi API/data model — toàn bộ thay đổi là UI. Xem đầy
đủ EARS mới/sửa (`UI-SHELL-*`, `UI-PROJ-01/02` sửa) ở `ui-delta-spec.md`
cùng thư mục (theo CLAUDE.md mục 5 — nhiều màn hình, tách file riêng).

## 1c. Thay đổi UI

Xem `ui-delta-spec.md`.

## 2. Acceptance criteria / Test mapping

Xem mục 5 trong `ui-delta-spec.md`.

## 3. Ghi chú cho AI agent khi implement

- Không đụng `backend/`/`infra/` — chỉ `frontend/`.
- Không thêm dependency mới (dropdown/badge tự viết — xem `plan.md`
  mục 2).
- Không tự ý thêm màu/token ngoài `DESIGN.md` — sidebar 240px,
  `secondary-container`/`tertiary-container` đều là token ĐÃ CÓ SẴN
  trong `DESIGN.md` frontmatter, chỉ là chưa từng dùng tới trong CSS.

## 4. Rút kinh nghiệm — cập nhật DESIGN.md

Sau nhiều vòng feedback UI ở ticket này (sidebar bị cắt, form không
căn giữa, filter trông giống nút thường, v.v.), phát hiện gốc rễ:
`DESIGN.md` thiếu spec atomic cho vài component đã dùng (Sidebar,
Dropdown/Filter). Cập nhật:

- **`DESIGN.md`**: thêm 2 mục Components atomic mới — **Navigation
  Sidebar** (240px fixed/full-height, active state), **Dropdown/Filter**
  (button+mũi tên▾ 16px+panel, KHÔNG dùng `<select multiple>`); thêm 3
  dòng Do's/Don'ts (không dùng `<select multiple>`, nội dung chính căn
  giữa+max-width, form >5 field nên phân nhóm card). CHỈ ghi nguyên
  tắc/component atomic — KHÔNG ghi chi tiết màn Create cụ thể (vẫn ở
  `projects-ui.md`, đúng ranh giới mục 3 `CLAUDE.md`). Đã thử thêm
  token `icon.sm/md` vào frontmatter nhưng `npx @google/design.md lint`
  báo key không thuộc schema hợp lệ (`colors`/`typography`/`spacing`/
  `rounded`/`components`) — bỏ, ghi thẳng "16px" trong mô tả component
  (nhất quán với cách các component khác ghi số cụ thể). Đã chạy
  `npx @google/design.md lint DESIGN.md` (đúng quy định `CLAUDE.md`
  mục 3) — 0 lỗi, 0 cảnh báo.
- Không sửa `CLAUDE.md` — chỉ cần bổ sung token/component ở `DESIGN.md`
  là đủ, không cần thêm process rule mới (quyết định của Product owner).
