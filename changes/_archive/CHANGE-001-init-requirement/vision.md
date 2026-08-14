# Vision — 実績管理システム (Project Track Management)

> Tài liệu này đóng vai trò 要件定義書 tối thiểu cho dự án — vì hiện chưa có
> tài liệu yêu cầu chính thức nào khác. Nội dung dựa trên trao đổi trực tiếp
> giữa AI agent và Product/Business owner (namlp), chưa qua ticket Backlog
> chính thức (tạm dùng `CHANGE-001-init-requirement`).

## 1. Bối cảnh & vấn đề

- VNEXT JAPAN thực hiện nhiều dự án outsource/offshore cho khách hàng Nhật.
- Hiện chưa có nơi tập trung lưu trữ thông tin các dự án đã làm → khó
  thống kê, khó trích xuất dữ liệu để làm tài liệu tham khảo hoặc PR năng
  lực công ty khi cần.
- Đây là dự án thử nghiệm nội bộ (không phải sản phẩm bán cho khách hàng),
  nên ưu tiên chi phí hạ tầng thấp nhất có thể.

## 2. Mục tiêu

- Xây dựng 1 hệ thống web nội bộ để lưu trữ, tra cứu, thống kê thông tin
  các dự án đã/đang thực hiện với khách hàng Nhật.
- Phục vụ 2 mục đích chính:
  1. Tài liệu tham khảo nội bộ (tra cứu lại dự án cũ: quy mô, công nghệ,
     thời gian...).
  2. Trích xuất dữ liệu để làm PR/profile năng lực công ty.

## 3. Đối tượng sử dụng

- Nhân viên công ty (PM, BrSE, Dev...) — quy mô khoảng vài chục người.
- Dùng chung 1 hệ thống nội bộ, không phân quyền xem theo phòng ban/team —
  toàn công ty xem được hết dữ liệu dự án.
- Không có người dùng ngoài công ty; khách hàng không truy cập hệ thống này.

## 4. Phạm vi (Scope)

### Trong phạm vi (v1)

- CRUD thông tin dự án: tên khách hàng, tên dự án, mô tả khái quát, thời
  gian bắt đầu/kết thúc (hoặc đang tiếp diễn), quy mô (số người tham gia,
  tổng man-month), công nghệ sử dụng, loại hình dự án (có thể nhiều loại
  cùng lúc, vd vừa offshore vừa new_dev), file đính kèm (diagram/screenshot),
  nguồn xác nhận thông tin (source note).
- Phân quyền cơ bản: ai đã đăng nhập cũng tạo được dự án mới; chỉ người tạo
  hoặc admin mới sửa/xoá được.
- Ẩn tên khách hàng thật khi xuất dữ liệu ra ngoài hệ thống (export); hiển
  thị đầy đủ khi xem nội bộ.
- Thống kê/dashboard: theo năm, theo khách hàng, theo công nghệ, theo loại
  hình dự án, timeline các dự án theo thời gian.
- Đăng nhập nhiều user (Cognito), chưa cần SSO.
- Giao diện tiếng Nhật; kiến trúc phải sẵn sàng cho đa ngôn ngữ sau này mà
  không cần đổi schema/API (label dùng code cố định, dịch ở resource file
  phía frontend).
- Hạ tầng AWS, ưu tiên kiến trúc serverless để chi phí gần $0 khi không có
  người dùng.
- Môi trường: chỉ cần local (dev/test) + 1 môi trường production.

### Ngoài phạm vi (v1 — có thể làm sau, chưa quyết định chi tiết)

- Export dữ liệu ra PowerPoint theo template (ưu tiên thấp).
- SSO đăng nhập qua hệ thống công ty.
- Quản lý theo từng cá nhân nhân viên (ai từng tham gia dự án nào để tự
  xuất CV/profile riêng).
- Xây dựng thực tế đa ngôn ngữ tiếng Việt/Anh (v1 chỉ đảm bảo kiến trúc
  không cần đổi khi thêm ngôn ngữ, chưa build UI đa ngôn ngữ).
- Màn hình quản lý user/role riêng trong app — v1 dùng trực tiếp AWS
  Cognito Console để gán quyền admin (tần suất thay đổi thấp, vài chục
  người dùng không cần UI riêng).

## 5. Ràng buộc

- Ngân sách/hạ tầng: ưu tiên chi phí thấp nhất có thể — kiến trúc serverless
  trên AWS (scale-to-zero khi rảnh).
- Dữ liệu khách hàng Nhật: cẩn trọng khi đưa dữ liệu ra ngoài hệ thống
  (export) — tên khách hàng thật không được công khai.
- Không có 要件定義書 chính thức từ khách hàng/Backlog — tài liệu này thay
  thế vai trò đó ở mức tối thiểu, có thể bổ sung khi có ticket Backlog
  thật.

## 6. Tiêu chí thành công

- Nhân viên tra cứu lại thông tin 1 dự án cũ trong vài giây, thay vì hỏi
  qua lại nhiều người hoặc tìm file rải rác.
- Trích xuất được số liệu thống kê (tổng man-month theo năm, top khách
  hàng, công nghệ dùng nhiều nhất...) mà không cần tổng hợp thủ công.
- Chi phí vận hành AWS ở mức tối thiểu khi hệ thống ít truy cập (phù hợp
  đặc thù dùng nội bộ, lượng truy cập thấp, không liên tục).

## 7. Việc chưa quyết định (cần làm rõ khi triển khai phần liên quan)

- Format cụ thể của export PowerPoint (khi ưu tiên làm tới).
- Danh sách đầy đủ `project_type` (hiện đề xuất: offshore, ses, lab,
  new_dev, maintenance) — cần xác nhận đủ chưa khi viết `delta-spec.md`.
