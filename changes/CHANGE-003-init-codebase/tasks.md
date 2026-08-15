# Tasks — CHANGE-003-init-codebase

> Dựa trên `delta-spec.md` + `plan.md` cùng thư mục. Layout thư mục theo
> [ARCH-10]: code nằm ở `backend/`, `frontend/`, `infra/` ngay tại repo
> root, ngang cấp `specs/`/`changes/` — KHÔNG gom vào 1 thư mục `src/`
> chung.

- **Ticket ID**: CHANGE-003-init-codebase
- **Dựa trên**: `delta-spec.md` (+ `plan.md`)

## Checklist

- [x] **T1** — Backend project skeleton (uv + FastAPI)
      - Liên quan: ARCH-02, ARCH-10, ARCH-11
      - File dự kiến: `backend/pyproject.toml`, `backend/app/main.py`
- [x] **T2** — Health endpoint `GET /health` (TDD, trả `{"status": "ok"}`)
      - Liên quan: ARCH-02
      - File dự kiến: `backend/app/routers/health.py`
- [x] **T3** — Cấu hình + kết nối DB qua `app.core.db`, health-check báo
      trạng thái DB (`db: ok|error`, không fail cứng)
      - Liên quan: ARCH-03, ARCH-13, ARCH-14, DM-G01, DM-G02
      - File dự kiến: `backend/app/core/config.py`, `backend/app/core/db.py`
- [x] **T4** — Docker Compose Postgres cho local
      - Liên quan: ARCH-08
      - File dự kiến: `docker-compose.yml`, `backend/.env.example`
      - Ghi chú: cổng host đổi từ 5432 → **5433** để tránh xung đột với
        container Postgres khác (`iask_postgres`) đã chiếm 5432 trên máy
- [x] **T5** — Alembic setup (baseline migration rỗng)
      - Liên quan: DM-G01, DM-G02 (migration tool)
      - File dự kiến: `backend/alembic.ini`, `backend/migrations/`
      - Ghi chú: `alembic upgrade head` chạy OK trên Postgres thật (port 5433)
- [x] **T6** — Lambda handler stub (Mangum, chưa deploy)
      - Liên quan: ARCH-02, ARCH-07 (chưa deploy)
      - File dự kiến: `backend/app/lambda_handler.py`
- [x] **T7** — Backend lint (ruff) + full test run
      - Liên quan: CLAUDE.md mục 2 (lint/format bắt buộc)
      - File dự kiến: `backend/ruff.toml`
- [x] **T8** — Frontend project skeleton (Vite+React+TS), gọi `GET /health`
      - Liên quan: ARCH-01, ARCH-11
      - File dự kiến: `frontend/src/App.tsx`, `frontend/src/App.test.tsx`
- [x] **T9** — Frontend lint (oxlint) + format (prettier)
      - Liên quan: CLAUDE.md mục 2 (lint/format bắt buộc)
      - File dự kiến: `frontend/.prettierrc`
      - Ghi chú: template Vite tự sinh sẵn **oxlint** thay vì eslint —
        đã so sánh nhanh 2 tool, quyết định giữ oxlint (nhanh, đủ dùng
        cho quy mô dự án), thêm prettier riêng cho format
- [ ] **T10** — CDK (Python) skeleton, `cdk synth` chạy được
      - Liên quan: ARCH-07, ARCH-10, ARCH-11
      - File dự kiến: `infra/app.py`, `infra/stacks/main_stack.py`, `infra/package.json`
- [ ] **T11** — CI (GitHub Actions): job backend/frontend/infra
      - Liên quan: ARCH-12, CLAUDE.md mục 2 (không giảm test coverage trên PR)
      - File dự kiến: `.github/workflows/ci.yml`
- [ ] **T12** — Cập nhật README hướng dẫn chạy local
      - Liên quan: ARCH-08, ARCH-10
      - File dự kiến: `README.md`
- [ ] **T13** — Review chéo (Product/Technical owner: namlp) trước khi
      coi ticket hoàn tất
- [ ] **T14** — Fold `[ARCH-10]`..`[ARCH-14]` vào `specs/architecture.md`
      (sửa lại đúng mục 3 cho `ARCH-12`, thêm mới các mục còn lại), sau
      đó di chuyển `changes/CHANGE-003-init-codebase/` vào
      `changes/_archive/`

## Trạng thái

| Trạng thái   | Ngày cập nhật | Ghi chú                     |
|--------------|----------------|--------------------------------|
| Đang làm     | 2026-08-15     | T1-T9 xong; đang làm T10 (CDK skeleton) |
