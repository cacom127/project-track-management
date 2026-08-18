from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field, model_validator

# DM-PROJ-04 — catalog cố định, KHÔNG cho tạo thêm qua app.
PROJECT_TYPE_CODES = ("offshore", "ses", "lab", "new_dev", "maintenance")


class ProjectCreate(BaseModel):
    customer_name: str = Field(min_length=1)
    project_name: str = Field(min_length=1)
    description: str | None = None
    start_date: date
    end_date: date | None = None
    is_ongoing: bool = False
    team_size: int | None = None
    total_man_month: Decimal | None = None
    source_note: str | None = None
    technologies: list[str] = Field(default_factory=list)
    project_types: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def _validate_ongoing_end_date(self) -> "ProjectCreate":
        # PROJ-07
        if self.is_ongoing and self.end_date is not None:
            raise ValueError("end_date phải để trống khi is_ongoing=true")
        return self

    @model_validator(mode="after")
    def _validate_project_types(self) -> "ProjectCreate":
        # PROJ-08
        invalid = [t for t in self.project_types if t not in PROJECT_TYPE_CODES]
        if invalid:
            raise ValueError(f"project_types không hợp lệ: {invalid}")
        return self


class ProjectUpdate(ProjectCreate):
    """PROJ-15 — full replace (`PUT /projects/{id}`). Kế thừa toàn bộ
    field/validator (PROJ-07/PROJ-08) từ `ProjectCreate` vì payload giống
    hệt nhau (`created_by` không nằm trong request body ở cả 2 route,
    lấy từ `get_current_user_id`)."""


class ProjectOut(BaseModel):
    id: int
    customer_name: str
    project_name: str
    description: str | None
    start_date: date
    end_date: date | None
    is_ongoing: bool
    team_size: int | None
    total_man_month: Decimal | None
    source_note: str | None
    created_by: str
    created_at: datetime
    updated_at: datetime
    technologies: list[str]
    project_types: list[str]


class ProjectListResponse(BaseModel):
    items: list[ProjectOut]
    total: int
    page: int
    page_size: int
