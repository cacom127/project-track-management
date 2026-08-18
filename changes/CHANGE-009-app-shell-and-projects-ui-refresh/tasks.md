# Tasks — CHANGE-009-app-shell-and-projects-ui-refresh

- **Ticket ID**: CHANGE-009-app-shell-and-projects-ui-refresh
- **Dựa trên**: `delta-spec.md`, `ui-delta-spec.md`, `plan.md`

## Checklist

- [x] **T1** — TDD: component `Sidebar.tsx` (240px, nav item
      "プロジェクト一覧", active state theo route hiện tại) + restructure
      `App.tsx` thành layout Header/Sidebar/content dùng chung mọi route
      đã login.
      - Liên quan: UI-SHELL-01, UI-SHELL-02
      - File: `frontend/src/components/Sidebar.tsx`,
        `frontend/src/components/Sidebar.test.tsx` (build qua subagent
        song song); `frontend/src/components/AppShell.tsx` (mới — ghép
        Header+Sidebar, do tôi tích hợp sau đó) + `frontend/src/App.tsx`.
      - Dùng `NavLink` (react-router) cho active state, không tự so
        sánh path thủ công.
- [x] **T2** — TDD: component `Badge.tsx` (nhận `variant: "type" |
      "tech"` để chọn màu — `secondary-container`/`tertiary-container`).
      - Liên quan: UI-PROJ-01-9
      - File: `frontend/src/components/Badge.tsx`,
        `frontend/src/components/Badge.test.tsx` (build qua subagent
        song song).
- [x] **T3** — TDD: component `FilterDropdown.tsx` (button hiện label +
      số lượng đã chọn, click mở panel checkbox list, click ra ngoài
      đóng panel, `onChange(selected: string[])`).
      - Liên quan: UI-PROJ-01-8
      - File: `frontend/src/components/FilterDropdown.tsx`,
        `frontend/src/components/FilterDropdown.test.tsx` (build qua
        subagent song song — 3 subagent T1/T2/T3 chạy đồng thời, mỗi
        cái chỉ đụng file mới của riêng mình, không xung đột).
- [x] **T4** — CSS: sidebar layout + breakpoint responsive (`DESIGN.md`
      3 mức), `.search-box`, `.form-group-card`, `.required-mark`,
      button Secondary/Ghost (cho nút Huỷ), badge theo nhóm màu.
      - Liên quan: UI-SHELL-01/03, UI-PROJ-01-7/9, UI-PROJ-02-5/6/8
      - File: `frontend/src/index.css` — thêm `--color-secondary-container`/
        `--color-on-secondary-container`/`--color-tertiary-container`/
        `--color-on-tertiary-container` (token có sẵn trong DESIGN.md,
        chưa từng khai báo CSS var trước đó).
- [x] **T5** — TDD: viết lại `ProjectList.tsx` — tách title/toolbar row,
      dùng `FilterDropdown` thay `<select multiple>`, dùng `Badge` cho
      種別/技術, `.search-box` cho ô tìm kiếm. Cập nhật lại
      `ProjectList.test.tsx` (query filter qua dropdown, không qua
      `selectedOptions`).
      - Liên quan: UI-PROJ-01-6..9
      - File: `frontend/src/pages/ProjectList.tsx`,
        `frontend/src/pages/ProjectList.test.tsx` — 8/8 pass (thêm 2
        test mới: badge theo nhóm, title/toolbar tách hàng).
- [x] **T6** — TDD: viết lại `ProjectCreate.tsx` — phân nhóm field theo
      3 `.form-group-card`, dấu `*` màu error, đơn vị 名/人月, nút Huỷ.
      Cập nhật `ProjectCreate.test.tsx` nếu cấu trúc DOM đổi (label/id
      giữ nguyên nên phần lớn test cũ vẫn chạy được).
      - Liên quan: UI-PROJ-02-5..8
      - File: `frontend/src/pages/ProjectCreate.tsx`,
        `frontend/src/pages/ProjectCreate.test.tsx` — 10/10 pass (thêm
        4 test mới: required-mark, 3 section, đơn vị, nút Huỷ).
- [x] **T7** — Cập nhật `App.test.tsx` cho layout shell mới (sidebar
      xuất hiện đúng, active state).
      - Liên quan: UI-SHELL-01/02
      - File: `frontend/src/App.test.tsx` — thêm 2 test (sidebar hiện
        trên mọi route đã login, active state ở `/projects`). Ẩn sidebar
        ở mobile (UI-SHELL-03) là hành vi CSS `@media` thuần — KHÔNG
        test được ý nghĩa qua jsdom (không áp dụng layout CSS thật),
        verify bằng mắt ở T9 thay vì viết test giả.
      - Bug phát hiện khi chạy full suite: `Home` (App.tsx) có sẵn 1
        link "プロジェクト一覧" tạm thời từ trước khi có sidebar — giờ
        trùng với sidebar, gây lỗi "multiple elements" trong test. Đã
        xoá link dư thừa đó khỏi `Home`.
- [x] **T8** — Full suite + lint + `npm run build` — verify không
      regression so với `CHANGE-007`/`CHANGE-008`.
      - Kết quả: 78/78 test pass, `oxlint` sạch, `npm run build` thành
        công (CSS 6.42kB → 10.21kB — hợp lý, thêm style thật cho
        sidebar/badge/dropdown/form-group-card). `npx prettier --write`
        đã chạy trên toàn bộ file mới/sửa.
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
| Đang làm | 2026-08-18 | T1-T8 xong (code + test local, 3 component build song song qua subagent). Còn T9 (deploy + verify bằng mắt theo 5 comment gốc), T10 (fold specs), T11 (archive). |
