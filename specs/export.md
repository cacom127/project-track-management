# Module: Export — Current Truth

> File này mô tả TRẠNG THÁI HIỆN TẠI đã chốt của module `export`.
> Không ghi ở đây các đề xuất đang bàn — những cái đó thuộc về `changes/`.

## 1. Mục đích module

Cho phép người dùng chọn 1-10 dự án từ màn List (module `projects`) và
xuất ra 1 file PowerPoint (`.pptx`) — mỗi dự án 1 slide, theo layout cố
định thiết kế sẵn (`backend/app/export/assets/template.pptx`). Tính
năng bổ sung ở `CHANGE-017-project-export-pptx`, phục vụ trình bày báo
cáo/hồ sơ năng lực cho khách hàng/đối tác.

Module này **không sở hữu entity/bảng dữ liệu nào** — chỉ đọc dữ liệu
có sẵn qua `app.projects.repository` (module `projects` vẫn là chủ sở
hữu duy nhất của `Project`/`Attachment`, xem `specs/data-model.md` mục
2). Tách thành module riêng (spec + code `backend/app/export/`) vì đây
là 1 capability độc lập với CRUD, không muốn làm phình `specs/
projects.md` (module lõi, ít nên đổi).

## 2. Yêu cầu hiện tại (Requirements — EARS notation)

- **[EXPORT-01]** The List screen shall allow the user to select one or
  more projects via checkbox, independent of `list`/`card` view mode
  (xem `specs/projects-ui.md` UI-PROJ-01-19..23 cho hành vi UI chi
  tiết).

- **[EXPORT-02]** When 1 or more projects are selected, the List
  header shall show a "出力" button (xem UI-PROJ-01-20); confirming the
  dialog (UI-PROJ-01-23) calls `POST /projects/export` with
  `{project_ids: [...]}`.

- **[EXPORT-03]** The system shall reject an export request where
  `project_ids` is empty or contains more than **10** items, responding
  `400 Bad Request` with a message indicating the limit. UI chặn trước
  ở phía client (UI-PROJ-01-21/22) nhưng backend luôn validate lại
  (defense-in-depth, không tin tưởng riêng UI).

- **[EXPORT-04]** The system shall respond `404 Not Found` (listing the
  missing ids) if any `project_id` in the request does not exist or is
  soft-deleted.

- **[EXPORT-05]** For each valid project, the system shall render
  exactly 1 slide into the export presentation, using the pre-designed
  template (`backend/app/export/assets/template.pptx`) and the field
  mapping in mục 3. Mỗi project được nhân bản từ 1 slide mẫu gốc
  (`copy.deepcopy` toàn bộ shape — `python-pptx` không có
  `duplicate_slide()` sẵn); slide mẫu gốc bị xoá sau khi xử lý xong tất
  cả project.

- **[EXPORT-06]** Badge rows (種別+trạng thái ở header, 技術, 開発工程)
  shall size each badge by its actual text length (tính riêng theo loại
  ký tự — CJK rộng hơn Latin) and wrap onto additional lines when a row
  exceeds its allotted horizontal width — KHÔNG dùng chiều rộng cố định
  của badge mẫu. 技術 và 開発工程 hiển thị thành **2 cột song song nằm
  ngang nhau** (không phải trên-dưới), mỗi cột tự xuống dòng độc lập.
  Mọi phần tử tĩnh phía dưới 1 hàng/cột badge (divider, label,
  `field_outcome_note`) tự đặt lại vị trí theo số dòng badge thực tế
  của slide đó.

- **[EXPORT-07]** The system shall NOT include `customer_name`,
  `source_note`, or `team_composition_note` anywhere in the exported
  slide — phù hợp với ràng buộc chung `customer_name` là dữ liệu bảo
  mật khi xuất ra ngoài hệ thống (`specs/data-model.md` mục 4).

- **[EXPORT-08]** For the image region of a slide, the system shall
  embed at most the first 4 attachments of the project (ordered as
  returned by `list_attachments()`, i.e. thứ tự upload); if the project
  has 0 attachments, the image region shall render empty (không lỗi).

- **[EXPORT-09]** For `概要`/`成果・課題・解決策`/
  `業種・期間・人数・総人月`, the system shall enable PowerPoint's
  "shrink text on overflow" (`TEXT_TO_FIT_SHAPE`) so long text reduces
  font size instead of overflowing/phình khung; `project_name` (title)
  shall use `NONE` (cỡ chữ cố định, KHÔNG phình KHÔNG co — vẫn có rủi ro
  tồn dư nếu tên dự án cực dài, đây là đánh đổi cố ý).

- **[EXPORT-10]** On success, the system shall respond `200 OK` with
  `{download_url: string, expires_in: 900}` — `download_url` là 1
  presigned S3 GET URL (tái dùng `app.core.s3.generate_presigned_get_url`),
  trỏ tới object `.pptx` vừa tạo trong S3 prefix `exports/`.

- **[EXPORT-11]** The system shall set the exported S3 object's
  `Content-Disposition` thành `attachment; filename="projects_export_
  <timestamp>.pptx"` để browser tải xuống với tên file hợp lý thay vì
  điều hướng tới URL.

- **[EXPORT-12]** The S3 bucket (bucket attachments hiện có, prefix
  riêng) shall have a lifecycle rule xoá object dưới prefix `exports/`
  sau **1 ngày** — file export chỉ dùng 1 lần để tải xuống, không cần
  lưu lâu.

## 3. Field mapping (template slide)

| Vùng trên slide | Field nguồn | Ghi chú |
|---|---|---|
| Title | `project_name` | Cỡ chữ cố định, không auto-shrink (EXPORT-09) |
| Badge cạnh title | `project_types`, `is_ongoing` | Badge 種別 (rộng theo text) + trạng thái 進行中/終了 |
| 概要 | `description` | Auto-shrink nếu dài |
| 業種 / 期間 / 人数 / 総人月 | `industry`, `formatPeriod()`, `team_size`, `total_man_month` | "—" nếu null; auto-shrink nếu dài |
| Ảnh (2×2) | 4 attachment đầu tiên | Trống nếu không có ảnh |
| 技術 / 開発工程 | `technologies`, `dev_process_phases` | 2 cột song song, mỗi cột tự xuống dòng độc lập theo độ dài text |
| 成果・課題・解決策 | `outcome_note` | Auto-shrink nếu dài |
| **KHÔNG hiển thị** | `customer_name`, `source_note`, `team_composition_note` | Bảo mật / không cần thiết cho slide tóm tắt |

## 4. Ràng buộc kỹ thuật đã chốt

- **Đồng bộ hoàn toàn, không job/queue** — API Gateway (HTTP API v2)
  có trần cứng ~29s cho integration timeout, không thể chờ vô hạn; giới
  hạn 10 dự án/lần export giữ xử lý an toàn trong ngân sách này.
- **Trả `{download_url}` (JSON) qua S3 presigned GET, KHÔNG trả file
  trực tiếp trong response** — tránh phải xử lý payload nhị phân qua
  API Gateway/Mangum, tái dùng đúng pattern đã có cho attachment
  (`CHANGE-011`).
- **Template `.pptx` lưu trong repo** (`backend/app/export/assets/
  template.pptx`), đóng gói cùng Lambda — không cần S3/DB riêng cho
  template; version đi cùng code (map field↔shape name phải khớp
  version template).
- Module `backend/app/export/` chỉ import từ `app.projects.repository`
  để đọc dữ liệu — KHÔNG đảo chiều dependency (module `projects` không
  biết tới `export`).
- **Không viết file tạm ra `/tmp`** — dùng `io.BytesIO` cho template,
  ảnh, và file kết quả (quy mô nhỏ: ≤10 slide, ≤40 ảnh/lần export).

## 5. Data Model

Không có — module này không sở hữu entity/bảng nào. Chỉ đọc
`Project`/`Attachment` (sở hữu bởi `projects`, xem `specs/projects.md`
mục Data Model) qua repository có sẵn.

## 6. UI

Hành vi UI (checkbox chọn, nút 出力, dialog xác nhận, giới hạn 10): xem
`specs/projects-ui.md` mục UI-PROJ-01-19..23 (thuộc màn List, module
`projects`).

## 7. Lịch sử thay đổi module này

| Ngày | Ticket ID | Thay đổi |
|------|-----------|----------|
| 2026-08-21 | CHANGE-017-project-export-pptx | Khởi tạo module: export N dự án ra `.pptx` theo template cố định (EXPORT-01..12) |
