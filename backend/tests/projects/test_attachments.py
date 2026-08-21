"""CHANGE-011 — PROJ-18..21. Mock toàn bộ `app.core.s3` (không gọi S3
thật, không có S3 emulator local — xem delta-spec.md mục 3)."""

import base64
import json
from unittest.mock import MagicMock

import pytest

from app.projects import repository


def _fake_bearer(sub: str = "user-1") -> str:
    def _b64(data: bytes) -> str:
        return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

    header = _b64(json.dumps({"alg": "none"}).encode())
    body = _b64(json.dumps({"sub": sub, "email": f"{sub}@vnext.vn"}).encode())
    return f"Bearer {header}.{body}.sig"


AUTH_HEADER = {"Authorization": _fake_bearer()}


def _create_project(client, **overrides):
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


@pytest.fixture(autouse=True)
def _mock_s3(monkeypatch):
    monkeypatch.setattr(
        repository.s3,
        "generate_presigned_put_url",
        MagicMock(return_value="https://example.com/put-url"),
    )
    monkeypatch.setattr(
        repository.s3,
        "generate_presigned_get_url",
        MagicMock(side_effect=lambda s3_key: f"https://example.com/get/{s3_key}"),
    )
    monkeypatch.setattr(repository.s3, "delete_object", MagicMock())
    return repository.s3


def _confirm_attachment(client, project_id, s3_key="projects/1/a.jpg", **overrides):
    payload = {
        "s3_key": s3_key,
        "file_name": "photo.jpg",
        "content_type": "image/jpeg",
        "size_bytes": 1024,
    }
    payload.update(overrides)
    return client.post(f"/projects/{project_id}/attachments", json=payload, headers=AUTH_HEADER)


# ---- PROJ-18: presign ----------------------------------------------------


def test_presign_attachment_validates_content_type(client):
    project = _create_project(client)

    response = client.post(
        f"/projects/{project['id']}/attachments/presign",
        json={"file_name": "a.gif", "content_type": "image/gif"},
        headers=AUTH_HEADER,
    )

    assert response.status_code == 400


def test_presign_attachment_returns_upload_url_and_s3_key(client, _mock_s3):
    project = _create_project(client)

    response = client.post(
        f"/projects/{project['id']}/attachments/presign",
        json={"file_name": "a.jpg", "content_type": "image/jpeg"},
        headers=AUTH_HEADER,
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["upload_url"] == "https://example.com/put-url"
    assert body["s3_key"].startswith(f"projects/{project['id']}/")
    assert body["s3_key"].endswith(".jpg")
    _mock_s3.generate_presigned_put_url.assert_called_once()


def test_presign_attachment_rejects_when_at_limit(client):
    project = _create_project(client)
    for i in range(10):
        s3_key = f"projects/{project['id']}/{i}.jpg"
        confirm = _confirm_attachment(client, project["id"], s3_key=s3_key)
        assert confirm.status_code == 201, confirm.text

    response = client.post(
        f"/projects/{project['id']}/attachments/presign",
        json={"file_name": "a.jpg", "content_type": "image/jpeg"},
        headers=AUTH_HEADER,
    )

    assert response.status_code == 400


def test_presign_attachment_404_when_project_not_found(client):
    response = client.post(
        "/projects/999999/attachments/presign",
        json={"file_name": "a.jpg", "content_type": "image/jpeg"},
        headers=AUTH_HEADER,
    )

    assert response.status_code == 404


# ---- PROJ-19: confirm -----------------------------------------------------


def test_confirm_attachment_creates_record(client, _mock_s3):
    project = _create_project(client)

    response = _confirm_attachment(client, project["id"])

    assert response.status_code == 201, response.text
    body = response.json()
    assert body["project_id"] == project["id"]
    assert body["file_name"] == "photo.jpg"
    assert body["content_type"] == "image/jpeg"
    assert body["size_bytes"] == 1024
    assert body["url"] == "https://example.com/get/projects/1/a.jpg"


def test_confirm_attachment_rejects_when_at_limit(client):
    project = _create_project(client)
    for i in range(10):
        s3_key = f"projects/{project['id']}/{i}.jpg"
        confirm = _confirm_attachment(client, project["id"], s3_key=s3_key)
        assert confirm.status_code == 201, confirm.text

    response = _confirm_attachment(client, project["id"], s3_key=f"projects/{project['id']}/11.jpg")

    assert response.status_code == 400


def test_confirm_attachment_rejects_when_size_exceeds_limit(client):
    project = _create_project(client)

    response = _confirm_attachment(client, project["id"], size_bytes=6 * 1024 * 1024)

    assert response.status_code == 400


def test_confirm_attachment_404_when_project_not_found(client):
    response = _confirm_attachment(client, 999999)

    assert response.status_code == 404


# ---- PROJ-20: list ---------------------------------------------------------


def test_list_attachments_returns_presigned_urls(client, _mock_s3):
    project = _create_project(client)
    _confirm_attachment(client, project["id"], s3_key="projects/1/a.jpg")
    _confirm_attachment(client, project["id"], s3_key="projects/1/b.jpg")

    response = client.get(f"/projects/{project['id']}/attachments", headers=AUTH_HEADER)

    assert response.status_code == 200, response.text
    items = response.json()
    assert len(items) == 2
    urls = {item["url"] for item in items}
    assert urls == {
        "https://example.com/get/projects/1/a.jpg",
        "https://example.com/get/projects/1/b.jpg",
    }


def test_list_attachments_404_when_project_not_found(client):
    response = client.get("/projects/999999/attachments", headers=AUTH_HEADER)

    assert response.status_code == 404


# ---- PROJ-21: delete --------------------------------------------------------


def test_delete_attachment_removes_s3_and_db(client, _mock_s3):
    project = _create_project(client)
    created = _confirm_attachment(client, project["id"]).json()

    response = client.delete(
        f"/projects/{project['id']}/attachments/{created['id']}", headers=AUTH_HEADER
    )

    assert response.status_code == 204
    _mock_s3.delete_object.assert_called_once_with("projects/1/a.jpg")

    list_response = client.get(f"/projects/{project['id']}/attachments", headers=AUTH_HEADER)
    assert list_response.json() == []


def test_delete_attachment_404_wrong_project(client):
    project_a = _create_project(client, project_name="A")
    project_b = _create_project(client, project_name="B")
    created = _confirm_attachment(client, project_a["id"]).json()

    response = client.delete(
        f"/projects/{project_b['id']}/attachments/{created['id']}", headers=AUTH_HEADER
    )

    assert response.status_code == 404


def test_delete_attachment_404_when_missing(client):
    project = _create_project(client)

    response = client.delete(f"/projects/{project['id']}/attachments/999999", headers=AUTH_HEADER)

    assert response.status_code == 404


def test_delete_attachment_404_when_project_not_found(client):
    response = client.delete("/projects/999999/attachments/1", headers=AUTH_HEADER)

    assert response.status_code == 404


# ---- list_attachment_s3_keys (CHANGE-017, EXPORT-07) ---------------------


def test_list_attachment_s3_keys_returns_upload_order(client, db_session, _mock_s3):
    project = _create_project(client)
    _confirm_attachment(client, project["id"], s3_key="projects/1/a.jpg")
    _confirm_attachment(client, project["id"], s3_key="projects/1/b.jpg")
    _confirm_attachment(client, project["id"], s3_key="projects/1/c.jpg")

    keys = repository.list_attachment_s3_keys(db_session, project["id"])

    assert keys == ["projects/1/a.jpg", "projects/1/b.jpg", "projects/1/c.jpg"]


def test_list_attachment_s3_keys_respects_limit(client, db_session, _mock_s3):
    project = _create_project(client)
    _confirm_attachment(client, project["id"], s3_key="projects/1/a.jpg")
    _confirm_attachment(client, project["id"], s3_key="projects/1/b.jpg")
    _confirm_attachment(client, project["id"], s3_key="projects/1/c.jpg")

    keys = repository.list_attachment_s3_keys(db_session, project["id"], limit=2)

    assert keys == ["projects/1/a.jpg", "projects/1/b.jpg"]
