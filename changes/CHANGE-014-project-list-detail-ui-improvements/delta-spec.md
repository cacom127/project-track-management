# Delta Spec — CHANGE-014-project-list-detail-ui-improvements

- **Ticket ID**: CHANGE-014-project-list-detail-ui-improvements
- **Module bị ảnh hưởng**: `specs/projects.md`, `specs/projects-ui.md`, `DESIGN.md`
- **Loại thay đổi**: ☑ Thêm mới &nbsp; ☑ Sửa &nbsp; ☐ Xoá

## 1. Yêu cầu thay đổi (EARS notation)

- **[PROJ-30] (MỚI)** `GET /projects/tech-tags` (không có query `q`)
  shall trả tối đa 200 tag (tăng từ 20), đủ cho toàn bộ catalog tech tag
  thực tế hiện có — tránh dropdown filter thiếu giá trị.

- **[UI-PROJ-01-12] (MỚI)** The technology filter dropdown panel shall
  render a text search input at the top that filters the option list
  client-side (case-insensitive substring match), and the panel shall
  have a fixed `max-height` with vertical scroll when options overflow.

- **[UI-PROJ-01-13] (MỚI)** The List screen shall render the current
  result count (`{total}件`) below the toolbar whenever `status ===
  "loaded"` and `total > 0`.

- **[UI-PROJ-01-14] (MỚI)** The List screen shall render a row of
  removable filter chips below the toolbar whenever at least one filter
  condition (search text, technology, project_type, or
  dev_process_phase) is active — one chip per individual value (not
  one per group). Clicking a chip's ✕ removes only that value from its
  filter (search chip clears the search text). A "すべてクリア" button
  clears all active conditions at once. Each chip's background/text
  color follows its category's `-fixed`/`-fixed-variant` DESIGN.md
  token pair (xem mục 1c), distinct from the bold badge colors used in
  the table/Detail screen. The search chip uses a neutral
  `surface-container-high` background (không thuộc category nào).

- **[UI-PROJ-03-8] (MỚI)** Free-text fields rendered on the Detail
  screen (`概要`, `成果・課題・解決策`, `確認元メモ`,
  `チーム体制の詳細`) shall preserve line breaks from the stored value:
  when the value contains 2+ non-empty lines, render as a bulleted list
  (1 `<li>` per line); when it contains exactly 1 line (or is
  empty/null), render as plain text (`—` if empty/null) — không hiện 1
  bullet đơn độc cho giá trị 1 dòng.

- **[UI-PROJ-03-9] (MỚI)** The Detail screen shall group
  `成果・課題・解決策` (`outcome_note`) and `確認元メモ`
  (`source_note`) into a 4th `form-group-card` section titled `その他`,
  matching the visual style of `基本情報`/`期間・規模`/`分類`.

- **[UI-PROJ-03-10] (SỬA)**
  - Cũ: badge `開発工程` dùng `variant="type"` (cùng màu `種別`).
  - Mới: badge `開発工程` dùng variant mới `"phase"`
    (`primary-container`/`on-primary-container`) — phân biệt màu với
    `種別` trên cả List (nếu có) và Detail.

- **[UI-PROJ-02-15] (MỚI)** `ProjectForm` (dùng chung cho Create/Edit)
  shall prevent the native Enter-key submit behavior when focus is on
  any `<input>` element inside the form (không áp dụng cho
  `<textarea>` — Enter trong textarea vốn chỉ xuống dòng, không submit
  — và không áp dụng khi Enter được nhấn trực tiếp trên nút submit).

## 1b. Thay đổi Data Model (nếu có)

Không có — ticket này không thêm/sửa field/bảng.

## 1c. UI chi tiết

**Filter chip color tokens (mới dùng, đã có sẵn giá trị trong
`DESIGN.md`, chưa gán cho component nào trước đây):**

| Category | Background | Text |
|---|---|---|
| 技術 | `tertiary-fixed` (`#9ff5c1`) | `on-tertiary-fixed-variant` (`#005231`) |
| 種別 | `secondary-fixed` (`#d3e4ff`) | `on-secondary-fixed-variant` (`#004881`) |
| 開発工程 | `primary-fixed` (`#d6e3ff`) | `on-primary-fixed-variant` (`#2d476f`) |
| 検索 (search) | `surface-container-high` (`#dee8ff`) | `on-surface` (`#121c2c`) |

Badge variant mới `"phase"` (dùng ở Detail cho 開発工程, KHÁC với chip
filter ở trên — badge dùng màu đậm `primary-container`/
`on-primary-container` giống cách `type`/`tech` badge hiện có, còn chip
filter dùng bản `-fixed` nhạt hơn để phân biệt 2 ngữ cảnh):

| Badge variant | Background | Text |
|---|---|---|
| `phase` (mới) | `primary-container` (`#1a365d`) | `on-primary-container` (`#86a0cd`) |

`MultilineText` component (mới, `frontend/src/components/MultilineText.tsx`):
- Input: `value: string | null | undefined`.
- Tách theo `\n`, `trim()` mỗi dòng, bỏ dòng rỗng.
- 0 dòng → render `—`.
- 1 dòng → render dòng đó dạng text thường (không bullet).
- ≥2 dòng → render `<ul className="multiline-list">` với 1 `<li>`/dòng.

## 2. Acceptance criteria / Test mapping

| ID | Test case tương ứng |
|---|---|
| PROJ-30 | `test_search_tech_tags_returns_up_to_200_without_q` |
| UI-PROJ-01-12 | `ProjectList.test.tsx`: gõ vào ô search trong dropdown lọc đúng option, panel có scroll khi nhiều option |
| UI-PROJ-01-13 | `ProjectList.test.tsx`: hiện `"N件"` khi có data |
| UI-PROJ-01-14 | `ProjectList.test.tsx`: chip hiện đúng theo từng filter, click ✕ xoá đúng 1 value, nút "すべてクリア" xoá hết |
| UI-PROJ-03-8 | `ProjectDetail.test.tsx`: giá trị nhiều dòng render `<li>`, giá trị 1 dòng không render bullet |
| UI-PROJ-03-9 | `ProjectDetail.test.tsx`: `その他` section chứa 成果・課題・解決策 + 確認元メモ |
| UI-PROJ-03-10 | `ProjectDetail.test.tsx`: badge 開発工程 có class `badge-phase`, khác `badge-type` |
| UI-PROJ-02-15 | `ProjectCreate.test.tsx`/`ProjectEdit.test.tsx`: nhấn Enter trong input 顧客名 không gọi `createProject`/`updateProject` |

## 3. Ghi chú cho AI agent khi implement

- Không đổi API contract của `GET /projects` — chỉ đổi giới hạn nội bộ
  của `search_tech_tags` khi `q` rỗng.
- `MultilineText` dùng chung cho cả 4 field ở Detail — viết 1 lần, test
  riêng component này thay vì lặp lại logic trong `ProjectDetail.test.tsx`.
- Filter chip xoá theo giá trị đơn lẻ — với nhóm multi-select
  (technology/projectType/devProcessPhase), xoá 1 chip = filter mảng bỏ
  đúng 1 giá trị, giữ nguyên các giá trị khác đã chọn.
- Cập nhật `DESIGN.md` (thêm đoạn mô tả filter chip + badge `phase`
  dùng token nào) TRƯỚC khi viết CSS — theo CLAUDE.md mục 3, không
  hardcode giá trị màu trực tiếp trong `index.css` mà không có trong
  `DESIGN.md`.
