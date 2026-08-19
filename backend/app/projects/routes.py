from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.auth import get_current_user_id
from app.core.db import DBSession, get_db_session
from app.projects.repository import (
    create_project,
    delete_project,
    get_project,
    list_projects,
    search_tech_tags,
    update_project,
)
from app.projects.schemas import ProjectCreate, ProjectListResponse, ProjectOut, ProjectUpdate

router = APIRouter()


@router.post("/projects", status_code=status.HTTP_201_CREATED, response_model=ProjectOut)
def create_project_route(
    payload: ProjectCreate,
    db: DBSession = Depends(get_db_session),
    user_id: str = Depends(get_current_user_id),
) -> ProjectOut:
    return create_project(db, payload, created_by=user_id)


@router.get("/projects", response_model=ProjectListResponse)
def list_projects_route(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    q: str | None = Query(None),
    technology: list[str] | None = Query(None),
    project_type: list[str] | None = Query(None),
    db: DBSession = Depends(get_db_session),
    user_id: str = Depends(get_current_user_id),
) -> ProjectListResponse:
    items, total = list_projects(
        db,
        page=page,
        page_size=page_size,
        q=q,
        technologies=technology,
        project_types=project_type,
    )
    return ProjectListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/projects/{project_id}", response_model=ProjectOut)
def get_project_route(
    project_id: int,
    db: DBSession = Depends(get_db_session),
    user_id: str = Depends(get_current_user_id),
) -> ProjectOut:
    # PROJ-14
    project = get_project(db, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.put("/projects/{project_id}", response_model=ProjectOut)
def update_project_route(
    project_id: int,
    payload: ProjectUpdate,
    db: DBSession = Depends(get_db_session),
    user_id: str = Depends(get_current_user_id),
) -> ProjectOut:
    # PROJ-15
    project = update_project(db, project_id, payload)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project_route(
    project_id: int,
    db: DBSession = Depends(get_db_session),
    user_id: str = Depends(get_current_user_id),
) -> None:
    # PROJ-16
    deleted = delete_project(db, project_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")


@router.get("/tech-tags", response_model=list[str])
def search_tech_tags_route(
    q: str | None = Query(None),
    db: DBSession = Depends(get_db_session),
    user_id: str = Depends(get_current_user_id),
) -> list[str]:
    return search_tech_tags(db, q)
