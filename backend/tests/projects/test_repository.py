from datetime import date
from decimal import Decimal

from app.projects.repository import (
    create_project,
    delete_project,
    get_project,
    list_projects,
    search_tech_tags,
    update_project,
)
from app.projects.schemas import ProjectCreate, ProjectUpdate


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
    )
    defaults.update(overrides)
    return create_project(db, ProjectCreate(**defaults), created_by="user-1")


def test_create_project_persists_and_returns_full_record(db_session):
    result = _make_project(db_session)

    assert result.id is not None
    assert result.customer_name == "ABC商事"
    assert result.created_by == "user-1"
    assert set(result.technologies) == {"React", "AWS"}
    assert set(result.project_types) == {"offshore", "new_dev"}
    assert result.created_at is not None
    assert result.updated_at is not None


def test_create_project_with_no_technologies_or_types(db_session):
    result = _make_project(db_session, technologies=[], project_types=[])

    assert result.technologies == []
    assert result.project_types == []


def test_create_project_reuses_existing_tag_case_insensitive(db_session):
    _make_project(db_session, project_name="Project A", technologies=["React"])
    _make_project(db_session, project_name="Project B", technologies=["react"])

    rows = db_session.execute("SELECT count(*) AS c FROM tech_tags WHERE lower(name) = 'react'")
    assert rows[0]["c"] == 1


def test_list_projects_default_sort_and_pagination(db_session):
    _make_project(db_session, project_name="P1")
    _make_project(db_session, project_name="P2")
    _make_project(db_session, project_name="P3")

    items, total = list_projects(db_session, page=1, page_size=2)

    assert total == 3
    assert len(items) == 2
    # sort mặc định created_at desc -> P3 tạo sau cùng phải đứng đầu
    assert items[0].project_name == "P3"

    items_page2, total_page2 = list_projects(db_session, page=2, page_size=2)
    assert total_page2 == 3
    assert len(items_page2) == 1
    assert items_page2[0].project_name == "P1"


def test_list_projects_filters_by_keyword_across_fields(db_session):
    _make_project(db_session, project_name="Alpha", customer_name="Sony", technologies=["Vue"])
    _make_project(db_session, project_name="Beta", customer_name="Rakuten", technologies=["React"])

    items, total = list_projects(db_session, q="Sony")
    assert total == 1
    assert items[0].project_name == "Alpha"

    items, total = list_projects(db_session, q="React")
    assert total == 1
    assert items[0].project_name == "Beta"


def test_list_projects_filters_by_technology_and_semantics(db_session):
    _make_project(db_session, project_name="Alpha", technologies=["React", "AWS"])
    _make_project(db_session, project_name="Beta", technologies=["React"])

    items, total = list_projects(db_session, technologies=["React", "AWS"])
    assert total == 1
    assert items[0].project_name == "Alpha"


def test_list_projects_filters_by_project_type_and_semantics(db_session):
    # PROJ-04 (SỬA — CHANGE-012): AND semantics, giống `technologies`.
    _make_project(db_session, project_name="Alpha", project_types=["offshore", "lab"])
    _make_project(db_session, project_name="Beta", project_types=["offshore"])
    _make_project(db_session, project_name="Gamma", project_types=["lab"])

    items, total = list_projects(db_session, project_types=["offshore", "lab"])
    names = {item.project_name for item in items}
    assert total == 1
    assert names == {"Alpha"}


def test_get_project_returns_full_record(db_session):
    created = _make_project(db_session)

    result = get_project(db_session, created.id)

    assert result is not None
    assert result.id == created.id
    assert set(result.technologies) == {"React", "AWS"}
    assert set(result.project_types) == {"offshore", "new_dev"}


def test_get_project_returns_none_when_not_found(db_session):
    assert get_project(db_session, 999999) is None


def test_get_project_returns_none_when_soft_deleted(db_session):
    created = _make_project(db_session)

    assert delete_project(db_session, created.id) is True
    assert get_project(db_session, created.id) is None


def test_update_project_replaces_scalar_fields_and_associations(db_session):
    created = _make_project(db_session, technologies=["React"], project_types=["offshore"])

    update_data = ProjectUpdate(
        customer_name="New Customer",
        project_name="New Project",
        description="New description",
        start_date=date(2024, 3, 1),
        end_date=None,
        is_ongoing=True,
        team_size=3,
        total_man_month=Decimal("4.5"),
        source_note="note",
        technologies=["Vue"],
        project_types=["lab"],
    )

    result = update_project(db_session, created.id, update_data)

    assert result is not None
    assert result.customer_name == "New Customer"
    assert result.project_name == "New Project"
    assert result.technologies == ["Vue"]
    assert result.project_types == ["lab"]

    reloaded = get_project(db_session, created.id)
    assert reloaded is not None
    assert reloaded.technologies == ["Vue"]
    assert reloaded.project_types == ["lab"]


def test_update_project_returns_none_when_not_found(db_session):
    update_data = ProjectUpdate(
        customer_name="X",
        project_name="Y",
        start_date=date(2024, 1, 1),
    )

    assert update_project(db_session, 999999, update_data) is None


def test_update_project_returns_none_when_soft_deleted(db_session):
    created = _make_project(db_session)
    assert delete_project(db_session, created.id) is True

    update_data = ProjectUpdate(
        customer_name="X",
        project_name="Y",
        start_date=date(2024, 1, 1),
    )

    assert update_project(db_session, created.id, update_data) is None


def test_delete_project_sets_deleted_at_and_returns_true(db_session):
    created = _make_project(db_session)

    assert delete_project(db_session, created.id) is True
    assert get_project(db_session, created.id) is None


def test_delete_project_returns_false_when_not_found(db_session):
    assert delete_project(db_session, 999999) is False


def test_delete_project_returns_false_when_already_deleted(db_session):
    created = _make_project(db_session)

    assert delete_project(db_session, created.id) is True
    assert delete_project(db_session, created.id) is False


def test_list_projects_excludes_soft_deleted(db_session):
    kept = _make_project(db_session, project_name="Kept")
    deleted = _make_project(db_session, project_name="Deleted")
    delete_project(db_session, deleted.id)

    items, total = list_projects(db_session)

    assert total == 1
    assert [item.project_name for item in items] == [kept.project_name]


def test_search_tech_tags_matches_case_insensitive(db_session):
    _make_project(db_session, technologies=["React", "Ruby on Rails"])

    results = search_tech_tags(db_session, q="rea")
    assert results == ["React"]

    results_all = search_tech_tags(db_session, q=None)
    assert set(results_all) >= {"React", "Ruby on Rails"}


def test_search_tech_tags_without_q_returns_more_than_20(db_session):
    # PROJ-30 — dropdown filter cần TOÀN BỘ catalog, không chỉ 20 đầu.
    for i in range(25):
        _make_project(db_session, technologies=[f"ZZZ-Tag-{i:02d}"])

    results = search_tech_tags(db_session, q=None)

    assert sum(1 for name in results if name.startswith("ZZZ-Tag-")) == 25
