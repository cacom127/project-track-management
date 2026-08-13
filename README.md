# Spec Template — Hướng dẫn sử dụng

Bộ template này kết hợp triết lý **GitHub Spec Kit** (constitution + tách
business/technical) và **OpenSpec** (current truth `specs/` + delta thay đổi
`changes/`). 

## Cấu trúc

```
spec-template/
├── CLAUDE.md                      # Nguyên tắc bất biến — sửa ngay khi setup dự án
├── DESIGN.md                       # Design system (màu/font/spacing/component) — xem mục riêng bên dưới
├── specs/                          # Trạng thái HIỆN TẠI (current truth)
│   ├── architecture.md             # Kiến trúc tổng thể
│   └── example-module-auth.md      # Ví dụ spec 1 module — copy & đổi tên khi thêm module
│                                    #   (thêm mục "## UI" hoặc tách file *-ui.md nếu module
│                                    #    có nhiều màn hình — xem CLAUDE.md mục 5)
└── changes/
    ├── _template/                  # Copy thư mục này mỗi khi có ticket mới
    │   ├── proposal.md             # Chỉ cần cho size Medium/Large
    │   ├── plan.md                 # Chỉ cần cho size Medium/Large
    │   ├── delta-spec.md           # BẮT BUỘC — mọi size
    │   └── tasks.md                # BẮT BUỘC — mọi size
    └── _archive/                   # Nơi chứa các change đã merge (lịch sử)
```

## Cách bắt đầu 1 dự án mới

1. Copy toàn bộ thư mục `spec-template/` vào root repo, đổi tên tuỳ ý (hoặc
   giữ nguyên cấu trúc con `specs/`, `changes/`, `CLAUDE.md`).
2. Điền `CLAUDE.md`: tên dự án, stack, nguyên tắc kỹ thuật thật của team.
3. Điền `specs/architecture.md` với kiến trúc thật (có thể sơ sài lúc đầu,
   sẽ đầy dần theo thời gian).
4. Xoá file `specs/example-module-auth.md` mẫu, hoặc giữ lại làm tài liệu
   tham khảo cách viết.

## Cách xử lý 1 ticket mới (workflow hàng ngày)

1. Nhận ticket từ Backlog, vd `TICKET-123`.
2. Xác định độ lớn theo bảng trong `CLAUDE.md` mục 4 (Small/Medium/Large).
3. Copy `changes/_template/` → `changes/TICKET-123-mo-ta-ngan/`.
4. Nếu Small: chỉ điền `delta-spec.md` + `tasks.md`, xoá `proposal.md` và
   `plan.md` không dùng.
   Nếu Medium/Large: điền đủ 4 file, theo thứ tự proposal → plan →
   delta-spec → tasks.
5. Đưa cả thư mục `changes/TICKET-123-.../` vào context khi làm việc với
   AI agent (Claude Code/Cursor) cùng với `CLAUDE.md`.
6. Sau khi code xong, test pass, review xong:
   - Gộp nội dung `delta-spec.md` vào file tương ứng trong `specs/`.
   - Cập nhật bảng "Lịch sử thay đổi" trong file `specs/` đó.
   - Di chuyển `changes/SIC_DEV-123-.../` sang `changes/_archive/`.

## Cách dùng DESIGN.md (design system)

`DESIGN.md` theo đúng format chuẩn mở của Google (`google-labs-code/design.md`)
— gồm YAML token (màu, font, spacing, component) + phần markdown giải thích lý
do. File mẫu trong template đã có sẵn ví dụ đầy đủ, chỉnh lại giá trị cho
đúng brand thật của dự án.

1. **Không có lệnh tự sinh file** — bạn phải tự viết/chỉnh tay, hoặc nhờ AI
   phân tích ảnh chụp màn hình app hiện tại để soạn bản nháp, hoặc dùng
   Google Stitch để generate từ mô tả brand.
2. **Validate trước khi merge thay đổi UI**:
   ```bash
   npx @google/design.md lint DESIGN.md
   ```
   Bắt lỗi token tham chiếu sai, thiếu màu primary, tương phản không đạt
   WCAG AA...
3. **So sánh khi đổi design system** (vd đổi bảng màu):
   ```bash
   npx @google/design.md diff DESIGN.md DESIGN-v2.md
   ```
4. **Export sang Tailwind/DTCG nếu cần** (web admin dùng Tailwind, hoặc cầu
   nối sang thư viện Flutter hỗ trợ chuẩn DTCG):
   ```bash
   npx @google/design.md export --format css-tailwind DESIGN.md > theme.css
   ```
5. **Khi prompt AI agent**, có thể nhắc thẳng: *"Build màn hình X theo đúng
   token trong DESIGN.md"* — không cần giải thích lại màu/font mỗi lần.

**Quan trọng — chống drift**: nếu code dùng 1 giá trị màu/font khác với
`DESIGN.md`, phải sửa lại 1 trong 2 để khớp nhau trước khi merge (xem
CLAUDE.md mục 3). Không để cả hai cùng tồn tại khác nhau — nếu không,
`DESIGN.md` sẽ mất tác dụng làm nguồn chân lý.

**Phân biệt với UI feature spec**: `DESIGN.md` chỉ mô tả token/component ở
mức atomic ("nút này trông thế nào"). Layout, trạng thái màn hình
(loading/error/empty), và hành vi tương tác của từng chức năng cụ thể vẫn
viết riêng trong `specs/<module>-ui.md` (xem CLAUDE.md mục 5) — hai file
này bổ sung cho nhau, không thay thế nhau.

## Gợi ý dùng với Claude Code / Cursor

- Đặt `CLAUDE.md` và `DESIGN.md` ở root — các tool này tự động đọc 2 file
  này làm system context mỗi phiên làm việc (đặc biệt khi task có đụng UI).
- Khi bắt đầu 1 task, có thể prompt: *"Đọc changes/TICKET-123-xxx/ và
  specs/auth.md, implement theo delta-spec.md và tasks.md"*.
- Với Cursor, có thể thêm rule trong `.cursor/rules/spec-workflow.mdc` trỏ
  về quy tắc trong `CLAUDE.md` mục 6 (không tự sửa `specs/` trực tiếp).

## Lưu ý quan trọng

- Không sửa `specs/` trực tiếp — mọi thay đổi phải đi qua `changes/` trước.
- Việc quá nhỏ (fix typo, đổi text) không cần cả bộ này — chỉ áp dụng cho
  thay đổi có ảnh hưởng đến hành vi hệ thống hoặc cần AI agent code theo.
- Giữ acceptance criteria (EARS notation) đủ cụ thể để map sang test case
  — đây là cách chống "spec chỉ để đọc, không ai enforce".
- Không để `DESIGN.md` trôi lệch khỏi code thật — coi nó như 1 nguồn chân
  lý, không phải tài liệu tham khảo (xem mục "Cách dùng DESIGN.md" ở trên).
