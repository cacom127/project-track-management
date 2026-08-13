---
version: alpha
name: <Tên design system>
description: Design system dùng chung cho các màn hình admin/mobile của dự án <tên dự án>
colors:
  primary: "#1A56DB"
  secondary: "#6C7278"
  tertiary: "#B8422E"
  neutral: "#F7F5F2"
  success: "#1F9254"
  warning: "#B7791F"
  error: "#C81E1E"
  on-primary: "#FFFFFF"
typography:
  h1:
    fontFamily: Noto Sans JP
    fontSize: 2rem
    fontWeight: 700
  h2:
    fontFamily: Noto Sans JP
    fontSize: 1.5rem
    fontWeight: 600
  body-md:
    fontFamily: Noto Sans JP
    fontSize: 1rem
    fontWeight: 400
  label-caps:
    fontFamily: Noto Sans JP
    fontSize: 0.75rem
    fontWeight: 500
rounded:
  sm: 4px
  md: 8px
  lg: 16px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
    padding: 12px
  button-primary-hover:
    backgroundColor: "#164FC7"
  button-primary-disabled:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.secondary}"
  input-field:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: 8px
  input-field-error:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.error}"
  card:
    backgroundColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: 16px
---

## Overview

<Mô tả ngắn phong cách thiết kế: nghiêm túc/enterprise (phù hợp app quản lý
kho, dashboard B2B cho khách hàng Nhật), ưu tiên rõ ràng - dễ đọc - mật độ
thông tin cao hơn là màu mè. Ví dụ: "Phong cách Enterprise Clean — ưu tiên
độ tương phản cao, ít trang trí, phù hợp người dùng thao tác nhanh trên
kho/cửa hàng.">

## Colors

- **Primary (#1A56DB):** Màu chính cho action/button quan trọng nhất, link.
- **Secondary (#6C7278):** Text phụ, border, placeholder.
- **Tertiary (#B8422E):** Dùng cho cảnh báo cần chú ý nhẹ (không phải error).
- **Neutral (#F7F5F2):** Nền phụ, trạng thái disabled.
- **Success/Warning/Error:** Dùng cho trạng thái hệ thống (toast, badge, validation) — không dùng cho mục đích trang trí khác.

## Typography

- **H1 (2rem, 700):** Tiêu đề màn hình chính.
- **H2 (1.5rem, 600):** Tiêu đề section trong 1 màn hình.
- **Body MD (1rem, 400):** Nội dung chính, label form.
- **Label Caps (0.75rem, 500):** Label nhỏ, tag, timestamp.
- Font `Noto Sans JP` được chọn vì hỗ trợ tốt hiển thị tiếng Nhật lẫn tiếng Việt trong cùng 1 màn hình (báo cáo, tên sản phẩm song ngữ).

## Layout

- Base spacing unit: 8px (`spacing.sm`). Mọi khoảng cách nên là bội số của 8px.
- Grid: 12 cột cho web admin, single-column cho mobile (Flutter).
- Khoảng cách giữa các section trong 1 màn hình: `spacing.lg` (24px) trở lên.

## Components

- **button-primary**: dùng cho action chính duy nhất trên 1 màn hình (submit, lưu, xác nhận). Không dùng quá 1 button-primary cùng lúc trên 1 màn hình.
- **input-field**: border 1px `{colors.secondary}` mặc định, chuyển sang `input-field-error` khi validate fail.
- **card**: dùng để nhóm thông tin liên quan (vd 1 sản phẩm trong danh sách RFID).

## Do's and Don'ts

- ✅ Dùng `button-primary` cho đúng 1 hành động quan trọng nhất/màn hình.
- ✅ Dùng `error` color CHỈ cho thông báo lỗi thật, không dùng cho nhấn mạnh thông thường.
- ❌ Không tự ý thêm màu mới ngoài palette đã định nghĩa — nếu thiếu, cập nhật file này trước, không hardcode trong code.
- ❌ Không dùng font khác ngoài `Noto Sans JP` cho nội dung chính (đảm bảo hiển thị đúng ký tự Nhật).
