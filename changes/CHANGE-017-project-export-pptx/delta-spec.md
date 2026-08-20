# Delta Spec — CHANGE-017-project-export-pptx

- **Ticket ID**: CHANGE-017-project-export-pptx
- **Module bị ảnh hưởng**: `specs/export.md` (MỚI — module chưa tồn
  tại), `specs/projects-ui.md` (thêm nhỏ vào màn List)
- **Loại thay đổi**: ☑ Thêm mới &nbsp; ☐ Sửa &nbsp; ☐ Xoá

## 1. Yêu cầu thay đổi (EARS notation)

### `specs/export.md` (MỚI — toàn bộ mục dưới đây là nội dung khởi tạo file)

- **[EXPORT-01] (MỚI)** The List screen shall allow the user to select
  one or more projects via checkbox, independent of `list`/`card` view
  mode (UI-PROJ-01-19, xem mục dưới).

- **[EXPORT-02] (MỚI)** When 1 or more projects are selected, the List
  toolbar shall show an "Export" button; clicking it shall call
  `POST /projects/export` with `{project_ids: [...]}`.

- **[EXPORT-03] (MỚI)** The system shall reject an export request where
  `project_ids` is empty or contains more than **10** items, responding
  `400 Bad Request` with a message indicating the limit.

- **[EXPORT-04] (MỚI)** The system shall respond `404 Not Found` (listing
  the missing ids) if any `project_id` in the request does not exist or
  is soft-deleted.

- **[EXPORT-05] (MỚI)** For each valid project, the system shall render
  exactly 1 slide into the export presentation, using the pre-designed
  template (`backend/app/export/assets/template.pptx`) and the field
  mapping in mục 2 dưới đây.

- **[EXPORT-06] (MỚI)** The system shall NOT include `customer_name`,
  `source_note`, or `team_composition_note` anywhere in the exported
  slide (bảo mật — xem `proposal.md` mục 2/3).

- **[EXPORT-07] (MỚI)** For the image region of a slide, the system
  shall embed at most the first 4 attachments of the project (ordered
  as returned by `list_attachments()`, i.e. thứ tự upload); if the
  project has 0 attachments, the image region shall render empty
  (không lỗi).

- **[EXPORT-08] (MỚI)** For the `概要`/`成果・課題・解決策` text
  regions, the system shall enable PowerPoint's "shrink text on
  overflow" behavior so long text reduces font size instead of
  overflowing the frame; the `project_name` title region shall NOT have
  this behavior (cỡ chữ cố định).

- **[EXPORT-09] (MỚI)** On success, the system shall respond
  `200 OK` with `{download_url: string, expires_in: 900}` — `download_url`
  is a presigned S3 GET URL (tái dùng
  `app.core.s3.generate_presigned_get_url`), pointing to the generated
  `.pptx` object stored under S3 prefix `exports/`.

- **[EXPORT-10] (MỚI)** The system shall set the exported S3 object's
  `Content-Disposition` to `attachment; filename="projects_export_<
  timestamp>.pptx"` so the browser downloads it with a sensible file
  name instead of navigating to it.

- **[EXPORT-11] (MỚI)** The S3 bucket shall have a lifecycle rule
  deleting objects under prefix `exports/` after **1 day**.

### `specs/projects-ui.md` (bổ sung nhỏ, tiếp UI-PROJ-01-18)

- **[UI-PROJ-01-19] (MỚI)** The List screen shall render a checkbox per
  row/card, plus a "select all on this page" checkbox in the toolbar;
  selection state shall persist while paginating/filtering within the
  same session (không cần lưu `localStorage`).

- **[UI-PROJ-01-20] (MỚI)** The List toolbar shall show an "Export"
  button, disabled when no project is selected; while an export request
  is in flight, the button shall show a loading state and be disabled
  to prevent duplicate requests.

- **[UI-PROJ-01-21] (MỚI)** When exactly 10 projects are selected, the
  system shall disable every currently-unchecked checkbox (row/card and
  "select all on this page") and show a message near the toolbar
  indicating the 10-project limit, so the user cannot select an 11th
  project client-side — chặn ở UI trước, backend (`EXPORT-03`) vẫn giữ
  nguyên validate lại (defense-in-depth, không tin tưởng riêng UI).
  Bỏ chọn 1 project sẽ mở khoá lại các checkbox còn lại ngay lập tức.

- **[UI-PROJ-01-22] (MỚI)** The "select all on this page" checkbox shall
  be disabled (chặn TRƯỚC khi click, không phải sau) whenever checking
  it would push the total selection above 10 — cụ thể: disabled khi
  `(số dòng CHƯA chọn trên trang hiện tại) + (số đã chọn) > 10` (ví dụ:
  page size 20, chưa chọn gì → "chọn tất cả trang này" bị disable ngay
  vì 20 > 10). Kèm message giải thích giống UI-PROJ-01-21, KHÔNG cho
  phép hành vi "tự động chỉ chọn 10 dòng đầu của trang rồi bỏ qua phần
  còn lại" (tránh chọn ngầm không rõ ràng dòng nào bị bỏ qua).

## 1b. Thay đổi Data Model (nếu có)

- Không có — không thêm/sửa entity/bảng nào (chỉ đọc dữ liệu có sẵn của
  module `projects`). Không động vào `specs/data-model.md`.

## 2. Field mapping (template slide) — tham chiếu, không lặp lại ở nơi khác

| Vùng trên slide | Field nguồn | Ghi chú |
|---|---|---|
| Title | `project_name` | Cỡ chữ cố định, không auto-shrink |
| Badge cạnh title | `project_types`, `is_ongoing` | Badge 種別 + trạng thái 進行中/終了 |
| 概要 | `description` | Auto-shrink nếu dài |
| 業種 / 期間 / 人数 / 総人月 | `industry`, `formatPeriod()`, `team_size`, `total_man_month` | "—" nếu null, dùng chung `formatPeriod` đã có ở FE (BE tự format lại tương đương) |
| Ảnh (2×2) | 4 attachment đầu tiên | Trống nếu không có ảnh |
| 技術 / 開発工程 | `technologies`, `dev_process_phases` | Badge ngang |
| 成果・課題・解決策 | `outcome_note` | Auto-shrink nếu dài |
| **KHÔNG hiển thị** | `customer_name`, `source_note`, `team_composition_note` | Bảo mật / không cần thiết cho slide tóm tắt |

## 3. Acceptance criteria / Test mapping

| ID | Test case tương ứng (file/tên) |
|----|----------------------------------|
| EXPORT-03 | `test_export_rejects_empty_or_over_10_ids` |
| EXPORT-04 | `test_export_404_when_project_id_missing` |
| EXPORT-05/07 | `test_build_presentation_one_slide_per_project_max_4_images` |
| EXPORT-06 | `test_build_presentation_excludes_customer_name_and_notes` |
| EXPORT-09/10 | `test_export_route_returns_presigned_download_url` |
| UI-PROJ-01-19 | `test_project_list_checkbox_selection` |
| UI-PROJ-01-20 | `test_project_list_export_button_disabled_states` |
| UI-PROJ-01-21 | `test_project_list_disables_checkboxes_at_10_selected` |
| UI-PROJ-01-22 | `test_project_list_select_all_disabled_when_page_would_exceed_10` |

## 4. Ghi chú cho AI agent khi implement

- Module mới `backend/app/export/` — KHÔNG sửa `app/projects/routes.py`
  hiện có, chỉ import `app.projects.repository` để đọc dữ liệu (giữ
  đúng chiều dependency đã quyết ở `plan.md`).
- Thêm `get_object_bytes()` vào `app/core/s3.py` (không đổi hàm cũ).
- Frontend: thêm state selection vào `ProjectList.tsx` hiện có — KHÔNG
  tạo trang mới.
- Test S3/pptx service nên dùng file template thật (nhỏ, tạo riêng cho
  test hoặc dùng chung `assets/template.pptx`) — không mock nội dung
  `python-pptx` (dễ false-positive), chỉ mock `app.core.s3` (boto3
  client) như các test attachment hiện có.
