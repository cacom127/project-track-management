from unittest.mock import MagicMock, patch

from scripts.apply_migration_via_data_api import (
    _fetch_current_revision,
    _split_statements,
    main,
)

SAMPLE_ALEMBIC_SQL = """BEGIN;

-- Running upgrade 66d20e7ae749 -> 9cdc4dbd9ca7

CREATE TABLE projects (
    id BIGINT NOT NULL
);

INSERT INTO alembic_version (version_num) VALUES ('9cdc4dbd9ca7');

COMMIT;
"""


def test_split_statements_strips_comments_and_transaction_markers():
    statements = _split_statements(SAMPLE_ALEMBIC_SQL)

    assert len(statements) == 2
    assert statements[0].startswith("CREATE TABLE projects")
    assert statements[1].startswith("INSERT INTO alembic_version")


def test_split_statements_ignores_blank_lines():
    assert _split_statements("\n\n   \n") == []


def test_fetch_current_revision_returns_base_when_table_missing():
    fake_client = MagicMock()

    class FakeBadRequest(Exception):
        pass

    fake_client.exceptions.BadRequestException = FakeBadRequest
    fake_client.execute_statement.side_effect = FakeBadRequest(
        'relation "alembic_version" does not exist'
    )

    revision = _fetch_current_revision(fake_client, "arn", "arn", "app")

    assert revision == "base"


def test_fetch_current_revision_returns_existing_value():
    fake_client = MagicMock()
    fake_client.execute_statement.return_value = {
        "records": [[{"stringValue": "66d20e7ae749"}]]
    }

    revision = _fetch_current_revision(fake_client, "arn", "arn", "app")

    assert revision == "66d20e7ae749"


def test_fetch_current_revision_reraises_unrelated_errors():
    fake_client = MagicMock()

    class FakeBadRequest(Exception):
        pass

    fake_client.exceptions.BadRequestException = FakeBadRequest
    fake_client.execute_statement.side_effect = FakeBadRequest("permission denied")

    try:
        _fetch_current_revision(fake_client, "arn", "arn", "app")
        raise AssertionError("expected FakeBadRequest to propagate")
    except FakeBadRequest:
        pass


@patch("scripts.apply_migration_via_data_api._generate_sql")
@patch("scripts.apply_migration_via_data_api._fetch_current_revision")
@patch("scripts.apply_migration_via_data_api.boto3")
def test_main_commits_transaction_on_success(mock_boto3, mock_fetch_rev, mock_gen_sql):
    fake_client = MagicMock()
    mock_boto3.client.return_value = fake_client
    fake_client.begin_transaction.return_value = {"transactionId": "txn-1"}
    mock_fetch_rev.return_value = "base"
    mock_gen_sql.return_value = "CREATE TABLE t (id INT);"

    main()

    fake_client.execute_statement.assert_called_once()
    assert fake_client.execute_statement.call_args.kwargs["transactionId"] == "txn-1"
    fake_client.commit_transaction.assert_called_once_with(
        resourceArn=fake_client.begin_transaction.call_args.kwargs["resourceArn"],
        secretArn=fake_client.begin_transaction.call_args.kwargs["secretArn"],
        transactionId="txn-1",
    )
    fake_client.rollback_transaction.assert_not_called()


@patch("scripts.apply_migration_via_data_api._generate_sql")
@patch("scripts.apply_migration_via_data_api._fetch_current_revision")
@patch("scripts.apply_migration_via_data_api.boto3")
def test_main_rolls_back_transaction_on_failure(mock_boto3, mock_fetch_rev, mock_gen_sql):
    fake_client = MagicMock()
    mock_boto3.client.return_value = fake_client
    fake_client.begin_transaction.return_value = {"transactionId": "txn-1"}
    fake_client.execute_statement.side_effect = RuntimeError("boom")
    mock_fetch_rev.return_value = "base"
    mock_gen_sql.return_value = "CREATE TABLE t (id INT);"

    try:
        main()
        raise AssertionError("expected RuntimeError to propagate")
    except RuntimeError:
        pass

    fake_client.rollback_transaction.assert_called_once()
    fake_client.commit_transaction.assert_not_called()


@patch("scripts.apply_migration_via_data_api._generate_sql")
@patch("scripts.apply_migration_via_data_api._fetch_current_revision")
@patch("scripts.apply_migration_via_data_api.boto3")
def test_main_does_nothing_when_already_at_head(mock_boto3, mock_fetch_rev, mock_gen_sql):
    fake_client = MagicMock()
    mock_boto3.client.return_value = fake_client
    mock_fetch_rev.return_value = "9cdc4dbd9ca7"
    mock_gen_sql.return_value = "-- nothing to do\n"

    main()

    fake_client.begin_transaction.assert_not_called()
    fake_client.execute_statement.assert_not_called()
