# Tasks — Thêm field mô tả chi tiết チーム体制

- **Ticket ID**: CHANGE-013
- **Dựa trên**: `delta-spec.md`

## Checklist

- [x] **T1** — Migration: thêm cột `projects.team_composition_note`
      (text, nullable)
      - Liên quan: DM-PROJ-09
      - File dự kiến: `backend/migrations/versions/<new>.py`
- [x] **T2** — Backend: schemas — thêm `team_composition_note` vào
      `ProjectCreate`/`ProjectOut` (free text, không validate)
      - Liên quan: PROJ-27, PROJ-28
      - File dự kiến: `backend/app/projects/schemas.py`
- [x] **T3** — Backend: repository — lưu/trả `team_composition_note`
      trong `create_project`/`update_project`/`get_project`/
      `list_projects`; thêm vào `_build_where` search `q`
      - Liên quan: PROJ-27, PROJ-28, PROJ-29
      - File dự kiến: `backend/app/projects/repository.py`
- [x] **T4** — Backend tests (TDD)
      - Liên quan: xem bảng Test mapping trong `delta-spec.md`
      - File dự kiến: `backend/tests/projects/test_extra_fields.py`
        (file mới `test_team_composition_note.py`)
- [x] **T5** — Frontend: `projectsApi.ts` thêm field vào `Project`/
      `ProjectCreateInput`; `ProjectForm.tsx` thêm textarea "チーム体制
      の詳細" cạnh 人数/総人月 trong 期間・規模; `ProjectDetail.tsx`
      hiển thị read-only cùng vị trí (TDD)
      - Liên quan: delta-spec.md mục 1c
      - File dự kiến: `frontend/src/lib/projectsApi.ts`,
        `frontend/src/components/ProjectForm.tsx`,
        `frontend/src/pages/ProjectDetail.tsx`,
        `frontend/src/pages/ProjectEdit.tsx` (nếu có `toFormValues`)
- [x] **T6** — Chạy full test suite (backend + frontend), lint, build,
      `prettier --check` trong git worktree sạch (không CRLF)
- [x] **T7** — Fold vào `specs/projects.md`, `specs/projects-ui.md`, di
      chuyển ticket vào `changes/_archive/`
- [x] **T8** — User đã tự chạy migration + deploy production, xác nhận
      test OK

## Trạng thái

| Trạng thái | Ngày cập nhật | Ghi chú |
|-------------|----------------|----------|
| Hoàn tất    | 2026-08-19     | T1-T8 xong, đã deploy + test production OK |
