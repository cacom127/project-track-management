# Delta Spec — CHANGE-003-init-codebase

> Cam kết cuối cùng, NẰM TRONG giới hạn kỹ thuật đã chốt ở `plan.md`
> cùng thư mục. Phần lớn `specs/architecture.md` đã có criteria (`ARCH-01..09`)
> từ `CHANGE-002` — ticket này KHÔNG lặp lại chúng, chỉ bổ sung những
> quyết định cụ thể hơn mà `CHANGE-002` chưa chốt (layout source code,
> package manager, CI cụ thể, hành vi `/health`), và SỬA 1 mục còn để
> "chưa quyết định" ở `architecture.md`.

- **Ticket ID**: CHANGE-003-init-codebase
- **Module bị ảnh hưởng**: `specs/architecture.md`
- **Loại thay đổi**: ☑ Thêm mới &nbsp; ☑ Sửa &nbsp; ☐ Xoá

## 1. Yêu cầu thay đổi (EARS notation)

- **[ARCH-10] (MỚI)** The system's source code shall live at repo root
  — ngang cấp với `specs/`, `changes/` — organized as `backend`
  (Python/FastAPI), `frontend` (React/Vite), `infra` (AWS CDK, Python).
  KHÔNG gom vào 1 thư mục `src/` chung.
- **[ARCH-11] (MỚI)** The system shall use `uv` as the Python
  package/dependency manager for `backend` and `infra`, and `npm` as
  the package manager for `frontend`.
- **[ARCH-12] (SỬA)**
  - Cũ: *"CI/CD: chưa quyết định — đề xuất GitHub Actions, chưa chốt"*
    (`specs/architecture.md` mục 3).
  - Mới: The system shall use **GitHub Actions** for CI, running
    separate lint + test jobs for `backend`, `frontend`, and `infra`
    (`cdk synth`) on every pull request and on push to the default
    branch.
- **[ARCH-13] (MỚI)** The system's `GET /health` endpoint shall respond
  `200` with body `{"status": "ok", "db": "<ok|error>"}`, and shall NOT
  respond with a `5xx` status solely because the database is
  unreachable — DB connectivity issues are reported via the `db` field,
  not via HTTP status.
- **[ARCH-14] (MỚI)** The system shall isolate all database access
  behind a single backend module (`app.core.db`), so that the local
  SQLAlchemy-based connection can be replaced by RDS Data API in
  production without changing any call site.

## 2. Acceptance criteria / Test mapping

| ID       | Test case tương ứng (file/tên)                                          |
|----------|------------------------------------------------------------------------------|
| ARCH-10  | `TC-ARCH-10: Review cấu trúc repo — code nằm ở backend/, frontend/, infra/ (không có src/)` |
| ARCH-11  | `TC-ARCH-11: uv sync (backend/infra) và npm install (frontend) chạy không lỗi` |
| ARCH-12  | `TC-ARCH-12: Push PR test, xác nhận GitHub Actions chạy đủ 3 job backend/frontend/infra` |
| ARCH-13  | `TC-ARCH-13: Tắt DB, gọi GET /health, xác nhận vẫn trả 200 với db: "error"` |
| ARCH-14  | `TC-ARCH-14: Review code — không có nơi nào khác ngoài app.core.db mở kết nối DB trực tiếp` |

> Test case cụ thể (theo format Excel test case của dự án, `CLAUDE.md`
> mục 7) sẽ viết đầy đủ khi implement — tên trên chỉ đảm bảo mỗi
> criterion trace được sang 1 test.

## 3. Ghi chú cho AI agent khi implement

- Các quyết định kỹ thuật làm nền cho các criteria trên đã chốt ở
  `plan.md` cùng thư mục — không tự ý đổi lại (vd không tự chuyển sang
  poetry/pip, không tự đổi CI tool khác GitHub Actions).
- `tasks.md` (viết tiếp sau file này) sẽ tham chiếu ID ở đây (`ARCH-10..14`)
  VÀ các ID đã có sẵn từ `CHANGE-002` (`ARCH-01..09`, `DM-G01..04`) —
  ticket này hiện thực hoá cả 2 nhóm, không chỉ nhóm mới thêm.
- Khi merge, mục **[ARCH-12] (SỬA)** cần cập nhật lại đúng câu chữ trong
  `specs/architecture.md` mục 3 (xoá dòng "chưa quyết định", thay bằng
  nội dung mới), các mục còn lại là thêm mới vào cuối mục 1 (tổng quan)
  hoặc mục 3 (ràng buộc hạ tầng) tuỳ nội dung.
