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

- **[UI-PROJ-03-8] (MỚI, SỬA sau feedback)** Free-text fields rendered
  on the Detail screen (`概要`, `成果・課題・解決策`, `確認元メモ`,
  `チーム体制の詳細`) shall preserve line breaks from the stored value
  via CSS `white-space: pre-wrap` (`—` if empty/null).
  - Cũ (thử đầu tiên): ≥2 dòng render dạng bullet list (`<ul>`/`<li>`).
  - Mới: KHÔNG chuyển thành list — bullet gây hiểu nhầm với field dạng
    đoạn văn tự do như `概要` (phát hiện qua feedback thực tế). Xuống
    dòng giữ nguyên như văn bản thường, không có dấu `•`.

- **[UI-PROJ-03-11] (MỚI)** Each field within a Detail screen block
  (基本情報/期間・規模/分類/その他) shall render its label above its
  value (component `DetailField`), with a thin `outline-variant`
  border between consecutive fields in the same block (không có border
  sau field cuối) — giúp nhận biết ranh giới từng field khi giá trị dài
  nhiều dòng.

- **[UI-PROJ-03-9] (MỚI)** The Detail screen shall group
  `成果・課題・解決策` (`outcome_note`) and `確認元メモ`
  (`source_note`) into a 4th `form-group-card` section titled `その他`,
  matching the visual style of `基本情報`/`期間・規模`/`分類`.

- **[UI-PROJ-03-10] (SỬA)**
  - Cũ: badge `開発工程` dùng `variant="type"` (cùng màu `種別`).
  - Mới: badge `開発工程` dùng variant mới `"phase"`
    (`phase-container`/`on-phase-container`, hệ hổ phách riêng) — phân
    biệt màu với `種別` trên cả List (nếu có) và Detail.

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
| 開発工程 | `phase-fixed` (`#ffe4a8`) | `on-phase-fixed-variant` (`#6b4a00`) |
| 検索 (search) | `surface-container-high` (`#dee8ff`) | `on-surface` (`#121c2c`) |

> **(SỬA)** Ban đầu 開発工程 dùng `primary-fixed`/`on-primary-fixed-variant`
> (tái dùng token có sẵn), nhưng `primary-fixed` (`#d6e3ff`) và
> `secondary-fixed` (`#d3e4ff`) quá giống nhau — phát hiện qua feedback
> thực tế sau khi triển khai. Đổi sang hệ hổ phách/vàng nâu riêng
> (`phase-container`/`phase-fixed`, token MỚI, không tái dùng
> `primary`) để tách biệt hẳn khỏi cả 種別 (xanh dương) và 技術 (xanh lá).

Badge variant mới `"phase"` (dùng ở Detail cho 開発工程, KHÁC với chip
filter ở trên — badge dùng màu đậm, còn chip filter dùng bản `-fixed`
nhạt hơn để phân biệt 2 ngữ cảnh, cùng hệ hổ phách):

| Badge variant | Background | Text |
|---|---|---|
| `phase` (mới) | `phase-container` (`#6b4a00`) | `on-phase-container` (`#ffcf6b`) |

`MultilineText` component (`frontend/src/components/MultilineText.tsx`):
- Input: `value: string | null | undefined`.
- `trim()` toàn bộ giá trị, rỗng → render `—`.
- Còn lại → render trong `<span className="multiline-text">` (CSS
  `white-space: pre-wrap` giữ xuống dòng, không tạo `<ul>`/`<li>`).

`DetailField` component (`frontend/src/components/DetailField.tsx`):
- Props: `label: string`, `children: ReactNode`.
- Render `<div className="detail-field"><span className="detail-field-label">{label}</span><div className="detail-field-value">{children}</div></div>`.
- CSS: `.detail-field` có `border-bottom` mảnh (`outline-variant`) +
  spacing, `:last-child` bỏ border/spacing dưới.
- Dùng cho MỌI field ở `ProjectDetail.tsx` (kể cả field hiển thị badge
  như 技術/種別/開発工程 — `children` nhận list `<Badge>`).

## 2. Acceptance criteria / Test mapping

| ID | Test case tương ứng |
|---|---|
| PROJ-30 | `test_search_tech_tags_returns_up_to_200_without_q` |
| UI-PROJ-01-12 | `ProjectList.test.tsx`: gõ vào ô search trong dropdown lọc đúng option, panel có scroll khi nhiều option |
| UI-PROJ-01-13 | `ProjectList.test.tsx`: hiện `"N件"` khi có data |
| UI-PROJ-01-14 | `ProjectList.test.tsx`: chip hiện đúng theo từng filter, click ✕ xoá đúng 1 value, nút "すべてクリア" xoá hết |
| UI-PROJ-03-8 | `MultilineText.test.tsx` + `ProjectDetail.test.tsx`: giá trị nhiều dòng KHÔNG render `<ul>`/`<li>`, giữ nguyên xuống dòng |
| UI-PROJ-03-9 | `ProjectDetail.test.tsx`: `その他` section chứa 成果・課題・解決策 + 確認元メモ |
| UI-PROJ-03-11 | `DetailField.test.tsx` + `ProjectDetail.test.tsx`: label/value là 2 element riêng, có class `detail-field-label`/`detail-field-value` |
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
