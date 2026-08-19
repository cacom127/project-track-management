# UI Delta Spec — Bổ sung field cho dự án (industry/outcome/dev process)

- **Ticket ID**: CHANGE-012
- **Module UI bị ảnh hưởng**: `specs/projects-ui.md`

## 1. Màn hình bị ảnh hưởng

- Tạo dự án — `/projects/new` (SỬA — thêm `industry`/`dev_process_phases`/`outcome_note`)
- Sửa dự án — `/projects/:id/edit` (SỬA — cùng field, dùng chung `ProjectForm`)
- Chi tiết dự án — `/projects/:id` (SỬA — hiển thị read-only 3 field mới)
- List dự án — `/projects` (SỬA — mở rộng search, thêm filter dropdown 開発工程)

## 2. Layout

### 2.1 Create/Edit (`ProjectForm`)

```
┌─ 基本情報 ──────────────────────┐
│ 顧客名 *        [___________]   │
│ プロジェクト名 * [___________]   │
│ 概要            [___________]   │
│ 業種            [___________]   │  ← MỚI
└─────────────────────────────────┘
...(期間・規模 giữ nguyên)...
┌─ 分類 ──────────────────────────┐
│ 技術            [tag input....] │
│ 種別            [☐offshore ...] │
│ 開発工程         [☐要件定義 ...] │  ← MỚI, cùng dạng checkbox với 種別
└─────────────────────────────────┘
...(画像添付 giữ nguyên)...
成果・課題・解決策 [___________]   │  ← MỚI, textarea, cạnh 確認元メモ
確認元メモ        [___________]
           [作成する]  [キャンセル]
```

- `業種`: input text đơn giản (giống `.input-field`), không bắt buộc.
- `開発工程`: `<fieldset>` + checkbox, style giống hệt `種別` hiện có
  (label "開発工程", 6 option cố định).
- `成果・課題・解決策`: textarea (giống `概要`), đặt cạnh `確認元メモ`
  cuối form.

### 2.2 Detail (read-only)

Hiển thị thêm 3 dòng text trong đúng section tương ứng: `業種` trong
基本情報 (sau 概要), `開発工程` trong 分類 (dạng Badge giống 種別, tông
`secondary-container`), `成果・課題・解決策` cạnh 確認元メモ.

### 2.3 List — search/filter

```
[🔍 検索......] [技術 ▾] [種別 ▾] [開発工程 ▾]  ← filter mới cuối cùng
```

- Ô tìm kiếm hiện tại (`q`) tự động bao phủ thêm `industry`/
  `outcome_note` — KHÔNG đổi UI, chỉ đổi hành vi backend (PROJ-24).
- Thêm `FilterDropdown` mới "開発工程" (component đã có sẵn, tái dùng y
  hệt cách 種別/技術 đang dùng) — OR semantics.

## 3. Hành vi tương tác (EARS)

- **[UI-PROJ-02-12] (MỚI)** The Create/Edit form shall render an
  optional `業種` text input in 基本情報, and an optional `成果・課題・
  解決策` textarea near `確認元メモ`.
- **[UI-PROJ-02-13] (MỚI)** The Create/Edit form shall render `開発工程`
  as a checkbox group (fixed catalog: 要件定義/設計/実装/テスト/リリース/
  保守運用) in 分類, giống cấu trúc `種別`.
- **[UI-PROJ-03-6] (MỚI)** The Detail screen shall render `業種`,
  `開発工程` (dạng Badge), and `成果・課題・解決策` read-only in their
  respective sections.
- **[UI-PROJ-01-11] (MỚI)** The List toolbar shall render an additional
  `FilterDropdown` for `開発工程` (OR semantics), alongside 技術/種別.

## 4. Test mapping

| ID | Test case tương ứng |
|---|---|
| UI-PROJ-02-12/13 | `ProjectForm.test.tsx` (case mới) |
| UI-PROJ-03-6 | `ProjectDetail.test.tsx` (case mới) |
| UI-PROJ-01-11 | `ProjectList.test.tsx` (case mới) |

## 5. Ghi chú DESIGN.md

Không cần bổ sung — tái dùng toàn bộ component/token đã có (`.input-field`,
`fieldset`/checkbox, `Badge`, `FilterDropdown`, textarea).

## 6. Tham chiếu thiết kế

- Không có Figma — nguồn chân lý là nội dung text ở trên.
