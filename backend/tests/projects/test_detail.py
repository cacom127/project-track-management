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
        "technologies": ["React", "AWS"],
        "project_types": ["offshore"],
    }
    payload.update(overrides)
    response = client.post("/projects", json=payload, headers=AUTH_HEADER)
    assert response.status_code == 201, response.text
    return response.json()


def test_get_project_returns_full_object(client):
    created = _create(client)

    response = client.get(f"/projects/{created['id']}", headers=AUTH_HEADER)

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == created["id"]
    assert body["customer_name"] == "ABC商事"
    assert set(body["technologies"]) == {"React", "AWS"}
    assert set(body["project_types"]) == {"offshore"}


def test_get_project_404_when_not_found(client):
    response = client.get("/projects/999999", headers=AUTH_HEADER)

    assert response.status_code == 404


def test_get_project_404_when_soft_deleted(client):
    created = _create(client)
    delete_response = client.delete(f"/projects/{created['id']}", headers=AUTH_HEADER)
    assert delete_response.status_code == 204

    response = client.get(f"/projects/{created['id']}", headers=AUTH_HEADER)

    assert response.status_code == 404


def test_get_project_without_auth_returns_401(client):
    created = _create(client)

    response = client.get(f"/projects/{created['id']}")

    assert response.status_code == 401
