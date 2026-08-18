# Tasks — CHANGE-007-projects-list-create

- **Ticket ID**: CHANGE-007-projects-list-create
- **Dựa trên**: `delta-spec.md`, `ui-delta-spec.md`, `plan.md`

## Checklist

- [x] **T1** — Alembic migration: tạo bảng `projects`, `tech_tags`,
      `project_tech_tags`, `project_types`, `project_project_types`; seed
      5 dòng cố định vào `project_types` (idempotent — `ON CONFLICT DO
      NOTHING`).
      - Liên quan: DM-PROJ-01..05
      - File: `backend/migrations/versions/9cdc4dbd9ca7_create_projects_tables.py`
      - Verify: `alembic upgrade head` / `downgrade -1` / `upgrade head`
        lại trên Postgres local (docker-compose) — schema đúng, seed
        đúng 5 dòng cả 2 lần, `ruff check` sạch.
- [x] **T2** — Script `apply_migration_via_data_api.py`: sinh SQL bằng
      `alembic upgrade head --sql`, chạy từng câu qua RDS Data API
      (`boto3` `rds-data`), tự cập nhật bảng `alembic_version` sau khi
      xong — tái dùng được cho MỌI migration sau này, không riêng ticket
      này (xem `plan.md` mục 2 — production không có kết nối trực tiếp
      tới Aurora).
      - File: `backend/scripts/apply_migration_via_data_api.py`,
        `backend/tests/scripts/test_apply_migration_via_data_api.py`
      - Verify: 8 test pass (mock boto3), sanity-check `_split_statements`
        trên SQL thật sinh ra từ T1's migration (12 câu, đúng thứ tự,
        loại đúng `BEGIN;`/`COMMIT;`, giữ `UPDATE alembic_version`).
        Transaction thật qua Data API `begin/commit/rollback_transaction`
        (không tự parse riêng — Data API tự đảm bảo atomicity).
- [x] **T3** — Backend: Pydantic schema (`ProjectCreate`, `ProjectOut`,
      `ProjectListResponse`) + hàm truy vấn dùng raw SQL qua
      `DBSession`/`get_db_session` có sẵn (KHÔNG dùng SQLAlchemy ORM
      model — kiến trúc hiện tại chỉ truyền SQL string qua interface
      chung cho cả nhánh local/Data API, xem `app/core/db.py`).
      - Liên quan: DM-PROJ-01..05
      - File: `backend/app/projects/schemas.py`,
        `backend/app/projects/repository.py`,
        `backend/tests/projects/test_repository.py`,
        `backend/tests/conftest.py` (mới),
        `backend/app/core/db.py` (fix — xem `delta-spec.md` mục 3),
        `backend/tests/test_db_sqlalchemy_adapter.py` (mới),
        `.github/workflows/ci.yml` (thêm bước migration)
      - Verify: 28/28 test pass (2 lần liên tiếp), DB thật không còn
        rác sau khi chạy test (SAVEPOINT rollback đúng), `ruff check` sạch.
- [x] **T4** — TDD: `POST /projects` — tạo project, validate field bắt
      buộc, validate `is_ongoing`/`end_date`, validate `project_types`
      trong enum, auto-tạo `tech_tags` mới (case-insensitive dedupe).
      - Liên quan: PROJ-05, PROJ-06, PROJ-07, PROJ-08, PROJ-09, PROJ-10, PROJ-12
      - File: `backend/app/projects/routes.py`,
        `backend/tests/projects/test_create_route.py`,
        `backend/app/core/auth.py` (mới — dependency lấy Cognito `sub`
        từ JWT, dùng chung cho mọi route cần "current user" sau này),
        `backend/tests/test_core_auth.py`,
        `backend/app/main.py` (đăng ký router + exception handler
        `RequestValidationError` → 400 dùng `jsonable_encoder`, xem
        `delta-spec.md` mục 3)
      - Verify: 36/36 test pass, `ruff check` sạch.
- [x] **T5** — TDD: `GET /projects` — pagination, search `q`, filter
      `technology` (AND), filter `project_type` (OR), sort mặc định
      `created_at desc`.
      - Liên quan: PROJ-01, PROJ-02, PROJ-03, PROJ-04, PROJ-12
      - File: `backend/app/projects/routes.py`,
        `backend/tests/projects/test_list_route.py` — 6/6 pass.
- [x] **T6** — TDD: `GET /tech-tags?q=` autocomplete.
      - Liên quan: PROJ-11
      - File: `backend/app/projects/routes.py`,
        `backend/tests/projects/test_tech_tags_route.py` — 3/3 pass.
      - **Backend hoàn tất T1-T6**: 45/45 test pass, `ruff check` sạch,
        verify 2 lần liên tiếp không rò rỉ dữ liệu vào Postgres local.
- [x] **T7** — TDD: FE API client cho `projects`
      (`listProjects`, `createProject`, `listTechTags`), dùng
      `apiFetch` có sẵn từ `auth` module.
      - Liên quan: PROJ-01, PROJ-05, PROJ-11
      - File: `frontend/src/lib/projectsApi.ts`,
        `frontend/src/lib/projectsApi.test.ts` — 9/9 pass, full suite
        42/42, lint sạch.
- [x] **T8** — TDD: màn List (`ProjectList.tsx`) — bảng 8 cột, search box
      debounce 300ms, filter công nghệ/loại hình, pagination, state
      Loading/Empty/Error/Loaded.
      - Liên quan: UI-PROJ-01-1..5
      - File: `frontend/src/pages/ProjectList.tsx`,
        `frontend/src/pages/ProjectList.test.tsx` — 6/6 pass, full suite
        48/48, lint sạch. (Styling token DESIGN.md đầy đủ để dành T11.)
- [x] **T9** — TDD: màn Tạo dự án (`ProjectCreate.tsx`) — form, validate
      FE, checkbox 進行中, tag input với autocomplete, state
      Idle/Validation error/Submitting/Server error/Success.
      - Liên quan: UI-PROJ-02-1..4
      - File: `frontend/src/pages/ProjectCreate.tsx`,
        `frontend/src/pages/ProjectCreate.test.tsx`,
        `frontend/src/lib/projectTypes.ts` (mới — tách chung với
        `ProjectList.tsx`, tránh trùng lặp catalog 5 loại hình).
      - Verify: 6/6 pass, full suite 54/54, lint sạch.
- [x] **T10** — Nối route `/projects` (List) và `/projects/new` (Create)
      vào `App.tsx`, bọc `RouteGuard`; thêm link điều hướng ở trang chủ
      (`プロジェクト一覧`) để vào được màn List sau khi login. Cả 2 màn
      hiển thị `Header` (email/role/logout) như thiết kế `ui-delta-spec.md`.
      - Liên quan: UI-PROJ-01-1, UI-PROJ-02-4
      - File: `frontend/src/App.tsx`, `frontend/src/App.test.tsx`,
        `frontend/src/pages/ProjectList.tsx`/`ProjectCreate.tsx` (thêm
        `<Header/>`), `frontend/src/lib/projectsApi.ts` (fix type
        `ProjectTypeCode` cho `project_types`)
      - Verify: 57/57 pass, `oxlint` sạch, `npm run build` + `tsc -b`
        thành công.
- [x] **T11** — Áp `DESIGN.md` token cho toàn bộ UI mới ở T8/T9 (đọc
      `DESIGN.md` trước khi code, không hardcode màu/spacing — theo
      CLAUDE.md mục 3 và kinh nghiệm từ `CHANGE-005`).
      - Liên quan: UI-PROJ-01, UI-PROJ-02 (toàn bộ)
      - Áp dụng đúng token có sẵn: Data Table (border-bottom
        outline-variant, header bg surface-container-low, hover row),
        Filter Chip (`radius-lg` mới thêm từ `rounded.lg` trong
        DESIGN.md — chưa có CSS var trước đó), Action Button
        Secondary/Ghost cho pagination, Input Field mở rộng cho
        textarea/checkbox.
      - File: `frontend/src/index.css`, `frontend/src/pages/ProjectCreate.tsx`
        (className `tag-chip-list`/`tag-suggestions`)
      - Verify: 57/57 pass, lint sạch, `npm run build` thành công (CSS
        3.08kB → 6.42kB, hợp lý vì có style thật thay vì HTML thô).
- [x] **T12** — Deploy migration (qua script T2) + code lên production
      (`namlp` tự chạy thủ công như các ticket trước); sau đó chạy
      checklist trong skill local `post-deploy-smoke-test` (health check,
      kiểm tra bundle FE, nhờ hard-refresh + xem Console) — báo lại kết quả.
      - Liên quan: toàn bộ PROJ-*, UI-PROJ-*
      - Ghi chú thực tế khi deploy: script T2 ban đầu báo
        `ModuleNotFoundError: No module named 'app'` do chạy trực tiếp
        (`python scripts/....py`) thay vì dạng module; cũng thiếu
        `AWS_PROFILE`/`AWS_DEFAULT_REGION` tường minh trong terminal
        chạy script. Đã sửa docstring trong
        `apply_migration_via_data_api.py` ghi rõ cách gọi đúng, tránh
        lặp lại lỗi này ở migration sau.
      - Verify thật trên production: tạo project có `technologies` +
        `project_types`, xem lại `/projects` — hiển thị đúng, rủi ro
        `array_agg`/Data API `arrayValue` đã ghi ở mục 3 KHÔNG xảy ra
        (Data API trả đúng mảng string, parse OK qua
        `_parse_data_api_records` hiện có, không cần fix thêm).
- [x] **T13** — Review chéo + fold `delta-spec.md`/`ui-delta-spec.md` vào
      `specs/projects.md` (MỚI) và `specs/projects-ui.md` (MỚI); thêm
      dòng module `projects` trỏ đúng file trong `specs/architecture.md`
      mục 2 + dòng lịch sử thay đổi mục 5.
      - File: `specs/projects.md` (mới), `specs/projects-ui.md` (mới),
        `specs/architecture.md` (bảng module, mục 4 thêm 4 nguyên tắc
        kỹ thuật mới — raw SQL/không ORM, migration qua Data API script,
        `get_current_user_id`, validation error 400 — + dòng lịch sử).
- [x] **T14** — Di chuyển thư mục này vào `changes/_archive/` sau khi
      merge.

## Trạng thái

| Trạng thái | Ngày cập nhật | Ghi chú |
|---|---|---|
| Hoàn tất | 2026-08-18 | Toàn bộ T1-T14 xong. Deploy production verify OK, đã fold vào specs/, đã archive. |
