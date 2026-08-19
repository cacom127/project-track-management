# Tasks — CHANGE-014-project-list-detail-ui-improvements

| # | Task | Trạng thái |
|---|---|---|
| T1 | Backend: tăng `LIMIT` `search_tech_tags` (20→200) khi `q` rỗng, thêm test | [x] |
| T2 | `DESIGN.md`: thêm mô tả filter chip (`-fixed` tokens) + badge variant `phase` | [x] |
| T3 | `FilterDropdown.tsx`: thêm search input lọc client-side + `max-height`/scroll cho panel | [x] |
| T4 | `Badge.tsx`: thêm variant `"phase"`, `ProjectDetail.tsx` đổi badge 開発工程 sang `phase` | [x] |
| T5 | `MultilineText.tsx` (component mới) + test riêng | [x] |
| T6 | `ProjectDetail.tsx`: áp `MultilineText` cho 概要/成果・課題・解決策/確認元メモ/チーム体制の詳細, gộp 2 field vào section `その他` | [x] |
| T7 | `ProjectList.tsx`: hiện `{total}件`, chip filter theo từng giá trị (search/tech/type/phase) + nút xoá riêng + "すべてクリア" | [x] |
| T8 | `index.css`: style chip filter (4 màu theo mục 1c), `.multiline-list`, `.form-group-card` cho その他 (tái dùng class có sẵn) | [x] |
| T9 | `ProjectForm.tsx`: chặn Enter submit trên `<input>` (không ảnh hưởng `<textarea>`/nút submit) | [x] |
| T10 | Test toàn bộ frontend: `npx vitest run` | [x] |
| T11 | Test toàn bộ backend: `pytest` (loại trừ 10 fail đã biết do data mẫu local, xem ghi chú CHANGE-012) | [x] |
| T12 | `prettier --check` trong git worktree sạch (không CRLF) | [x] |
| T13 | Verify local: chạy `.env` bỏ Cognito 1 lần để chắc test không phụ thuộc CognitoUserPool import-time | [x] |
| T14 | Báo user deploy + test production OK, rồi mới fold spec vào `specs/`/`DESIGN.md` và archive ticket | [ ] |

## Ghi chú

- 10 test backend fail sẵn có do ~45+ project mẫu trong local DB
  (pagination test + import PPTX) — verify KHÔNG tăng số lượng fail so
  với trước khi bắt đầu ticket này (chỉ tăng số test PASS theo số test
  mới viết ở T1/T5).
