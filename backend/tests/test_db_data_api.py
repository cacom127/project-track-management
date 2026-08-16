from unittest.mock import MagicMock

from app.core.db import DataApiSession


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
