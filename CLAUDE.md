# CLAUDE.md — Constitution của dự án

> File này là NGUYÊN TẮC BẤT BIẾN, luôn được AI agent (Claude Code, Cursor...) nạp
> vào context đầu tiên, bất kể đang làm task nào. Chỉ sửa file này khi có quyết
> định ảnh hưởng TOÀN dự án — không dùng để ghi chi tiết 1 feature.
>
> Quy ước: mỗi mục dùng EARS notation ("The system shall...") để AI đọc không
> phải đoán, và có thể sinh test/checklist trực tiếp từ đó.

## 1. Bối cảnh dự án

- **Tên dự án**: <tên hệ thống>
- **Khách hàng**: <tên khách hàng>
- **Stack chính**: <Flutter / Web / AWS / ...>
- **Repo**: <đường dẫn repo>
- **Ngôn ngữ giao tiếp với khách hàng**: 日本語 (tài liệu 提案書/見積書/テスト仕様書 viết tiếng Nhật)
- **Ngôn ngữ code/comment**: <English/Tiếng Việt>

## 2. Nguyên tắc kỹ thuật bất biến

<!-- Ví dụ mẫu, thay bằng nguyên tắc thật của dự án -->

- The system shall use <ngôn ngữ/framework> version <X> or higher.
- The system shall not introduce a runtime dependency that has not been
  updated in the last 12 months.
- The system shall enforce lint/format rules defined in `<config file>`
  before merge.
- The system shall not lower existing test coverage on any pull request.
- The system shall log all external API calls with request/response status
  for traceability (yêu cầu audit của khách hàng Nhật).

## 3. Design system (UI)

- The system's visual identity (color, typography, spacing, component
  style) lives in `DESIGN.md` at project root — theo format chuẩn
  `google-labs-code/design.md`.
- The AI agent shall read `DESIGN.md` before generating or modifying any
  UI code, and shall not invent colors/fonts/spacing values outside what
  is defined there.
- Nếu cần 1 giá trị design chưa có trong `DESIGN.md` (màu mới, component
  mới...), the AI agent shall cập nhật `DESIGN.md` trước, không hardcode
  giá trị trực tiếp trong code UI.
- `DESIGN.md` chỉ mô tả token/style của component ở mức atomic (nút này
  trông thế nào). Layout/hành vi/state của TỪNG màn hình/chức năng cụ thể
  được mô tả riêng trong `specs/<module>-ui.md` (xem mục 5).
- Trước khi merge thay đổi UI, chạy `npx @google/design.md lint DESIGN.md`
  để kiểm tra token hợp lệ và tương phản WCAG.
- The system shall NOT accept a code value that contradicts `DESIGN.md`.
  Nếu code và file lệch nhau, phải sửa 1 trong 2 để khớp lại trước khi
  merge — không được để cả hai cùng tồn tại khác nhau.

## 4. Quy ước tổ chức spec (áp dụng cho toàn dự án)

- The system's specification lives in `specs/` (current truth — trạng thái
  đã chốt, đã merge) and `changes/` (đề xuất/thay đổi đang thực hiện).
- Every change shall be tracked using the ticket ID from Backlog
  (vd: `changes/TICKET-123-add-2fa/`) để trace ngược lại ticket gốc.
- Every `changes/<ticket-id>/` folder shall contain at minimum
  `delta-spec.md` and `tasks.md`. `proposal.md` and `plan.md` are optional,
  required only for Medium/Large changes (xem mục 6).
- When a change is merged, its `delta-spec.md` shall be folded into the
  corresponding file under `specs/`, and the `changes/<ticket-id>/` folder
  shall be moved to `changes/_archive/`.

## 5. Quy ước tổ chức UI feature spec

- Layout, trạng thái màn hình (loading/error/empty...), và hành vi tương
  tác của TỪNG chức năng cụ thể được viết trong `specs/<module>-ui.md`
  (hoặc mục `## UI` trong `specs/<module>.md` nếu module đơn giản).
- UI feature spec tham chiếu ngược lại token trong `DESIGN.md`, không lặp
  lại giá trị màu/font cụ thể.

## 6. Phân loại độ lớn thay đổi (Change Sizing)

| Size  | Tiêu chí                                              | File bắt buộc                              |
|-------|--------------------------------------------------------|---------------------------------------------|
| Small | Fix bug, đổi 1 field/UI nhỏ, < nửa ngày công          | `delta-spec.md`, `tasks.md`                 |
| Medium| Thêm tính năng trong module có sẵn                    | + `proposal.md`                             |
| Large | Tính năng mới ảnh hưởng nhiều module / đổi kiến trúc  | + `proposal.md`, `plan.md` (cần duyệt trước khi vào `tasks.md`) |

## 7. Quy tắc viết acceptance criteria

- The system's acceptance criteria shall be written in EARS notation:
  `[Điều kiện/trigger] the system shall [hành vi mong đợi]`.
- Every acceptance criterion shall be traceable to at least one test case
  (unit/integration/manual test theo format Excel test case của dự án).
- Ambiguous verbs (vd: "nhanh", "thân thiện", "ổn định") shall be replaced
  with measurable criteria (vd: "phản hồi trong < 2s với 100 concurrent user").

## 8. Không được làm gì (Explicit non-goals / cấm)

- The AI agent shall NOT modify files under `specs/` directly without a
  corresponding entry in `changes/`.
- The AI agent shall NOT invent business requirements not present in
  `proposal.md` / `delta-spec.md` — nếu thiếu thông tin, phải hỏi lại.
- The AI agent shall NOT delete or rewrite historical folders under
  `changes/_archive/`.
- The AI agent shall NOT modify `DESIGN.md` casually while implementing a
  feature — thay đổi design token là quyết định riêng, cần được ghi trong
  `changes/<ticket-id>/delta-spec.md` như mọi thay đổi khác nếu ảnh hưởng
  nhiều màn hình.

## 9. Liên hệ / người chốt quyết định

- **Product/Business owner**: <tên/role>
- **Technical owner**: <tên/role>
- **Khách hàng phía Nhật (liên hệ nếu cần confirm requirement)**: <tên/role>
