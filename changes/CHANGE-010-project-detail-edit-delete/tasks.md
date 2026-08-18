# Tasks — Xem chi tiết / Sửa / Xoá dự án

- **Ticket ID**: CHANGE-010
- **Dựa trên**: `delta-spec.md`, `ui-delta-spec.md`

## Checklist

- [ ] **T1** — Migration: thêm cột `projects.deleted_at` (timestamptz,
      nullable)
      - Liên quan: DM-PROJ-05
      - File dự kiến: `backend/migrations/versions/<new>.py`
- [ ] **T2** — Backend: `get_project`, `update_project`, `delete_project`
      trong `repository.py`; sửa `list_projects`/`_build_where` loại
      soft-deleted
      - Liên quan: PROJ-14, PROJ-15, PROJ-16, PROJ-17
      - File dự kiến: `backend/app/projects/repository.py`
- [ ] **T3** — Backend: route `GET/PUT/DELETE /projects/{id}`, schema
      `ProjectUpdate`
      - Liên quan: PROJ-14, PROJ-15, PROJ-16
      - File dự kiến: `backend/app/projects/routes.py`,
        `backend/app/projects/schemas.py`
- [ ] **T4** — Backend tests cho T2/T3 (TDD — viết test trước)
      - Liên quan: xem bảng Test mapping trong `delta-spec.md`
      - File dự kiến: `backend/tests/projects/test_detail.py`,
        `test_update.py`, `test_delete.py`
- [ ] **T5** — DESIGN.md: thêm component "Modal / Confirm Dialog",
      "Toast" (chính thức hoá + biến thể success), Action Button biến
      thể destructive
      - Liên quan: ui-delta-spec.md mục 6
      - File dự kiến: `DESIGN.md`
      - Chạy `npx --yes -p @google/design.md -c "designmd lint DESIGN.md"`
        sau khi sửa
- [ ] **T6** — Frontend: component `Modal.tsx` (TDD)
      - Liên quan: UI-PROJ-03-4
      - File dự kiến: `frontend/src/components/Modal.tsx`
- [ ] **T6b** — Frontend: component `ToastHost.tsx` (đọc
      `location.state?.successMessage`, tự ẩn sau 3s, clear history
      state) + tích hợp vào `AppShell.tsx`; thêm `.toast-success` CSS
      (TDD)
      - Liên quan: UI-SHELL-04
      - File dự kiến: `frontend/src/components/ToastHost.tsx`,
        `frontend/src/components/AppShell.tsx`, `frontend/src/index.css`
- [ ] **T7** — Frontend: tách `ProjectForm.tsx` từ `ProjectCreate.tsx`
      hiện tại (props `mode`, `initialValues`, `onSubmit`), giữ
      `ProjectCreate.tsx` là wrapper mỏng; sửa điều hướng thành công
      thành `navigate("/projects", { state: { successMessage: ... } })`
      - Liên quan: UI-PROJ-04-3, UI-PROJ-02-4 (SỬA)
      - File dự kiến: `frontend/src/components/ProjectForm.tsx`,
        `frontend/src/pages/ProjectCreate.tsx`
- [ ] **T8** — Frontend: `ProjectDetail.tsx` + route `/projects/:id`
      (nút 削除 điều hướng kèm `successMessage` sau khi xoá thành công)
      - Liên quan: UI-PROJ-03-1..5
      - File dự kiến: `frontend/src/pages/ProjectDetail.tsx`,
        `frontend/src/App.tsx`
- [ ] **T9** — Frontend: `ProjectEdit.tsx` + route `/projects/:id/edit`
      (dùng `ProjectForm.tsx` từ T7, điều hướng kèm `successMessage`)
      - Liên quan: UI-PROJ-04-1..3
      - File dự kiến: `frontend/src/pages/ProjectEdit.tsx`,
        `frontend/src/App.tsx`
- [ ] **T10** — Frontend: thêm nút "詳細" mỗi row trong `ProjectList.tsx`
      - Liên quan: UI-PROJ-01-10
      - File dự kiến: `frontend/src/pages/ProjectList.tsx`
- [ ] **T11** — Frontend: `projectsApi.ts` thêm `getProject`,
      `updateProject`, `deleteProject`
      - Liên quan: T8, T9
      - File dự kiến: `frontend/src/lib/projectsApi.ts`
- [ ] **T12** — Chạy full test suite (backend + frontend), lint, build
- [ ] **T13** — Fold vào `specs/projects.md`, `specs/projects-ui.md`,
      di chuyển ticket vào `changes/_archive/`
- [ ] **T14** — Nhắc user chạy migration script trên production sau
      khi merge (`apply_migration_via_data_api.py`)

## Trạng thái

| Trạng thái | Ngày cập nhật | Ghi chú |
|-------------|----------------|----------|
| Đang làm    | 2026-08-19     | Bắt đầu implement trên branch `feature/change-010-project-detail-edit-delete` |
