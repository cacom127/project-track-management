# Tasks — Bổ sung field cho dự án (industry/outcome/dev process)

- **Ticket ID**: CHANGE-012
- **Dựa trên**: `delta-spec.md`, `ui-delta-spec.md`

## Checklist

- [x] **T1** — Migration: thêm cột `projects.industry`/`projects.outcome_note`,
      bảng `dev_process_phases` (seed 6 dòng) + bảng nối
      `project_dev_process_phases`
      - Liên quan: DM-PROJ-07, DM-PROJ-08
      - File dự kiến: `backend/migrations/versions/<new>.py`
- [x] **T2** — Backend: schemas — thêm `industry`/`outcome_note` vào
      `ProjectCreate`/`ProjectOut`; thêm `dev_process_phases` (list,
      validate catalog); constant `DEV_PROCESS_PHASE_CODES`
      - Liên quan: PROJ-22, PROJ-23
      - File dự kiến: `backend/app/projects/schemas.py`
- [x] **T3** — Backend: repository — `create_project`/`update_project`
      lưu `industry`/`outcome_note`/`dev_process_phases` (tái dùng
      pattern `_fetch_project_type_ids`); `_build_where` thêm
      `industry`/`outcome_note` vào search `q`, thêm filter
      `dev_process_phase` (OR); `get_project`/`list_projects` trả thêm
      3 field
      - Liên quan: PROJ-24, PROJ-25, PROJ-26
      - File dự kiến: `backend/app/projects/repository.py`
- [x] **T4** — Backend tests (TDD)
      - Liên quan: xem bảng Test mapping trong `delta-spec.md`
      - File dự kiến: `backend/tests/projects/test_extra_fields.py`
- [x] **T5** — Frontend: `projectsApi.ts`/`projectTypes.ts`-style file
      mới cho `DEV_PROCESS_PHASE_OPTIONS`/`DEV_PROCESS_PHASE_LABELS`
      (giống `projectTypes.ts`), thêm field vào `Project`/
      `ProjectCreateInput` type, thêm `dev_process_phase` vào
      `ListProjectsParams`
      - File dự kiến: `frontend/src/lib/projectsApi.ts`,
        `frontend/src/lib/devProcessPhases.ts`
- [x] **T6** — Frontend: `ProjectForm.tsx` thêm `業種` input,
      `開発工程` checkbox group, `成果・課題・解決策` textarea (TDD)
      - Liên quan: UI-PROJ-02-12/13
      - File dự kiến: `frontend/src/components/ProjectForm.tsx`
- [x] **T7** — Frontend: `ProjectDetail.tsx` hiển thị read-only 3 field
      mới (Badge cho 開発工程)
      - Liên quan: UI-PROJ-03-6
      - File dự kiến: `frontend/src/pages/ProjectDetail.tsx`
- [x] **T8** — Frontend: `ProjectList.tsx` thêm `FilterDropdown`
      "開発工程"
      - Liên quan: UI-PROJ-01-11
      - File dự kiến: `frontend/src/pages/ProjectList.tsx`
- [x] **T9** — Chạy full test suite (backend + frontend), lint, build,
      `prettier --check` trong git worktree sạch (không CRLF)
- [x] **T10** — Fold vào `specs/projects.md`, `specs/projects-ui.md`,
      `specs/data-model.md` (bảng mới DM-PROJ-08), di chuyển ticket vào
      `changes/_archive/`
- [x] **T11** — User đã tự chạy migration + deploy production, xác
      nhận test OK

## Trạng thái

| Trạng thái | Ngày cập nhật | Ghi chú |
|-------------|----------------|----------|
| Hoàn tất    | 2026-08-19     | T1-T11 xong, đã deploy + test production OK. Bổ sung thêm 1 thay đổi ngoài kế hoạch ban đầu: đổi filter 種別/開発工程 sang AND semantics (PROJ-04 sửa) theo yêu cầu Product owner |
