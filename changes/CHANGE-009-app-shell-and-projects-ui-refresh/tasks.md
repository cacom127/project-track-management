# Tasks — CHANGE-009-app-shell-and-projects-ui-refresh

- **Ticket ID**: CHANGE-009-app-shell-and-projects-ui-refresh
- **Dựa trên**: `delta-spec.md`, `ui-delta-spec.md`, `plan.md`

## Checklist

- [ ] **T1** — TDD: component `Sidebar.tsx` (240px, nav item
      "プロジェクト一覧", active state theo route hiện tại) + restructure
      `App.tsx` thành layout Header/Sidebar/content dùng chung mọi route
      đã login.
      - Liên quan: UI-SHELL-01, UI-SHELL-02
      - File dự kiến: `frontend/src/components/Sidebar.tsx`,
        `frontend/src/components/Sidebar.test.tsx`, `frontend/src/App.tsx`
- [ ] **T2** — TDD: component `Badge.tsx` (nhận `variant: "type" |
      "tech"` để chọn màu — `secondary-container`/`tertiary-container`).
      - Liên quan: UI-PROJ-01-9
      - File dự kiến: `frontend/src/components/Badge.tsx`,
        `frontend/src/components/Badge.test.tsx`
- [ ] **T3** — TDD: component `FilterDropdown.tsx` (button hiện label +
      số lượng đã chọn, click mở panel checkbox list, click ra ngoài
      đóng panel, `onChange(selected: string[])`).
      - Liên quan: UI-PROJ-01-8
      - File dự kiến: `frontend/src/components/FilterDropdown.tsx`,
        `frontend/src/components/FilterDropdown.test.tsx`
- [ ] **T4** — CSS: sidebar layout + breakpoint responsive (`DESIGN.md`
      3 mức), `.search-box`, `.form-group-card`, `.required-mark`,
      button Secondary/Ghost (cho nút Huỷ), badge theo nhóm màu.
      - Liên quan: UI-SHELL-01/03, UI-PROJ-01-7/9, UI-PROJ-02-5/6/8
      - File dự kiến: `frontend/src/index.css`
- [ ] **T5** — TDD: viết lại `ProjectList.tsx` — tách title/toolbar row,
      dùng `FilterDropdown` thay `<select multiple>`, dùng `Badge` cho
      種別/技術, `.search-box` cho ô tìm kiếm. Cập nhật lại
      `ProjectList.test.tsx` (query filter qua dropdown, không qua
      `selectedOptions`).
      - Liên quan: UI-PROJ-01-6..9
      - File dự kiến: `frontend/src/pages/ProjectList.tsx`,
        `frontend/src/pages/ProjectList.test.tsx`
- [ ] **T6** — TDD: viết lại `ProjectCreate.tsx` — phân nhóm field theo
      3 `.form-group-card`, dấu `*` màu error, đơn vị 名/人月, nút Huỷ.
      Cập nhật `ProjectCreate.test.tsx` nếu cấu trúc DOM đổi (label/id
      giữ nguyên nên phần lớn test cũ vẫn chạy được).
      - Liên quan: UI-PROJ-02-5..8
      - File dự kiến: `frontend/src/pages/ProjectCreate.tsx`,
        `frontend/src/pages/ProjectCreate.test.tsx`
- [ ] **T7** — Cập nhật `App.test.tsx` cho layout shell mới (sidebar
      xuất hiện đúng, active state, ẩn ở mobile — dùng
      `window.matchMedia` mock hoặc test CSS class thay vì đo pixel
      thật).
      - Liên quan: UI-SHELL-01..03
      - File dự kiến: `frontend/src/App.test.tsx`
- [ ] **T8** — Full suite + lint + `npm run build` — verify không
      regression so với `CHANGE-007`/`CHANGE-008`.
- [ ] **T9** — Deploy (`namlp` tự chạy `npm run build` + `cdk deploy`,
      không cần migration) — verify bằng mắt theo đúng 5 comment gốc
      (sidebar, search box, nút tạo mới, badge, dấu * đỏ).
- [ ] **T10** — Fold `ui-delta-spec.md` vào `specs/projects-ui.md` (SỬA)
      + `specs/architecture.md` mục 1 (thêm mô tả App Shell).
- [ ] **T11** — Di chuyển thư mục này vào `changes/_archive/` sau khi
      merge.

## Trạng thái

| Trạng thái | Ngày cập nhật | Ghi chú |
|---|---|---|
| Đang làm | 2026-08-18 | Vừa hoàn tất proposal/plan/delta-spec/ui-delta-spec, chuẩn bị implement T1. |
