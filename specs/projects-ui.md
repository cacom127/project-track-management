# Module: Projects — UI (Current Truth)

> Layout/state/hành vi tương tác của module `projects`. Token màu/font/
> component xem `DESIGN.md` — file này KHÔNG lặp lại giá trị màu/font
> cụ thể, chỉ tham chiếu tên token.

## 1. Danh sách màn hình thuộc module này

| Màn hình      | Route/Screen name | Mô tả ngắn                          |
|----------------|----------------------|----------------------------------------|
| List dự án     | `/projects`          | Bảng dự án, search/filter, pagination   |
| Tạo dự án      | `/projects/new`      | Form tạo project mới                    |
| Chi tiết dự án | `/projects/:id`      | Xem đầy đủ 1 dự án, nút Sửa/Xoá          |
| Sửa dự án      | `/projects/:id/edit` | Form sửa (dùng chung `ProjectForm` với Tạo) |

---

## 2. Màn hình: List dự án

### 2.1 Layout

```
┌─────────────────────────────────────────────────────┐
│ プロジェクト                      [+ 新規プロジェクト] │  ← hàng tiêu đề
├─────────────────────────────────────────────────────┤
│┌───────────────────────────────────────────────────┐│
││ [🔍 検索......] [技術 ▾ (2)] [種別 ▾]              ││  ← toolbar (border riêng)
│└───────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────┤
│顧客名|ﾌﾟﾛｼﾞｪｸﾄ名|概要|期間|種別        |技術      |人数|総人月|👁|
│ ...  | ...      | .. | .. |[オフショア][新規開発]|[React][AWS]| .. | .. |👁|
├─────────────────────────────────────────────────────┤
│              ‹ 1 2 3 4 ›  (pagination)                │
└─────────────────────────────────────────────────────┘
```

8 cột dữ liệu theo đúng thứ tự trên: `customer_name`, `project_name`,
`description` (rút gọn 1 dòng bằng ellipsis, không tooltip),
`start_date`〜`end_date` (hoặc "進行中" nếu `is_ongoing`), `project_types`,
`technologies`, `team_size`, `total_man_month`. `team_size`/
`total_man_month` hiển thị "—" nếu `null`. Cột thứ 9 là icon "詳細"
(`CHANGE-010`, xem mục 2.1 cuối).

- **Hàng tiêu đề** (`<h1>プロジェクト</h1>` + nút "+ 新規プロジェクト")
  tách riêng khỏi **hàng toolbar** (search + filter, có border riêng
  bao quanh cả group — token component `Dropdown/Filter`/`Input Field`
  trong `DESIGN.md`).
- **Ô tìm kiếm**: class riêng (KHÔNG dùng `.input-field` nguyên khối),
  width cố định 320px, icon kính lúp inline.
- **Filter công nghệ/loại hình**: dùng component `Dropdown/Filter`
  (`DESIGN.md`) — button + mũi tên ▾ + panel checkbox, KHÔNG dùng
  `<select multiple>` gốc trình duyệt.
- **種別/技術**: mỗi giá trị 1 badge riêng (không nối chuỗi bằng dấu
  phẩy) — 種別 dùng tông `secondary-container`, 技術 dùng tông
  `tertiary-container` (phân biệt theo NHÓM, không theo từng giá trị).
- Data Table theo `DESIGN.md` mục Components (border bottom
  outline-variant mỗi row, header nền surface-container-low, hover row
  nền surface-container-low), pagination dùng Action Button
  Secondary/Ghost.
- Cột cuối mỗi row là icon "詳細" (accessible name "詳細" qua
  `aria-label`, KHÔNG phải link chữ) điều hướng tới `/projects/:id`
  (`CHANGE-010`). Không có nút Sửa/Xoá trực tiếp ở List — Detail là nơi
  duy nhất chứa hành động Sửa/Xoá.
- Search debounce 300ms trước khi gọi API, reset về page 1 khi đổi
  search/filter.

### 2.2 Trạng thái màn hình (state matrix)

| Trạng thái | Trigger | Hiển thị |
|---|---|---|
| Loading | Mount / đổi filter / đổi trang | Text/spinner "読み込み中..." giữa bảng |
| Empty | `total === 0` | "プロジェクトが見つかりません" |
| Error | API lỗi | `.toast-error`, giữ nguyên filter/search đã nhập |
| Loaded | Bình thường | Bảng 8 cột + pagination |

### 2.3 Hành vi tương tác (EARS)

- **[UI-PROJ-01-1]** When the List screen mounts, the system shall call
  `GET /projects` with default paging and show the Loading state until
  the response resolves.
- **[UI-PROJ-01-2]** When the user types in the search box, the system
  shall debounce 300ms before calling `GET /projects` with the updated
  `q` param, resetting to page 1.
- **[UI-PROJ-01-3]** When the user selects a value in the technology or
  loại hình filter, the system shall call `GET /projects` with the
  updated filter params, resetting to page 1.
- **[UI-PROJ-01-4]** When `total === 0`, the system shall show the
  Empty state instead of an empty table.
- **[UI-PROJ-01-5]** The List table shall render 8 columns per row (xem
  mục 2.1), with `team_size`/`total_man_month` rendered as "—" when
  `null`.
- **[UI-PROJ-01-6]** The List screen shall render the page title
  ("プロジェクト") and the "+ 新規プロジェクト" action button on a
  dedicated header row, separate from the search/filter toolbar row.
- **[UI-PROJ-01-7]** The search input shall render at a fixed max-width
  (320px), not stretch to fill the toolbar row.
- **[UI-PROJ-01-8]** The technology/loại hình filter UI shall be a
  dropdown button + checkbox panel (component `Dropdown/Filter`), not a
  native `<select multiple>`. Button phải có ký hiệu mũi tên ▾.
- **[UI-PROJ-01-9]** The List table shall render each
  `project_types`/`technologies` value as an individual badge — 種別
  badges use `secondary-container` tint, 技術 badges use
  `tertiary-container` tint.
- **[UI-PROJ-01-10]** The List table shall render a "詳細" icon
  (accessible name "詳細" qua `aria-label`) per row navigating to
  `/projects/:id` (`CHANGE-010`).

---

## 3. Màn hình: Tạo dự án

### 3.1 Layout

```
┌─ 基本情報 ──────────────────────┐
│ 顧客名 *        [___________]   │
│ プロジェクト名 * [___________]   │
│ 概要            [___________]   │
└─────────────────────────────────┘
┌─ 期間・規模 ────────────────────┐
│ 開始日 *        [__/__/____]    │
│ ☐ 進行中                        │
│ 終了日          [__/__/____]    │ ← disable khi 進行中 checked
│ 人数 [___]名     総人月 [___]人月 │  ← 2 field nằm ngang hàng
└─────────────────────────────────┘
┌─ 分類 ──────────────────────────┐
│ 技術            [tag input....] │
│ 種別            [☐offshore ...] │
└─────────────────────────────────┘
┌─ 画像添付（最大10枚）──────────────┐
│ [+ 画像を選択]  [Paste Zone]      │  ← xem mục 6 (CHANGE-011)
│ ┌───┐┌───┐┌───┐              │
│ │📷 ││📷 ││📷 │  ← thumbnail        │
└─────────────────────────────────┘
確認元メモ        [___________]
           [作成する]  [キャンセル]
```

- Form phân nhóm theo 3 card (component "Card" atomic — border 1px
  `outline-variant`, giống `.auth-card`), toàn trang giới hạn max-width
  640px và **căn giữa**.
- Component dùng: `.input-field`/`.input-field-error`, `.button-primary`,
  Action Button Secondary/Ghost (nút Huỷ), `.toast-error`, Filter Chip
  (tag công nghệ đã chọn, `radius-lg`).
- Field bắt buộc đánh dấu `*` màu `error`. Tag công nghệ có autocomplete
  gọi `GET /tech-tags?q=` khi gõ, có placeholder + hint hướng dẫn thêm
  bằng Enter. Dropdown gợi ý bám sát ngay dưới input (không bị hint text
  chen giữa), nền `surface-container-low` (khác nền input/panel xung
  quanh), hover item dùng `secondary-container` (`CHANGE-010`).
- `team_size`/`total_man_month`: đơn vị "名"/"人月" cố định cạnh input,
  2 field nằm ngang hàng.
- Field/input disabled (vd 終了日 khi 進行中 checked) hiển thị nền
  `surface-container-low` + text `on-surface-variant`, phân biệt rõ với
  trạng thái bình thường (`CHANGE-010`).
- Nút "キャンセル" (Action Button Secondary/Ghost) cạnh nút "作成する",
  điều hướng về `/projects` không submit.
- Form dùng component dùng chung `ProjectForm` (props `initialValues`,
  `projectId?`, `onSubmit`, `onSuccess`, `submitLabel`, `cancelTo`) —
  tái sử dụng bởi cả màn Tạo và Sửa (mục 5), xem `CHANGE-010`/
  `CHANGE-011`.
- Section "画像添付" (`AttachmentManager` mode `staged` — chưa có
  `project_id` lúc này) nằm sau 分類, trước 確認元メモ. Xem mục 6.

### 3.2 Trạng thái màn hình (state matrix)

| Trạng thái | Trigger | Hiển thị |
|---|---|---|
| Idle | Mount | Form trống, nút "作成する" |
| Validation error | Submit thiếu field bắt buộc, hoặc 進行中 checked mà vẫn có 終了日 | Inline error dưới field tương ứng, chặn submit (check FE trước khi gọi API) |
| Submitting | Đang gọi `POST /projects` | Disable toàn bộ input + nút |
| Server error | API trả lỗi | `.toast-error`, giữ nguyên dữ liệu đã nhập |
| Success | `201` | Redirect về `/projects`; project mới nằm ở đầu danh sách |

### 3.3 Hành vi tương tác (EARS)

- **[UI-PROJ-02-1]** When the user checks "進行中" on the Create screen,
  the system shall clear and disable the 終了日 field.
- **[UI-PROJ-02-2]** When the user submits the Create form with a
  missing required field, the system shall show an inline error under
  that field and shall NOT call the API.
- **[UI-PROJ-02-3]** When the user types a new value into the
  technology tag input, the system shall call `GET /tech-tags?q=` to
  show matching existing tags, allowing the user to pick one or keep
  typing a new tag. Ô nhập hiển thị placeholder
  "入力してEnterで追加（複数可）" + hint chữ nhỏ xác nhận có thể thêm nhiều
  tag bằng Enter (sửa ở `CHANGE-008` — ban đầu không có hướng dẫn nào,
  người dùng không biết cách thêm).
- **[UI-PROJ-02-4]** When `POST /projects` succeeds, the system shall
  navigate to `/projects` with a success toast message
  ("「{project_name}」を作成しました", xem mục 6 — toast trước đó chỉ
  navigate không kèm thông báo, sửa ở `CHANGE-010`).
- **[UI-PROJ-02-5]** Required field labels shall render a trailing `*`
  character in `error` color.
- **[UI-PROJ-02-6]** The Create form shall group fields into 3 visual
  sections: 基本情報 (customer/project name/description), 期間・規模
  (dates/team_size/total_man_month), 分類 (technologies/project_types).
- **[UI-PROJ-02-7]** `team_size`/`total_man_month` inputs shall display
  a fixed unit label ("名"/"人月") adjacent to the field, side by side.
- **[UI-PROJ-02-8]** The Create screen shall render a "キャンセル" link
  next to "作成する" that navigates to `/projects` without submitting.
- **[UI-PROJ-02-9]** Disabled input/textarea shall render with a
  visibly muted background/text color (`surface-container-low`/
  `on-surface-variant`), distinct from the normal state (`CHANGE-010`).
- **[UI-PROJ-02-10]** The technology tag suggestion dropdown shall
  render immediately below the input, with a background tint distinct
  from the input/panel (`surface-container-low`), hover item dùng
  `secondary-container` (`CHANGE-010`).
- **[UI-PROJ-02-11]** `ProjectForm`'s `onSubmit` prop shall return the
  created/updated `Project`, and a new `onSuccess` prop shall be called
  AFTER attachment upload (if any staged) completes — tách "gửi dữ
  liệu form" khỏi "điều hướng/toast khi xong" để chỗ cho bước upload
  ảnh staged ở giữa (`CHANGE-011`).

---

## 4. Màn hình: Chi tiết dự án

### 4.1 Layout

```
┌─ 基本情報 ──────────────────────┐
│ 顧客名           ○○○           │
│ プロジェクト名     ○○○           │
│ 概要              ○○○           │
└─────────────────────────────────┘
┌─ 期間・規模 ────────────────────┐
│ 期間             2024-01-01〜進行中│
│ 人数 / 総人月     5名 / 12.5人月  │
└─────────────────────────────────┘
┌─ 分類 ──────────────────────────┐
│ 技術             [React][AWS]   │
│ 種別             [オフショア]     │
└─────────────────────────────────┘
┌─ 画像添付（最大10枚）──────────────┐
│ ┌───┐┌───┐┌───┐              │
│ │📷 ││📷 ││📷 │  ← thumbnail, click mở Lightbox, KHÔNG có nút thêm/xoá │
└─────────────────────────────────┘
確認元メモ         ○○○
           [編集]  [削除]
```

- Cùng layout 3-card + max-width 640px căn giữa như màn Tạo (mục 3.1),
  nhưng field hiển thị dạng text read-only (không phải input). 種別/技術
  vẫn hiển thị Badge như List. Section "画像添付" (`AttachmentManager`
  mode `live` + `readOnly`) đặt sau 分類 — **chỉ xem** (thumbnail +
  Lightbox), KHÔNG có nút "+ 画像を選択"/Paste Zone/nút xoá, đúng tinh
  thần Detail read-only; muốn thêm/xoá ảnh phải bấm "編集" sang màn Sửa
  (`CHANGE-011`, sửa lại từ bản đầu cho Detail thêm/xoá được luôn).
- Nút "編集" (Action Button Primary, `.button-primary` — text luôn căn
  giữa kể cả khi render bằng `<Link>`) điều hướng `/projects/:id/edit`.
  Nút "削除" (Action Button Destructive) mở Modal xác nhận trước khi
  gọi `DELETE /projects/:id`.

### 4.2 Trạng thái màn hình (state matrix)

| Trạng thái | Trigger | Hiển thị |
|---|---|---|
| Loading | Mount | Text "読み込み中..." |
| Not found | `GET /projects/:id` trả 404 | "プロジェクトが見つかりません" + link về `/projects` |
| Error | API lỗi khác | `.toast-error` |
| Loaded | Bình thường | 3-card read-only + nút 編集/削除 |
| Deleting | Đang gọi `DELETE /projects/:id` | Disable nút trong Modal |
| Delete error | `DELETE` lỗi | Đóng Modal, hiện `.toast-error`, giữ nguyên trang |
| Delete success | `204` | Điều hướng về `/projects` kèm toast thành công |

### 4.3 Hành vi tương tác (EARS)

- **[UI-PROJ-03-1]** When the Detail screen mounts, the system shall
  call `GET /projects/{id}` and show the Loading state until it
  resolves.
- **[UI-PROJ-03-2]** When `GET /projects/{id}` returns `404`, the
  system shall show a "not found" message with a link back to
  `/projects`.
- **[UI-PROJ-03-3]** The Detail screen shall render all project fields
  read-only, using the same 3-section grouping as the Create screen.
- **[UI-PROJ-03-4]** When the user clicks "削除", the system shall open
  a confirm Modal before calling `DELETE /projects/{id}`.
- **[UI-PROJ-03-5]** When the user confirms deletion in the Modal, the
  system shall call `DELETE /projects/{id}` and, on success, navigate
  to `/projects` with a success toast message
  ("「{project_name}」を削除しました").

---

## 5. Màn hình: Sửa dự án

### 5.1 Layout

Layout giống hệt màn Tạo (mục 3.1, dùng chung component `ProjectForm`),
form điền sẵn giá trị hiện tại. Nút submit đổi label "更新する" thay vì
"作成する". Nút "キャンセル" điều hướng về `/projects/:id` (Detail) thay
vì `/projects` như Tạo. Section "画像添付" dùng mode `live` (khác Tạo
dùng mode `staged`) vì `project_id` đã tồn tại — thao tác thêm/xoá ảnh
ngay lập tức, không phụ thuộc việc submit form; KHÁC Detail (mode
`live` + `readOnly`), Edit KHÔNG bật `readOnly` nên vẫn thêm/xoá được
(`CHANGE-011`).

### 5.2 Trạng thái màn hình (state matrix)

| Trạng thái | Trigger | Hiển thị |
|---|---|---|
| Loading | Mount, đang fetch data cũ | Text "読み込み中..." |
| Not found | `GET /projects/:id` trả 404 | "プロジェクトが見つかりません" + link về `/projects` |
| Idle | Data cũ load xong | Form điền sẵn giá trị, nút "更新する" |
| Validation error | Submit thiếu field bắt buộc / 進行中+終了日 mâu thuẫn | Giống Tạo (inline error, chặn submit) |
| Submitting | Đang gọi `PUT /projects/{id}` | Disable toàn bộ input + nút |
| Server error | API lỗi | `.toast-error`, giữ nguyên dữ liệu đã sửa |
| Success | `200` | Điều hướng về `/projects/:id` (Detail) kèm toast thành công |

### 5.3 Hành vi tương tác (EARS)

- **[UI-PROJ-04-1]** When the Edit screen mounts, the system shall call
  `GET /projects/{id}` and pre-fill the form with the returned values.
- **[UI-PROJ-04-2]** When the user submits the Edit form with valid
  data, the system shall call `PUT /projects/{id}` and, on success,
  navigate to `/projects/:id` with a success toast message
  ("「{project_name}」を更新しました").
- **[UI-PROJ-04-3]** The Edit form shall reuse the same validation
  rules as the Create form (required fields, 進行中/終了日 conflict).

---

## 6. Ảnh đính kèm (`AttachmentManager`)

Component dùng chung, đặt trong `ProjectForm` (Tạo/Sửa) và `ProjectDetail`
— xem layout ở mục 3.1/4.1/5.1.

### 6.1 Layout

```
[+ 画像を選択]
┌─ Paste Zone ──────────────────┐
│ クリックしてCtrl+Vで画像を貼り付け │  ← tabIndex=0, xem trạng thái bên dưới
└───────────────────────────────┘
┌───┐┌───┐┌───┐┌───┐
│📷 ││📷 ││📷 ││📷 │  ← thumbnail, click mở Lightbox
│ × ││ × ││ × ││ × │  ← nút xoá góc trên-phải (ẩn nếu `readOnly`)
└───┘└───┘└───┘└───┘
```

- Click "+ 画像を選択" mở file picker
  (`accept="image/jpeg,image/png,image/webp"`, `multiple`).
- **Paste Zone**: khối `tabIndex=0` nhận `onPaste`, 3 trạng thái (token
  xem `DESIGN.md` mục Components > Paste Zone):
  - Bình thường (chưa focus, còn <10 ảnh): border nét đứt
    `outline-variant`.
  - Đang focus (còn <10 ảnh): border `secondary` + box-shadow — giống
    `:focus` của Input Field.
  - Đủ 10 ảnh: border mờ hơn, bỏ `tabIndex`, `cursor: not-allowed`.
- Mỗi thumbnail có nút "×" xoá góc trên-phải; click thumbnail (không
  phải nút xoá) mở Lightbox (bespoke, tái dùng backdrop style của
  `Modal` nhưng không có nút Confirm — chỉ xem ảnh + đóng).
- Đủ 10 ảnh: ẩn/disable nút "+ 画像を選択", đồng bộ với Paste Zone.
- Sai định dạng/quá 5MB: lỗi inline dưới section, không thêm vào danh
  sách.
- **`readOnly` (chỉ mode `live`, dùng ở Detail)**: ẩn hoàn toàn nút "+
  画像を選択", Paste Zone, và nút xoá trên mỗi thumbnail — chỉ còn xem
  thumbnail + Lightbox. Edit KHÔNG bật cờ này (vẫn thêm/xoá được).

### 6.2 Trạng thái (state matrix)

| Trạng thái | Trigger | Hiển thị |
|---|---|---|
| Idle | Mount, chưa có ảnh | Chỉ nút "+ 画像を選択" + Paste Zone (ẩn nếu `readOnly`) |
| Loaded (mode `live`) | `GET .../attachments` xong | Lưới thumbnail |
| Uploading 1 ảnh (mode `live`) | Đang presign/PUT/confirm | Overlay loading trên thumbnail đó, ảnh khác vẫn tương tác được |
| Deleting (mode `live`) | Đang gọi `DELETE .../attachments/:id` | Thumbnail đó disable + loading |
| Staged (mode `staged`, Create) | Chọn/paste trước khi project tồn tại | Preview local (`URL.createObjectURL`), chưa gọi API |
| Uploading staged (sau submit Create) | `POST /projects` xong, đang upload từng ảnh | Toàn form disable, nút submit hiện "画像をアップロード中..." |
| Read-only (Detail) | `readOnly=true` | Chỉ lưới thumbnail + Lightbox, không có nút thêm/xoá |

### 6.3 Hành vi tương tác (EARS)

- **[UI-PROJ-05-1]** The `AttachmentManager` shall accept image files
  via file picker or clipboard paste (Ctrl+V trong Paste Zone),
  validating type (jpeg/png/webp) and size (≤5MB) client-side.
- **[UI-PROJ-05-2]** When 10 attachments already exist/staged, the
  system shall disable the Paste Zone and "+ 画像を選択" button.
- **[UI-PROJ-05-3]** In `live` mode, adding an image shall immediately
  call the presign → PUT → confirm flow and update the list; removing
  shall immediately call `DELETE`.
- **[UI-PROJ-05-4]** In `staged` mode, images shall be held
  client-side until the form submits successfully; after
  `POST /projects` succeeds, the system shall upload each staged image
  (best-effort, không rollback nếu 1 ảnh lỗi) before calling
  `onSuccess`.
- **[UI-PROJ-05-5]** Clicking a thumbnail (not its delete button) shall
  open a Lightbox showing the full-size image.
- **[UI-PROJ-05-6]** The Paste Zone shall render 3 distinguishable
  states: bình thường, đang focus (giống `:focus` Input Field), và đủ
  10 ảnh (không focus được).
- **[UI-PROJ-05-7]** On the Detail screen, `AttachmentManager` shall
  render with `readOnly` — hiding "+ 画像を選択", the Paste Zone, and
  each thumbnail's delete button; clicking a thumbnail still opens the
  Lightbox. Chỉ Edit mới thêm/xoá được ảnh.

## 7. Thông báo thành công (ToastHost)

- Sau khi Tạo/Sửa/Xoá thành công, `AppShell` render 1 `ToastHost` dùng
  chung (đọc `location.state?.successMessage` khi route thay đổi) hiện
  banner `.toast-success` (nền `tertiary-container`, text `on-tertiary`
  — xem `DESIGN.md` mục Components > Toast) ở góc dưới-phải màn hình,
  tự ẩn sau 3 giây, clear navigation state ngay để back/refresh không
  hiện lại (`CHANGE-010`).
- **[UI-SHELL-04]** The `AppShell` shall render a `ToastHost` that reads
  `successMessage` from router navigation state and shows a
  `.toast-success` banner for 3 seconds, clearing the navigation state
  immediately so it does not reappear on back/refresh.

---

## 8. Lịch sử thay đổi module này

| Ngày       | Ticket ID                       | Thay đổi                                    |
|------------|-----------------------------------|--------------------------------------------------|
| 2026-08-18 | CHANGE-007-projects-list-create  | Khởi tạo: màn List + Tạo dự án (UI-PROJ-01/02) |
| 2026-08-18 | CHANGE-008-fix-db-resume-and-tech-hint | Thêm placeholder/hint cho ô 技術 (UI-PROJ-02-3) |
| 2026-08-19 | CHANGE-009-app-shell-and-projects-ui-refresh | App Shell (Sidebar, xem `specs/architecture.md` mục 1); List: tách title/toolbar, dropdown filter, badge (UI-PROJ-01-6..9); Create: phân nhóm card, dấu *, đơn vị ngang hàng, nút Huỷ (UI-PROJ-02-5..8) |
| 2026-08-19 | CHANGE-010-project-detail-edit-delete | Thêm màn Chi tiết (mục 4)/Sửa (mục 5); List: icon 詳細 thay link chữ (UI-PROJ-01-10); Create: toast thành công (UI-PROJ-02-4 sửa), input disabled rõ ràng hơn, dropdown gợi ý 技術 bám input + đổi màu nền (UI-PROJ-02-9/10); ToastHost dùng chung (mục 7, UI-SHELL-04) |
| 2026-08-19 | CHANGE-011-project-attachments | Thêm `AttachmentManager` dùng chung (mục 6, UI-PROJ-05-1..7) cho Tạo/Sửa/Chi tiết (Detail dùng `readOnly` — chỉ xem); `ProjectForm` đổi contract `onSubmit`/`onSuccess` (UI-PROJ-02-11) |

<!-- Trỏ về changes/_archive/CHANGE-00X-.../ để xem đầy đủ ui-delta-spec gốc -->
