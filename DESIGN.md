---
name: Structure & Clarity
description: Design system cho 実績管理システム — phong cách Corporate Minimalism, phù hợp quản lý dự án outsource B2B với khách hàng Nhật.
colors:
  surface: '#f9f9ff'
  surface-dim: '#d0daf0'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d9e3f9'
  on-surface: '#121c2c'
  on-surface-variant: '#43474e'
  inverse-surface: '#273141'
  inverse-on-surface: '#ebf1ff'
  outline: '#74777f'
  outline-variant: '#c4c6cf'
  surface-tint: '#455f88'
  primary: '#002045'
  on-primary: '#ffffff'
  primary-container: '#1a365d'
  on-primary-container: '#86a0cd'
  inverse-primary: '#adc7f7'
  secondary: '#1960a3'
  on-secondary: '#ffffff'
  secondary-container: '#7db6ff'
  on-secondary-container: '#00477f'
  tertiary: '#002715'
  on-tertiary: '#ffffff'
  tertiary-container: '#003f25'
  on-tertiary-container: '#5caf81'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#adc7f7'
  on-primary-fixed: '#001b3c'
  on-primary-fixed-variant: '#2d476f'
  secondary-fixed: '#d3e4ff'
  secondary-fixed-dim: '#a2c9ff'
  on-secondary-fixed: '#001c38'
  on-secondary-fixed-variant: '#004881'
  tertiary-fixed: '#9ff5c1'
  tertiary-fixed-dim: '#83d8a6'
  on-tertiary-fixed: '#002111'
  on-tertiary-fixed-variant: '#005231'
  background: '#f9f9ff'
  on-background: '#121c2c'
  surface-variant: '#d9e3f9'
typography:
  headline-lg:
    fontFamily: Noto Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Noto Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Noto Sans
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
  body-lg:
    fontFamily: Noto Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Noto Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Noto Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Noto Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Noto Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Noto Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-page: 32px
---

## Thương hiệu & Phong cách

Design system này được xây dựng cho môi trường yêu cầu độ chính xác cao
của quản lý dự án IT outsource B2B tại Nhật Bản. Cá tính thương hiệu bắt
nguồn từ **sự chính xác, tinh thần trách nhiệm, và hiệu quả có hệ
thống**. Thiết kế tránh các chi tiết trang trí rườm rà, ưu tiên triết lý
"công cụ là trên hết" — giao diện không bao giờ được cạnh tranh sự chú ý
với dữ liệu dự án quan trọng mà nó hiển thị.

Phong cách thiết kế là **Corporate Minimalism** (Tối giản doanh nghiệp)
đã được tinh chỉnh. Sử dụng ngôn ngữ thiết kế phẳng (flat design) với
đường viền tương phản cao để hỗ trợ quét thông tin nhanh trong dữ liệu
dày đặc. Bằng cách ưu tiên tính toàn vẹn cấu trúc và phân cấp thị giác rõ
ràng, hệ thống gợi lên cảm giác đáng tin cậy và kỷ luật chuyên nghiệp —
điều cần thiết cho hoạt động outsource ở quy mô doanh nghiệp.

## Colors

Bảng màu mang tính chức năng nghiêm ngặt, dùng "Navy đậm" (Deep Corporate
Navy) để thể hiện sự uy tín, và "Xanh dương chuyên nghiệp" cho các thành
phần tương tác.

- **Primary (#002045):** Dùng cho điều hướng cố định (sidebar/header),
  tiêu đề cấp cao, và nhận diện thương hiệu ở tầng cấu trúc.
- **Secondary — Action (#1960a3):** Dành riêng cho button, link, trạng
  thái active — dẫn hướng mắt người dùng tới hành động cần hoàn thành.
- **Tertiary — Success (#002715, container `#003f25`, on-container
  `#5caf81`):** Dùng cho chỉ báo trạng thái dự án tích cực và các mốc
  hoàn thành.
- **Neutral/Surface:** Cách tiếp cận phân lớp dùng `surface` (`#f9f9ff`)
  làm nền canvas và `surface-container-lowest` (`#ffffff`) cho các khối
  nội dung (card, modal) — tạo khác biệt tinh tế nhưng rõ ràng giữa vùng
  làm việc và vùng dữ liệu.
- **Text tương phản cao:** `on-surface` (`#121c2c`) đảm bảo độ dễ đọc tối
  đa trên nền sáng, đáp ứng chuẩn accessibility cho người dùng thao tác
  trong thời gian dài.
- **Error (`#ba1a1a`, container `#ffdad6`):** Dùng cho lỗi/validation
  fail — không dùng cho mục đích nhấn mạnh thông thường.

## Typography

Hệ thống dùng duy nhất **Noto Sans** (đảm bảo hiển thị tốt ký tự tiếng
Nhật song song với chuỗi kỹ thuật Latin/số).

- **Phân cấp:** dùng `headline-sm` (18px) cho tiêu đề card và section,
  giữ mật độ thông tin cao.
- **Nội dung chính:** `body-md` (14px) là cỡ chữ chủ lực cho dữ liệu
  bảng và mô tả.
- **Label:** `label-md`/`label-sm` dùng weight semi-bold + letter-
  spacing nhẹ để phân biệt metadata với nội dung chính.
- **Mật độ dữ liệu cao:** trong bảng phức tạp, cho phép dùng `body-sm`
  (13px) để tối đa hoá khả năng nhìn lướt qua (at-a-glance) tập dữ liệu
  lớn.

## Layout & Spacing

Hệ thống tuân theo lưới tuyến tính **8px** nghiêm ngặt để đảm bảo tính
nhất quán xuyên suốt mọi module.

- **Mô hình layout:** lưới hybrid 12 cột fixed-fluid. Sidebar cố định
  240px, vùng nội dung chính dùng lưới fluid với max-width 1440px để
  tránh dòng text quá dài trên màn hình siêu rộng.
- **Mật độ:** dùng khoảng cách dọc "chặt" (tight). Gutter giữa các card
  là `md` (16px), padding nội bộ cho component nhiều dữ liệu (bảng) dùng
  `sm` (8px) để giảm thiểu việc cuộn trang.
- **Breakpoint:**
  - Mobile (<768px): 1 cột, margin giảm còn 16px.
  - Tablet (768px–1024px): lưới 8 cột, sidebar thu gọn còn icon.
  - Desktop (>1024px): lưới 12 cột, sidebar đầy đủ.

## Elevation & Depth

Để giữ đúng tinh thần "Enterprise Clean", hệ thống tránh drop-shadow
truyền thống và hiệu ứng neomorphic.

- **Phân lớp theo tông màu (Tonal Layering):** độ sâu được thể hiện qua
  thay đổi màu nền — nền trang chính dùng `surface` (`#f9f9ff`), container
  tương tác (card, modal) dùng `surface-container-lowest` (`#ffffff`).
- **Viền phẳng:** thay vì đổ bóng, dùng border 1px solid màu
  `outline-variant` (`#c4c6cf`) để xác định ranh giới element.
- **Elevation khi active:** khi hover, element có thể dùng border-bottom
  2px hoặc shadow rất nhẹ, mờ (`0 2px 4px rgba(0,0,0,0.05)`) chỉ để gợi ý
  tính tương tác, không phải để trang trí.
- **Modal:** overlay cấp cao dùng backdrop bán trong suốt (`primary`
  `#002045` ở độ mờ 40%) để giữ tập trung vào tác vụ đang làm.

## Shapes

Ngôn ngữ hình khối mang tính bảo thủ và hình học.

- **Component tiêu chuẩn:** góc bo "mềm" (`rounded.DEFAULT`, 4px /
  0.25rem) áp dụng cho button, input field, card nhỏ — giảm cảm giác
  "brutalist" mà vẫn giữ tính chuyên nghiệp.
- **Badge trạng thái & filter chip:** dùng `rounded.lg` (8px) để phân
  biệt với button có thể click.
- **Container lớn:** vùng nội dung chính và container trang lớn dùng góc
  vuông (0px) hoặc bo rất nhẹ (4px) để củng cố cảm giác cấu trúc, kiến
  trúc của hệ thống.

## Components

### Bảng dữ liệu mật độ cao (Data Table)
- **Style:** border-bottom 1px màu `outline-variant` (`#c4c6cf`) cho mỗi
  row. Nền header dùng `surface-container-low` (`#f0f3ff`) với text
  `label-sm`.
- **Tương tác:** hover row dùng nền `surface-container-low` (`#f0f3ff`).
  Không dùng shadow.

### Filter Chip & Status Badge
- **Chip:** nền xám nhạt, border 1px, có icon "X" để xoá.
- **Status Badge:** dùng cách phối "nền tinted" (vd Success = nền xanh
  lá nhạt + text xanh lá đậm) để đảm bảo dễ đọc mà không quá nặng nề như
  khối màu đặc.

### Action Button
- **Primary:** nền đặc `secondary` (`#1960a3`), text trắng, bo góc 4px.
- **Secondary/Ghost:** border 1px `secondary` (`#1960a3`), text cùng
  màu.
- **Destructive:** nền đặc `error` (`#ba1a1a`), border cùng màu, text
  `on-error` (`#ffffff`). Dùng cho hành động không thể hoàn tác (vd xác
  nhận xoá trong Modal).
- **Kích thước:** chiều cao chuẩn 32px cho layout mật độ cao; 40px cho
  action chính của trang.

### Input Field
- **Mặc định:** border 1px `outline-variant` (`#c4c6cf`). Khi focus,
  border đổi sang `secondary` (`#1960a3`) kèm viền glow mờ bên trong 1px.
- **Label:** căn trên (top-aligned), dùng `label-md` để tối ưu không
  gian trong form.

### Stat Card
- **Cấu trúc:** border 1px, padding nội bộ 16px.
- **Nội dung:** giá trị số lớn dùng `headline-md` màu `primary`, mô tả
  phụ dùng `label-sm` màu neutral.

### Navigation Sidebar
- **Cấu trúc:** cố định `240px`, `position: fixed`, kéo dài hết chiều
  cao viewport (không cuộn theo nội dung, đè lên vùng header phía trên
  cùng bên trái). Nền `surface-container-lowest`, border-right 1px
  `outline-variant`.
- **Item:** padding dọc theo `spacing.sm`, ngang theo `spacing.lg`.
  Item active dùng nền `secondary-container`, text
  `on-secondary-container`, in đậm; hover (không active) dùng nền
  `surface-container-low`.

### Dropdown / Filter
- **Button:** border 1px `outline-variant`, nền
  `surface-container-lowest`, giống chiều cao Input Field (40px). Label
  hiện kèm số lượng đang chọn trong dấu ngoặc (vd "技術 (2)") khi có ít
  nhất 1 giá trị được chọn. LUÔN kèm ký hiệu mũi tên `▾` cỡ 16px màu
  `on-surface-variant`, đặt cạnh label để phân biệt trực quan với
  Action Button (không có mũi tên).
- **Panel:** mở khi click button, đóng khi click ra ngoài. Nền
  `surface-container-lowest`, border 1px `outline-variant`, bo góc
  `rounded.DEFAULT`, shadow rất nhẹ (`0 2px 4px rgba(0,0,0,0.05)`, xem
  mục Elevation & Depth). Danh sách checkbox bên trong, không giới hạn
  số lượng.

### Modal / Confirm Dialog
- **Cấu trúc:** backdrop phủ toàn màn hình + panel căn giữa chứa title +
  body text + 2 action button (Cancel / Confirm).
- **Backdrop:** `primary` ở độ mờ 40% — xem mục Elevation & Depth.
- **Panel:** nền `surface-container-lowest`, border 1px `outline-variant`,
  bo góc `rounded.DEFAULT`.
- **Tương tác:** đóng khi click backdrop hoặc nút Cancel. KHÔNG đóng khi
  click bên trong panel.
- **Action button:** nút Cancel dùng biến thể Secondary/Ghost, nút
  Confirm dùng biến thể Primary hoặc Destructive (xem mục Action Button)
  tuỳ hành động — hành động không thể hoàn tác (vd xoá) dùng Destructive.

### Toast
- **Cấu trúc:** banner full-width bên trong `.app-page`, gồm icon + text.
- **Error (`.toast-error`):** nền `error-container` (`#ffdad6`), text
  `on-error-container` (`#93000a`). Giữ nguyên cho tới khi user dismiss
  hoặc thử lại — không tự ẩn.
- **Success (`.toast-success`):** nền `tertiary-container` (`#003f25`),
  text `on-tertiary-container` (`#5caf81`). Tự ẩn sau 3 giây.

## Do's and Don'ts

- ✅ Dùng đúng token trong `colors`/`typography`/`rounded`/`spacing` ở
  trên — không tự ý thêm giá trị mới ngoài palette đã định nghĩa.
- ✅ Chỉ dùng `error` cho thông báo lỗi thật, không dùng cho nhấn mạnh
  thông thường.
- ❌ Không dùng font khác ngoài `Noto Sans` cho nội dung chính (đảm bảo
  hiển thị đúng ký tự Nhật).
- ❌ Không thêm drop-shadow/gradient trang trí — mọi độ sâu thể hiện qua
  tông màu nền (Tonal Layering) hoặc border phẳng (xem mục Elevation & Depth).
- ❌ Không dùng `<select multiple>` gốc trình duyệt cho multi-select
  filter — trải nghiệm kém (phải giữ Ctrl/Cmd để chọn nhiều, không có
  gợi ý cách dùng, không style được). Dùng component **Dropdown /
  Filter** đã định nghĩa ở mục Components.
- ❌ Không dùng `confirm()`/`alert()` gốc trình duyệt cho hành động phá
  huỷ (vd xoá) — không style được, không nhất quán cross-browser. Dùng
  component **Modal / Confirm Dialog** với nút Action Button biến thể
  Destructive.
- ✅ Nội dung chính (form, bảng dữ liệu) căn giữa theo chiều ngang khi
  còn dư không gian (`margin: 0 auto` kèm `max-width` phù hợp) — không
  để dính sát 1 lề khi màn hình rộng hơn nội dung.
- ✅ Form nhiều field (>5) nên phân nhóm theo card (border 1px
  `outline-variant`, xem cấu trúc tương tự `Stat Card`) để dễ quét mắt,
  thay vì xếp phẳng liên tục — chi tiết field nào thuộc nhóm nào do
  `specs/<module>-ui.md` của từng màn hình quyết định, file này chỉ quy
  định NGUYÊN TẮC chung.
