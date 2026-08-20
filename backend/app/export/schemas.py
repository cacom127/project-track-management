from pydantic import BaseModel, Field

from app.core.s3 import PRESIGNED_GET_EXPIRES_SECONDS

MAX_EXPORT_PROJECTS = 10


class ExportRequest(BaseModel):
    """CHANGE-017 (EXPORT-03) — số lượng validate ở route (`1..10`),
    KHÔNG dùng `Field(min_length=1, max_length=10)` để có thể trả message
    tuỳ biến rõ nghĩa hơn message mặc định của Pydantic."""

    project_ids: list[int] = Field(default_factory=list)


class ExportResponse(BaseModel):
    download_url: str
    expires_in: int = PRESIGNED_GET_EXPIRES_SECONDS
