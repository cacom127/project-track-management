# Plan — CHANGE-003-init-codebase

> Dựa trên `proposal.md` cùng thư mục. Đây là quyết định kỹ thuật cuối
> cùng — sau khi duyệt, `delta-spec.md` sẽ viết cam kết (EARS) NẰM TRONG
> giới hạn kỹ thuật đã chốt ở đây, không đổi ngược lại quyết định này.

- **Ticket ID**: CHANGE-003-init-codebase
- **Dựa trên**: `proposal.md` cùng thư mục

## 1. Kiến trúc / thiết kế kỹ thuật

Ticket này không đụng tới module nghiệp vụ nào (`auth`, `projects`...) —
chỉ dựng khung nền tảng mà mọi module sau sẽ build lên trên, theo đúng
`specs/architecture.md`/`specs/data-model.md` đã chốt:

- Thêm 1 API duy nhất: `GET /health` (chưa phải API nghiệp vụ, chỉ để
  xác minh pipeline).
- DB: chưa có bảng nghiệp vụ nào — chỉ chạy Alembic baseline rỗng để
  xác nhận migration tool hoạt động.
- Luồng dữ liệu cần verify:

```
[React SPA (Vite, local :5173)]
        | fetch GET /health (CORS)
        v
[FastAPI (uvicorn, local :8000)] -- SELECT 1 --> [Postgres (docker-compose, local :5432)]
```

- Repo có thêm `backend/`, `frontend/`, `infra/` (CDK) — cấu trúc
  monorepo, ngang hàng `specs/`/`changes/` hiện có ở root.

## 2. Quyết định kỹ thuật quan trọng

| Quyết định | Lý do |
|---|---|
| Monorepo: `backend/`, `frontend/`, `infra/` ngay ở root (KHÔNG gom dưới `src/`) | Team nhỏ, đồng bộ version API/FE dễ hơn, 1 pipeline CI duy nhất (đề xuất ở `proposal.md`); đặt ngang cấp `specs/`/`changes/` thay vì lồng thêm 1 lớp `src/` — tránh double-nesting không cần thiết (vd `uv`/Vite tự sinh layout `src/` riêng bên trong từng project con rồi) |
| Python package manager: **uv** | Nhanh, quản lý venv + dependency trong 1 tool, không cần cài thêm gì ngoài `uv` (đã đề xuất ở `proposal.md`) |
| Frontend package manager: **npm** | Đi kèm sẵn Node, không cần quyết định thêm tool |
| CI: **GitHub Actions** | Repo đã ở GitHub, free tier đủ cho private repo nội bộ nhỏ |
| Local dev kết nối DB qua **SQLAlchemy trực tiếp** (không qua RDS Data API) | RDS Data API là dịch vụ AWS, không tồn tại ở local/docker-compose; SQLAlchemy + Postgres driver là cách kết nối chuẩn khi chạy `uvicorn` trực tiếp theo đúng `specs/architecture.md` mục "Ràng buộc hạ tầng — local" |
| Cô lập truy cập DB qua 1 module duy nhất `app.core.db` | Khi có ticket deploy production thật (dùng RDS Data API), chỉ cần thay implementation trong module này, không phải sửa code gọi DB rải rác nhiều nơi |
| `GET /health` trả `200` ngay cả khi DB lỗi (báo qua field `db` riêng, không trả `500`) | Health-check dùng để giám sát uptime tổng thể của service, không nên fail cứng chỉ vì DB gián đoạn tạm thời — tách rõ "service sống" (`status`) và "DB sống" (`db`) |
| Alembic ở ticket này chỉ có 1 migration baseline **rỗng** | Chưa có bảng nghiệp vụ nào được quyết định (thuộc ticket module `auth`/`projects` riêng) — chỉ xác nhận migration tool chạy được trên schema rỗng |
| Lambda handler (Mangum) chỉ tạo **stub**, KHÔNG deploy | Đúng phạm vi `proposal.md` mục 3 (Non-goals) — deploy AWS thật để 1 ticket riêng sau khi có module nghiệp vụ |
| CDK app viết Python, nhưng CDK CLI cài qua `npm` trong `infra/package.json` | Ràng buộc của bản thân công cụ AWS CDK — CLI luôn là gói npm dù code app dùng ngôn ngữ nào; không phải lựa chọn có thể tránh |

## 3. Rủi ro / đánh đổi (trade-off)

- **RDS Data API (production) khác cách kết nối DB ở local (SQLAlchemy
  trực tiếp)** — khi có ticket deploy AWS thật, cần viết thêm 1 lớp
  thích ứng cho RDS Data API, có rủi ro lệch hành vi giữa 2 môi trường.
  Giảm thiểu: đã cô lập toàn bộ truy cập DB qua `app.core.db` (xem bảng
  trên) để việc thay implementation sau này gọn, không phải sửa nhiều
  chỗ.
- **CDK stack ở ticket này gần như rỗng** (chưa có Lambda/Aurora/Cognito
  thật) — khi ticket deploy AWS thật tới, khối lượng việc bổ sung khá
  lớn. Chấp nhận vì đây là ranh giới phạm vi rõ ràng đã ghi trong
  `proposal.md` (Non-goals).
- **`uv` là tool tương đối mới**, có thể chưa quen với một số thành
  viên — giảm thiểu bằng cách ghi rõ lệnh cụ thể trong README hướng dẫn
  chạy local (1 task riêng khi implement).

## 4. Migration / rollback

- Cần migration dữ liệu: **Không** — repo mới, chưa có dữ liệu thật nào
  tồn tại, Alembic baseline ở ticket này là schema rỗng.
- Rollback: nếu cần huỷ, chỉ cần revert branch/commit — chưa có gì
  deploy lên production nên không ảnh hưởng hệ thống đang chạy.

## 5. Định nghĩa "Done" cho bước Plan này

- [ ] Đã xác nhận thiết kế với Technical owner (namlp)
- [ ] Đã cập nhật `delta-spec.md` tương ứng với thiết kế này
