# Module: Projects — UI (Current Truth)

> Layout/state/hành vi tương tác của module `projects`. Token màu/font/
> component xem `DESIGN.md` — file này KHÔNG lặp lại giá trị màu/font
> cụ thể, chỉ tham chiếu tên token.

## 1. Danh sách màn hình thuộc module này

| Màn hình      | Route/Screen name | Mô tả ngắn                          |
|----------------|----------------------|----------------------------------------|
| List dự án     | `/projects`          | Bảng dự án, search/filter, pagination   |
| Tạo dự án      | `/projects/new`      | Form tạo project mới                    |

---

## 2. Màn hình: List dự án

### 2.1 Layout

```
┌─────────────────────────────────────────────────────┐
│ Header (email/role + logout)                          │
├─────────────────────────────────────────────────────┤
│ [🔍 検索..............] [技術 ▾] [種別 ▾]            │
│                                    [+ 新規プロジェクト] │
├─────────────────────────────────────────────────────┤
│顧客名|ﾌﾟﾛｼﾞｪｸﾄ名|概要|期間|種別|技術|人数|総人月        │
│ ------ | -------- | ---- | ---- | ---- | ---- | ---- | ---- │
│ ...    | ...      | ...  | ...  | ...  | ...  | ...  | ...  │
├─────────────────────────────────────────────────────┤
│              ‹ 1 2 3 4 ›  (pagination)                │
└─────────────────────────────────────────────────────┘
```

8 cột theo đúng thứ tự trên: `customer_name`, `project_name`,
`description` (rút gọn 1 dòng bằng ellipsis, không tooltip),
`start_date`〜`end_date` (hoặc "進行中" nếu `is_ongoing`), `project_types`,
`technologies`, `team_size`, `total_man_month`. `team_size`/
`total_man_month` hiển thị "—" nếu `null`.

- Component dùng: `.input-field` (ô search), `.button-primary` (nút
  "新規プロジェクト"), Data Table theo `DESIGN.md` mục Components (border
  bottom outline-variant mỗi row, header nền surface-container-low,
  hover row nền surface-container-low), pagination dùng Action Button
  Secondary/Ghost.
- Row KHÔNG có hành động click (detail/edit để ticket sau).
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

---

## 3. Màn hình: Tạo dự án

### 3.1 Layout

```
┌─────────────────────────────────┐
│ Header                          │
├─────────────────────────────────┤
│ 顧客名 *        [___________]   │
│ プロジェクト名 * [___________]   │
│ 概要            [___________]   │
│ 開始日 *        [__/__/____]    │
│ ☐ 進行中                        │
│ 終了日          [__/__/____]    │ ← disable khi 進行中 checked
│ 人数            [___]           │
│ 総人月          [___]           │
│ 技術            [tag input....] │
│ 種別            [☐offshore ☐ses │
│                  ☐lab ☐new_dev  │
│                  ☐maintenance]  │
│ 確認元メモ      [___________]   │
│           [作成する]            │
└─────────────────────────────────┘
```

- Component dùng: `.input-field`/`.input-field-error`, `.button-primary`,
  `.toast-error`, Filter Chip (tag công nghệ đã chọn, `radius-lg`), single
  -column layout giống `Login`/`ChangePassword`.
- Field bắt buộc đánh dấu `*`. Tag công nghệ có autocomplete gọi
  `GET /tech-tags?q=` khi gõ.

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
  typing a new tag.
- **[UI-PROJ-02-4]** When `POST /projects` succeeds, the system shall
  navigate to `/projects`.

---

## 4. Lịch sử thay đổi module này

| Ngày       | Ticket ID                       | Thay đổi                                    |
|------------|-----------------------------------|--------------------------------------------------|
| 2026-08-18 | CHANGE-007-projects-list-create  | Khởi tạo: màn List + Tạo dự án (UI-PROJ-01/02) |

<!-- Trỏ về changes/_archive/CHANGE-007-projects-list-create/ để xem đầy đủ ui-delta-spec gốc -->
