# Tasks — CHANGE-015-project-list-card-view

| # | Task | Trạng thái |
|---|---|---|
| T1 | Chuyển `formatPeriod` ra `frontend/src/lib/formatPeriod.ts` dùng chung | [ ] |
| T2 | `ProjectCard.tsx` (component mới) + `ProjectCard.test.tsx` | [ ] |
| T3 | `ProjectList.tsx`: 2 nút toggle list/card, đọc/ghi `localStorage` | [ ] |
| T4 | `ProjectList.tsx`: render grid `ProjectCard` khi mode=card, dùng chung state hiện có | [ ] |
| T5 | `index.css`: style `.project-card`, status badge, grid, view-toggle button | [ ] |
| T6 | Test toàn bộ frontend: `npx vitest run` | [ ] |
| T7 | Test backend (sanity — ticket này không đổi backend): `pytest` | [ ] |
| T8 | `prettier --check` trong git worktree sạch (không CRLF) | [ ] |
| T9 | Verify local: bỏ `.env` 1 lần, chắc test không phụ thuộc CognitoUserPool import-time | [ ] |
| T10 | Báo user deploy + test production OK, rồi mới fold spec vào `specs/projects-ui.md` và archive ticket | [ ] |
