from collections.abc import Generator
from typing import Any, Protocol

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings


class DBSession(Protocol):
    """Interface chung cho cả 2 nhánh truy vấn DB — router chỉ cần biết
    interface này, không cần biết đang chạy SQLAlchemy (local) hay Data
    API (production). Xem ARCH-14."""

    def execute(self, sql: str, params: dict[str, Any] | None = None) -> Any: ...


class SqlAlchemySessionAdapter:
    """Bọc SQLAlchemy Session để nhận SQL dạng string thuần, khớp
    interface với DataApiSession."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def execute(self, sql: str, params: dict[str, Any] | None = None) -> Any:
        return self._session.execute(text(sql), params or {})


engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def _get_sqlalchemy_session() -> Generator[DBSession, None, None]:
    session = SessionLocal()
    try:
        yield SqlAlchemySessionAdapter(session)
    finally:
        session.close()


class DataApiSession:
    """Truy vấn Aurora qua RDS Data API bằng `boto3` trực tiếp — KHÔNG
    dùng package `sqlalchemy-aurora-data-api` (bản mới nhất phát hành
    2023-12-30, quá 12 tháng, vi phạm CLAUDE.md mục 2). Xem ARCH-16."""

    def __init__(self, client: Any, cluster_arn: str, secret_arn: str, database: str) -> None:
        self._client = client
        self._cluster_arn = cluster_arn
        self._secret_arn = secret_arn
        self._database = database

    def execute(self, sql: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        response = self._client.execute_statement(
            resourceArn=self._cluster_arn,
            secretArn=self._secret_arn,
            database=self._database,
            sql=sql,
            parameters=_to_data_api_parameters(params or {}),
            includeResultMetadata=True,
        )
        return _parse_data_api_records(response)


def _to_data_api_parameters(params: dict[str, Any]) -> list[dict[str, Any]]:
    parameters = []
    for name, value in params.items():
        if isinstance(value, bool):
            field: dict[str, Any] = {"booleanValue": value}
        elif isinstance(value, int):
            field = {"longValue": value}
        elif isinstance(value, float):
            field = {"doubleValue": value}
        elif value is None:
            field = {"isNull": True}
        else:
            field = {"stringValue": str(value)}
        parameters.append({"name": name, "value": field})
    return parameters


def _parse_data_api_records(response: dict[str, Any]) -> list[dict[str, Any]]:
    columns = [col["name"] for col in response.get("columnMetadata", [])]
    records = []
    for record in response.get("records", []):
        row = {
            col_name: next(iter(field.values()), None) if field else None
            for col_name, field in zip(columns, record, strict=False)
        }
        records.append(row)
    return records


def _get_data_api_session() -> Generator[DBSession, None, None]:
    import boto3

    client = boto3.client("rds-data")
    yield DataApiSession(
        client=client,
        cluster_arn=settings.db_cluster_arn,
        secret_arn=settings.db_secret_arn,
        database=settings.db_name,
    )


def get_db_session() -> Generator[DBSession, None, None]:
    if settings.db_backend == "data-api":
        yield from _get_data_api_session()
    else:
        yield from _get_sqlalchemy_session()
