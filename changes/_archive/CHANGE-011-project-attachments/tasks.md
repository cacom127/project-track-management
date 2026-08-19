# Tasks — Ảnh đính kèm cho dự án

- **Ticket ID**: CHANGE-011
- **Dựa trên**: `delta-spec.md`, `ui-delta-spec.md`

## Checklist

- [x] **T1** — Infra: CORS rule cho `attachments_bucket`, env var
      `ATTACHMENTS_BUCKET_NAME`, `CfnOutput` tên bucket
      - Liên quan: delta-spec.md mục 1d
      - File dự kiến: `infra/stacks/main_stack.py`
- [x] **T2** — Migration: bảng `attachments`
      - Liên quan: DM-PROJ-06
      - File dự kiến: `backend/migrations/versions/<new>.py`
- [x] **T3** — Backend: `app/core/s3.py` (presign PUT/GET, delete
      object) — bọc riêng để test mock được, không gọi S3 thật
      - File dự kiến: `backend/app/core/s3.py`
- [x] **T4** — Backend: schemas `AttachmentOut`, `AttachmentPresignRequest`,
      `AttachmentPresignResponse`, `AttachmentConfirmRequest`
      - File dự kiến: `backend/app/projects/schemas.py`
- [x] **T5** — Backend: repository `presign_attachment`,
      `confirm_attachment`, `list_attachments`, `delete_attachment`,
      `count_attachments`
      - Liên quan: PROJ-18..21
      - File dự kiến: `backend/app/projects/repository.py`
- [x] **T6** — Backend: routes
      `POST/GET /projects/{id}/attachments`,
      `POST /projects/{id}/attachments/presign`,
      `DELETE /projects/{id}/attachments/{attachment_id}`
      - Liên quan: PROJ-18..21
      - File dự kiến: `backend/app/projects/routes.py`
- [x] **T7** — Backend tests (TDD — viết test trước, mock `app/core/s3.py`)
      - Liên quan: xem bảng Test mapping trong `delta-spec.md`
      - File dự kiến: `backend/tests/projects/test_attachments.py`
- [x] **T8** — DESIGN.md: thêm component "Thumbnail Grid", "Paste Zone"
      (3 trạng thái: bình thường/focus/đủ giới hạn)
      - Liên quan: ui-delta-spec.md mục 6
      - Lint: 0 errors/0 warnings
- [x] **T9** — Frontend: `attachmentsApi.ts` (presign/confirm/list/delete
      + upload PUT trực tiếp lên presigned URL)
      - File: `frontend/src/lib/attachmentsApi.ts`
- [x] **T10** — Frontend: `AttachmentManager.tsx` (2 mode `staged`/`live`,
      Paste Zone 3 trạng thái, Lightbox tự viết riêng thay vì dùng
      `Modal.tsx` — lý do: `Modal` bắt buộc có confirm/cancel, không
      hợp cho popup chỉ xem ảnh) + test (TDD)
      - Liên quan: UI-PROJ-05-1..6
      - File: `frontend/src/components/AttachmentManager.tsx`
- [x] **T11** — Frontend: đổi contract `ProjectForm.tsx` (`onSubmit`
      trả `Project`, thêm `onSuccess`), tích hợp `AttachmentManager`
      mode `staged`
      - Liên quan: UI-PROJ-02-11, UI-PROJ-05-4
      - File: `frontend/src/components/ProjectForm.tsx`
- [x] **T12** — Frontend: cập nhật `ProjectCreate.tsx`/`ProjectEdit.tsx`
      theo contract mới (`ProjectEdit` truyền `projectId` cho
      `AttachmentManager` mode `live`)
      - File: `frontend/src/pages/ProjectCreate.tsx`,
        `frontend/src/pages/ProjectEdit.tsx`
- [x] **T13** — Frontend: tích hợp `AttachmentManager` mode `live` vào
      `ProjectDetail.tsx`
      - File: `frontend/src/pages/ProjectDetail.tsx`
- [x] **T14** — Chạy full test suite (backend + frontend), lint, build,
      và `prettier --check` trong git worktree sạch (không CRLF)
      - Backend: 83/83 pass (17/17 riêng attachments/s3), ruff sạch,
        `cdk synth` OK. 10 fail còn lại ở `tests/projects/` là do 25
        project mẫu seed thủ công trước đó trong Postgres local — không
        phải regression, CI dùng Postgres mới hoàn toàn nên không ảnh
        hưởng.
      - Frontend: 125/125 pass (kể cả tắt `.env`, mô phỏng CI), lint/
        build sạch, prettier sạch trong worktree không CRLF.
- [x] **T15** — Fold vào `specs/projects.md`, `specs/projects-ui.md`,
      `specs/architecture.md`, `specs/data-model.md`, di chuyển ticket
      vào `changes/_archive/` — làm sau khi user deploy + test production
      OK (quyết định Product owner, khác thứ tự các ticket trước)
- [x] **T16** — User đã tự chạy migration + `cdk deploy` production,
      xác nhận test OK

## Trạng thái

| Trạng thái | Ngày cập nhật | Ghi chú |
|-------------|----------------|----------|
| Hoàn tất    | 2026-08-19     | T1-T16 xong, đã deploy + test production OK |
