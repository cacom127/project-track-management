# UI Delta Spec — CHANGE-009-app-shell-and-projects-ui-refresh

- **Ticket ID**: CHANGE-009-app-shell-and-projects-ui-refresh
- **Module UI bị ảnh hưởng**: `specs/projects-ui.md` (SỬA), thêm mục App
  Shell dùng chung (fold vào `specs/architecture.md` mục 1 khi merge)

## 1. Màn hình/component bị ảnh hưởng

- App Shell (Header + Sidebar) — MỚI, dùng chung mọi trang sau login.
- List dự án (`/projects`) — SỬA layout, filter, hiển thị badge.
- Tạo dự án (`/projects/new`) — SỬA: phân nhóm field, đơn vị, nút Huỷ.

---

## 2. App Shell (Header + Sidebar)

### 2.1 Layout

```
┌─────────────────────────────────────────────────────────┐
│ Header (nền primary, full-width): 実績管理システム   email/role/ログアウト │
├──────────┬────────────────────────────────────────────────┤
│ Sidebar  │                                                 │
│ 240px    │              (nội dung trang)                   │
│          │                                                 │
│ ・プロジェ │                                                 │
│  クト一覧  │                                                 │
│ (active) │                                                 │
└──────────┴────────────────────────────────────────────────┘
```

- Sidebar: 240px cố định (token có sẵn trong `DESIGN.md` mục Layout &
  Spacing), nền `surface-container-lowest`, border-right 1px
  `outline-variant`. Item active: nền `secondary-container` nhạt, text
  `on-secondary-container`.
- Responsive: Desktop/Tablet (≥768px) hiện sidebar đầy đủ; Mobile
  (<768px) ẩn hẳn sidebar (chỉ 1 nav item hiện tại, chưa cần hamburger
  menu — làm khi có ≥3 mục).
- Header giữ nguyên hành vi/thiết kế đã có từ `CHANGE-005`.

### 2.2 Hành vi tương tác (EARS)

- **[UI-SHELL-01] (MỚI)** The system shall render a persistent 240px
  left sidebar on viewports ≥768px, containing at minimum "プロジェクト
  一覧" linking to `/projects`.
- **[UI-SHELL-02] (MỚI)** When the current route matches a sidebar
  item's target, the system shall render that item with an active
  visual state (nền `secondary-container`).
- **[UI-SHELL-03] (MỚI)** On viewports <768px, the system shall hide
  the sidebar entirely (nội dung trang chiếm toàn bộ chiều rộng).

---

## 3. Màn hình: List dự án

### 3.1 Layout

```
┌─────────────────────────────────────────────────────┐
│ プロジェクト                      [+ 新規プロジェクト] │  ← hàng tiêu đề
├─────────────────────────────────────────────────────┤
│ [🔍 検索......] [技術 ▾ (2)] [種別 ▾]                │  ← hàng toolbar
├─────────────────────────────────────────────────────┤
│顧客名|ﾌﾟﾛｼﾞｪｸﾄ名|概要|期間|種別        |技術      |人数|総人月│
│ ...  | ...      | .. | .. |[オフショア][新規開発]|[React][AWS]| .. | ..  │
├─────────────────────────────────────────────────────┤
│              ‹ 1 2 3 4 ›  (pagination)                │
└─────────────────────────────────────────────────────┘
```

- **Hàng tiêu đề**: `<h1>プロジェクト</h1>` bên trái, nút
  "+ 新規プロジェクト" (`.button-primary`) bên phải — KHÔNG cùng hàng với
  search/filter nữa (sửa comment #3).
- **Ô tìm kiếm**: class riêng `.search-box` — width cố định 320px
  (không `flex: 1` giãn hết), icon kính lúp SVG inline bên trong, dùng
  token `Input Field` cho border/radius nhưng KHÔNG dùng `.input-field`
  nguyên khối (sửa comment #2).
- **Filter dropdown** (`FilterDropdown` component, thay `<select
  multiple>`): button hiển thị label + số lượng đang chọn (vd
  "技術 (2)"), click mở panel checkbox list bên dưới (`position:
  absolute`), click ra ngoài đóng panel.
- **Badge 種別/技術** (thay text nối dấu phẩy — sửa comment #4): mỗi giá
  trị 1 badge riêng, bo góc `rounded.lg`. 種別 dùng nền
  `secondary-container`/text `on-secondary-container`; 技術 dùng nền
  `tertiary-container`/text `on-tertiary-container` — phân biệt theo
  NHÓM, không theo từng giá trị cụ thể trong nhóm.

### 3.2 Trạng thái màn hình (state matrix — chỉ phần thay đổi/mới)

| Trạng thái | Trigger | Hiển thị |
|---|---|---|
| Filter dropdown đóng (mặc định) | Mount / click ra ngoài panel | Chỉ hiện button, không hiện panel checkbox |
| Filter dropdown mở | Click vào button filter | Hiện panel checkbox list đè lên nội dung bên dưới (không đẩy layout) |

(Các state Loading/Empty/Error/Loaded khác giữ nguyên như
`specs/projects-ui.md` hiện tại — không đổi.)

### 3.3 Hành vi tương tác (EARS — MỚI/SỬA)

- **[UI-PROJ-01-6] (MỚI)** The List screen shall render the page title
  ("プロジェクト") and the "+ 新規プロジェクト" action button on a
  dedicated header row, separate from the search/filter toolbar row.
- **[UI-PROJ-01-7] (MỚI)** The search input shall render at a fixed
  max-width (320px), not stretch to fill the toolbar row.
- **[UI-PROJ-01-8] (SỬA)** UI-PROJ-01-3's technology/loại hình filter
  UI shall be a dropdown button + checkbox panel (`FilterDropdown`),
  not a native `<select multiple>`. Behavior (calling `GET /projects`
  with updated params, resetting to page 1) is unchanged.
- **[UI-PROJ-01-9] (MỚI)** The List table shall render each
  `project_types`/`technologies` value as an individual badge — 種別
  badges use `secondary-container` tint, 技術 badges use
  `tertiary-container` tint.

---

## 4. Màn hình: Tạo dự án

### 4.1 Layout

```
┌─ 基本情報 ──────────────────────┐
│ 顧客名 *        [___________]   │
│ プロジェクト名 * [___________]   │
│ 概要            [___________]   │
└─────────────────────────────────┘
┌─ 期間・規模 ────────────────────┐
│ 開始日 *        [__/__/____]    │
│ ☐ 進行中                        │
│ 終了日          [__/__/____]    │
│ 人数            [___] 名        │
│ 総人月          [___] 人月       │
└─────────────────────────────────┘
┌─ 分類 ──────────────────────────┐
│ 技術            [tag input....] │
│ 種別            [☐offshore ...] │
└─────────────────────────────────┘
確認元メモ        [___________]
           [作成する]  [キャンセル]
```

- Mỗi nhóm là 1 `<section className="form-group-card">` (border 1px
  `outline-variant`, giống pattern `.auth-card` đã có), tiêu đề nhóm
  dùng `label-md` in đậm.
- Dấu `*` sau label bắt buộc: `<span className="required-mark">*</span>`,
  màu `error`.
- `team_size`/`total_man_month`: thêm text "名"/"人月" ngay cạnh input
  (không phải placeholder — label đơn vị cố định luôn hiện).
- Nút "キャンセル": `<Link to="/projects">`, style Secondary/Ghost
  (border 1px `secondary`, không nền đặc) — đặt cạnh nút "作成する".
- Toàn trang giới hạn `max-width` (không kéo giãn hết màn hình rộng).

### 4.2 Trạng thái màn hình

Giữ nguyên state matrix Idle/Validation error/Submitting/Server
error/Success đã có ở `specs/projects-ui.md` — không đổi hành vi, chỉ
đổi layout/style.

### 4.3 Hành vi tương tác (EARS — MỚI)

- **[UI-PROJ-02-5] (MỚI)** Required field labels shall render a
  trailing `*` character in `error` color.
- **[UI-PROJ-02-6] (MỚI)** The Create form shall group fields into 3
  visual sections: 基本情報 (customer/project name/description),
  期間・規模 (dates/team_size/total_man_month), 分類 (technologies/
  project_types).
- **[UI-PROJ-02-7] (MỚI)** `team_size`/`total_man_month` inputs shall
  display a fixed unit label ("名"/"人月") adjacent to the field.
- **[UI-PROJ-02-8] (MỚI)** The Create screen shall render a "キャンセル"
  link next to "作成する" that navigates to `/projects` without
  submitting.

---

## 5. Test mapping

| ID | Test case tương ứng |
|---|---|
| UI-SHELL-01 | `TC-SHELL-01: Sidebar hiện ở desktop, có mục プロジェクト一覧` |
| UI-SHELL-02 | `TC-SHELL-02: Item active khi ở route /projects` |
| UI-SHELL-03 | `TC-SHELL-03: Sidebar ẩn ở viewport <768px` |
| UI-PROJ-01-6 | `TC-PROJ-UI-10: Title row tách riêng khỏi toolbar row` |
| UI-PROJ-01-7 | `TC-PROJ-UI-11: Search box có class/style riêng, không dùng input-field` |
| UI-PROJ-01-8 | `TC-PROJ-UI-12: FilterDropdown mở/đóng, chọn checkbox gọi đúng API param` |
| UI-PROJ-01-9 | `TC-PROJ-UI-13: Mỗi giá trị 種別/技術 render badge riêng` |
| UI-PROJ-02-5 | `TC-PROJ-UI-14: Dấu * có class/màu error` |
| UI-PROJ-02-6 | `TC-PROJ-UI-15: 3 section card render đúng field` |
| UI-PROJ-02-7 | `TC-PROJ-UI-16: Đơn vị 名/人月 hiện cạnh input` |
| UI-PROJ-02-8 | `TC-PROJ-UI-17: Nút Huỷ điều hướng về /projects, không gọi API` |

## 6. Tham chiếu thiết kế (nếu có)

- Không có Figma/mockup — chốt qua brainstorm trực tiếp với Product
  owner (namlp), nguồn chân lý là nội dung EARS + state matrix ở trên.
