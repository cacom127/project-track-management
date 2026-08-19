# Delta Spec — Thêm field mô tả chi tiết チーム体制

- **Ticket ID**: CHANGE-013
- **Module bị ảnh hưởng**: `specs/projects.md`
- **Loại thay đổi**: ☑ Thêm mới

## 1. Yêu cầu thay đổi (EARS notation)

- **[PROJ-27] (MỚI)** `POST /projects`/`PUT /projects/{id}` shall accept
  an optional `team_composition_note` (string, free text, no validation
  catalog), stored as-is — mô tả chi tiết vai trò trong team (vd "PM：1名、
  BrSE 1名、開発者：5名、テスター：4名"), bổ sung cho `team_size` (chỉ 1
  con số tổng).
- **[PROJ-28] (MỚI)** `GET /projects/{id}`, list item, và response của
  create/update shall include `team_composition_note`.
- **[PROJ-29] (MỚI)** `GET /projects` (list) shall include
  `team_composition_note` in the `q` keyword search (ILIKE, cùng nhóm
  với PROJ-24) — nội dung có thể chứa từ khoá hữu ích (vd tên vai trò
  "テクニカーリーダー").

## 1b. Thay đổi Data Model

- **[DM-PROJ-09] (MỚI — field)** Thêm field `projects.team_composition_note`
  (text, nullable) — map vào `specs/projects.md` mục Data Model. Field
  của entity đã tồn tại (`projects`) → KHÔNG cần sửa `specs/data-model.md`.

## 1c. Thay đổi UI

- Create/Edit (`ProjectForm`): thêm textarea "チーム体制の詳細" cạnh
  `人数`/`総人月` trong section 期間・規模.
- Detail (`ProjectDetail`): hiển thị read-only cùng vị trí, "—" nếu
  `null`.
- Không thêm cột/search mới ở List (ngoài phạm vi, giống cách xử lý
  `outcome_note` ở `CHANGE-012` — chỉ thêm vào `q` search nếu cần, xem
  mục 3 ghi chú).

## 2. Acceptance criteria / Test mapping

| ID      | Test case tương ứng                                                |
|---------|------------------------------------------------------------------------|
| PROJ-27 | `test_create_project_with_team_composition_note`, `test_update_project_replaces_team_composition_note` |
| PROJ-28 | `test_get_project_includes_team_composition_note` |
| PROJ-29 | `test_list_projects_search_matches_team_composition_note` |

## 3. Ghi chú cho AI agent khi implement

- Field tự do (free text), không catalog, không validation — pattern y
  hệt `outcome_note` (`CHANGE-012`), tái dùng cách làm tương tự (thêm
  cột scalar đơn giản, không cần bảng nối).
- Migration mới cần chạy qua `apply_migration_via_data_api.py` khi
  deploy production (nhắc user, KHÔNG tự chạy).
