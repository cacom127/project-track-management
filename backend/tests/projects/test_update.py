import base64
import json


def _fake_bearer(sub: str = "user-1") -> str:
    def _b64(data: bytes) -> str:
        return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

    header = _b64(json.dumps({"alg": "none"}).encode())
    body = _b64(json.dumps({"sub": sub, "email": f"{sub}@vnext.vn"}).encode())
    return f"Bearer {header}.{body}.sig"


AUTH_HEADER = {"Authorization": _fake_bearer()}

VALID_PAYLOAD = {
    "customer_name": "ABC商事",
    "project_name": "基幹システム刷新",
    "start_date": "2024-01-01",
    "technologies": ["React", "AWS"],
    "project_types": ["offshore"],
}


def _create(client, **overrides):
    payload = {**VALID_PAYLOAD, **overrides}
    response = client.post("/projects", json=payload, headers=AUTH_HEADER)
    assert response.status_code == 201, response.text
    return response.json()


def test_update_project_replaces_all_fields(client):
    created = _create(client)

    update_payload = {
        "customer_name": "XYZ商事",
        "project_name": "更新後プロジェクト",
        "description": "新しい説明",
        "start_date": "2024-02-01",
        "end_date": "2024-12-31",
        "is_ongoing": False,
        "team_size": 8,
        "total_man_month": "20.5",
        "source_note": "更新メモ",
        "technologies": ["Vue"],
        "project_types": ["lab"],
    }

    response = client.put(f"/projects/{created['id']}", json=update_payload, headers=AUTH_HEADER)

    assert response.status_code == 200
    body = response.json()
    assert body["customer_name"] == "XYZ商事"
    assert body["project_name"] == "更新後プロジェクト"
    assert body["description"] == "新しい説明"
    assert body["start_date"] == "2024-02-01"
    assert body["end_date"] == "2024-12-31"
    assert body["is_ongoing"] is False
    assert body["team_size"] == 8
    assert body["source_note"] == "更新メモ"


def test_update_project_replaces_tech_and_type_associations(client):
    created = _create(client, technologies=["React", "AWS"], project_types=["offshore"])

    update_payload = {**VALID_PAYLOAD, "technologies": ["Vue"], "project_types": ["lab"]}

    response = client.put(f"/projects/{created['id']}", json=update_payload, headers=AUTH_HEADER)

    assert response.status_code == 200
    body = response.json()
    assert body["technologies"] == ["Vue"]
    assert body["project_types"] == ["lab"]

    get_response = client.get(f"/projects/{created['id']}", headers=AUTH_HEADER)
    get_body = get_response.json()
    assert get_body["technologies"] == ["Vue"]
    assert get_body["project_types"] == ["lab"]


def test_update_project_validates_ongoing_end_date(client):
    created = _create(client)

    update_payload = {**VALID_PAYLOAD, "is_ongoing": True, "end_date": "2024-12-31"}

    response = client.put(f"/projects/{created['id']}", json=update_payload, headers=AUTH_HEADER)

    assert response.status_code == 400


def test_update_project_validates_invalid_project_types(client):
    created = _create(client)

    update_payload = {**VALID_PAYLOAD, "project_types": ["not-a-real-type"]}

    response = client.put(f"/projects/{created['id']}", json=update_payload, headers=AUTH_HEADER)

    assert response.status_code == 400


def test_update_project_404_when_not_found(client):
    response = client.put("/projects/999999", json=VALID_PAYLOAD, headers=AUTH_HEADER)

    assert response.status_code == 404


def test_update_project_404_when_soft_deleted(client):
    created = _create(client)
    delete_response = client.delete(f"/projects/{created['id']}", headers=AUTH_HEADER)
    assert delete_response.status_code == 204

    response = client.put(f"/projects/{created['id']}", json=VALID_PAYLOAD, headers=AUTH_HEADER)

    assert response.status_code == 404


def test_update_project_without_auth_returns_401(client):
    created = _create(client)

    response = client.put(f"/projects/{created['id']}", json=VALID_PAYLOAD)

    assert response.status_code == 401
