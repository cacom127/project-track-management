# UI Delta Spec — Ảnh đính kèm cho dự án

- **Ticket ID**: CHANGE-011
- **Module UI bị ảnh hưởng**: `specs/projects-ui.md`

## 1. Màn hình bị ảnh hưởng

- Tạo dự án — `/projects/new` (SỬA — thêm mục 画像添付, ảnh chỉ upload
  thật sau khi tạo project thành công)
- Sửa dự án — `/projects/:id/edit` (SỬA — thêm mục 画像添付, upload/xoá
  ngay lập tức)
- Chi tiết dự án — `/projects/:id` (SỬA — thêm mục 画像添付, xem/xoá)
- `AttachmentManager` (MỚI — component dùng chung, không phải 1 route)

## 2. Layout

```
┌─ 画像添付（最大10枚）──────────────┐
│ [+ 画像を選択]                     │
│ ┌─ Paste Zone ──────────────────┐ │
│ │ クリックしてCtrl+Vで画像を貼り付け │ │  ← tabIndex=0, xem trạng thái mục 3
│ └───────────────────────────────┘ │
│ ┌───┐┌───┐┌───┐┌───┐          │
│ │📷 ││📷 ││📷 ││📷 │  ← thumbnail, click mở Lightbox │
│ │ × ││ × ││ × ││ × │  ← nút xoá góc trên-phải          │
│ └───┘└───┘└───┘└───┘          │
└─────────────────────────────────┘
```

- Section riêng dạng card (giống 3 card khác của form), đặt cuối
  `ProjectForm` (sau 分類, trước 確認元メモ) và trên Detail (sau 分類).
- Click "+ 画像を選択" mở file picker (`accept="image/jpeg,image/png,image/webp"`,
  `multiple`).
- **Paste Zone**: 1 khối `tabIndex=0` riêng (bắt buộc phải focus được để
  nhận sự kiện `onPaste`), 3 trạng thái phân biệt rõ (feedback, xem mục
  6 để biết token/style):
  - Bình thường (chưa focus, còn <10 ảnh): border nét đứt
    `outline-variant`, hint "クリックしてCtrl+Vで画像を貼り付け".
  - Đang focus, sẵn sàng paste (còn <10 ảnh): border đổi màu
    `secondary` + box-shadow nhẹ — **y hệt style `:focus` của Input
    Field** đã có.
  - Đủ 10 ảnh (không thể paste): border nét đứt mờ hơn, bỏ `tabIndex`
    (không focus được), `cursor: not-allowed`, hint "上限（10枚）に達し
    ました".
- Mỗi thumbnail có nút "×" xoá góc trên-phải, click thumbnail (không
  phải nút xoá) mở Lightbox — dùng lại component `Modal` (ảnh full-size
  + nút đóng, không có nút Confirm).
- Khi đã đủ 10 ảnh: ẩn/disable nút "+ 画像を選択" (đồng bộ với Paste
  Zone ở trạng thái "đủ 10 ảnh").
- File sai định dạng/quá 5MB: hiện lỗi inline ngay dưới section, không
  thêm vào danh sách.

## 3. Trạng thái (state matrix)

| Trạng thái | Trigger | Hiển thị |
|---|---|---|
| Idle | Mount, chưa có ảnh nào | Chỉ nút "+ 画像を選択" |
| Loaded (mode `live`) | `GET .../attachments` xong | Lưới thumbnail |
| Uploading (1 ảnh) | Đang presign/PUT/confirm | Thumbnail đó hiện overlay loading, các ảnh khác vẫn tương tác được |
| Upload error | Presign/PUT/confirm lỗi | Toast lỗi, không thêm thumbnail |
| Deleting | Đang gọi `DELETE .../attachments/:id` | Thumbnail đó disable, hiện loading |
| Staged (mode `staged`, Create) | Chọn/paste ảnh trước khi project tồn tại | Thumbnail preview local (`URL.createObjectURL`), chưa gọi API |
| Uploading staged (sau submit) | `POST /projects` thành công, đang upload từng ảnh staged | Toàn form disable, text "画像をアップロード中..." |

## 4. Hành vi tương tác (EARS)

- **[UI-PROJ-05-1] (MỚI)** The `AttachmentManager` shall accept image
  files via file picker or clipboard paste (Ctrl+V trong Paste Zone),
  validating type (jpeg/png/webp) and size (≤5MB) client-side before
  adding.
- **[UI-PROJ-05-2] (MỚI)** When 10 attachments already exist/staged,
  the system shall disable the Paste Zone (bỏ `tabIndex`, đổi hint
  text, `cursor: not-allowed`) and the "+ 画像を選択" button.
- **[UI-PROJ-05-6] (MỚI)** The Paste Zone shall render 3 distinguishable
  states: bình thường (border nét đứt `outline-variant`), đang focus
  (border `secondary` + box-shadow, giống `:focus` của Input Field),
  và đủ 10 ảnh (border mờ hơn, không focus được).
- **[UI-PROJ-05-3] (MỚI)** In `live` mode (Edit/Detail), adding an
  image shall immediately call the presign → PUT → confirm flow and
  refresh the list; removing shall immediately call `DELETE`.
- **[UI-PROJ-05-4] (MỚI)** In `staged` mode (Create), images shall be
  held client-side (no API call) until the form submits successfully;
  after `POST /projects` succeeds, the system shall upload each staged
  image sequentially before navigating away, showing a
  "画像をアップロード中..." state.
- **[UI-PROJ-05-5] (MỚI)** Clicking a thumbnail (not its delete button)
  shall open a Lightbox showing the full-size image.
- **[UI-PROJ-02-11] (MỚI)** `ProjectForm`'s `onSubmit` prop shall
  return the created/updated `Project` (thay vì `void`), and a new
  `onSuccess` prop shall be called AFTER attachment upload (if any)
  completes — tách hành vi "gửi dữ liệu form" khỏi "điều hướng/toast
  khi xong", để chỗ cho bước upload ảnh staged ở giữa.

## 5. Test mapping

| ID | Test case tương ứng |
|---|---|
| UI-PROJ-05-1..6 | `AttachmentManager.test.tsx` |
| UI-PROJ-02-11 | `ProjectForm.test.tsx` (mới), `ProjectCreate.test.tsx`/`ProjectEdit.test.tsx` (cập nhật mock `onSubmit`) |

## 6. Ghi chú DESIGN.md cần bổ sung

- Component **Thumbnail Grid** (MỚI, atomic): ô vuông cố định (vd
  96x96px), `object-fit: cover`, border 1px `outline-variant`, bo góc
  `rounded.DEFAULT`, nút xoá tròn nhỏ góc trên-phải đè lên ảnh (nền
  `error`, icon "×" trắng).
- Component **Paste Zone** (MỚI, atomic — feedback CHANGE-011): khối
  `tabIndex=0` nhận `onPaste`, 3 trạng thái dùng lại token đã có, KHÔNG
  cần màu mới:
  - Bình thường: border nét đứt 1px `outline-variant`.
  - Focus (sẵn sàng paste): border `secondary` + box-shadow nhẹ — giống
    hệt `:focus` của Input Field.
  - Đủ giới hạn (không thể paste): border nét đứt `outline-variant`
    nhưng opacity thấp hơn, `cursor: not-allowed`, không nhận focus.
- Lightbox: tái dùng cấu trúc Modal đã có (backdrop + panel), không cần
  token mới — panel chứa `<img>` thay vì text, không có nút Confirm
  (chỉ nút đóng/click backdrop).

## 7. Tham chiếu thiết kế

- Không có Figma — nguồn chân lý là nội dung text ở trên.
