from unittest.mock import MagicMock

from app.core.db import DataApiSession, SqlAlchemySessionAdapter


def test_execute_returns_list_of_dicts_when_query_returns_rows():
    fake_session = MagicMock()
    fake_result = MagicMock()
    fake_result.returns_rows = True
    fake_result.mappings.return_value.all.return_value = [{"answer": 1}]
    fake_session.execute.return_value = fake_result
    adapter = SqlAlchemySessionAdapter(fake_session)

    rows = adapter.execute("SELECT 1 AS answer")

    assert rows == [{"answer": 1}]


def test_execute_returns_empty_list_when_query_has_no_rows():
    fake_session = MagicMock()
    fake_result = MagicMock()
    fake_result.returns_rows = False
    fake_session.execute.return_value = fake_result
    adapter = SqlAlchemySessionAdapter(fake_session)

    rows = adapter.execute("INSERT INTO t (id) VALUES (1)")

    assert rows == []


def test_commit_delegates_to_underlying_session():
    fake_session = MagicMock()
    adapter = SqlAlchemySessionAdapter(fake_session)

    adapter.commit()

    fake_session.commit.assert_called_once()


def test_data_api_commit_is_noop():
    fake_client = MagicMock()
    session = DataApiSession(client=fake_client, cluster_arn="a", secret_arn="b", database="app")

    session.commit()  # không raise, không gọi client nào

    fake_client.assert_not_called()
