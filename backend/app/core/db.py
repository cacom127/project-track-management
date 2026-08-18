import time
from collections.abc import Generator
from typing import Any, Protocol

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

# Aurora Serverless v2 auto-pause (capacity 0-1 ACU, xem
# specs/architecture.md mục 3): request đầu tiên sau thời gian dài idle
# có thể gặp DatabaseResumingException trong lúc Aurora "wake up" —
# retry với backoff ngắn thay vì để lỗi bay thẳng ra client (bug thật
# gặp lúc test CHANGE-007 trên production: POST /projects trả 500
# "Internal Server Error" không có traceback rõ ràng phía client).
DB_RESUME_MAX_RETRIES = 3
DB_RESUME_RETRY_DELAY_SECONDS = 2


class DBSession(Protocol):
    """Interface chung cho cả 2 nhánh truy vấn DB — router chỉ cần biết
    interface này, không cần biết đang chạy SQLAlchemy (local) hay Data
    API (production). Xem ARCH-14.

    `execute()` luôn trả `list[dict[str, Any]]` ở CẢ 2 nhánh (rỗng nếu
    câu lệnh không trả row, vd INSERT/UPDATE không có RETURNING) — trước
    `CHANGE-007` chỉ nhánh Data API trả đúng dạng này, nhánh SQLAlchemy
    trả thẳng `CursorResult` (không ai phát hiện vì `health` chỉ chạy
    SELECT rồi bỏ qua kết quả). Chuẩn hoá lại khi `projects` module lần
    đầu thực sự dùng kết quả INSERT/SELECT từ router.
    `commit()` cần gọi tường minh sau khi ghi dữ liệu — nhánh Data API
    tự commit từng câu lệnh (no-op ở đây), nhánh SQLAlchemy cần
    `session.commit()` thật."""

    def execute(self, sql: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]: ...

    def commit(self) -> None: ...


class SqlAlchemySessionAdapter:
    """Bọc SQLAlchemy Session để nhận SQL dạng string thuần, khớp
    interface với DataApiSession."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def execute(self, sql: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        result = self._session.execute(text(sql), params or {})
        if result.returns_rows:
            return [dict(row) for row in result.mappings().all()]
        return []

    def commit(self) -> None:
        self._session.commit()


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
        for attempt in range(DB_RESUME_MAX_RETRIES):
            try:
                response = self._client.execute_statement(
                    resourceArn=self._cluster_arn,
                    secretArn=self._secret_arn,
                    database=self._database,
                    sql=sql,
                    parameters=_to_data_api_parameters(params or {}),
                    includeResultMetadata=True,
                )
                return _parse_data_api_records(response)
            except Exception as exc:
                if not _is_database_resuming(exc) or attempt == DB_RESUME_MAX_RETRIES - 1:
                    raise
                time.sleep(DB_RESUME_RETRY_DELAY_SECONDS)
        raise AssertionError("unreachable")  # vòng for luôn return hoặc raise

    def commit(self) -> None:
        """No-op: mỗi `execute_statement` (không truyền `transactionId`)
        tự commit ngay khi Data API xử lý xong, không có khái niệm
        session cần commit riêng như SQLAlchemy."""


def _is_database_resuming(exc: Exception) -> bool:
    """Nhận diện `botocore.errorfactory.DatabaseResumingException` bằng
    `Error.Code` trong `exc.response` (giống cách botocore tự expose),
    không dựa vào `client.exceptions.DatabaseResumingException` — tránh
    phải mock đúng class thật trong test."""
    response = getattr(exc, "response", None)
    if not isinstance(response, dict):
        return False
    return response.get("Error", {}).get("Code") == "DatabaseResumingException"


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


def _parse_data_api_field(field: dict[str, Any] | None) -> Any:
    """Data API trả field dạng `{"isNull": True}` cho cột NULL (đúng 1
    key duy nhất, không kèm value khác) — PHẢI check riêng key `isNull`,
    không được lấy đại `next(iter(field.values()))` vì với field NULL,
    giá trị đó chính là `True` (flag của key `isNull`), không phải
    `None` (bug thật gặp ở CHANGE-008: cột NULL bị hiểu nhầm thành bool
    `True`, Pydantic validate lỗi vì kiểu date/decimal/string nhận `True`)."""
    if not field or field.get("isNull"):
        return None
    # Bỏ qua key "isNull" khi lấy giá trị thật — phòng trường hợp Data
    # API trả kèm "isNull": false cùng key giá trị trong 1 dict (không
    # chỉ đúng 1 key như quan sát thực tế), next(iter()) có thể vô tình
    # lấy nhầm giá trị của "isNull" nếu nó đứng trước trong dict.
    for key, value in field.items():
        if key == "isNull":
            continue
        if key == "arrayValue":
            return _parse_data_api_array_value(value)
        return value
    return None


def _parse_data_api_array_value(array_value: dict[str, Any]) -> list[Any]:
    """Cột Postgres ARRAY (vd `array_agg` cho `technologies`/
    `project_types` — xem `app.projects.repository.list_projects`) trả
    dạng `{"arrayValue": {"stringValues": [...]}}` (hoặc
    `longValues`/`booleanValues`/`doubleValues`/`arrayValues` tuỳ kiểu
    phần tử) qua Data API — KHÔNG phải list phẳng như local SQLAlchemy.
    Rủi ro đã cảnh báo ở `CHANGE-007`, xác nhận + fix ở `CHANGE-008`."""
    for key, value in array_value.items():
        if key == "arrayValues":
            return [_parse_data_api_array_value(item) for item in value]
        return list(value)
    return []


def _parse_data_api_records(response: dict[str, Any]) -> list[dict[str, Any]]:
    columns = [col["name"] for col in response.get("columnMetadata", [])]
    records = []
    for record in response.get("records", []):
        row = {
            col_name: _parse_data_api_field(field)
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
