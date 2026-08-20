from datetime import UTC, datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.core import s3
from app.core.auth import get_current_user_id
from app.core.db import DBSession, get_db_session
from app.export.schemas import MAX_EXPORT_PROJECTS, ExportRequest, ExportResponse
from app.export.service import build_presentation
from app.projects.repository import get_project, list_attachment_s3_keys

router = APIRouter()

_EXPORT_CONTENT_TYPE = (
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
)


@router.post("/projects/export", response_model=ExportResponse)
def export_projects_route(
    payload: ExportRequest,
    db: DBSession = Depends(get_db_session),
    user_id: str = Depends(get_current_user_id),
) -> ExportResponse:
    # EXPORT-03
    project_ids = payload.project_ids
    if not project_ids or len(project_ids) > MAX_EXPORT_PROJECTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"project_ids phải có từ 1 đến {MAX_EXPORT_PROJECTS} phần tử",
        )

    # EXPORT-04
    projects = []
    missing_ids = []
    for project_id in project_ids:
        project = get_project(db, project_id)
        if project is None:
            missing_ids.append(project_id)
        else:
            projects.append(project)
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy project: {missing_ids}",
        )

    # EXPORT-07 — chỉ cần tối đa 4 ảnh/project (build_presentation tự
    # cắt, nhưng giới hạn ngay ở query cho nhẹ hơn).
    attachments_by_project = {
        project.id: list_attachment_s3_keys(db, project.id, limit=4) for project in projects
    }

    file_bytes = build_presentation(projects, attachments_by_project)

    export_key = f"exports/{uuid4()}.pptx"
    timestamp = datetime.now(UTC).strftime("%Y%m%d%H%M%S")
    s3.upload_bytes(
        export_key,
        file_bytes,
        content_type=_EXPORT_CONTENT_TYPE,
        content_disposition=f'attachment; filename="projects_export_{timestamp}.pptx"',
    )

    return ExportResponse(
        download_url=s3.generate_presigned_get_url(export_key),
        expires_in=s3.PRESIGNED_GET_EXPIRES_SECONDS,
    )
