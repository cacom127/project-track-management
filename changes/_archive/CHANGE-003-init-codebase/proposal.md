# Proposal — CHANGE-003-init-codebase

> Khởi tạo bộ khung source code (backend, frontend, infra) dựa trên kiến
> trúc đã chốt ở `specs/architecture.md` + `specs/data-model.md`.

- **Ticket ID**: CHANGE-003-init-codebase
- **Size**: Large
- **Người đề xuất**: namlp
- **Ngày**: 2026-08-14

## 1. Vấn đề / lý do cần thay đổi

`specs/vision.md`, `specs/architecture.md`, `specs/data-model.md` đã
chốt xong (qua `CHANGE-001`, `CHANGE-002`), nhưng repo hiện tại **chưa
có dòng code thật nào** — chỉ có bộ spec-kit (`CLAUDE.md`, `DESIGN.md`,
`specs/`, `changes/`). Cần khởi tạo bộ khung source code để các ticket
module tiếp theo (`auth`, `projects`, `reporting`...) có nền để build
tính năng lên trên, thay vì mỗi ticket module tự quyết định cấu trúc
project khác nhau.

## 2. Mục tiêu (Goal)

Có 1 repo chạy được xuyên suốt toàn bộ kiến trúc đã chốt ở mức "khung
sườn + hello world", cụ thể đo được:

- `docker-compose up` ở local chạy được Postgres + backend (`uvicorn`
  chạy FastAPI trực tiếp, chưa qua Lambda) trong < 1 phút trên máy mới.
- Có 1 endpoint `GET /health` trả `200 {"status": "ok"}`, có test
  (`pytest`) pass cho endpoint này.
- Frontend (`npm run dev`) chạy được, gọi thành công `GET /health` và
  hiển thị kết quả — xác nhận CORS/kết nối FE↔BE hoạt động.
- CDK (Python) `cdk synth` chạy không lỗi cho stack rỗng/tối thiểu
  (chưa cần `cdk deploy` thật lên AWS ở ticket này).
- CI (GitHub Actions) chạy lint + test tự động trên mọi PR.

## 3. Ngoài phạm vi (Non-goals)

- KHÔNG implement business logic của bất kỳ module nào (auth thật, CRUD
  `projects` thật, thống kê...) — đó là phạm vi của các ticket module
  riêng (`CHANGE-004` trở đi).
- KHÔNG `cdk deploy` lên AWS thật, KHÔNG tạo Cognito User Pool thật ở
  ticket này — chỉ chuẩn bị code CDK, deploy thật khi có ticket riêng
  cho việc đó (sau khi ít nhất 1 module nghiệp vụ sẵn sàng).
- KHÔNG viết UI thật ngoài 1 trang test gọi `/health` — UI theo
  `DESIGN.md` sẽ làm khi có ticket module cụ thể.

## 4. Ảnh hưởng

- Module liên quan: nền tảng, ảnh hưởng toàn bộ dự án — tham chiếu
  `specs/architecture.md`, `specs/data-model.md`.
- Ảnh hưởng khách hàng Nhật cần thông báo trước: Không (nội bộ, chưa
  production).
- Ảnh hưởng dữ liệu hiện có (migration): Không (repo mới, chưa có dữ
  liệu).

## 5. Phương án thay thế đã xem xét

| Quyết định | Chọn | Lý do |
|---|---|---|
| Cấu trúc repo | **Monorepo** — `backend/`, `frontend/`, `infra/` cùng 1 repo, ngang hàng `specs/`/`changes/` | Team nhỏ, dễ đồng bộ version giữa API/FE, 1 CI pipeline duy nhất; tách nhiều repo chỉ có lợi khi có nhiều team độc lập — không phải trường hợp này |
| Python package manager | **uv** | Nhanh, quản lý venv+dependency trong 1 tool, đang là xu hướng chuẩn cho project Python mới; thay thế được cho pip/poetry mà không phức tạp hơn |
| Frontend package manager | **npm** | Mặc định đi kèm Node, không cần cài thêm gì, đủ dùng cho quy mô dự án |
| CI | **GitHub Actions** | Repo đã ở GitHub, free tier đủ dùng cho private repo nội bộ nhỏ, không cần thêm service ngoài |

## 6. Việc cần xác nhận trước khi viết `delta-spec.md`/`plan.md`

- Xác nhận 4 lựa chọn ở mục 5 (monorepo, `uv`, `npm`, GitHub Actions) —
  đây cũng là quyết định còn treo từ `specs/architecture.md` ("CI/CD
  chưa quyết định").
- Tên thư mục cụ thể: `backend/`, `frontend/`, `infra/` — ok chưa hay
  bạn muốn tên khác?
