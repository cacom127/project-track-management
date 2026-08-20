# Tasks — CHANGE-017-project-export-pptx

## Backend

| # | Task | Trạng thái |
|---|------|------------|
| T1 | Thêm `python-pptx` vào `backend/pyproject.toml` | [x] |
| T2 | Tạo `backend/app/export/assets/template.pptx` (layout đã chốt ở `proposal.md` mục 3) — đặt tên placeholder/shape rõ ràng theo bảng field mapping (`delta-spec.md` mục 2) | [x] |
| T3 | `app/core/s3.py`: thêm `get_object_bytes(s3_key) -> bytes` | [x] |
| T4 | `app/core/s3.py` (hoặc module export riêng): hàm upload object với `ContentDisposition` (EXPORT-10) | [x] |
| T5 | `backend/app/export/service.py`: `build_presentation(projects, attachments_by_project) -> bytes` — mở template, add_slide per project, điền field theo mapping, auto-shrink cho 概要/成果, chèn tối đa 4 ảnh (EXPORT-05..08) | [x] |
| T6 | `backend/app/export/routes.py`: `POST /projects/export` — validate 1-10 ids (EXPORT-03), 404 nếu thiếu id (EXPORT-04), gọi `service.build_presentation`, upload S3 `exports/`, trả `{download_url, expires_in}` (EXPORT-09) | [x] |
| T7 | Đăng ký router export vào `app/main.py` | [x] |
| T8 | Test: `test_export_rejects_empty_or_over_10_ids`, `test_export_404_when_project_id_missing`, `test_build_presentation_one_slide_per_project_max_4_images`, `test_build_presentation_excludes_customer_name_and_notes`, `test_export_route_returns_presigned_download_url` (mock `app.core.s3`, dùng template thật) | [x] |

## Infra

| # | Task | Trạng thái |
|---|------|------------|
| T9 | CDK: thêm lifecycle rule xoá object sau 1 ngày cho prefix `exports/` trên bucket attachments hiện có (EXPORT-11) | [x] |
| T10 | CDK: đảm bảo Lambda role có quyền `s3:PutObject`/`s3:GetObject` cho prefix `exports/` (nếu policy hiện tại đang giới hạn theo prefix `attachments/`) | [x] |

## Frontend

| # | Task | Trạng thái |
|---|------|------------|
| T11 | `frontend/src/lib/projectsApi.ts`: thêm `exportProjects(projectIds: number[]): Promise<{download_url: string; expires_in: number}>` | [x] |
| T12 | `ProjectList.tsx`: thêm checkbox chọn dòng/card (cả `list` và `card` mode) + checkbox "chọn tất cả trang này" (UI-PROJ-01-19) | [x] |
| T13 | `ProjectList.tsx`: nút "Export" trên toolbar — disabled khi chưa chọn gì, loading state khi đang gọi API, trigger download qua `window.location.href = download_url` khi xong (UI-PROJ-01-20) | [x] |
| T14 | `ProjectList.tsx`: khi đã chọn đủ 10, disable mọi checkbox dòng/card chưa chọn + hiện thông báo giới hạn cạnh toolbar; bỏ chọn 1 project mở khoá lại ngay (UI-PROJ-01-21) | [x] |
| T15 | `ProjectList.tsx`: "chọn tất cả trang này" disable TRƯỚC khi click nếu `(chưa chọn trên trang) + (đã chọn)` > 10 — không tự động chỉ chọn 10 dòng đầu (UI-PROJ-01-22) | [x] |
| T16 | Test: checkbox selection giữ khi đổi trang/filter trong cùng phiên, nút Export disable/enable đúng, gọi đúng `project_ids`, checkbox tự khoá/mở đúng ở mốc 10, "chọn tất cả trang này" disable đúng khi trang > phần còn trống | [x] |

## Docs / Spec

| # | Task | Trạng thái |
|---|------|------------|
| T17 | Sau khi deploy + user xác nhận: tạo `specs/export.md` từ `delta-spec.md` mục 1 (EXPORT-01..11) | [ ] |
| T18 | Fold UI-PROJ-01-19..22 vào `specs/projects-ui.md` (mục layout + changelog) | [ ] |
| T19 | Archive ticket vào `changes/_archive/` | [ ] |

## Ghi chú

- Thứ tự khuyến nghị: T1-T4 (nền tảng) → T5-T7 (backend logic) song song
  T9-T10 (infra) → T11-T16 (frontend) → T8 (test backend, có thể làm
  song song ngay sau T5-T6) → T17-T19 (fold, chỉ làm sau khi deploy +
  test OK).
- T2 đã chốt (2026-08-20) — `backend/app/export/assets/template.pptx`,
  16:9, dùng blank layout + text box/shape đặt tên thủ công (không dùng
  Slide Layout placeholder chuẩn). Tên shape để T5 map field:
  `field_project_name`, `field_type_badge_1`, `field_status_badge`,
  `field_description` (auto-shrink), `field_meta` (業種/期間/人数/総人月
  gộp 1 textbox, xuống dòng bằng `\n`), `img_slot_1..4`, `field_tech_badge_1..2`,
  `field_phase_badge_1..2`, `field_outcome_note` (auto-shrink). Số lượng
  badge 技術/開発工程 trong template chỉ là VÍ DỤ (2 badge mỗi loại) — T5
  cần tự tạo thêm/xoá bớt shape badge tại runtime theo số lượng thực tế
  của `technologies`/`dev_process_phases` (copy style từ badge mẫu đầu
  tiên), không giới hạn cứng 2.
- **T1-T16 hoàn tất (2026-08-20)**, code song song qua 2 agent (backend
  + frontend, infra làm trực tiếp) trên cùng branch:
  - Backend: `test_export.py`/`test_service.py` mới + test S3/attachment
    cập nhật; `pytest` toàn bộ: 109 passed / 15 failed — đúng baseline
    data cũ có sẵn (không phải regression, đã verify không liên quan
    code mới); `ruff check` sạch.
  - Frontend: `vitest run` 171/171 pass, `npm run build` sạch, prettier
    sạch (verify qua worktree riêng).
  - Quyết định khác hướng dẫn ban đầu (backend): nhân bản slide bằng
    `add_slide(layout Blank)` + deepcopy toàn bộ shape từ slide mẫu
    (thay vì mở lại `Presentation` nhiều lần); thêm
    `list_attachment_s3_keys()` riêng (AttachmentOut không có s3_key).
  - Quyết định khác hướng dẫn ban đầu (frontend): `ProjectCard` tự bảo
    vệ logic disable (`selectionDisabled && !selected`) để checkbox đã
    chọn không bị khoá nhầm khi đạt giới hạn 10.
  - CHƯA deploy — chờ T17-T19 sau khi user xác nhận test production OK.
