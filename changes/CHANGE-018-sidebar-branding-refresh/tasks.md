# Tasks — Logo/favicon VPM + làm mới UI Sidebar

- **Ticket ID**: CHANGE-018-sidebar-branding-refresh
- **Dựa trên**: `delta-spec.md`

## Checklist

- [ ] **T1** — Copy `frontend/src/assets/vpm_icon_transparent.png` →
      `frontend/public/favicon.png` và `frontend/public/logo.png`
      - Liên quan: ARCH-SHELL-01, ARCH-SHELL-02
- [ ] **T2** — Sửa `frontend/index.html`: đổi `<link rel="icon">` sang
      `/favicon.png` (type `image/png`)
      - Liên quan: ARCH-SHELL-01
- [ ] **T3** — Thêm khu vực header logo vào `Sidebar.tsx` (chỉ ảnh, không
      text, `border-bottom`)
      - Liên quan: ARCH-SHELL-02
      - File dự kiến: `frontend/src/components/Sidebar.tsx`
- [ ] **T4** — Thêm icon SVG inline cạnh trái label nav item; đổi CSS
      `.sidebar-item`/`.sidebar-item-active`/`:hover` sang bo góc +
      margin ngang (không full-bleed)
      - Liên quan: ARCH-SHELL-03
      - File dự kiến: `frontend/src/components/Sidebar.tsx`,
        `frontend/src/index.css`
- [ ] **T5** — Cập nhật `DESIGN.md` mục "Navigation Sidebar" (logo
      header, icon trong item, bo góc active/hover)
      - Liên quan: ARCH-SHELL-02, ARCH-SHELL-03
- [ ] **T6** — Cập nhật/thêm test `Sidebar.test.tsx` (render logo, render
      icon cạnh label); chạy lại `AppShell.test.tsx` xem còn pass không
      - Liên quan: ARCH-SHELL-02, ARCH-SHELL-03
- [ ] **T7** — Build + prettier verify (theo pattern worktree đã dùng
      các change trước)
- [ ] **T8** — Review chéo + cập nhật `specs/architecture.md` mục "App
      Shell" khi merge
- [ ] **T9** — Di chuyển thư mục này vào `changes/_archive/` sau khi merge

## Trạng thái

| Trạng thái  | Ngày cập nhật | Ghi chú |
|-------------|----------------|----------|
| Đang làm    | 2026-08-21     |          |
