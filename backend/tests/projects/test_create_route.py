import base64
import json


def _fake_bearer(sub: str = "user-1") -> str:
    def _b64(data: bytes) -> str:
        return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

    header = _b64(json.dumps({"alg": "none"}).encode())
    body = _b64(json.dumps({"sub": sub, "email": f"{sub}@vnext.vn"}).encode())
    return f"Bearer {header}.{body}.sig"


VALID_PAYLOAD = {
    "customer_name": "ABC商事",
    "project_name": "基幹システム刷新",
    "start_date": "2024-01-01",
    "is_ongoing": True,
    "technologies": ["React", "AWS"],
    "project_types": ["offshore", "new_dev"],
}


def test_create_project_returns_201_with_full_body(client):
    response = client.post(
        "/projects", json=VALID_PAYLOAD, headers={"Authorization": _fake_bearer("user-1")}
    )

    assert response.status_code == 201
    body = response.json()
    assert body["customer_name"] == "ABC商事"
    assert body["created_by"] == "user-1"
    assert set(body["technologies"]) == {"React", "AWS"}
    assert set(body["project_types"]) == {"offshore", "new_dev"}
    assert body["id"] is not None


def test_missing_required_field_returns_400(client):
    payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "customer_name"}

    response = client.post("/projects", json=payload, headers={"Authorization": _fake_bearer()})

    assert response.status_code == 400


def test_is_ongoing_true_with_end_date_returns_400(client):
    payload = {**VALID_PAYLOAD, "is_ongoing": True, "end_date": "2024-12-31"}

    response = client.post("/projects", json=payload, headers={"Authorization": _fake_bearer()})

    assert response.status_code == 400


def test_invalid_project_type_returns_400(client):
    payload = {**VALID_PAYLOAD, "project_types": ["not-a-real-type"]}

    response = client.post("/projects", json=payload, headers={"Authorization": _fake_bearer()})

    assert response.status_code == 400


def test_missing_auth_header_returns_401(client):
    response = client.post("/projects", json=VALID_PAYLOAD)

    assert response.status_code == 401
