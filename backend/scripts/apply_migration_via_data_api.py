"""Áp dụng Alembic migration lên Aurora production qua RDS Data API.

Production không có kết nối trực tiếp tới Aurora (không VPC/bastion) —
`alembic upgrade head` (kết nối psycopg trực tiếp) không chạy được nhắm
vào Aurora thật. Script này sinh SQL bằng `alembic upgrade <rev>:head
--sql` (offline mode, không cần kết nối DB thật) rồi chạy từng câu qua
RDS Data API. Xem
`changes/_archive/CHANGE-007-projects-list-create/plan.md` mục 2.

Tái dùng được cho MỌI migration sau này, không chỉ CHANGE-007.

Usage (từ thư mục `backend/`, sau khi đã cấu hình AWS SSO/profile đúng):
    export AWS_PROFILE=project-track
    export AWS_DEFAULT_REGION=ap-northeast-1
    export DB_CLUSTER_ARN=<lấy từ CDK Output DbClusterArn>
    export DB_SECRET_ARN=<lấy từ CDK Output DbSecretArn>
    export DB_NAME=app
    uv run python -m scripts.apply_migration_via_data_api

LƯU Ý: PHẢI chạy dạng module (`-m scripts.apply_migration_via_data_api`),
KHÔNG chạy trực tiếp (`python scripts/apply_migration_via_data_api.py`)
— chạy trực tiếp thì `sys.path[0]` là thư mục `scripts/`, không phải gốc
`backend/`, nên `from app.core.config import settings` báo
`ModuleNotFoundError: No module named 'app'` (gặp thật khi deploy
CHANGE-007). `boto3` cũng cần `AWS_PROFILE`/`AWS_DEFAULT_REGION` tường
minh trong ĐÚNG terminal đang chạy script — không tự kế thừa từ terminal
khác đã `cdk deploy`/`aws sso login` trước đó.
"""

import subprocess

import boto3

from app.core.config import settings


def _fetch_current_revision(client, cluster_arn: str, secret_arn: str, database: str) -> str:
    """Trả về revision hiện tại trên Aurora, hoặc "base" nếu chưa từng
    chạy migration nào (bảng alembic_version chưa tồn tại)."""
    try:
        response = client.execute_statement(
            resourceArn=cluster_arn,
            secretArn=secret_arn,
            database=database,
            sql="SELECT version_num FROM alembic_version",
        )
    except client.exceptions.BadRequestException as exc:
        if "does not exist" in str(exc):
            return "base"
        raise
    records = response.get("records", [])
    if not records:
        return "base"
    return records[0][0]["stringValue"]


def _generate_sql(start_revision: str) -> str:
    """Sinh SQL offline cho khoảng `start_revision` -> head — không cần
    kết nối DB thật (chỉ dùng URL để xác định dialect)."""
    result = subprocess.run(
        ["uv", "run", "alembic", "upgrade", f"{start_revision}:head", "--sql"],
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout


def _split_statements(sql_text: str) -> list[str]:
    """Tách SQL offline của Alembic thành từng câu lệnh, bỏ comment và
    marker transaction (`BEGIN;`/`COMMIT;`) — Data API tự quản lý
    transaction riêng qua begin_transaction/commit_transaction."""
    statements: list[str] = []
    current: list[str] = []
    for line in sql_text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("--"):
            continue
        current.append(line)
        if stripped.endswith(";"):
            statement = "\n".join(current).strip()
            current = []
            if statement.upper() in ("BEGIN;", "COMMIT;"):
                continue
            statements.append(statement)
    return statements


def main() -> None:
    client = boto3.client("rds-data")
    cluster_arn = settings.db_cluster_arn
    secret_arn = settings.db_secret_arn
    database = settings.db_name

    current_revision = _fetch_current_revision(client, cluster_arn, secret_arn, database)
    sql_text = _generate_sql(current_revision)
    statements = _split_statements(sql_text)

    if not statements:
        print(f"Đã ở head (revision hiện tại: {current_revision}) — không có gì để chạy.")
        return

    print(f"Chuẩn bị chạy {len(statements)} câu SQL (từ {current_revision} -> head):")
    for statement in statements:
        print(f"  - {statement.splitlines()[0][:80]}")

    transaction_id = client.begin_transaction(
        resourceArn=cluster_arn,
        secretArn=secret_arn,
        database=database,
    )["transactionId"]

    try:
        for statement in statements:
            client.execute_statement(
                resourceArn=cluster_arn,
                secretArn=secret_arn,
                database=database,
                sql=statement,
                transactionId=transaction_id,
            )
    except Exception:
        client.rollback_transaction(
            resourceArn=cluster_arn,
            secretArn=secret_arn,
            transactionId=transaction_id,
        )
        raise

    client.commit_transaction(
        resourceArn=cluster_arn,
        secretArn=secret_arn,
        transactionId=transaction_id,
    )
    print("Migration áp dụng thành công lên production.")


if __name__ == "__main__":
    main()
