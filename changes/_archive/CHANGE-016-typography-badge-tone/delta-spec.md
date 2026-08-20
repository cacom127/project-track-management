# Delta Spec — CHANGE-016-typography-badge-tone

- **Ticket ID**: CHANGE-016-typography-badge-tone
- **Module bị ảnh hưởng**: `DESIGN.md` (cross-cutting, toàn app)
- **Loại thay đổi**: ☐ Thêm mới &nbsp; ☑ Sửa &nbsp; ☐ Xoá

## Bối cảnh / feedback thực tế

- Chữ hiển thị mờ, khó nhìn trên trình duyệt.
- Màu badge (種別/技術/開発工程) ở màn List/Detail quá đậm, khiến dữ
  liệu này nổi bật hơn hẳn phần còn lại của UI.

## Nguyên nhân

- **Font mờ**: `index.css` import web font `Noto Sans` (bản Latin-only)
  qua Google Fonts, nhưng `font-family` fallback ký tự tiếng Nhật sang
  font hệ thống (`Hiragino Sans`/`Yu Gothic`). Latin/số dùng web font
  (hint khác), tiếng Nhật dùng font hệ thống (hint khác) — 2 kiểu render
  trộn lẫn trong cùng 1 dòng chữ khiến tổng thể nhìn mờ/không nhất quán,
  đặc biệt rõ trên Windows ClearType.
- **Badge quá đậm**: token `*-container` (`secondary-container`
  `#7db6ff`, `tertiary-container` `#003f25` nền tối, `phase-container`
  `#6b4a00` nền tối) vốn được CHANGE-014 chọn cố ý để phân biệt badge
  (đậm) với filter chip (nhạt, dùng `*-fixed`) — nhưng thực tế đậm quá
  mức, badge lấn át phần dữ liệu khác trên màn hình.

## 1. Yêu cầu thay đổi (EARS notation)

- **[UI-GLOBAL-01] (SỬA)** The system shall load **Noto Sans JP**
  (thay cho `Noto Sans` bản Latin-only) làm web font chính, phủ cả
  Latin/số lẫn ký tự tiếng Nhật từ cùng 1 nguồn font, giữ nguyên
  `Hiragino Sans`/`Yu Gothic` làm fallback trong `--font-family`.

- **[UI-GLOBAL-02] (SỬA)** Badge (`badge-type`/`badge-tech`/
  `badge-phase`, dùng ở màn List và Detail) shall dùng token màu
  `*-fixed`/`on-*-fixed-variant` (tông nhạt, cùng tông với filter chip)
  thay cho `*-container` (tông đậm) trước đây — xem bảng cập nhật trong
  `DESIGN.md` mục "Badge & Filter Chip".

- **[UI-GLOBAL-03] (SỬA)** `.project-card-dot-badge` (badge 種別 dạng
  chấm tròn trên `ProjectCard`, CHANGE-015) shall tiếp tục dùng CÙNG
  token màu với `badge-type` sau khi đổi (`secondary-fixed`/
  `on-secondary-fixed-variant`), giữ nguyên yêu cầu "khớp màu với
  Detail/List" đã có từ CHANGE-015.

## Non-goals

- Không đổi font-size/font-weight/spacing hiện có (chỉ đổi font-family
  và màu badge).
- Không đổi màu/style của filter chip (đã đúng tông nhạt từ CHANGE-014,
  giữ nguyên).
