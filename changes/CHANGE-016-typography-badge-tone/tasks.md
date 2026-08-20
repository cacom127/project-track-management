# Tasks — CHANGE-016-typography-badge-tone

| # | Task | Trạng thái |
|---|------|------------|
| T1 | Cập nhật `DESIGN.md`: Typography (Noto Sans → Noto Sans JP), Badge & Filter Chip (badge dùng `*-fixed`), mục "không được làm" | [x] |
| T2 | `frontend/src/index.css`: đổi Google Fonts import + `--font-family` sang Noto Sans JP | [x] |
| T3 | `frontend/src/index.css`: `.badge-type`/`.badge-tech`/`.badge-phase` → dùng token `*-fixed`/`on-*-fixed-variant` | [x] |
| T4 | `frontend/src/index.css`: `.project-card-dot-badge` đổi theo `badge-type` để tiếp tục khớp màu | [x] |
| T5 | Chạy test suite frontend (không có test nào phụ thuộc màu/font cụ thể — xác nhận) | [ ] |
| T6 | Prettier check (worktree sạch, `core.autocrlf=false`) | [ ] |
| T7 | Deploy + user xác nhận trên production | [ ] |
| T8 | Fold: nội dung đã nằm sẵn trong `DESIGN.md` (không có file `specs/*.md` nào cần sửa thêm, vì `projects-ui.md` chỉ tham chiếu tên token, không lặp lại giá trị màu/font — đúng quy ước CLAUDE.md mục 5); archive ticket | [ ] |

## Ghi chú

- Thay đổi chỉ động vào `DESIGN.md` + `frontend/src/index.css`. Không
  đổi component nào (Badge.tsx, ProjectCard.tsx giữ nguyên, chỉ đổi CSS
  token phía dưới).
- Không có acceptance test tự động cho "chữ có mờ hay không" — xác nhận
  bằng mắt sau khi deploy (giống các thay đổi thuần CSS trước đây).
