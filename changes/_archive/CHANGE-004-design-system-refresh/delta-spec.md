# Delta Spec — CHANGE-004-design-system-refresh

> Thay toàn bộ nội dung placeholder (mẫu "RFID/kho" từ template gốc)
> trong `DESIGN.md` bằng 1 design system thật cho 実績管理システム, tên
> gọi "Structure & Clarity" — phong cách Corporate Minimalism cho B2B
> outsource IT với khách hàng Nhật.

- **Ticket ID**: CHANGE-004-design-system-refresh
- **Module bị ảnh hưởng**: `DESIGN.md`
- **Loại thay đổi**: ☐ Thêm mới &nbsp; ☑ Sửa &nbsp; ☐ Xoá

## 1. Nội dung thay đổi

- Thay toàn bộ token YAML (`colors`, `typography`, `rounded`, `spacing`)
  bằng bộ token mới do Product owner (namlp) cung cấp trực tiếp.
- Viết lại phần mô tả markdown (Brand & Style, Colors, Typography,
  Layout & Spacing, Elevation & Depth, Shapes, Components) bằng tiếng
  Việt — theo đúng yêu cầu ngôn ngữ của `CLAUDE.md` mục 1.
- **Sửa lỗi lệch dữ liệu**: bản mô tả gốc (tiếng Anh) do user cung cấp có
  1 số giá trị hex trong phần prose không khớp với token YAML đi kèm
  (vd `primary`/`secondary`/`tertiary` prose ghi hex khác YAML). Khi
  dịch sang tiếng Việt, dùng ĐÚNG hex trong YAML — không giữ hex lệch
  trong bản mô tả gốc, theo `CLAUDE.md` mục 3 ("không để 2 nguồn cùng
  tồn tại khác nhau").
- Bỏ 2 field `version`/`description` không có trong bản token mới; thêm
  lại `description` (tiếng Việt) để khớp quy ước file mẫu.

## 2. Ghi chú cho AI agent khi implement

- Đây là design token, không phải acceptance criteria dạng EARS —
  không áp bảng test-case như các `delta-spec.md` module nghiệp vụ.
- Validate bằng lệnh `npx @google/design.md lint DESIGN.md` (theo
  hướng dẫn trong `README.md` mục "Cách dùng DESIGN.md") trước khi coi
  là xong — nếu tool này chưa cài được, ghi chú rõ để user tự chạy sau.
