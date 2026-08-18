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
- [x] **T1c** — Fix bug thứ 3 (insert OK nhưng response validate lỗi
      Pydantic): `_parse_data_api_records` trả nhầm `True` thay vì
      `None` cho cột NULL (field Data API dạng `{"isNull": True}`).
      - Liên quan: ARCH-22
      - File: `backend/app/core/db.py`, `backend/tests/test_db_data_api.py`
      - Verify: 49/49 full suite pass, `ruff check` sạch.
- [x] **T1d** — Chủ động fix trước khi user gặp lỗi thật: `array_agg`
      (`technologies`/`project_types` ở `GET /projects`) trả dạng
      `arrayValue` lồng nhau qua Data API — chưa được parse thành list
      phẳng.
      - Liên quan: ARCH-23
      - File: `backend/app/core/db.py`, `backend/tests/test_db_data_api.py`
      - Verify: 50/50 full suite pass, `ruff check` sạch.
- [x] **T2** — UI: thêm placeholder + hint chữ nhỏ cho ô 技術 (cách thêm
      nhiều tag bằng Enter).
      - Liên quan: UI-PROJ-02-3
      - File: `frontend/src/pages/ProjectCreate.tsx`, `frontend/src/index.css`
      - Verify: 57/57 test pass, lint sạch, build thành công.
- [x] **T3** — Deploy lên production (`namlp` tự chạy `cdk deploy`,
      không chạy lại migration — không đổi schema DB), verify thật:
      tạo project ngay sau thời gian Aurora idle lâu, xác nhận không
      còn `500`.
      - Thực tế deploy phát hiện thêm 2 bug nữa ngoài dự kiến ban đầu
        (không chỉ retry `DatabaseResumingException`) — đã fix ở T1b/T1c
        (và T1d chủ động trước khi gặp lỗi thật). Sau 4 vòng fix, user
        xác nhận "đã hết lỗi" — tạo project + xem list hoạt động đúng.
- [x] **T4** — Review chéo + fold `delta-spec.md` vào
      `specs/architecture.md` (ARCH-21/22/23), `specs/projects.md`
      (PROJ-13), và `specs/projects-ui.md` (UI-PROJ-02-3).
- [x] **T5** — Di chuyển thư mục này vào `changes/_archive/` sau khi merge.

## Trạng thái

| Trạng thái | Ngày cập nhật | Ghi chú |
|---|---|---|
| Hoàn tất | 2026-08-18 | Toàn bộ T1-T5 xong. Deploy production verify OK sau 4 vòng fix (retry resume + cast date/numeric + null-field parsing + array_agg parsing), đã fold vào specs/, đã archive. |
