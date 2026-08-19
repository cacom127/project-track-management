import base64
import json
from datetime import date
from decimal import Decimal

from app.projects.repository import create_project, get_project, list_projects, update_project
from app.projects.schemas import ProjectCreate, ProjectUpdate


def _fake_bearer(sub: str = "user-1") -> str:
    def _b64(data: bytes) -> str:
        return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

    header = _b64(json.dumps({"alg": "none"}).encode())
    body = _b64(json.dumps({"sub": sub, "email": f"{sub}@vnext.vn"}).encode())
    return f"Bearer {header}.{body}.sig"


AUTH_HEADER = {"Authorization": _fake_bearer()}


def _make_project(db, **overrides):
    defaults = dict(
        customer_name="ABC商事",
        project_name="基幹システム刷新",
        description="レガシーシステムの刷新プロジェクト",
        start_date=date(2024, 1, 1),
        end_date=None,
        is_ongoing=True,
        team_size=5,
        total_man_month=Decimal("12.5"),
        source_note="社内Wiki",
        technologies=["React", "AWS"],
        project_types=["offshore", "new_dev"],
        industry="金融",
        outcome_note="生産性が20%向上した",
        dev_process_phases=["requirements", "design"],
    )
    defaults.update(overrides)
    return create_project(db, ProjectCreate(**defaults), created_by="user-1")


# PROJ-22 / PROJ-26
def test_create_project_with_industry_and_outcome_note(db_session):
    created = _make_project(db_session, industry="製造業", outcome_note="コスト削減に成功")

    assert created.industry == "製造業"
    assert created.outcome_note == "コスト削減に成功"
    assert set(created.dev_process_phases) == {"requirements", "design"}

    reloaded = get_project(db_session, created.id)
    assert reloaded is not None
    assert reloaded.industry == "製造業"
    assert reloaded.outcome_note == "コスト削減に成功"
    assert set(reloaded.dev_process_phases) == {"requirements", "design"}


# PROJ-22
def test_update_project_replaces_industry_and_outcome_note(db_session):
    created = _make_project(
        db_session,
        industry="金融",
        outcome_note="旧メモ",
        dev_process_phases=["requirements"],
    )

    update_data = ProjectUpdate(
        customer_name=created.customer_name,
        project_name=created.project_name,
        start_date=created.start_date,
        industry="小売業",
        outcome_note="新メモ",
        dev_process_phases=["testing", "release"],
    )
    result = update_project(db_session, created.id, update_data)

    assert result is not None
    assert result.industry == "小売業"
    assert result.outcome_note == "新メモ"
    assert set(result.dev_process_phases) == {"testing", "release"}

    reloaded = get_project(db_session, created.id)
    assert reloaded is not None
    assert reloaded.industry == "小売業"
    assert reloaded.outcome_note == "新メモ"
    assert set(reloaded.dev_process_phases) == {"testing", "release"}


# PROJ-23
def test_create_project_validates_dev_process_phases(db_session):
    created = _make_project(
        db_session, dev_process_phases=["requirements", "design", "implementation", "testing"]
    )

    assert set(created.dev_process_phases) == {
        "requirements",
        "design",
        "implementation",
        "testing",
    }


def test_create_project_rejects_invalid_dev_process_phase():
    try:
        ProjectCreate(
            customer_name="ABC",
            project_name="XYZ",
            start_date=date(2024, 1, 1),
            dev_process_phases=["not-a-real-phase"],
        )
        raised = False
    except ValueError:
        raised = True
    assert raised


# PROJ-24
def test_list_projects_search_matches_industry(db_session):
    _make_project(db_session, project_name="Alpha", industry="金融業界特有の業種名")
    _make_project(db_session, project_name="Beta", industry="製造業")

    items, total = list_projects(db_session, q="金融業界特有")
    assert total == 1
    assert items[0].project_name == "Alpha"


def test_list_projects_search_matches_outcome_note(db_session):
    _make_project(db_session, project_name="Alpha", outcome_note="ユニークな成果ノート文言")
    _make_project(db_session, project_name="Beta", outcome_note="別の内容")

    items, total = list_projects(db_session, q="ユニークな成果ノート")
    assert total == 1
    assert items[0].project_name == "Alpha"


# PROJ-25
def test_list_projects_filters_by_dev_process_phase_or_semantics(db_session):
    _make_project(db_session, project_name="Alpha", dev_process_phases=["requirements"])
    _make_project(db_session, project_name="Beta", dev_process_phases=["release"])
    _make_project(db_session, project_name="Gamma", dev_process_phases=["maintenance_ops"])

    items, total = list_projects(
        db_session, dev_process_phases=["requirements", "release"]
    )
    names = {item.project_name for item in items}
    assert total == 2
    assert names == {"Alpha", "Beta"}


# PROJ-26
def test_get_project_includes_new_fields(db_session):
    created = _make_project(
        db_session,
        industry="IT",
        outcome_note="成果メモ",
        dev_process_phases=["testing"],
    )

    result = get_project(db_session, created.id)

    assert result is not None
    assert result.industry == "IT"
    assert result.outcome_note == "成果メモ"
    assert result.dev_process_phases == ["testing"]


# PROJ-23 — route level: giá trị ngoài catalog -> 400
def test_create_project_rejects_invalid_dev_process_phase_via_route(client):
    payload = {
        "customer_name": "ABC商事",
        "project_name": "基幹システム刷新",
        "start_date": "2024-01-01",
        "dev_process_phases": ["not-a-real-phase"],
    }

    response = client.post("/projects", json=payload, headers=AUTH_HEADER)

    assert response.status_code == 400


# PROJ-26 — route level: response chứa đủ 3 field mới
def test_get_project_route_includes_new_fields(client):
    payload = {
        "customer_name": "ABC商事",
        "project_name": "基幹システム刷新",
        "start_date": "2024-01-01",
        "industry": "IT",
        "outcome_note": "成果メモ",
        "dev_process_phases": ["testing", "release"],
    }
    created = client.post("/projects", json=payload, headers=AUTH_HEADER).json()

    response = client.get(f"/projects/{created['id']}", headers=AUTH_HEADER)

    assert response.status_code == 200
    body = response.json()
    assert body["industry"] == "IT"
    assert body["outcome_note"] == "成果メモ"
    assert set(body["dev_process_phases"]) == {"testing", "release"}


# PROJ-25 — route level: OR semantics qua query param
def test_list_projects_filters_by_dev_process_phase_via_route(client):
    def _create(**overrides):
        payload = {
            "customer_name": "ABC商事",
            "project_name": "P",
            "start_date": "2024-01-01",
        }
        payload.update(overrides)
        return client.post("/projects", json=payload, headers=AUTH_HEADER).json()

    _create(project_name="Alpha", dev_process_phases=["requirements"])
    _create(project_name="Beta", dev_process_phases=["release"])
    _create(project_name="Gamma", dev_process_phases=["maintenance_ops"])

    response = client.get(
        "/projects",
        params=[
            ("dev_process_phase", "requirements"),
            ("dev_process_phase", "release"),
        ],
        headers=AUTH_HEADER,
    )

    body = response.json()
    names = {item["project_name"] for item in body["items"]}
    assert body["total"] == 2
    assert names == {"Alpha", "Beta"}
