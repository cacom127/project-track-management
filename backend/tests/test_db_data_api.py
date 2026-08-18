from unittest.mock import MagicMock

import pytest

from app.core.db import DataApiSession


class FakeDatabaseResumingError(Exception):
    """Giả lập botocore ClientError với Error.Code =
    DatabaseResumingException — Aurora Serverless v2 đang wake up sau
    auto-pause (xem specs/architecture.md mục 3)."""

    def __init__(self) -> None:
        super().__init__("resuming")
        self.response = {"Error": {"Code": "DatabaseResumingException"}}


def test_execute_returns_parsed_records():
    fake_client = MagicMock()
    fake_client.execute_statement.return_value = {
        "columnMetadata": [{"name": "answer"}],
        "records": [[{"longValue": 1}]],
    }
    session = DataApiSession(
        client=fake_client,
        cluster_arn="arn:aws:rds:ap-northeast-1:123:cluster:test",
        secret_arn="arn:aws:secretsmanager:ap-northeast-1:123:secret:test",
        database="app",
    )

    rows = session.execute("SELECT 1 AS answer")

    assert rows == [{"answer": 1}]
    fake_client.execute_statement.assert_called_once_with(
        resourceArn="arn:aws:rds:ap-northeast-1:123:cluster:test",
        secretArn="arn:aws:secretsmanager:ap-northeast-1:123:secret:test",
        database="app",
        sql="SELECT 1 AS answer",
        parameters=[],
        includeResultMetadata=True,
    )


def test_execute_passes_typed_parameters():
    fake_client = MagicMock()
    fake_client.execute_statement.return_value = {"columnMetadata": [], "records": []}
    session = DataApiSession(
        client=fake_client,
        cluster_arn="arn",
        secret_arn="arn",
        database="app",
    )

    session.execute("SELECT :id", {"id": 5})

    called_params = fake_client.execute_statement.call_args.kwargs["parameters"]
    assert called_params == [{"name": "id", "value": {"longValue": 5}}]


def test_execute_propagates_client_errors():
    fake_client = MagicMock()
    fake_client.execute_statement.side_effect = RuntimeError("boom")
    session = DataApiSession(
        client=fake_client, cluster_arn="arn", secret_arn="arn", database="app"
    )

    try:
        session.execute("SELECT 1")
        raise AssertionError("expected RuntimeError")
    except RuntimeError:
        pass


def test_execute_retries_on_database_resuming_then_succeeds(monkeypatch):
    from app.core import db as db_module

    monkeypatch.setattr(db_module.time, "sleep", lambda _seconds: None)
    fake_client = MagicMock()
    fake_client.execute_statement.side_effect = [
        FakeDatabaseResumingError(),
        FakeDatabaseResumingError(),
        {"columnMetadata": [{"name": "answer"}], "records": [[{"longValue": 1}]]},
    ]
    session = DataApiSession(
        client=fake_client, cluster_arn="arn", secret_arn="arn", database="app"
    )

    rows = session.execute("SELECT 1 AS answer")

    assert rows == [{"answer": 1}]
    assert fake_client.execute_statement.call_count == 3


def test_execute_reraises_after_max_retries_on_database_resuming(monkeypatch):
    from app.core import db as db_module

    monkeypatch.setattr(db_module.time, "sleep", lambda _seconds: None)
    fake_client = MagicMock()
    fake_client.execute_statement.side_effect = FakeDatabaseResumingError()
    session = DataApiSession(
        client=fake_client, cluster_arn="arn", secret_arn="arn", database="app"
    )

    with pytest.raises(FakeDatabaseResumingError):
        session.execute("SELECT 1")

    assert fake_client.execute_statement.call_count == db_module.DB_RESUME_MAX_RETRIES


def test_execute_does_not_retry_non_resuming_errors():
    fake_client = MagicMock()
    fake_client.execute_statement.side_effect = RuntimeError("boom")
    session = DataApiSession(
        client=fake_client, cluster_arn="arn", secret_arn="arn", database="app"
    )

    with pytest.raises(RuntimeError):
        session.execute("SELECT 1")

    fake_client.execute_statement.assert_called_once()
