# Proposal — Bổ sung field cho dự án (industry/outcome/dev process) phục vụ import dữ liệu thật

- **Ticket ID**: CHANGE-012
- **Size**: Medium
- **Người đề xuất**: namlp
- **Ngày**: 2026-08-19

## 1. Vấn đề / lý do cần thay đổi

Chuẩn bị import dữ liệu 24 dự án thật từ file tổng hợp nội bộ
(`BU2_2025開発実績調査_内部用.pptx`, do sales phỏng vấn PM). File này có
3 nhóm thông tin schema hiện tại chưa lưu được, sẽ phải nhét chung vào
`description` nếu không bổ sung field — mất cấu trúc, khó tra cứu/thống
kê sau này: (1) ngành nghề khách hàng, (2) 課題・解決策・成果 (case
study — giá trị cốt lõi của "実績管理システム"), (3) giai đoạn SDLC mà
VNEXT phụ trách.

## 2. Mục tiêu (Goal)

- Thêm `industry` (ngành nghề khách hàng, free text).
- Thêm `outcome_note` (課題・解決策・成果, free text).
- Thêm `dev_process_phases` (giai đoạn SDLC phụ trách, catalog cố định
  đa chọn — giống pattern `project_types`).
- Mở rộng search List (`q`) bao phủ `industry`/`outcome_note`; thêm
  filter dropdown mới cho `dev_process_phases` (OR semantics, giống
  `project_type`).

## 3. Ngoài phạm vi (Non-goals)

- Không thêm cột mới vào bảng List (chỉ thêm search/filter, không đổi
  layout bảng — tránh rối, có thể làm ticket riêng nếu cần).
- Không làm tính năng import PPTX tự động trong app — import 24 dự án
  thật là việc làm 1 lần, qua script riêng ngoài codebase chính thức
  (không phải phần của ticket này).
- Không đổi catalog `project_types` hiện có.

## 4. Ảnh hưởng

- Module liên quan: `specs/projects.md`, `specs/projects-ui.md`.
- Có ảnh hưởng khách hàng Nhật cần thông báo trước không: Không.
- Có ảnh hưởng dữ liệu hiện có (migration) không: Có — thêm 2 cột
  (`industry`, `outcome_note`) + 2 bảng mới (`dev_process_phases`,
  `project_dev_process_phases`).

## 5. Phương án thay thế đã xem xét

- `dev_process_phases` dạng free text (giống `outcome_note`): bị loại
  theo yêu cầu Product owner — muốn catalog cố định để filter/thống kê
  được, tránh viết tự do không nhất quán (vd "テスト" vs "結合テスト" vs
  "システムテスト" đều nên quy về cùng 1 giá trị "テスト").
- Gộp `outcome_note` thành 3 field riêng (課題/解決策/成果): bị loại vì
  dữ liệu nguồn luôn viết liền mạch thành 1 đoạn narrative, tách nhỏ
  không mang lại giá trị tra cứu thêm (YAGNI).
