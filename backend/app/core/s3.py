"""Bọc tương tác S3 (presign PUT/GET, xoá object) — CHANGE-011, cùng
tinh thần cô lập external dependency như `app/core/db.py` cho DB, đơn
giản hơn nhiều vì S3 không có 2 nhánh local/production như Data API.

`_get_client()` tạo `boto3` client MỚI mỗi lần gọi (thay vì client
module-level) để test dễ monkeypatch (`monkeypatch.setattr(s3,
"_get_client", ...)`) mà không lo về cache/state giữa các test."""

from typing import Any

import boto3

from app.core.config import settings

PRESIGNED_PUT_EXPIRES_SECONDS = 300
PRESIGNED_GET_EXPIRES_SECONDS = 900


def _get_client() -> Any:
    return boto3.client("s3")


def generate_presigned_put_url(s3_key: str, content_type: str) -> str:
    """PROJ-18 — URL PUT hết hạn ngắn (5 phút) để client upload trực
    tiếp lên S3, không qua backend."""
    client = _get_client()
    return client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.attachments_bucket_name,
            "Key": s3_key,
            "ContentType": content_type,
        },
        ExpiresIn=PRESIGNED_PUT_EXPIRES_SECONDS,
    )


def generate_presigned_get_url(s3_key: str) -> str:
    """PROJ-19/20 — URL GET hết hạn dài hơn (15 phút), sinh mới mỗi lần
    trả response (bucket private hoàn toàn, không có URL public cố định)."""
    client = _get_client()
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.attachments_bucket_name, "Key": s3_key},
        ExpiresIn=PRESIGNED_GET_EXPIRES_SECONDS,
    )


def delete_object(s3_key: str) -> None:
    """PROJ-21 — hard delete object khỏi S3 (khác soft-delete của
    `projects`)."""
    client = _get_client()
    client.delete_object(Bucket=settings.attachments_bucket_name, Key=s3_key)
