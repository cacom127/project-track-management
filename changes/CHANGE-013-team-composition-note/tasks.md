# Tasks — Thêm field mô tả chi tiết チーム体制

- **Ticket ID**: CHANGE-013
- **Dựa trên**: `delta-spec.md`

## Checklist

- [ ] **T1** — Migration: thêm cột `projects.team_composition_note`
      (text, nullable)
      - Liên quan: DM-PROJ-09
      - File dự kiến: `backend/migrations/versions/<new>.py`
- [ ] **T2** — Backend: schemas — thêm `team_composition_note` vào
      `ProjectCreate`/`ProjectOut` (free text, không validate)
      - Liên quan: PROJ-27, PROJ-28
      - File dự kiến: `backend/app/projects/schemas.py`
- [ ] **T3** — Backend: repository — lưu/trả `team_composition_note`
      trong `create_project`/`update_project`/`get_project`/
      `list_projects`; thêm vào `_build_where` search `q`
      - Liên quan: PROJ-27, PROJ-28, PROJ-29
      - File dự kiến: `backend/app/projects/repository.py`
- [ ] **T4** — Backend tests (TDD)
      - Liên quan: xem bảng Test mapping trong `delta-spec.md`
      - File dự kiến: `backend/tests/projects/test_extra_fields.py`
        (bổ sung case)
- [ ] **T5** — Frontend: `projectsApi.ts` thêm field vào `Project`/
      `ProjectCreateInput`; `ProjectForm.tsx` thêm textarea "チーム体制
      の詳細" cạnh 人数/総人月 trong 期間・規模; `ProjectDetail.tsx`
      hiển thị read-only cùng vị trí (TDD)
      - Liên quan: delta-spec.md mục 1c
      - File dự kiến: `frontend/src/lib/projectsApi.ts`,
        `frontend/src/components/ProjectForm.tsx`,
        `frontend/src/pages/ProjectDetail.tsx`,
        `frontend/src/pages/ProjectEdit.tsx` (nếu có `toFormValues`)
- [ ] **T6** — Chạy full test suite (backend + frontend), lint, build,
      `prettier --check` trong git worktree sạch (không CRLF)
- [ ] **T7** — Fold vào `specs/projects.md`, `specs/projects-ui.md`, di
      chuyển ticket vào `changes/_archive/` — LÀM SAU khi user deploy +
      test production OK
- [ ] **T8** — Nhắc user: chạy migration script trên production sau
      khi merge

## Trạng thái

| Trạng thái | Ngày cập nhật | Ghi chú |
|-------------|----------------|----------|
| Đang làm    | 2026-08-19     | Bắt đầu implement trên branch `feature/change-013-team-composition-note` |
