# UI Delta Spec — CHANGE-007-projects-list-create

- **Ticket ID**: CHANGE-007-projects-list-create
- **Module UI bị ảnh hưởng**: `specs/projects-ui.md` (MỚI — chưa tồn tại)

## 1. Màn hình bị ảnh hưởng

- List dự án — route `/projects` (MỚI)
- Tạo dự án — route `/projects/new` (MỚI)

## 2. Layout

### 2a. List (`/projects`)

```
┌─────────────────────────────────────────────────────┐
│ Header (đã có: email/role + logout)                  │
├─────────────────────────────────────────────────────┤
│ [🔍 検索..............] [技術 ▾] [種別 ▾]            │
│                                    [+ 新規プロジェクト] │
├─────────────────────────────────────────────────────┤
│ 顧客名|ﾌﾟﾛｼﾞｪｸﾄ名|概要|期間|種別|技術|人数|総人月        │
│ ------ | -------- | ---- | ---- | ---- | ---- | ---- | ---- │
│ ...    | ...      | ...  | ...  | ...  | ...  | ...  | ...  │
├─────────────────────────────────────────────────────┤
│              ‹ 1 2 3 4 ›  (pagination)                │
└─────────────────────────────────────────────────────┘
```

Cột hiển thị (8 cột, theo đúng thứ tự trên): `customer_name`,
`project_name`, `description` (rút gọn), `start_date`〜`end_date` (hoặc
"進行中" nếu `is_ongoing`), `project_types`, `technologies`, `team_size`,
`total_man_month`.

- `description` rút gọn 1 dòng bằng CSS `text-overflow: ellipsis`
  (`white-space: nowrap; overflow: hidden`), không giới hạn cứng theo số
  ký tự — không có tooltip/xem đầy đủ ở ticket này (chờ màn Detail).
- `team_size`/`total_man_month` hiển thị rỗng ("—") nếu `null`, không
  hiển thị "0" gây hiểu nhầm.
- Component dùng: `.input-field` (ô search), `.button-primary` (nút
  "新規プロジェクト"), table dùng style mặc định hiện có (chưa có token
  table riêng trong `DESIGN.md` — nếu cần thêm, cập nhật `DESIGN.md`
  trước theo CLAUDE.md mục 3, không hardcode trong lúc code ticket này).
- Row trong bảng KHÔNG có hành động click ở ticket này (detail/edit để
  ticket sau) — con trỏ chuột giữ mặc định, không hiện dạng "clickable".

### 2b. Tạo dự án (`/projects/new`)

```
┌─────────────────────────────────┐
│ Header                          │
├─────────────────────────────────┤
│ 顧客名 *        [___________]   │
│ プロジェクト名 * [___________]   │
│ 概要            [___________]   │
│                 [___________]   │
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
│                                  │
│           [作成する]            │
└─────────────────────────────────┘
```

- Component dùng: `.input-field`/`.input-field-error`, `.button-primary`,
  `.toast-error` (lỗi server), single-column layout giống `Login`/
  `ChangePassword` đã có.
- Field bắt buộc đánh dấu `*`.

## 3. Trạng thái màn hình (state matrix)

### List

| Trạng thái | Trigger | Hiển thị |
|---|---|---|
| Loading | Mount / đổi filter / đổi trang | Skeleton hoặc spinner giữa bảng |
| Empty | `total === 0` | "プロジェクトが見つかりません" + nếu đang có filter/search thì thêm gợi ý xoá điều kiện lọc |
| Error | API lỗi | `.toast-error`, giữ nguyên filter/search đã nhập |
| Loaded | Bình thường | Bảng + pagination |

### Tạo dự án

| Trạng thái | Trigger | Hiển thị |
|---|---|---|
| Idle | Mount | Form trống, nút "作成する" |
| Validation error | Submit thiếu field bắt buộc, hoặc 進行中 checked mà vẫn có 終了日 | Inline error dưới field tương ứng, chặn submit (check FE trước khi gọi API) |
| Submitting | Đang gọi `POST /projects` | Disable toàn bộ input + nút |
| Server error | API trả lỗi (validate 400 hoặc lỗi khác) | `.toast-error`, giữ nguyên dữ liệu đã nhập |
| Success | `201` | Redirect về `/projects`; project mới nằm ở đầu danh sách (sort `created_at desc` mặc định) |

## 4. Hành vi tương tác (EARS)

- **[UI-PROJ-01-1] (MỚI)** When the List screen mounts, the system shall
  call `GET /projects` with default paging and show the Loading state
  until the response resolves.
- **[UI-PROJ-01-2] (MỚI)** When the user types in the search box, the
  system shall debounce 300ms before calling `GET /projects` with the
  updated `q` param, resetting to page 1.
- **[UI-PROJ-01-3] (MỚI)** When the user selects a value in the
  technology or loại hình filter, the system shall call `GET /projects`
  with the updated filter params, resetting to page 1.
- **[UI-PROJ-01-4] (MỚI)** When `total === 0`, the system shall show the
  Empty state instead of an empty table.
- **[UI-PROJ-01-5] (MỚI)** The List table shall render 8 columns per
  row: `customer_name`, `project_name`, `description` (single-line,
  ellipsis-truncated), `start_date`〜`end_date` (or "進行中" when
  `is_ongoing`), `project_types`, `technologies`, `team_size`,
  `total_man_month` — the last two rendered as "—" when `null`.
- **[UI-PROJ-02-1] (MỚI)** When the user checks "進行中" on the Create
  screen, the system shall clear and disable the 終了日 field.
- **[UI-PROJ-02-2] (MỚI)** When the user submits the Create form with a
  missing required field, the system shall show an inline error under
  that field and shall NOT call the API.
- **[UI-PROJ-02-3] (MỚI)** When the user types a new value into the
  technology tag input, the system shall call `GET /tech-tags?q=` to
  show matching existing tags, allowing the user to pick one or keep
  typing a new tag.
- **[UI-PROJ-02-4] (MỚI)** When `POST /projects` succeeds, the system
  shall navigate to `/projects`.

## 5. Test mapping

| ID | Test case tương ứng |
|---|---|
| UI-PROJ-01-1 | `TC-PROJ-UI-01: List gọi API đúng khi mount` |
| UI-PROJ-01-2 | `TC-PROJ-UI-02: Search debounce 300ms` |
| UI-PROJ-01-3 | `TC-PROJ-UI-03: Filter reset về page 1` |
| UI-PROJ-01-4 | `TC-PROJ-UI-04: Empty state hiển thị đúng` |
| UI-PROJ-01-5 | `TC-PROJ-UI-09: Bảng render đủ 8 cột, team_size/total_man_month null hiển thị "—"` |
| UI-PROJ-02-1 | `TC-PROJ-UI-05: Checkbox 進行中 disable 終了日` |
| UI-PROJ-02-2 | `TC-PROJ-UI-06: Validate field bắt buộc trước khi gọi API` |
| UI-PROJ-02-3 | `TC-PROJ-UI-07: Autocomplete tech tag` |
| UI-PROJ-02-4 | `TC-PROJ-UI-08: Submit thành công redirect về /projects` |

## 6. Tham chiếu thiết kế (nếu có)

- Không có Figma/mockup — thiết kế chốt qua brainstorm trực tiếp, nguồn
  chân lý là nội dung EARS + state matrix ở trên.
