# Delta Spec — Giữ điều kiện tìm kiếm List khi back từ Detail

- **Ticket ID**: CHANGE-019-preserve-list-search-state
- **Module bị ảnh hưởng**: `specs/projects-ui.md` (màn List)
- **Loại thay đổi**: ☐ Thêm mới &nbsp; ☑ Sửa &nbsp; ☐ Xoá

## 1. Yêu cầu thay đổi (EARS notation)

- **[UI-PROJ-01-24] (MỚI)** The List screen shall sync its search/filter
  state (`q`, `page`, `technology`, `project_type`, `dev_process_phase`)
  to the URL query string (`useSearchParams`, replace — không tạo thêm
  history entry mỗi lần gõ/lọc) and initialize its state from the URL on
  mount.

- **[UI-PROJ-01-25] (MỚI)** When the user navigates back (browser back
  button) from the Detail screen to the List screen, the system shall
  restore the exact search/filter state and page that was active before
  navigating away — hệ quả tự nhiên của UI-PROJ-01-24 (URL cũ vẫn còn
  nguyên query, không cần code riêng ở Detail).

- **[UI-PROJ-01-26] (MỚI)** When the user navigates to the List screen
  via the Sidebar nav item ("プロジェクト一覧", đường dẫn `/projects`
  không kèm query), the system shall reset to the default (empty)
  search/filter state — phân biệt rõ với hành vi "back" ở
  UI-PROJ-01-25 (bấm menu = bắt đầu lại, quyết định của user).

## 1b. Thay đổi Data Model (nếu có)

Không có — thay đổi thuần state UI phía frontend, không đụng entity/bảng.

## 2. Acceptance criteria / Test mapping

| ID            | Test case tương ứng (file/tên)                                          |
|---------------|----------------------------------------------------------------------------|
| UI-PROJ-01-24 | `ProjectList.test.tsx: syncs q/page/filters to the URL query string`      |
| UI-PROJ-01-25 | `ProjectList.test.tsx: restores state from URL on mount (simulated back)` |
| UI-PROJ-01-26 | `ProjectList.test.tsx: resets to default state when URL has no query`    |

## 3. Ghi chú cho AI agent khi implement

- Chỉ sửa `frontend/src/pages/ProjectList.tsx` (+ test tương ứng) —
  KHÔNG đụng `Sidebar.tsx`, `ProjectDetail.tsx`, `ProjectEdit.tsx`.
  Detail hiện không có nút "戻る" ở trạng thái bình thường (chỉ có ở
  trạng thái not-found) — người dùng quay lại bằng nút back của browser,
  nên chỉ cần đồng bộ URL ở List là đủ, browser back tự khôi phục.
- Dùng `useSearchParams` (react-router) với `{ replace: true }` khi
  cập nhật — tránh phình history mỗi lần gõ ký tự tìm kiếm/đổi filter.
- Query param key gợi ý: `q`, `page` (bỏ nếu =1), `technology`, `type`,
  `phase` (join bằng dấu phẩy, bỏ nếu rỗng) — giữ URL gọn khi không có
  filter nào (bare `/projects`, khớp với hành vi UI-PROJ-01-26 khi bấm
  menu sidebar).
- **Bug cần tránh khi cài đặt**: effect debounce search hiện tại
  (`useEffect` trên `q`, set `debouncedQ` + `setPage(1)` sau 300ms) chạy
  cả ở lần mount đầu tiên — nếu không chặn, nó sẽ ghi đè `page` vừa
  khôi phục từ URL về lại `1` ngay sau khi mount. Cần bỏ qua việc reset
  `page` ở lần chạy effect đầu tiên (vd dùng 1 `ref` đánh dấu đã qua lần
  mount đầu).
