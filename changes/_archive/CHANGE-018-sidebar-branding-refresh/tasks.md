# Tasks — Logo/favicon VPM + làm mới UI Sidebar

- **Ticket ID**: CHANGE-018-sidebar-branding-refresh
- **Dựa trên**: `delta-spec.md`

## Checklist

- [x] **T1** — Copy `frontend/src/assets/vpm_icon_transparent.png` →
      `frontend/public/favicon.png` và `frontend/public/logo.png`
      - Liên quan: ARCH-SHELL-01, ARCH-SHELL-02
- [x] **T2** — Sửa `frontend/index.html`: đổi `<link rel="icon">` sang
      `/favicon.png` (type `image/png`)
      - Liên quan: ARCH-SHELL-01
- [x] **T3** — Thêm khu vực header logo vào `Sidebar.tsx` (chỉ ảnh, không
      text, `border-bottom`)
      - Liên quan: ARCH-SHELL-02
      - File dự kiến: `frontend/src/components/Sidebar.tsx`
- [x] **T4** — Thêm icon SVG inline cạnh trái label nav item; đổi CSS
      `.sidebar-item`/`.sidebar-item-active`/`:hover` sang bo góc +
      margin ngang (không full-bleed)
      - Liên quan: ARCH-SHELL-03
      - File dự kiến: `frontend/src/components/Sidebar.tsx`,
        `frontend/src/index.css`
- [x] **T5** — Cập nhật `DESIGN.md` mục "Navigation Sidebar" (logo
      header, icon trong item, bo góc active/hover)
      - Liên quan: ARCH-SHELL-02, ARCH-SHELL-03
- [x] **T6** — Cập nhật/thêm test `Sidebar.test.tsx` (render logo, render
      icon cạnh label); chạy lại `AppShell.test.tsx` xem còn pass không
      - Liên quan: ARCH-SHELL-02, ARCH-SHELL-03
- [x] **T7** — Build + prettier verify (theo pattern worktree đã dùng
      các change trước)
- [x] **T8** — Review chéo + cập nhật `specs/architecture.md` mục "App
      Shell" khi merge
- [x] **T9** — Di chuyển thư mục này vào `changes/_archive/` sau khi merge

## Trạng thái

| Trạng thái      | Ngày cập nhật | Ghi chú                                                        |
|-----------------|----------------|-----------------------------------------------------------------|
| Đang làm        | 2026-08-21     |                                                                   |
| Code xong (T1-T7) | 2026-08-21   | Đã commit trên branch `feature/change-018-sidebar-branding-refresh`. |
| Hoàn tất         | 2026-08-21    | User deploy + test OK. Đã fold vào `specs/architecture.md`, archive ticket. |
