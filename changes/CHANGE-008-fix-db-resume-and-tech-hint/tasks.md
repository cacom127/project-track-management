# Tasks — CHANGE-008-fix-db-resume-and-tech-hint

- **Ticket ID**: CHANGE-008-fix-db-resume-and-tech-hint
- **Dựa trên**: `delta-spec.md`

## Checklist

- [x] **T1** — TDD: `DataApiSession.execute()` retry khi gặp
      `DatabaseResumingException` (3 lần, cách 2s), không retry lỗi khác.
      - Liên quan: ARCH-21
      - File: `backend/app/core/db.py`, `backend/tests/test_db_data_api.py`
      - Verify: 48/48 test pass, `ruff check` sạch.
- [x] **T1b** — Fix bug thứ 2 (vẫn 500 sau khi deploy T1): thêm
      `::date`/`::numeric` cast tường minh cho `start_date`/`end_date`/
      `total_man_month` trong `POST /projects` — Data API không tự cast
      tham số sang kiểu cột đích.
      - Liên quan: PROJ-13
      - File: `backend/app/projects/repository.py`
      - Verify: 22/22 test `tests/projects/` pass, 48/48 full suite,
        `ruff check` sạch. LƯU Ý cú pháp: `:param ::type` (có khoảng
        trắng) — viết dính `:param::type` làm SQLAlchemy không nhận
        diện được bind param (đã gặp thật khi sửa).
- [x] **T2** — UI: thêm placeholder + hint chữ nhỏ cho ô 技術 (cách thêm
      nhiều tag bằng Enter).
      - Liên quan: UI-PROJ-02-3
      - File: `frontend/src/pages/ProjectCreate.tsx`, `frontend/src/index.css`
      - Verify: 57/57 test pass, lint sạch, build thành công.
- [ ] **T3** — Deploy lên production (`namlp` tự chạy `cdk deploy`,
      không cần chạy lại migration — không đổi schema DB), verify thật:
      tạo project ngay sau thời gian Aurora idle lâu, xác nhận không
      còn `500`.
- [ ] **T4** — Review chéo + fold `delta-spec.md` vào
      `specs/architecture.md` (ARCH-21) và `specs/projects-ui.md`
      (UI-PROJ-02-3).
- [ ] **T5** — Di chuyển thư mục này vào `changes/_archive/` sau khi merge.

## Trạng thái

| Trạng thái | Ngày cập nhật | Ghi chú |
|---|---|---|
| Đang làm | 2026-08-18 | T1-T2 xong (code + test local), chờ deploy + verify T3. |
