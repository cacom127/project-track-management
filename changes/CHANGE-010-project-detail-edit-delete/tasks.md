# Tasks — Xem chi tiết / Sửa / Xoá dự án

- **Ticket ID**: CHANGE-010
- **Dựa trên**: `delta-spec.md`, `ui-delta-spec.md`

## Checklist

- [x] **T1** — Migration: thêm cột `projects.deleted_at` (timestamptz,
      nullable)
      - Liên quan: DM-PROJ-05
      - File: `backend/migrations/versions/a4b7568918c1_add_projects_deleted_at.py`
- [x] **T2** — Backend: `get_project`, `update_project`, `delete_project`
      trong `repository.py`; sửa `list_projects`/`_build_where` loại
      soft-deleted
      - Liên quan: PROJ-14, PROJ-15, PROJ-16, PROJ-17
      - File: `backend/app/projects/repository.py`
- [x] **T3** — Backend: route `GET/PUT/DELETE /projects/{id}`, schema
      `ProjectUpdate`
      - Liên quan: PROJ-14, PROJ-15, PROJ-16
      - File: `backend/app/projects/routes.py`,
        `backend/app/projects/schemas.py`
- [x] **T4** — Backend tests cho T2/T3 (TDD — viết test trước)
      - Liên quan: xem bảng Test mapping trong `delta-spec.md`
      - File: `backend/tests/projects/test_detail.py`,
        `test_update.py`, `test_delete.py`, `test_repository.py` (bổ sung)
- [x] **T5** — DESIGN.md: thêm component "Modal / Confirm Dialog",
      "Toast" (chính thức hoá + biến thể success), Action Button biến
      thể destructive
      - Liên quan: ui-delta-spec.md mục 6
      - File: `DESIGN.md` — lint 0 errors/0 warnings
- [x] **T6** — Frontend: component `Modal.tsx` (TDD)
      - Liên quan: UI-PROJ-03-4
      - File: `frontend/src/components/Modal.tsx`
- [x] **T6b** — Frontend: component `ToastHost.tsx` (đọc
      `location.state?.successMessage`, tự ẩn sau 3s, clear history
      state) + tích hợp vào `AppShell.tsx`; thêm `.toast-success` CSS
      (TDD)
      - Liên quan: UI-SHELL-04
      - File: `frontend/src/components/ToastHost.tsx`,
        `frontend/src/components/AppShell.tsx`, `frontend/src/index.css`
- [x] **T7** — Frontend: tách `ProjectForm.tsx` từ `ProjectCreate.tsx`
      hiện tại (`initialValues`, `onSubmit`), giữ `ProjectCreate.tsx`
      là wrapper mỏng; sửa điều hướng thành công thành
      `navigate("/projects", { state: { successMessage: ... } })`
      - Liên quan: UI-PROJ-04-3, UI-PROJ-02-4 (SỬA)
      - File: `frontend/src/components/ProjectForm.tsx`,
        `frontend/src/pages/ProjectCreate.tsx`
- [x] **T8** — Frontend: `ProjectDetail.tsx` + route `/projects/:id`
      (nút 削除 điều hướng kèm `successMessage` sau khi xoá thành công)
      - Liên quan: UI-PROJ-03-1..5
      - File: `frontend/src/pages/ProjectDetail.tsx`,
        `frontend/src/App.tsx`, `frontend/src/lib/projectsApi.ts`
        (thêm `ProjectNotFoundError` để phân biệt 404)
- [x] **T9** — Frontend: `ProjectEdit.tsx` + route `/projects/:id/edit`
      (dùng `ProjectForm.tsx` từ T7, điều hướng kèm `successMessage`)
      - Liên quan: UI-PROJ-04-1..3
      - File: `frontend/src/pages/ProjectEdit.tsx`, `frontend/src/App.tsx`
- [x] **T10** — Frontend: thêm cột/link "詳細" mỗi row trong
      `ProjectList.tsx`
      - Liên quan: UI-PROJ-01-10
      - File: `frontend/src/pages/ProjectList.tsx`
- [x] **T11** — Frontend: `projectsApi.ts` thêm `getProject`,
      `updateProject`, `deleteProject`
      - Liên quan: T8, T9
      - File: `frontend/src/lib/projectsApi.ts`
- [x] **T12** — Chạy full test suite (backend + frontend), lint, build
      - Backend: 76/76 pass. Frontend: 99/99 pass, lint sạch, build OK.
- [ ] **T13** — Fold vào `specs/projects.md`, `specs/projects-ui.md`,
      di chuyển ticket vào `changes/_archive/`
- [ ] **T14** — Nhắc user chạy migration script trên production sau
      khi merge (`apply_migration_via_data_api.py`)

## Trạng thái

| Trạng thái | Ngày cập nhật | Ghi chú |
|-------------|----------------|----------|
| Đang làm    | 2026-08-19     | T1-T12 xong (backend + frontend + DESIGN.md), còn fold spec + archive (T13) |
