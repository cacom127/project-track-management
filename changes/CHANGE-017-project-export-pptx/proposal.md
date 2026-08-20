# Proposal — Export dự án ra PowerPoint

- **Ticket ID**: CHANGE-017-project-export-pptx
- **Size**: Large
- **Người đề xuất**: namlp
- **Ngày**: 2026-08-20

## 1. Vấn đề / lý do cần thay đổi

Hiện tại dữ liệu 実績 (thành tích dự án) chỉ xem được trên web (List/
Detail). Khi cần trình bày cho khách hàng/đối tác (báo cáo BU, hồ sơ
năng lực...), người dùng phải tự copy thông tin từng dự án sang
PowerPoint thủ công — mất thời gian, dễ sai lệch định dạng, không nhất
quán giữa các lần làm.

## 2. Mục tiêu (Goal)

- Người dùng chọn được 1 hoặc nhiều dự án từ màn List, bấm "Export" và
  nhận về 1 file `.pptx` — mỗi dự án là 1 slide, theo layout cố định đã
  thiết kế sẵn (xem mục "Layout" bên dưới), không cần chỉnh sửa thủ công
  sau khi export.
- File xuất ra không chứa thông tin định danh khách hàng
  (`customer_name`) — yêu cầu bảo mật, vì file có thể được chia sẻ ra
  ngoài team.

## 3. Layout slide (đã chốt qua brainstorm)

Mỗi dự án 1 slide, khổ 16:9:

```
┌────────────────────────────────────────────────────────────┐
│ [project_name — bold, lớn, cỡ chữ CỐ ĐỊNH, không auto-shrink] │
│ [種別 badge]  [進行中 / 終了]                                 │
├───────────────────────────────┬──────────────────────────────┤
│ 概要 (auto-shrink nếu dài)     │  4 ảnh đầu tiên (2x2 grid),   │
│                                 │  dư ảnh không đưa vào slide  │
│ 業種 / 期間 / 人数 / 総人月     │                               │
├───────────────────────────────┴──────────────────────────────┤
│ 技術 (badge)   開発工程 (badge)                                │
├────────────────────────────────────────────────────────────┤
│ 成果・課題・解決策 (auto-shrink nếu dài)                       │
└────────────────────────────────────────────────────────────┘
```

- **Field đưa vào slide**: `project_name`, `project_types` (種別),
  `is_ongoing` (trạng thái), `description` (概要), `industry` (業種),
  `formatPeriod` (期間), `team_size`/`total_man_month`, `technologies`
  (技術), `dev_process_phases` (開発工程), `outcome_note`
  (成果・課題・解決策), tối đa 4 ảnh đầu (theo thứ tự upload).
- **Field KHÔNG đưa vào slide**: `customer_name` (bảo mật),
  `source_note` (確認元メモ — ghi chú nội bộ), `team_composition_note`
  (chi tiết đội hình — quá dài cho slide tóm tắt).

## 4. Ngoài phạm vi (Non-goals)

- Không cho phép người dùng tự tuỳ biến layout/template qua UI (layout
  cố định 1 mẫu, sửa layout = sửa code/template, không phải tính năng
  runtime).
- Không hỗ trợ export sang định dạng khác (PDF, Word...) trong ticket
  này.
- Không xử lý dự án có nhiều hơn 4 ảnh bằng cách tạo slide phụ (chỉ lấy
  4 ảnh đầu, xem mục 3).
- Không thêm cơ chế theo dõi lịch sử export (ai export lúc nào).

## 5. Ảnh hưởng

- **Module mới: `export`** — feature này tách riêng khỏi `projects`
  (xem thảo luận, quyết định ghi tại `plan.md` mục 2):
  - `specs/export.md` (mới): EARS cho chọn nhiều dự án, endpoint export,
    layout mapping, quy tắc field ẩn/auto-shrink.
  - Data ownership KHÔNG đổi — `Project`/`Attachment` vẫn do module
    `projects` sở hữu (`specs/data-model.md`), không tạo entity/bảng
    mới; `export` chỉ đọc qua repository của `projects`.
  - `specs/projects-ui.md`: chỉ thêm phần nhỏ (checkbox chọn dòng + nút
    Export trên toolbar List) — vì đó là thay đổi UI của màn List đã
    tồn tại.
  - Backend: package mới `backend/app/export/` (router + service render
    pptx), import từ `app.projects.repository`, không đảo chiều
    dependency.
- Ảnh hưởng khách hàng Nhật cần thông báo trước: Không (tính năng nội
  bộ, không đổi hành vi hiện có).
- Ảnh hưởng dữ liệu hiện có (migration): Không — chỉ đọc dữ liệu hiện
  có, không đổi schema.
- Thêm asset mới vào repo: 1 file `.pptx` template (thiết kế sẵn layout
  ở mục 3) — cần lưu ở đâu trong repo/deploy sẽ quyết định ở `plan.md`.

## 6. Phương án thay thế đã xem xét

- **Render phía frontend (JS, vd `pptxgenjs`) thay vì backend
  Python**: cân nhắc nhưng backend đã có sẵn `python-pptx`-style xử lý
  quen thuộc (đã dùng khi import dữ liệu từ PPTX gốc đầu dự án), và ảnh
  đính kèm đang lưu ở S3 — backend fetch ảnh trực tiếp từ S3 nội bộ gọn
  hơn là để frontend tải ảnh qua presigned URL rồi nhúng vào JS. Chọn
  backend.
- **Trả file trực tiếp trong response API (đồng bộ) vs. tạo job async +
  tải qua S3 presigned URL**: còn để ngỏ, sẽ quyết định ở `plan.md` dựa
  trên giới hạn thời gian/kích thước response của Lambda khi export
  nhiều dự án cùng lúc.
