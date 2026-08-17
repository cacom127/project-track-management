import base64
import json


def _fake_bearer(sub: str = "user-1") -> str:
    def _b64(data: bytes) -> str:
        return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

    header = _b64(json.dumps({"alg": "none"}).encode())
    body = _b64(json.dumps({"sub": sub, "email": f"{sub}@vnext.vn"}).encode())
    return f"Bearer {header}.{body}.sig"


AUTH_HEADER = {"Authorization": _fake_bearer()}


def _create(client, technologies):
    payload = {
        "customer_name": "ABC商事",
        "project_name": "P",
        "start_date": "2024-01-01",
        "technologies": technologies,
        "project_types": [],
    }
    response = client.post("/projects", json=payload, headers=AUTH_HEADER)
    assert response.status_code == 201, response.text


def test_tech_tags_matches_case_insensitive_query(client):
    _create(client, ["React", "Ruby on Rails"])

    response = client.get("/tech-tags", params={"q": "rea"}, headers=AUTH_HEADER)

    assert response.status_code == 200
    assert response.json() == ["React"]


def test_tech_tags_without_query_returns_all(client):
    _create(client, ["React", "AWS"])

    response = client.get("/tech-tags", headers=AUTH_HEADER)

    assert response.status_code == 200
    assert set(response.json()) >= {"React", "AWS"}


def test_tech_tags_without_auth_returns_401(client):
    response = client.get("/tech-tags")

    assert response.status_code == 401
