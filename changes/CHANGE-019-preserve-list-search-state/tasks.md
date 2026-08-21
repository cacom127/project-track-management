# Tasks — Giữ điều kiện tìm kiếm List khi back từ Detail

- **Ticket ID**: CHANGE-019-preserve-list-search-state
- **Dựa trên**: `delta-spec.md`

## Checklist

- [ ] **T1** — Thêm `useSearchParams`, khởi tạo `q`/`page`/`technology`/
      `projectType`/`devProcessPhase` từ URL query khi mount
      - Liên quan: UI-PROJ-01-24, UI-PROJ-01-25
      - File dự kiến: `frontend/src/pages/ProjectList.tsx`
- [ ] **T2** — Thêm effect đồng bộ ngược 5 state trên lên URL (dùng
      `setSearchParams(..., { replace: true })`), bỏ param khi rỗng/mặc
      định (page=1) để URL gọn
      - Liên quan: UI-PROJ-01-24
      - File dự kiến: `frontend/src/pages/ProjectList.tsx`
- [ ] **T3** — Sửa effect debounce search để KHÔNG reset `page` ở lần
      chạy đầu tiên (mount) — tránh đè mất `page` vừa khôi phục từ URL
      - Liên quan: UI-PROJ-01-25
      - File dự kiến: `frontend/src/pages/ProjectList.tsx`
- [ ] **T4** — Viết/cập nhật test: đồng bộ lên URL, khôi phục từ URL khi
      mount (simulate back), reset về mặc định khi URL không có query
      (simulate bấm menu sidebar)
      - Liên quan: UI-PROJ-01-24, UI-PROJ-01-25, UI-PROJ-01-26
      - File dự kiến: `frontend/src/pages/ProjectList.test.tsx`
- [ ] **T5** — Build + prettier verify (theo pattern worktree đã dùng
      các change trước)
- [ ] **T6** — Review chéo + cập nhật `specs/projects-ui.md` (thêm
      UI-PROJ-01-24..26) khi merge
- [ ] **T7** — Di chuyển thư mục này vào `changes/_archive/` sau khi merge

## Trạng thái

| Trạng thái  | Ngày cập nhật | Ghi chú |
|-------------|----------------|----------|
| Đang làm    | 2026-08-21     |          |
