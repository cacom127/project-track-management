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
        "project_name": "基幹システム刷新",
        "start_date": "2024-01-01",
        "technologies": [],
        "project_types": [],
    }
    payload.update(overrides)
    response = client.post("/projects", json=payload, headers=AUTH_HEADER)
    assert response.status_code == 201, response.text
    return response.json()


def test_delete_project_sets_deleted_at_and_returns_204(client):
    created = _create(client)

    response = client.delete(f"/projects/{created['id']}", headers=AUTH_HEADER)

    assert response.status_code == 204

    get_response = client.get(f"/projects/{created['id']}", headers=AUTH_HEADER)
    assert get_response.status_code == 404


def test_delete_project_404_when_not_found(client):
    response = client.delete("/projects/999999", headers=AUTH_HEADER)

    assert response.status_code == 404


def test_delete_project_404_when_already_deleted(client):
    created = _create(client)
    first = client.delete(f"/projects/{created['id']}", headers=AUTH_HEADER)
    assert first.status_code == 204

    second = client.delete(f"/projects/{created['id']}", headers=AUTH_HEADER)

    assert second.status_code == 404


def test_delete_project_without_auth_returns_401(client):
    created = _create(client)

    response = client.delete(f"/projects/{created['id']}")

    assert response.status_code == 401


def test_list_projects_excludes_soft_deleted(client):
    kept = _create(client, project_name="Kept")
    deleted = _create(client, project_name="Deleted")

    delete_response = client.delete(f"/projects/{deleted['id']}", headers=AUTH_HEADER)
    assert delete_response.status_code == 204

    response = client.get("/projects", headers=AUTH_HEADER)

    body = response.json()
    assert body["total"] == 1
    assert [item["project_name"] for item in body["items"]] == [kept["project_name"]]
