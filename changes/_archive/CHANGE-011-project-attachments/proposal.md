# Proposal — Ảnh đính kèm cho dự án

- **Ticket ID**: CHANGE-011
- **Size**: Medium
- **Người đề xuất**: namlp
- **Ngày**: 2026-08-19

## 1. Vấn đề / lý do cần thay đổi

Dự án thường có screenshot/diagram/tài liệu hình ảnh liên quan (kiến
trúc hệ thống, giao diện...) cần lưu kèm để tham khảo sau. Hiện tại
không có cách nào lưu ảnh gắn với 1 dự án cụ thể. Entity `Attachment`
đã được hoạch định sẵn trong `specs/data-model.md` (quan hệ
`PROJECT ||--o{ ATTACHMENT`) từ `CHANGE-002-architecture`, và hạ tầng S3
bucket riêng (`AttachmentsBucket`) đã tồn tại — chỉ chưa có field-level
schema/API/UI thật.

## 2. Mục tiêu (Goal)

- Upload được tối đa 10 ảnh (jpg/png/webp, ≤5MB/ảnh) cho 1 dự án, qua
  chọn file hoặc paste từ clipboard (Ctrl+V).
- Xem được ảnh dạng lightbox, xoá được từng ảnh.
- Thao tác được ở cả màn Tạo (trước khi project tồn tại — ảnh chỉ thật
  sự upload sau khi tạo project thành công) và Sửa/Chi tiết (project đã
  có `id`).

## 3. Ngoài phạm vi (Non-goals)

- Không hỗ trợ định dạng khác ngoài jpg/png/webp (không PDF/video...).
- Không có tính năng edit/crop/resize ảnh trong app.
- Không giữ lịch sử ảnh đã xoá (hard delete, khác hành vi soft-delete
  của `projects`).
- Không giới hạn quyền theo role (giữ đúng hiện trạng `PROJ-12`).

## 4. Ảnh hưởng

- Module liên quan: `specs/projects.md` (thêm entity `Attachment`),
  `specs/projects-ui.md`, `specs/architecture.md` (env var/CORS bucket).
- Có ảnh hưởng khách hàng Nhật cần thông báo trước không: Không.
- Có ảnh hưởng dữ liệu hiện có (migration) không: Có — bảng mới
  `attachments`.
- Có ảnh hưởng hạ tầng (CDK) không: Có — CORS cho S3 bucket, env var
  `ATTACHMENTS_BUCKET_NAME` cho Lambda, `CfnOutput` tên bucket.

## 5. Phương án thay thế đã xem xét

- Proxy bytes ảnh qua Lambda (upload thẳng vào body request) thay vì
  presigned URL: bị loại vì giới hạn payload API Gateway/Lambda (~6MB),
  và kiến trúc đã chốt sẵn "presigned URL" từ `CHANGE-002`
  (`specs/architecture.md` mục 1).
- Soft delete cho attachment (giống `projects`): bị loại vì ảnh không
  có giá trị tham chiếu lịch sử như dữ liệu dự án — hard delete đơn
  giản hơn, tránh rác S3 tích luỹ vô thời hạn.
