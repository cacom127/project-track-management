from fastapi.testclient import TestClient

from app.core.db import get_db_session
from app.main import app

client = TestClient(app)


def test_health_returns_ok_when_db_reachable():
    def fake_db_session_ok():
        class FakeConn:
            def execute(self, *_args, **_kwargs):
                return None

        yield FakeConn()

    app.dependency_overrides[get_db_session] = fake_db_session_ok
    try:
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok", "db": "ok"}
    finally:
        app.dependency_overrides.clear()


def test_health_reports_db_error_without_failing_request():
    def fake_db_session_error():
        class FakeConn:
            def execute(self, *_args, **_kwargs):
                raise RuntimeError("db down")

        yield FakeConn()

    app.dependency_overrides[get_db_session] = fake_db_session_error
    try:
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok", "db": "error"}
    finally:
        app.dependency_overrides.clear()
