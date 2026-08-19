import base64
import json


def _fake_bearer(sub: str = "user-1") -> str:
    def _b64(data: bytes) -> str:
        return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

    header = _b64(json.dumps({"alg": "none"}).encode())
    body = _b64(json.dumps({"sub": sub, "email": f"{sub}@vnext.vn"}).encode())
    return f"Bearer {header}.{body}.sig"


AUTH_HEADER = {"Authorization": _fake_bearer()}


def _create(client, **overrides):
    payload = {
        "customer_name": "ABC商事",
        "project_name": "P",
        "start_date": "2024-01-01",
        "technologies": [],
        "project_types": [],
    }
    payload.update(overrides)
    response = client.post("/projects", json=payload, headers=AUTH_HEADER)
    assert response.status_code == 201, response.text
    return response.json()


def test_list_returns_empty_response_shape_when_no_projects(client):
    response = client.get("/projects", headers=AUTH_HEADER)

    assert response.status_code == 200
    assert response.json() == {"items": [], "total": 0, "page": 1, "page_size": 20}


def test_list_respects_page_and_page_size(client):
    _create(client, project_name="P1")
    _create(client, project_name="P2")
    _create(client, project_name="P3")

    response = client.get("/projects", params={"page": 2, "page_size": 2}, headers=AUTH_HEADER)

    body = response.json()
    assert response.status_code == 200
    assert body["total"] == 3
    assert body["page"] == 2
    assert body["page_size"] == 2
    assert len(body["items"]) == 1
    assert body["items"][0]["project_name"] == "P1"  # sort created_at desc


def test_list_filters_by_q(client):
    _create(client, project_name="Alpha", customer_name="Sony")
    _create(client, project_name="Beta", customer_name="Rakuten")

    response = client.get("/projects", params={"q": "Sony"}, headers=AUTH_HEADER)

    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["project_name"] == "Alpha"


def test_list_filters_by_technology_and_semantics(client):
    _create(client, project_name="Alpha", technologies=["React", "AWS"])
    _create(client, project_name="Beta", technologies=["React"])

    response = client.get(
        "/projects", params=[("technology", "React"), ("technology", "AWS")], headers=AUTH_HEADER
    )

    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["project_name"] == "Alpha"


def test_list_filters_by_project_type_and_semantics(client):
    # PROJ-04 (SỬA — CHANGE-012): AND semantics, giống `technologies`.
    _create(client, project_name="Alpha", project_types=["offshore", "lab"])
    _create(client, project_name="Beta", project_types=["offshore"])
    _create(client, project_name="Gamma", project_types=["lab"])

    response = client.get(
        "/projects",
        params=[("project_type", "offshore"), ("project_type", "lab")],
        headers=AUTH_HEADER,
    )

    body = response.json()
    names = {item["project_name"] for item in body["items"]}
    assert body["total"] == 1
    assert names == {"Alpha"}


def test_list_without_auth_returns_401(client):
    response = client.get("/projects")

    assert response.status_code == 401
