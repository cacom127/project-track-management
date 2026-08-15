# Tasks — CHANGE-004-design-system-refresh

- **Ticket ID**: CHANGE-004-design-system-refresh
- **Dựa trên**: `delta-spec.md`

## Checklist

- [x] **T1** — Cập nhật `DESIGN.md`: thay YAML token + viết lại prose
      tiếng Việt (đối chiếu hex prose vs YAML, sửa lệch nếu có)
      - Ghi chú: `npx @google/design.md lint` không chạy ra output được
        trong môi trường Git Bash hiện tại (nghi vấn đề resolve package
        tên có dấu chấm) — chưa validate tự động được, user có thể tự
        chạy lại trong PowerShell nếu muốn.
- [x] **T2** — Archive ticket vào `changes/_archive/`

## Trạng thái

| Trạng thái | Ngày cập nhật | Ghi chú |
|---|---|---|
| Hoàn tất | 2026-08-15 | Lint tool chưa verify được do môi trường, còn lại đã xong |
