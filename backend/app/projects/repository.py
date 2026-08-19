"""Truy vấn DB cho module `projects` — dùng raw SQL qua `DBSession`
(KHÔNG dùng SQLAlchemy ORM model), đúng nguyên tắc cô lập DB access
(ARCH-14) và tương thích cả 2 nhánh local (SQLAlchemy)/production (RDS
Data API). Xem `changes/_archive/CHANGE-007-projects-list-create/plan.md`.

Ghi chú rủi ro (chưa verify được trong môi trường này, cần xác nhận lại
ở bước smoke-test sau khi deploy production — T12): cột `technologies`/
`project_types` trả về dạng Postgres ARRAY qua `array_agg`; RDS Data API
có thể trả field này dạng `arrayValue` (cấu trúc lồng) thay vì string đơn
giản — `app.core.db._parse_data_api_records` hiện chỉ lấy giá trị đầu
tiên trong field dict, CẦN kiểm tra lại trên Data API thật.
"""

from uuid import uuid4

from app.core import s3
from app.core.db import DBSession
from app.projects.schemas import (
    ALLOWED_ATTACHMENT_CONTENT_TYPES,
    MAX_ATTACHMENT_SIZE_BYTES,
    MAX_ATTACHMENTS_PER_PROJECT,
    AttachmentConfirmRequest,
    AttachmentOut,
    AttachmentPresignRequest,
    AttachmentPresignResponse,
    ProjectCreate,
    ProjectOut,
    ProjectUpdate,
)

# CHANGE-011 — suy ext file từ content_type (đã validate ∈
# ALLOWED_ATTACHMENT_CONTENT_TYPES trước khi tra bảng này).
_CONTENT_TYPE_EXTENSIONS = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}


def _fetch_or_create_tag_ids(db: DBSession, names: list[str]) -> list[int]:
    tag_ids = []
    for name in names:
        existing = db.execute(
            "SELECT id FROM tech_tags WHERE lower(name) = lower(:name)", {"name": name}
        )
        if existing:
            tag_ids.append(existing[0]["id"])
        else:
            created = db.execute(
                "INSERT INTO tech_tags (name) VALUES (:name) RETURNING id", {"name": name}
            )
            tag_ids.append(created[0]["id"])
    return tag_ids


def _fetch_project_type_ids(db: DBSession, codes: list[str]) -> list[int]:
    if not codes:
        return []
    params = {f"code{i}": code for i, code in enumerate(codes)}
    placeholders = ", ".join(f":{key}" for key in params)
    rows = db.execute(f"SELECT id FROM project_types WHERE code IN ({placeholders})", params)
    return [row["id"] for row in rows]


def _fetch_dev_process_phase_ids(db: DBSession, codes: list[str]) -> list[int]:
    if not codes:
        return []
    params = {f"code{i}": code for i, code in enumerate(codes)}
    placeholders = ", ".join(f":{key}" for key in params)
    rows = db.execute(
        f"SELECT id FROM dev_process_phases WHERE code IN ({placeholders})", params
    )
    return [row["id"] for row in rows]


def create_project(db: DBSession, data: ProjectCreate, created_by: str) -> ProjectOut:
    rows = db.execute(
        """
        INSERT INTO projects (
            customer_name, project_name, description, start_date, end_date,
            is_ongoing, team_size, total_man_month, source_note, created_by,
            industry, outcome_note
        ) VALUES (
            :customer_name, :project_name, :description, :start_date ::date,
            :end_date ::date, :is_ongoing, :team_size, :total_man_month ::numeric,
            :source_note, :created_by, :industry, :outcome_note
        )
        RETURNING id, customer_name, project_name, description, start_date, end_date,
                  is_ongoing, team_size, total_man_month, source_note, created_by,
                  created_at, updated_at, industry, outcome_note
        """,
        {
            "customer_name": data.customer_name,
            "project_name": data.project_name,
            "description": data.description,
            "start_date": data.start_date.isoformat(),
            "end_date": data.end_date.isoformat() if data.end_date else None,
            "is_ongoing": data.is_ongoing,
            "team_size": data.team_size,
            "total_man_month": (
                float(data.total_man_month) if data.total_man_month is not None else None
            ),
            "source_note": data.source_note,
            "created_by": created_by,
            "industry": data.industry,
            "outcome_note": data.outcome_note,
        },
    )
    project_row = rows[0]
    project_id = project_row["id"]

    for tag_id in _fetch_or_create_tag_ids(db, data.technologies):
        db.execute(
            "INSERT INTO project_tech_tags (project_id, tag_id) VALUES (:pid, :tid)",
            {"pid": project_id, "tid": tag_id},
        )

    for type_id in _fetch_project_type_ids(db, data.project_types):
        db.execute(
            "INSERT INTO project_project_types (project_id, project_type_id) VALUES (:pid, :tid)",
            {"pid": project_id, "tid": type_id},
        )

    for phase_id in _fetch_dev_process_phase_ids(db, data.dev_process_phases):
        db.execute(
            "INSERT INTO project_dev_process_phases (project_id, dev_process_phase_id) "
            "VALUES (:pid, :tid)",
            {"pid": project_id, "tid": phase_id},
        )

    db.commit()

    return ProjectOut(
        **project_row,
        technologies=list(data.technologies),
        project_types=list(data.project_types),
        dev_process_phases=list(data.dev_process_phases),
    )


def get_project(db: DBSession, project_id: int) -> ProjectOut | None:
    # PROJ-14 — trả None nếu không tồn tại/đã soft-delete để route trả 404.
    rows = db.execute(
        """
        SELECT p.id, p.customer_name, p.project_name, p.description, p.start_date, p.end_date,
               p.is_ongoing, p.team_size, p.total_man_month, p.source_note, p.created_by,
               p.created_at, p.updated_at, p.industry, p.outcome_note,
               COALESCE(array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL), '{}')
                   AS technologies,
               COALESCE(array_agg(DISTINCT pt.code) FILTER (WHERE pt.code IS NOT NULL), '{}')
                   AS project_types,
               COALESCE(array_agg(DISTINCT dpp.code) FILTER (WHERE dpp.code IS NOT NULL), '{}')
                   AS dev_process_phases
        FROM projects p
        LEFT JOIN project_tech_tags ptt ON ptt.project_id = p.id
        LEFT JOIN tech_tags t ON t.id = ptt.tag_id
        LEFT JOIN project_project_types ppt ON ppt.project_id = p.id
        LEFT JOIN project_types pt ON pt.id = ppt.project_type_id
        LEFT JOIN project_dev_process_phases pdpp ON pdpp.project_id = p.id
        LEFT JOIN dev_process_phases dpp ON dpp.id = pdpp.dev_process_phase_id
        WHERE p.id = :project_id AND p.deleted_at IS NULL
        GROUP BY p.id
        """,
        {"project_id": project_id},
    )
    if not rows:
        return None
    return ProjectOut(**rows[0])


def update_project(db: DBSession, project_id: int, data: ProjectUpdate) -> ProjectOut | None:
    # PROJ-15 — full replace: cập nhật hết cột scalar rồi xoá/insert lại
    # toàn bộ mapping technologies/project_types theo payload mới.
    rows = db.execute(
        """
        UPDATE projects
        SET customer_name = :customer_name,
            project_name = :project_name,
            description = :description,
            start_date = :start_date ::date,
            end_date = :end_date ::date,
            is_ongoing = :is_ongoing,
            team_size = :team_size,
            total_man_month = :total_man_month ::numeric,
            source_note = :source_note,
            industry = :industry,
            outcome_note = :outcome_note,
            updated_at = now()
        WHERE id = :project_id AND deleted_at IS NULL
        RETURNING id, customer_name, project_name, description, start_date, end_date,
                  is_ongoing, team_size, total_man_month, source_note, created_by,
                  created_at, updated_at, industry, outcome_note
        """,
        {
            "project_id": project_id,
            "customer_name": data.customer_name,
            "project_name": data.project_name,
            "description": data.description,
            "start_date": data.start_date.isoformat(),
            "end_date": data.end_date.isoformat() if data.end_date else None,
            "is_ongoing": data.is_ongoing,
            "team_size": data.team_size,
            "total_man_month": (
                float(data.total_man_month) if data.total_man_month is not None else None
            ),
            "source_note": data.source_note,
            "industry": data.industry,
            "outcome_note": data.outcome_note,
        },
    )
    if not rows:
        return None
    project_row = rows[0]

    db.execute(
        "DELETE FROM project_tech_tags WHERE project_id = :project_id", {"project_id": project_id}
    )
    db.execute(
        "DELETE FROM project_project_types WHERE project_id = :project_id",
        {"project_id": project_id},
    )
    db.execute(
        "DELETE FROM project_dev_process_phases WHERE project_id = :project_id",
        {"project_id": project_id},
    )

    for tag_id in _fetch_or_create_tag_ids(db, data.technologies):
        db.execute(
            "INSERT INTO project_tech_tags (project_id, tag_id) VALUES (:pid, :tid)",
            {"pid": project_id, "tid": tag_id},
        )

    for type_id in _fetch_project_type_ids(db, data.project_types):
        db.execute(
            "INSERT INTO project_project_types (project_id, project_type_id) VALUES (:pid, :tid)",
            {"pid": project_id, "tid": type_id},
        )

    for phase_id in _fetch_dev_process_phase_ids(db, data.dev_process_phases):
        db.execute(
            "INSERT INTO project_dev_process_phases (project_id, dev_process_phase_id) "
            "VALUES (:pid, :tid)",
            {"pid": project_id, "tid": phase_id},
        )

    db.commit()

    return ProjectOut(
        **project_row,
        technologies=list(data.technologies),
        project_types=list(data.project_types),
        dev_process_phases=list(data.dev_process_phases),
    )


def delete_project(db: DBSession, project_id: int) -> bool:
    # PROJ-16 — soft delete, bảng nối KHÔNG bị xoá theo (giữ lịch sử).
    rows = db.execute(
        """
        UPDATE projects
        SET deleted_at = now()
        WHERE id = :project_id AND deleted_at IS NULL
        RETURNING id
        """,
        {"project_id": project_id},
    )
    db.commit()
    return bool(rows)


def _build_where(
    q: str | None,
    technologies: list[str] | None,
    project_types: list[str] | None,
    dev_process_phases: list[str] | None = None,
) -> tuple[str, dict]:
    # PROJ-17 — loại bỏ project đã soft-delete khỏi list (items + total).
    clauses: list[str] = ["p.deleted_at IS NULL"]
    params: dict = {}

    if q:
        params["q"] = f"%{q}%"
        clauses.append(
            "(p.customer_name ILIKE :q OR p.project_name ILIKE :q OR p.description ILIKE :q "
            "OR p.industry ILIKE :q OR p.outcome_note ILIKE :q "
            "OR EXISTS ("
            "  SELECT 1 FROM project_tech_tags ptt_q "
            "  JOIN tech_tags t_q ON t_q.id = ptt_q.tag_id "
            "  WHERE ptt_q.project_id = p.id AND t_q.name ILIKE :q"
            "))"
        )

    if technologies:
        tag_params = {f"tech_{i}": tag.lower() for i, tag in enumerate(technologies)}
        placeholders = ", ".join(f":{key}" for key in tag_params)
        params.update(tag_params)
        clauses.append(
            f"p.id IN ("
            f"  SELECT ptt2.project_id FROM project_tech_tags ptt2"
            f"  JOIN tech_tags t2 ON t2.id = ptt2.tag_id"
            f"  WHERE lower(t2.name) IN ({placeholders})"
            f"  GROUP BY ptt2.project_id"
            f"  HAVING COUNT(DISTINCT lower(t2.name)) = {len(technologies)}"
            f")"
        )

    if project_types:
        type_params = {f"ptype_{i}": code for i, code in enumerate(project_types)}
        placeholders = ", ".join(f":{key}" for key in type_params)
        params.update(type_params)
        clauses.append(
            f"p.id IN ("
            f"  SELECT ppt2.project_id FROM project_project_types ppt2"
            f"  JOIN project_types pt2 ON pt2.id = ppt2.project_type_id"
            f"  WHERE pt2.code IN ({placeholders})"
            f")"
        )

    if dev_process_phases:
        phase_params = {f"phase_{i}": code for i, code in enumerate(dev_process_phases)}
        placeholders = ", ".join(f":{key}" for key in phase_params)
        params.update(phase_params)
        clauses.append(
            f"p.id IN ("
            f"  SELECT pdpp2.project_id FROM project_dev_process_phases pdpp2"
            f"  JOIN dev_process_phases dpp2 ON dpp2.id = pdpp2.dev_process_phase_id"
            f"  WHERE dpp2.code IN ({placeholders})"
            f")"
        )

    return (" AND ".join(clauses) if clauses else "TRUE"), params


def list_projects(
    db: DBSession,
    *,
    page: int = 1,
    page_size: int = 20,
    q: str | None = None,
    technologies: list[str] | None = None,
    project_types: list[str] | None = None,
    dev_process_phases: list[str] | None = None,
) -> tuple[list[ProjectOut], int]:
    where_sql, params = _build_where(q, technologies, project_types, dev_process_phases)

    total_rows = db.execute(f"SELECT COUNT(*) AS total FROM projects p WHERE {where_sql}", params)
    total = total_rows[0]["total"]

    list_params = dict(params)
    list_params["limit"] = page_size
    list_params["offset"] = (page - 1) * page_size

    rows = db.execute(
        f"""
        SELECT p.id, p.customer_name, p.project_name, p.description, p.start_date, p.end_date,
               p.is_ongoing, p.team_size, p.total_man_month, p.source_note, p.created_by,
               p.created_at, p.updated_at, p.industry, p.outcome_note,
               COALESCE(array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL), '{{}}')
                   AS technologies,
               COALESCE(array_agg(DISTINCT pt.code) FILTER (WHERE pt.code IS NOT NULL), '{{}}')
                   AS project_types,
               COALESCE(array_agg(DISTINCT dpp.code) FILTER (WHERE dpp.code IS NOT NULL), '{{}}')
                   AS dev_process_phases
        FROM projects p
        LEFT JOIN project_tech_tags ptt ON ptt.project_id = p.id
        LEFT JOIN tech_tags t ON t.id = ptt.tag_id
        LEFT JOIN project_project_types ppt ON ppt.project_id = p.id
        LEFT JOIN project_types pt ON pt.id = ppt.project_type_id
        LEFT JOIN project_dev_process_phases pdpp ON pdpp.project_id = p.id
        LEFT JOIN dev_process_phases dpp ON dpp.id = pdpp.dev_process_phase_id
        WHERE {where_sql}
        GROUP BY p.id
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT :limit OFFSET :offset
        """,
        list_params,
    )
    items = [ProjectOut(**row) for row in rows]
    return items, total


def search_tech_tags(db: DBSession, q: str | None = None) -> list[str]:
    if q:
        rows = db.execute(
            "SELECT name FROM tech_tags WHERE name ILIKE :q ORDER BY name LIMIT 20",
            {"q": f"%{q}%"},
        )
    else:
        rows = db.execute("SELECT name FROM tech_tags ORDER BY name LIMIT 20")
    return [row["name"] for row in rows]


def count_attachments(db: DBSession, project_id: int) -> int:
    rows = db.execute(
        "SELECT COUNT(*) AS c FROM attachments WHERE project_id = :project_id",
        {"project_id": project_id},
    )
    return rows[0]["c"]


def presign_attachment(
    db: DBSession, project_id: int, data: AttachmentPresignRequest
) -> AttachmentPresignResponse | None:
    """PROJ-18 — trả None nếu project không tồn tại/đã xoá (route 404).
    Raise `ValueError` nếu content_type không hợp lệ hoặc đã đủ 10 ảnh
    (route bắt và trả 400 — không có tiền lệ 400 từ repository trong
    codebase này ngoài Pydantic validator, nên dùng cách đơn giản nhất:
    ValueError + route catch, giống quy ước FastAPI thông thường)."""
    if get_project(db, project_id) is None:
        return None

    if data.content_type not in ALLOWED_ATTACHMENT_CONTENT_TYPES:
        raise ValueError(f"content_type không hợp lệ: {data.content_type}")

    if count_attachments(db, project_id) >= MAX_ATTACHMENTS_PER_PROJECT:
        raise ValueError(f"Dự án đã đủ {MAX_ATTACHMENTS_PER_PROJECT} ảnh đính kèm")

    ext = _CONTENT_TYPE_EXTENSIONS[data.content_type]
    s3_key = f"projects/{project_id}/{uuid4()}.{ext}"
    upload_url = s3.generate_presigned_put_url(s3_key, data.content_type)
    return AttachmentPresignResponse(upload_url=upload_url, s3_key=s3_key)


def confirm_attachment(
    db: DBSession, project_id: int, data: AttachmentConfirmRequest, created_by: str
) -> AttachmentOut | None:
    """PROJ-19 — re-validate giới hạn 10 ảnh (chống race condition upload
    đồng thời) và size_bytes ≤ 5MB trước khi insert."""
    if get_project(db, project_id) is None:
        return None

    if count_attachments(db, project_id) >= MAX_ATTACHMENTS_PER_PROJECT:
        raise ValueError(f"Dự án đã đủ {MAX_ATTACHMENTS_PER_PROJECT} ảnh đính kèm")

    if data.size_bytes > MAX_ATTACHMENT_SIZE_BYTES:
        raise ValueError(f"size_bytes vượt giới hạn {MAX_ATTACHMENT_SIZE_BYTES} bytes")

    rows = db.execute(
        """
        INSERT INTO attachments (
            project_id, s3_key, file_name, content_type, size_bytes, created_by
        ) VALUES (
            :project_id, :s3_key, :file_name, :content_type, :size_bytes, :created_by
        )
        RETURNING id, project_id, file_name, content_type, size_bytes, created_at
        """,
        {
            "project_id": project_id,
            "s3_key": data.s3_key,
            "file_name": data.file_name,
            "content_type": data.content_type,
            "size_bytes": data.size_bytes,
            "created_by": created_by,
        },
    )
    db.commit()
    row = rows[0]
    return AttachmentOut(**row, url=s3.generate_presigned_get_url(data.s3_key))


def list_attachments(db: DBSession, project_id: int) -> list[AttachmentOut]:
    """PROJ-20 — mỗi attachment kèm presigned GET URL sinh mới."""
    rows = db.execute(
        """
        SELECT id, project_id, s3_key, file_name, content_type, size_bytes, created_at
        FROM attachments
        WHERE project_id = :project_id
        ORDER BY created_at ASC, id ASC
        """,
        {"project_id": project_id},
    )
    return [
        AttachmentOut(
            id=row["id"],
            project_id=row["project_id"],
            file_name=row["file_name"],
            content_type=row["content_type"],
            size_bytes=row["size_bytes"],
            created_at=row["created_at"],
            url=s3.generate_presigned_get_url(row["s3_key"]),
        )
        for row in rows
    ]


def delete_attachment(db: DBSession, project_id: int, attachment_id: int) -> bool:
    """PROJ-21 — hard delete, cả S3 object lẫn record DB. Trả False nếu
    không tồn tại hoặc không thuộc project_id trong URL (route 404)."""
    rows = db.execute(
        "SELECT s3_key FROM attachments WHERE id = :id AND project_id = :project_id",
        {"id": attachment_id, "project_id": project_id},
    )
    if not rows:
        return False

    s3.delete_object(rows[0]["s3_key"])
    db.execute("DELETE FROM attachments WHERE id = :id", {"id": attachment_id})
    db.commit()
    return True
