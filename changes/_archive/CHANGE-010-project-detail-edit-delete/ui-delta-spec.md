# UI Delta Spec — Xem chi tiết / Sửa / Xoá dự án

- **Ticket ID**: CHANGE-010
- **Module UI bị ảnh hưởng**: `specs/projects-ui.md`

## 1. Màn hình bị ảnh hưởng

- Chi tiết dự án — `/projects/:id` (MỚI)
- Sửa dự án — `/projects/:id/edit` (MỚI)
- List dự án — `/projects` (SỬA — thêm nút "詳細" mỗi row, hiện toast
  thành công sau khi điều hướng tới từ Create/Delete)
- Tạo dự án — `/projects/new` (SỬA — hiện toast thành công sau khi tạo,
  xem mục 2.5)
- Modal xác nhận xoá (MỚI — component dùng chung, không phải 1 route riêng)
- ToastHost (MỚI — component dùng chung trong `AppShell`, không phải 1
  route riêng)

## 2. Layout

### 2.1 Chi tiết dự án (`/projects/:id`)

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
確認元メモ         ○○○
           [編集]  [削除]
```

- Cùng layout 3-card + max-width 640px căn giữa như màn Create
  (`specs/projects-ui.md` mục 3.1), nhưng field hiển thị dạng text
  read-only (không phải input). 種別/技術 vẫn hiển thị Badge như List.
- Component dùng: Card (border outline-variant), Badge, Action Button
  Primary ("編集"), Action Button thứ 2 màu `error` cho "削除" — cần bổ
  sung biến thể "destructive" cho Action Button trong DESIGN.md nếu
  chưa có (xem mục 6).
- Nút "編集" điều hướng `/projects/:id/edit`. Nút "削除" mở Modal xác
  nhận (mục 2.3).

### 2.2 Sửa dự án (`/projects/:id/edit`)

- Layout giống hệt màn Create (`specs/projects-ui.md` mục 3.1), form
  điền sẵn giá trị hiện tại. Nút submit đổi label "更新する" thay vì
  "作成する". Nút "キャンセル" điều hướng về `/projects/:id` (Detail) thay
  vì `/projects` như Create.

### 2.3 Modal xác nhận xoá

```
┌──────────────────────────────┐
│  「{project_name}」を削除しますか？ │
│  この操作は取り消せません。        │
│                               │
│              [キャンセル] [削除する] │
└──────────────────────────────┘
```

- Component **Modal** (MỚI trong DESIGN.md, xem mục 6): backdrop
  `primary` 40% opacity phủ toàn màn hình, panel `surface-container-lowest`
  căn giữa. Đóng khi click backdrop hoặc nút "キャンセル", KHÔNG đóng khi
  click bên trong panel.
- Nút "削除する" dùng Action Button biến thể destructive (màu `error`).

### 2.4 List — thêm icon Detail

- Thêm 1 cột icon (kính lúp/mắt xem, KHÔNG phải link chữ "詳細") cuối
  mỗi row trong bảng List (`specs/projects-ui.md` mục 2.1), điều hướng
  tới `/projects/:id`. Accessible name giữ "詳細" qua `aria-label` (sửa
  từ bản nháp ban đầu dùng link chữ — feedback CHANGE-010: dùng icon
  cho gọn). Không thêm nút Sửa/Xoá trực tiếp ở List (quyết định của
  Product owner — Detail là nơi duy nhất chứa hành động Sửa/Xoá).

### 2.5 ToastHost — thông báo thành công

```
                                    ┌───────────────────────────┐
                                    │ 「サンプル案件」を作成しました │  ← .toast-success
                                    └───────────────────────────┘
                                                    góc dưới-phải màn hình, nổi trên nội dung
```

- Component **Toast** (MỚI trong DESIGN.md, xem mục 6) — biến thể
  `success` nền `tertiary-container`, text `on-tertiary` (KHÔNG phải
  `on-tertiary-container` — 2 tông xanh gần nhau cho tương phản kém,
  sửa lại từ bản nháp ban đầu theo feedback CHANGE-010) cạnh biến thể
  `error` hiện có (`.toast-error`, vẫn là banner đầu trang như cũ).
- Vị trí: cố định (`position: fixed`) góc dưới-phải màn hình, nổi trên
  nội dung — KHÔNG phải banner full-width đầu trang như `.toast-error`
  (sửa từ bản nháp ban đầu theo feedback CHANGE-010).
- Đặt trong `AppShell` (không phải từng page riêng) — đọc
  `location.state?.successMessage` khi route thay đổi, hiển thị 3 giây
  rồi tự ẩn, đồng thời clear `history.state` ngay khi hiển thị (tránh
  hiện lại khi back/refresh).
- Cơ chế truyền: trang gọi
  `navigate(path, { state: { successMessage: "..." } })` sau khi API
  thành công, thay vì `navigate(path)` đơn thuần.

## 3. Trạng thái màn hình (state matrix)

### Detail

| Trạng thái | Trigger | Hiển thị |
|---|---|---|
| Loading | Mount | Text "読み込み中..." |
| Not found | `GET /projects/:id` trả 404 | "プロジェクトが見つかりません" + link về `/projects` |
| Error | API lỗi khác | `.toast-error` |
| Loaded | Bình thường | 3-card read-only + nút 編集/削除 |
| Deleting | Đang gọi `DELETE /projects/:id` | Disable nút trong Modal, hiện loading trên nút "削除する" |
| Delete error | `DELETE` lỗi | Đóng Modal, hiện `.toast-error` trên Detail, giữ nguyên trang |
| Delete success | `204` | Điều hướng về `/projects` |

### Edit

| Trạng thái | Trigger | Hiển thị |
|---|---|---|
| Loading | Mount, đang fetch data cũ | Text "読み込み中..." |
| Idle | Data cũ load xong | Form điền sẵn giá trị, nút "更新する" |
| Validation error | Submit thiếu field bắt buộc / 進行中+終了日 mâu thuẫn | Giống Create (inline error, chặn submit) |
| Submitting | Đang gọi `PUT /projects/:id` | Disable toàn bộ input + nút |
| Server error | API lỗi | `.toast-error`, giữ nguyên dữ liệu đã sửa |
| Success | `200` | Điều hướng về `/projects/:id` (Detail) |

## 4. Hành vi tương tác (EARS)

- **[UI-PROJ-03-1] (MỚI)** When the Detail screen mounts, the system
  shall call `GET /projects/{id}` and show the Loading state until it
  resolves.
- **[UI-PROJ-03-2] (MỚI)** When `GET /projects/{id}` returns `404`, the
  system shall show a "not found" message with a link back to
  `/projects`.
- **[UI-PROJ-03-3] (MỚI)** The Detail screen shall render all project
  fields read-only, using the same 3-section grouping as the Create
  screen (基本情報/期間・規模/分類).
- **[UI-PROJ-03-4] (MỚI)** When the user clicks "削除" on the Detail
  screen, the system shall open a confirm Modal before calling
  `DELETE /projects/{id}`.
- **[UI-PROJ-03-5] (MỚI)** When the user confirms deletion in the
  Modal, the system shall call `DELETE /projects/{id}` and, on success,
  navigate to `/projects` with a success toast message
  ("「{project_name}」を削除しました").
- **[UI-PROJ-04-1] (MỚI)** When the Edit screen mounts, the system
  shall call `GET /projects/{id}` and pre-fill the form with the
  returned values.
- **[UI-PROJ-04-2] (MỚI)** When the user submits the Edit form with
  valid data, the system shall call `PUT /projects/{id}` and, on
  success, navigate to `/projects/:id` with a success toast message
  ("「{project_name}」を更新しました").
- **[UI-PROJ-04-3] (MỚI)** The Edit form shall reuse the same
  validation rules as the Create form (required fields, 進行中/終了日
  conflict).
- **[UI-PROJ-01-10] (MỚI)** The List table shall render a "詳細" icon
  (accessible name "詳細" qua `aria-label`) per row navigating to
  `/projects/:id`.
- **[UI-PROJ-02-9] (MỚI)** Disabled input/textarea (vd 終了日 khi
  進行中 checked) shall render with a visibly muted background/text
  color (`surface-container-low`/`on-surface-variant`), distinct from
  the normal state — trước đó disabled trông không khác gì bình
  thường (feedback CHANGE-010).
- **[UI-PROJ-02-10] (MỚI)** The technology tag suggestion dropdown
  shall render immediately below the input (không bị hint text chen
  giữa), with a background tint distinct from the input/panel
  (`surface-container-low`), hover item dùng `secondary-container`
  (feedback CHANGE-010).
- **[UI-PROJ-02-4] (SỬA)**
  - Cũ: When `POST /projects` succeeds, the system shall navigate to
    `/projects`.
  - Mới: When `POST /projects` succeeds, the system shall navigate to
    `/projects` with a success toast message
    ("「{project_name}」を作成しました").
- **[UI-SHELL-04] (MỚI)** The `AppShell` shall render a `ToastHost`
  that reads `successMessage` from router navigation state and shows a
  `.toast-success` banner (nền `tertiary-container`, text `on-tertiary`,
  vị trí cố định góc dưới-phải màn hình) for 3 seconds, clearing the
  navigation state immediately so it does not reappear on back/refresh.

## 5. Test mapping

| ID | Test case tương ứng |
|---|---|
| UI-PROJ-03-1..5 | `ProjectDetail.test.tsx` |
| UI-PROJ-04-1..3 | `ProjectEdit.test.tsx` |
| UI-PROJ-01-10 | `ProjectList.test.tsx` (case mới) |
| UI-PROJ-02-4 | `ProjectCreate.test.tsx` (case sửa) |
| UI-PROJ-02-9, UI-PROJ-02-10 | Xác minh thủ công (CSS, không có test tự động riêng) |
| UI-SHELL-04 | `ToastHost.test.tsx` |

## 6. Ghi chú DESIGN.md cần bổ sung

- Component **Modal / Confirm Dialog** (MỚI) — cấu trúc atomic: backdrop
  + panel + title + body + 2 action button. Token màu đã có sẵn ở mục
  Elevation & Depth, chỉ thiếu spec cấu trúc component.
- Action Button biến thể **destructive** (màu `error`) — nếu DESIGN.md
  hiện chưa có, bổ sung 1 dòng trong mục Action Button.
- Component **Toast** (MỚI) — chính thức hoá `.toast-error` đã tồn tại
  trong code nhưng chưa có trong DESIGN.md, và thêm biến thể `success`
  (token `tertiary-container`/`on-tertiary-container`). Cấu trúc: banner
  full-width trong `.app-page`, icon + text, tự ẩn sau 3s cho biến thể
  success (error giữ nguyên hành vi cũ — không tự ẩn, ẩn khi user sửa
  lại input/thử lại).

## 7. Tham chiếu thiết kế

- Không có Figma — theo đúng nguyên tắc CLAUDE.md mục 5, nguồn chân lý
  là nội dung text ở trên.
