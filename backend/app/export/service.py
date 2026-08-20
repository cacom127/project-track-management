"""CHANGE-017 (EXPORT-05..08) — dựng file `.pptx` từ template đã thiết
kế sẵn (`assets/template.pptx`, xem `changes/CHANGE-017-project-export-
pptx/tasks.md` T2 cho danh sách tên shape).

Cách "nhân bản slide": python-pptx không có `duplicate_slide()` có sẵn.
Cách chuẩn (và cách dùng ở đây): `add_slide(layout)` để tạo 1 slide rỗng
cùng layout, rồi `copy.deepcopy` từng shape-element của slide mẫu và
append vào `<p:spTree>` của slide mới — layout `template.pptx` dùng là
"Blank" (không có placeholder tự sinh) nên slide mới tạo ra hoàn toàn
trống trước khi copy, không lo xung đột placeholder.

Mỗi project được apply lên 1 slide RIÊNG (nhân bản từ slide mẫu gốc,
CHƯA bị điền dữ liệu) — slide mẫu gốc bị xoá ở cuối cùng, tránh phụ
thuộc vào thứ tự điền dữ liệu (không có project nào "dùng chung" slide
mẫu ban đầu)."""

import copy
import io
from pathlib import Path

from pptx import Presentation
from pptx.util import Emu

from app.core import s3
from app.export.labels import DEV_PROCESS_PHASE_LABELS, PROJECT_TYPE_LABELS
from app.projects.schemas import ProjectOut

TEMPLATE_PATH = Path(__file__).parent / "assets" / "template.pptx"

MAX_IMAGES_PER_SLIDE = 4
# Khoảng cách giữa 2 badge liền nhau trên cùng 1 hàng (~0.12in) — xấp xỉ
# khoảng cách đã dùng khi thiết kế template (field_type_badge_1 →
# field_status_badge, field_tech_badge_1 → field_tech_badge_2).
BADGE_GAP_EMU = 109728


def _find_shape(slide, name: str):
    for shape in slide.shapes:
        if shape.name == name:
            return shape
    return None


def _remove_shape(shape) -> None:
    shape._element.getparent().remove(shape._element)


def _set_text(shape, text: str) -> None:
    """Set text mà vẫn giữ style (font/size/color/bold) của run đầu
    tiên đã thiết kế sẵn trong template — chỉ đổi nội dung."""
    tf = shape.text_frame
    p = tf.paragraphs[0]
    if p.runs:
        run = p.runs[0]
        for extra in p.runs[1:]:
            extra._r.getparent().remove(extra._r)
        run.text = text
    else:
        run = p.add_run()
        run.text = text


def _duplicate_shape_at(master, left: int):
    """Deepcopy XML element của `master`, append vào cùng slide, trả về
    Shape wrapper của bản copy (đã set lại `left`). `master` giữ
    nguyên, không bị ảnh hưởng."""
    clone_el = copy.deepcopy(master._element)
    master._element.addnext(clone_el)
    # Sau khi append, bản copy là shape CUỐI CÙNG trong slide có cùng
    # `name` với master — python-pptx không có API "wrap 1 element vừa
    # thêm" trực tiếp nên phải tìm lại qua iterate (đã verify hành vi
    # này ổn định khi build template draft).
    slide_shapes = master._parent
    matches = [shp for shp in slide_shapes if shp.name == master.name]
    clone = matches[-1]
    clone.left = Emu(left)
    return clone


def _render_badge_row(
    slide, master_name: str, values: list[str], gap_emu: int = BADGE_GAP_EMU
) -> int:
    """Điền `values` (0..N phần tử, N có thể khác số badge mẫu có sẵn
    trong template — chỉ có 1-2 mẫu) vào hàng badge bắt đầu từ vị trí
    của `master_name`. Trả về vị trí `left` (EMU) NGAY SAU badge cuối
    cùng đã render — dùng để đặt tiếp phần tử liền sau (ví dụ
    field_status_badge nối sau các type badge) mà không đè lên nhau dù
    số lượng badge thay đổi theo từng project."""
    master = _find_shape(slide, master_name)
    if master is None:
        raise ValueError(f"Không tìm thấy shape mẫu '{master_name}' trong template")

    left = master.left
    width = master.width
    if not values:
        _remove_shape(master)
        return left

    for index, value in enumerate(values):
        shape = master if index == 0 else _duplicate_shape_at(master, left)
        if index == 0:
            shape.left = Emu(left)
        _set_text(shape, value)
        left = left + width + gap_emu

    return left


def _format_period(project: ProjectOut) -> str:
    start = project.start_date.isoformat()
    if project.is_ongoing:
        return f"{start} 〜 進行中"
    if project.end_date:
        return f"{start} 〜 {project.end_date.isoformat()}"
    return start


def _fill_meta(slide, project: ProjectOut) -> None:
    shape = _find_shape(slide, "field_meta")
    industry = project.industry or "—"
    period = _format_period(project)
    team_size = f"{project.team_size}名" if project.team_size is not None else "—"
    man_month = f"{project.total_man_month}人月" if project.total_man_month is not None else "—"
    _set_text(
        shape,
        f"業種: {industry}　　期間: {period}\n人数: {team_size}　　総人月: {man_month}",
    )


def _fill_images(slide, s3_keys: list[str]) -> None:
    # EXPORT-07 — tối đa 4 ảnh đầu; slot thừa (project ít ảnh hơn 4) giữ
    # nguyên placeholder xám của template, không lỗi.
    for index in range(MAX_IMAGES_PER_SLIDE):
        slot_name = f"img_slot_{index + 1}"
        slot = _find_shape(slide, slot_name)
        if slot is None or index >= len(s3_keys):
            continue
        left, top, width, height = slot.left, slot.top, slot.width, slot.height
        image_bytes = s3.get_object_bytes(s3_keys[index])
        _remove_shape(slot)
        slide.shapes.add_picture(io.BytesIO(image_bytes), left, top, width, height)


def _fill_slide(slide, project: ProjectOut, s3_keys: list[str]) -> None:
    _set_text(_find_shape(slide, "field_project_name"), project.project_name)

    type_labels = [PROJECT_TYPE_LABELS.get(code, code) for code in project.project_types]
    status_label = "進行中" if project.is_ongoing else "終了"
    next_left = _render_badge_row(slide, "field_type_badge_1", type_labels)
    status_shape = _find_shape(slide, "field_status_badge")
    status_shape.left = Emu(next_left)
    _set_text(status_shape, status_label)

    _set_text(_find_shape(slide, "field_description"), project.description or "—")
    _fill_meta(slide, project)

    _fill_images(slide, s3_keys[:MAX_IMAGES_PER_SLIDE])

    _render_badge_row(slide, "field_tech_badge_1", list(project.technologies))
    _remove_shape(_find_shape(slide, "field_tech_badge_2"))

    phase_labels = [DEV_PROCESS_PHASE_LABELS.get(code, code) for code in project.dev_process_phases]
    _render_badge_row(slide, "field_phase_badge_1", phase_labels)
    _remove_shape(_find_shape(slide, "field_phase_badge_2"))

    _set_text(_find_shape(slide, "field_outcome_note"), project.outcome_note or "—")
    # EXPORT-06 — customer_name/source_note/team_composition_note KHÔNG
    # có shape tương ứng trong template nên không cần code loại trừ
    # riêng, chỉ cần không bao giờ đọc field này ở trên.


def _duplicate_slide(prs: Presentation, source_slide):
    new_slide = prs.slides.add_slide(source_slide.slide_layout)
    for shape in source_slide.shapes:
        new_slide.shapes._spTree.append(copy.deepcopy(shape._element))
    return new_slide


def _delete_slide(prs: Presentation, slide) -> None:
    slide_id = slide.slide_id
    xml_slides = prs.slides._sldIdLst
    for sld_id_el in list(xml_slides):
        if int(sld_id_el.get("id")) == slide_id:
            r_id = sld_id_el.get(
                "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
            )
            prs.part.drop_rel(r_id)
            xml_slides.remove(sld_id_el)
            return


def build_presentation(
    projects: list[ProjectOut], attachments_by_project: dict[int, list[str]]
) -> bytes:
    """EXPORT-05 — 1 slide/project. `attachments_by_project` map
    `project_id -> list[s3_key]` (đã giới hạn thứ tự upload, chưa cắt
    4 — `_fill_images` tự cắt)."""
    prs = Presentation(str(TEMPLATE_PATH))
    template_slide = prs.slides[0]

    for project in projects:
        slide = _duplicate_slide(prs, template_slide)
        _fill_slide(slide, project, attachments_by_project.get(project.id, []))

    _delete_slide(prs, template_slide)

    buffer = io.BytesIO()
    prs.save(buffer)
    return buffer.getvalue()
