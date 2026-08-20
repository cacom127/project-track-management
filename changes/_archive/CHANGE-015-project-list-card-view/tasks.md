# Tasks — CHANGE-015-project-list-card-view

| # | Task | Trạng thái |
|---|---|---|
| T1 | Chuyển `formatPeriod` ra `frontend/src/lib/formatPeriod.ts` dùng chung | [x] |
| T2 | `ProjectCard.tsx` (component mới) + `ProjectCard.test.tsx` | [x] |
| T3 | `ProjectList.tsx`: 2 nút toggle list/card, đọc/ghi `localStorage` | [x] |
| T4 | `ProjectList.tsx`: render grid `ProjectCard` khi mode=card, dùng chung state hiện có | [x] |
| T5 | `index.css`: style `.project-card`, status badge, grid, view-toggle button | [x] |
| T6 | Test toàn bộ frontend: `npx vitest run` | [x] |
| T7 | Test backend (sanity — ticket này không đổi backend): `pytest` | [x] |
| T8 | `prettier --check` trong git worktree sạch (không CRLF) | [x] |
| T9 | Verify local: bỏ `.env` 1 lần, chắc test không phụ thuộc CognitoUserPool import-time | [x] |
| T10 | Báo user deploy + test production OK, rồi mới fold spec vào `specs/projects-ui.md` và archive ticket | [x] |
| T11 | Feedback: 開発工程 hiện dạng text nối "・" → đổi sang badge (`variant="phase"`) | [x] |
| T12 | Feedback: 人数/総人月 chưa cân đối → `text-align:center` + `align-items:center` trong stat box | [x] |
| T13 | Feedback: thêm đường kẻ phân cách giữa プロジェクト名↔stat box, giữa 技術↔種別 (`.project-card-divider`) | [x] |
| T14 | Feedback: viền card quá nhạt → thử `outline` (đậm) → quá gắt → quay lại `outline-variant` + `box-shadow` opacity 0.08 | [x] |
| T15 | Bug fix: bổ sung `--color-outline` còn thiếu trong `:root` (phát hiện khi debug viền không hiện) | [x] |
| T16 | Feedback: nút toggle list/card chưa căn phải → `margin-left: auto` | [x] |
| T17 | Feedback: đổi mặc định view mode từ `list` sang `card` | [x] |
| T18 | Feedback: màu badge 種別 trên card không khớp Detail → đổi từ xám trung tính sang `secondary-container` (giống `badge-type`) | [x] |

## Ghi chú

- Backend không đổi ở ticket này — baseline 15 fail/95 pass giữ nguyên
  xuyên suốt (data pollution đã biết từ trước, không phải regression).
- Frontend: 160/160 pass, kể cả khi bỏ `.env`.
- Prettier: sạch, verify trong git worktree `core.autocrlf=false` sau
  commit cuối cùng.
- Commit: `d058c34` (implement + toàn bộ feedback), `fe8c3e1` (prettier
  fix), `79e197a` (docs), `214c628` (fix build lỗi `tsc -b`).

| Trạng thái | Ngày | Ghi chú |
|---|---|---|
| Hoàn tất | 2026-08-20 | T1-T18 xong, đã deploy + test production OK (workaround `--app` override do `uv.exe` bị Device Guard chặn cục bộ, không phải lỗi code), đã fold vào `specs/projects-ui.md` |
