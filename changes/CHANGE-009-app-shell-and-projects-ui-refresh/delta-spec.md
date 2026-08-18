# Delta Spec — CHANGE-009-app-shell-and-projects-ui-refresh

- **Ticket ID**: CHANGE-009-app-shell-and-projects-ui-refresh
- **Module bị ảnh hưởng**: `specs/projects-ui.md`, `specs/architecture.md`
  (mục 1 — thêm layout shell dùng chung)
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
