"""CHANGE-017 (EXPORT-03/04/09/10) — test ở tầng route/HTTP, dùng DB
thật (fixture `client`, xem `tests/conftest.py`). Mock `app.export.
routes.s3` VÀ `app.export.service.s3` (2 module khác nhau đều import
`app.core.s3` riêng, cùng tinh thần mock như `tests/projects/
test_attachments.py`)."""

import base64
import json
from unittest.mock import MagicMock

import pytest

from app.export import routes as export_routes
from app.export import service as export_service


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
    monkeypatch.setattr(export_service.s3, "get_object_bytes", MagicMock(return_value=b"x"))
    monkeypatch.setattr(export_routes.s3, "upload_bytes", MagicMock())
    monkeypatch.setattr(
        export_routes.s3,
        "generate_presigned_get_url",
        MagicMock(side_effect=lambda key: f"https://example.com/get/{key}"),
    )


def test_export_rejects_empty_project_ids(client):
    response = client.post("/projects/export", json={"project_ids": []}, headers=AUTH_HEADER)

    assert response.status_code == 400


def test_export_rejects_more_than_10_project_ids(client):
    response = client.post(
        "/projects/export", json={"project_ids": list(range(1, 12))}, headers=AUTH_HEADER
    )

    assert response.status_code == 400


def test_export_404_when_project_id_missing(client):
    project = _create_project(client)
    missing_id = project["id"] + 999

    response = client.post(
        "/projects/export",
        json={"project_ids": [project["id"], missing_id]},
        headers=AUTH_HEADER,
    )

    assert response.status_code == 404
    assert str(missing_id) in response.text


def test_export_returns_presigned_download_url(client):
    project = _create_project(client)

    response = client.post(
        "/projects/export", json={"project_ids": [project["id"]]}, headers=AUTH_HEADER
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["download_url"].startswith("https://example.com/get/exports/")
    assert body["download_url"].endswith(".pptx")
    assert body["expires_in"] == export_routes.s3.PRESIGNED_GET_EXPIRES_SECONDS
    export_routes.s3.upload_bytes.assert_called_once()
    _, kwargs = export_routes.s3.upload_bytes.call_args
    assert kwargs["content_type"].endswith("presentationml.presentation")
    assert "attachment" in kwargs["content_disposition"]
