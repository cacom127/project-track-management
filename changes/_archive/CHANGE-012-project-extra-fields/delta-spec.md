# Delta Spec — Bổ sung field cho dự án (industry/outcome/dev process)

- **Ticket ID**: CHANGE-012
- **Module bị ảnh hưởng**: `specs/projects.md`
- **Loại thay đổi**: ☑ Thêm mới &nbsp; ☑ Sửa (PROJ-04)

## 1. Yêu cầu thay đổi (EARS notation)

- **[PROJ-22] (MỚI)** `POST /projects`/`PUT /projects/{id}` shall accept
  optional `industry` (string, free text) and `outcome_note` (string,
  free text) fields, stored as-is (no validation catalog).
- **[PROJ-23] (MỚI)** `POST /projects`/`PUT /projects/{id}` shall accept
  an optional `dev_process_phases` list, validated against the fixed
  catalog (`requirements`, `design`, `implementation`, `testing`,
  `release`, `maintenance_ops`) — trả `400` nếu có giá trị ngoài
  catalog (giống PROJ-08 cho `project_types`).
- **[PROJ-24] (MỚI)** `GET /projects` (list) shall include `industry`
  and `outcome_note` in the `q` keyword search (ILIKE, cùng nhóm với
  `customer_name`/`project_name`/`description`/tech tag ở PROJ-02).
- **[PROJ-25] (MỚI)** `GET /projects` shall accept one or more
  `dev_process_phase` query params, filtering to projects that have ALL
  of the specified phases (AND semantics, giống `technology` ở PROJ-03
  — sửa lại từ bản nháp ban đầu dùng OR, theo yêu cầu Product owner để
  đồng nhất với `technology`).
- **[PROJ-04] (SỬA)**
  - Cũ: When `GET /projects` includes one or more `project_type` query
    params, the system shall filter to projects that have ANY of the
    specified project types (OR semantics).
  - Mới: ... shall filter to projects that have ALL of the specified
    project types (AND semantics, giống `technology` ở PROJ-03) — đồng
    nhất semantics filter giữa `technology`/`project_type`/
    `dev_process_phase`, tránh 3 filter cùng dạng UI (checkbox đa chọn)
    nhưng hành vi khác nhau gây nhầm lẫn.
- **[PROJ-26] (MỚI)** `GET /projects/{id}`, list item, và response của
  create/update shall include `industry`, `outcome_note`,
  `dev_process_phases` trong response body.

## 1b. Thay đổi Data Model

- **[DM-PROJ-07] (MỚI — field)** Thêm field `projects.industry` (string,
  nullable) và `projects.outcome_note` (text, nullable) — map vào
  `specs/projects.md` mục Data Model.
- **[DM-PROJ-08] (MỚI — bảng)** Thêm bảng `dev_process_phases` (catalog
  cố định, 6 dòng seed qua migration: `requirements`, `design`,
  `implementation`, `testing`, `release`, `maintenance_ops` — nhãn
  hiển thị 要件定義/設計/実装/テスト/リリース/保守運用) và bảng nối N-N
  `project_dev_process_phases` (`project_id` FK, `dev_process_phase_id`
  FK) — map field-level vào `specs/projects.md` mục Data Model, VÀ
  thêm dòng quan hệ `PROJECT }o--o{ DEV_PROCESS_PHASE` vào
  `specs/data-model.md` mục 1 (bảng MỚI, khác PROJ-07 chỉ thêm field).

## 1c. Thay đổi UI

Xem `ui-delta-spec.md`.

## 2. Acceptance criteria / Test mapping

| ID      | Test case tương ứng                                              |
|---------|---------------------------------------------------------------------|
| PROJ-22 | `test_create_project_with_industry_and_outcome_note`, `test_update_project_replaces_industry_and_outcome_note` |
| PROJ-23 | `test_create_project_validates_dev_process_phases`, `test_create_project_rejects_invalid_dev_process_phase` |
| PROJ-24 | `test_list_projects_search_matches_industry`, `test_list_projects_search_matches_outcome_note` |
| PROJ-25 | `test_list_projects_filters_by_dev_process_phase_and_semantics`, `test_list_projects_filters_by_dev_process_phase_via_route` |
| PROJ-04 (sửa) | `test_list_projects_filters_by_project_type_and_semantics`, `test_list_filters_by_project_type_and_semantics` |
| PROJ-26 | `test_get_project_includes_new_fields` |

## 3. Ghi chú cho AI agent khi implement

- `dev_process_phases` dùng đúng pattern đã có của `project_types`
  (catalog + bảng nối + `_fetch_project_type_ids`-style helper) — tái
  dùng cấu trúc code tương tự trong `repository.py`, KHÔNG viết lại từ
  đầu.
- Migration mới cần chạy qua `apply_migration_via_data_api.py` khi
  deploy production (nhắc user, KHÔNG tự chạy) — xem README.md mục
  "Deploy production" bước 5.
- Sau khi ticket này xong, sẽ có 1 bước riêng (KHÔNG thuộc ticket này)
  để import 24 dự án thật từ PPTX qua script tạm gọi thẳng
  `POST /projects` — chỉ cần đảm bảo API chấp nhận đủ field mới.
