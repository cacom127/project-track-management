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

from app.core.db import DBSession
from app.projects.schemas import ProjectCreate, ProjectOut


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


def create_project(db: DBSession, data: ProjectCreate, created_by: str) -> ProjectOut:
    rows = db.execute(
        """
        INSERT INTO projects (
            customer_name, project_name, description, start_date, end_date,
            is_ongoing, team_size, total_man_month, source_note, created_by
        ) VALUES (
            :customer_name, :project_name, :description, :start_date, :end_date,
            :is_ongoing, :team_size, :total_man_month, :source_note, :created_by
        )
        RETURNING id, customer_name, project_name, description, start_date, end_date,
                  is_ongoing, team_size, total_man_month, source_note, created_by,
                  created_at, updated_at
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

    db.commit()

    return ProjectOut(
        **project_row,
        technologies=list(data.technologies),
        project_types=list(data.project_types),
    )


def _build_where(
    q: str | None, technologies: list[str] | None, project_types: list[str] | None
) -> tuple[str, dict]:
    clauses: list[str] = []
    params: dict = {}

    if q:
        params["q"] = f"%{q}%"
        clauses.append(
            "(p.customer_name ILIKE :q OR p.project_name ILIKE :q OR p.description ILIKE :q "
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

    return (" AND ".join(clauses) if clauses else "TRUE"), params


def list_projects(
    db: DBSession,
    *,
    page: int = 1,
    page_size: int = 20,
    q: str | None = None,
    technologies: list[str] | None = None,
    project_types: list[str] | None = None,
) -> tuple[list[ProjectOut], int]:
    where_sql, params = _build_where(q, technologies, project_types)

    total_rows = db.execute(f"SELECT COUNT(*) AS total FROM projects p WHERE {where_sql}", params)
    total = total_rows[0]["total"]

    list_params = dict(params)
    list_params["limit"] = page_size
    list_params["offset"] = (page - 1) * page_size

    rows = db.execute(
        f"""
        SELECT p.id, p.customer_name, p.project_name, p.description, p.start_date, p.end_date,
               p.is_ongoing, p.team_size, p.total_man_month, p.source_note, p.created_by,
               p.created_at, p.updated_at,
               COALESCE(array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL), '{{}}')
                   AS technologies,
               COALESCE(array_agg(DISTINCT pt.code) FILTER (WHERE pt.code IS NOT NULL), '{{}}')
                   AS project_types
        FROM projects p
        LEFT JOIN project_tech_tags ptt ON ptt.project_id = p.id
        LEFT JOIN tech_tags t ON t.id = ptt.tag_id
        LEFT JOIN project_project_types ppt ON ppt.project_id = p.id
        LEFT JOIN project_types pt ON pt.id = ppt.project_type_id
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
