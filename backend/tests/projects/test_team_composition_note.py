from datetime import date
from decimal import Decimal

from app.projects.repository import create_project, get_project, list_projects, update_project
from app.projects.schemas import ProjectCreate, ProjectUpdate
from tests.projects.test_extra_fields import AUTH_HEADER


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
    )
    defaults.update(overrides)
    return create_project(db, ProjectCreate(**defaults), created_by="user-1")


# PROJ-27
def test_create_project_with_team_composition_note(db_session):
    created = _make_project(
        db_session,
        team_composition_note="PM：1名、BrSE 1名、開発者：5名、テスター：4名",
    )

    assert created.team_composition_note == "PM：1名、BrSE 1名、開発者：5名、テスター：4名"


# PROJ-27
def test_update_project_replaces_team_composition_note(db_session):
    created = _make_project(db_session, team_composition_note="旧チーム構成")

    updated = update_project(
        db_session,
        created.id,
        ProjectUpdate(
            customer_name=created.customer_name,
            project_name=created.project_name,
            start_date=created.start_date,
            team_composition_note="新チーム構成：PM 1名、開発者 3名",
        ),
    )

    assert updated is not None
    assert updated.team_composition_note == "新チーム構成：PM 1名、開発者 3名"


# PROJ-28
def test_get_project_includes_team_composition_note(db_session):
    created = _make_project(db_session, team_composition_note="テスト構成メモ")

    result = get_project(db_session, created.id)

    assert result is not None
    assert result.team_composition_note == "テスト構成メモ"


# PROJ-29
def test_list_projects_search_matches_team_composition_note(db_session):
    _make_project(
        db_session,
        project_name="Alpha",
        team_composition_note="テクニカーリーダー：1名",
    )
    _make_project(db_session, project_name="Beta", team_composition_note="開発者のみ")

    items, total = list_projects(db_session, q="テクニカーリーダー")

    assert total == 1
    assert items[0].project_name == "Alpha"


# PROJ-28 — route level
def test_get_project_route_includes_team_composition_note(client):
    payload = {
        "customer_name": "ABC商事",
        "project_name": "基幹システム刷新",
        "start_date": "2024-01-01",
        "team_composition_note": "PM 1名、開発者 3名",
    }
    created = client.post("/projects", json=payload, headers=AUTH_HEADER).json()

    response = client.get(f"/projects/{created['id']}", headers=AUTH_HEADER)

    assert response.status_code == 200
    assert response.json()["team_composition_note"] == "PM 1名、開発者 3名"
