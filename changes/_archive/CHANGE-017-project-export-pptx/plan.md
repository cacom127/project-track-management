# Plan — Export dự án ra PowerPoint

- **Ticket ID**: CHANGE-017-project-export-pptx
- **Dựa trên**: `proposal.md` cùng thư mục

## 1. Kiến trúc / thiết kế kỹ thuật

**Module mới `export`** (tách khỏi `projects`, xem `proposal.md` mục 5):

```
backend/app/export/
  __init__.py
  routes.py        # POST /projects/export
  service.py       # build_presentation(projects, attachments) -> bytes
  assets/
    template.pptx   # file mẫu thiết kế sẵn layout, đóng gói cùng Lambda
```

**Luồng dữ liệu (đồng bộ hoàn toàn, không job/queue):**

```
FE: chọn N dự án trên List (checkbox) → POST /projects/export {project_ids: [...]}
  → BE (app/export/routes.py):
     1. Validate: 1 <= len(project_ids) <= 10, tất cả tồn tại (404 nếu thiếu id nào)
     2. Với mỗi id: app.projects.repository.get_project() + list_attachments()
     3. app.export.service.build_presentation(): mở template.pptx, với mỗi
        project add_slide() theo layout đã chốt, fetch tối đa 4 ảnh đầu qua
        app.core.s3.get_object_bytes() (MỚI), add_picture() từ BytesIO
     4. Upload file kết quả lên S3 (prefix riêng exports/, key theo uuid),
        set ContentDisposition: attachment; filename="projects_export_*.pptx"
     5. Trả JSON {download_url, expires_in} qua
        app.core.s3.generate_presigned_get_url() (tái dùng, không cần API mới)
  → FE: nhận download_url, trigger download (window.location.href = url)
```

**Vì sao KHÔNG trả file trực tiếp trong response API** (đã cân nhắc ở
proposal mục 6): trả binary qua API Gateway REST + Mangum cần cấu hình
`binaryMediaTypes` và xử lý base64 hai chiều — phức tạp và dễ lỗi hơn
nhiều so với tái dùng pattern presigned URL đã chạy ổn định (đính kèm
ảnh, `CHANGE-011`). Chọn: build file → upload S3 → trả URL.

## 2. Quyết định kỹ thuật quan trọng

| Quyết định | Lý do |
|---|---|
| Đồng bộ hoàn toàn (không job/queue), nhưng giới hạn **tối đa 10 dự án/lần export** | API Gateway có trần cứng 29s cho integration timeout (không thể tăng), không thể chờ vô hạn. 10 dự án × (fetch DB + tối đa 4 ảnh + render slide) nằm an toàn trong ngân sách này; nếu client gửi > 10 → trả 400 rõ ràng thay vì để timeout mơ hồ. |
| Trả `{download_url}` (JSON) qua S3 presigned GET, KHÔNG trả file trực tiếp trong response | Tránh phải cấu hình `binaryMediaTypes` cho API Gateway + Mangum; tái dùng pattern đã có (`generate_presigned_get_url`, dùng cho attachment). |
| Template `.pptx` lưu trong repo (`backend/app/export/assets/template.pptx`), đóng gói cùng Lambda | File nhỏ, tĩnh, không đổi theo runtime — không cần S3/DB riêng, versioning qua git như code. |
| Thêm `get_object_bytes(s3_key) -> bytes` vào `app/core/s3.py` | Cần đọc nội dung ảnh nhị phân để nhúng vào slide (`add_picture` nhận file-like object) — chưa có hàm đọc object hiện có (chỉ có presign PUT/GET). |
| Không viết file tạm ra `/tmp`, dùng `io.BytesIO` toàn bộ (template, ảnh, file kết quả) | Lambda `/tmp` có giới hạn dung lượng + tồn tại giữa các lần invoke (rủi ro rác) — giữ trong memory đơn giản hơn cho quy mô file nhỏ (≤10 slide, ≤40 ảnh). |
| File export lưu ở S3 prefix riêng `exports/`, thêm **lifecycle rule tự xoá sau 1 ngày** | File export chỉ dùng 1 lần để download, không cần lưu lâu — tránh tích tụ rác trên S3 theo thời gian (infra: thêm rule vào bucket `AttachmentsBucket` hiện có trong CDK stack, không tạo bucket mới). |
| Danh sách 4 ảnh/dự án lấy theo thứ tự `list_attachments()` hiện có (thứ tự upload) | Tái dùng logic có sẵn, không cần thêm cột `sort_order`. |

## 3. Rủi ro / đánh đổi (trade-off)

- **Timeout nếu ảnh quá nặng**: 10 dự án × 4 ảnh gốc (không resize) có thể
  chậm nếu ảnh gốc rất lớn. Giảm thiểu: nếu qua kiểm thử thực tế thấy gần
  ngưỡng 29s, cân nhắc resize ảnh khi nhúng (`python-pptx` chèn theo
  width/height cố định của khung — không cần ảnh gốc full-size, có thể
  downscale trước khi add_picture để giảm thời gian xử lý + dung lượng
  file .pptx).
- **UX chờ đồng bộ**: người dùng phải chờ trên UI trong lúc BE xử lý
  (không có progress bar từng bước) — FE cần disable nút + hiện spinner
  cho tới khi có `download_url`.
- **Giới hạn 10 dự án** là cứng, không cấu hình được qua UI — nếu sau này
  cần export nhiều hơn, phải quay lại kiến trúc async (job + S3 +
  polling/notify), đây sẽ là 1 ticket riêng, không mở rộng phạm vi ở đây.

## 4. Migration / rollback

- Cần migration dữ liệu: **Không** — không đổi DB schema.
- Infra: thêm 1 lifecycle rule S3 cho prefix `exports/` (CDK) — rollback
  bằng cách xoá rule đó, không ảnh hưởng dữ liệu đã có.
- Rollback tính năng: revert code deploy (route mới, không đụng route
  cũ) — không có bước dọn dữ liệu cần thiết.

## 5. Định nghĩa "Done" cho bước Plan này

- [ ] Đã xác nhận thiết kế với Technical owner (namlp)
- [ ] Đã cập nhật `delta-spec.md` tương ứng với thiết kế này
