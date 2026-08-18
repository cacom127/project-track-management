# Delta Spec — Xem chi tiết / Sửa / Xoá dự án

- **Ticket ID**: CHANGE-010
- **Module bị ảnh hưởng**: `specs/projects.md`
- **Loại thay đổi**: ☑ Thêm mới &nbsp; ☐ Sửa &nbsp; ☐ Xoá

## 1. Yêu cầu thay đổi (EARS notation)

- **[PROJ-14] (MỚI)** When an authenticated user requests
  `GET /projects/{id}`, the system shall return the full project object
  (same shape as `ProjectOut`), or `404` if the id does not exist or is
  soft-deleted (`deleted_at IS NOT NULL`).
- **[PROJ-15] (MỚI)** When an authenticated user submits
  `PUT /projects/{id}` with valid data, the system shall replace all
  fields of the project (including full replace of `technologies`/
  `project_types` associations) and return `200` with the updated
  object. Áp dụng lại toàn bộ validation đã có ở `POST /projects`
  (PROJ-06, PROJ-07, PROJ-08), và trả `404` nếu id không tồn tại/đã bị
  xoá.
- **[PROJ-16] (MỚI)** When an authenticated user submits
  `DELETE /projects/{id}`, the system shall set `deleted_at = now()`
  (soft delete) and return `204`. Bảng nối `project_tech_tags`/
  `project_project_types` KHÔNG bị xoá theo (giữ lịch sử). Trả `404`
  nếu id không tồn tại/đã bị xoá.
- **[PROJ-17] (MỚI)** `GET /projects` (list) shall exclude soft-deleted
  projects (`deleted_at IS NOT NULL`) from results and from `total`
  count — sửa `list_projects`/`_build_where` thêm điều kiện này.

## 1b. Thay đổi Data Model

- **[DM-PROJ-05] (MỚI — field)** Thêm field `projects.deleted_at`
  (timestamptz, nullable, default `NULL`) — map vào `specs/projects.md`
  mục Data Model. Không phải bảng mới, không cần sửa
  `specs/data-model.md`.

## 1c. Thay đổi UI

Xem `ui-delta-spec.md` (nhiều màn hình mới, tách riêng theo CLAUDE.md
mục 5).

## 2. Acceptance criteria / Test mapping

| ID      | Test case tương ứng (file/tên)                              |
|---------|---------------------------------------------------------------|
| PROJ-14 | `test_get_project_returns_full_object`, `test_get_project_404_when_not_found_or_deleted` |
| PROJ-15 | `test_update_project_replaces_all_fields`, `test_update_project_replaces_tech_and_type_associations`, `test_update_project_validates_ongoing_end_date`, `test_update_project_404_when_not_found` |
| PROJ-16 | `test_delete_project_sets_deleted_at`, `test_delete_project_404_when_not_found` |
| PROJ-17 | `test_list_projects_excludes_soft_deleted` |

## 3. Ghi chú cho AI agent khi implement

- Migration mới cần chạy qua `apply_migration_via_data_api.py` khi
  deploy production (giống `CHANGE-007`/`CHANGE-008`) — nhắc user chạy
  script này sau khi merge, KHÔNG tự động chạy.
- `PUT /projects/{id}` là full-replace (không phải PATCH từng field) —
  giữ đúng cho cả `technologies`/`project_types`: xoá hết mapping cũ
  rồi insert lại theo payload mới, tái dùng `_fetch_or_create_tag_ids`/
  `_fetch_project_type_ids` đã có trong `repository.py`.
- Không thêm bất kỳ kiểm tra phân quyền/role nào (ngoài phạm vi, xem
  proposal.md mục 3).
