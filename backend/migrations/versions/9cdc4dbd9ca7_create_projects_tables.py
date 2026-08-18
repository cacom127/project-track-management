"""create projects tables

Revision ID: 9cdc4dbd9ca7
Revises: 66d20e7ae749
Create Date: 2026-08-18 09:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '9cdc4dbd9ca7'
down_revision: str | Sequence[str] | None = '66d20e7ae749'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# CHANGE-007-projects-list-create — DM-PROJ-01..05. Danh sách cố định,
# KHÔNG cho tạo thêm qua app (xem plan.md mục 2).
PROJECT_TYPE_CODES = ("offshore", "ses", "lab", "new_dev", "maintenance")


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "projects",
        sa.Column("id", sa.BigInteger(), sa.Identity(), primary_key=True),
        sa.Column("customer_name", sa.String(length=255), nullable=False),
        sa.Column("project_name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("is_ongoing", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("team_size", sa.Integer(), nullable=True),
        sa.Column("total_man_month", sa.Numeric(6, 2), nullable=True),
        sa.Column("source_note", sa.Text(), nullable=True),
        sa.Column("created_by", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at", sa.TIMESTAMP(), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.TIMESTAMP(), nullable=False, server_default=sa.func.now()
        ),
    )

    op.create_table(
        "tech_tags",
        sa.Column("id", sa.BigInteger(), sa.Identity(), primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column(
            "created_at", sa.TIMESTAMP(), nullable=False, server_default=sa.func.now()
        ),
    )
    # Case-insensitive uniqueness (DM-PROJ-02) — Postgres UNIQUE mặc định
    # phân biệt hoa/thường, dùng index trên lower(name) thay thế.
    op.create_index(
        "ix_tech_tags_name_lower",
        "tech_tags",
        [sa.text("lower(name)")],
        unique=True,
    )

    op.create_table(
        "project_tech_tags",
        sa.Column(
            "project_id",
            sa.BigInteger(),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "tag_id",
            sa.BigInteger(),
            sa.ForeignKey("tech_tags.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("project_id", "tag_id"),
    )

    op.create_table(
        "project_types",
        sa.Column("id", sa.BigInteger(), sa.Identity(), primary_key=True),
        sa.Column("code", sa.String(length=50), nullable=False, unique=True),
    )

    op.create_table(
        "project_project_types",
        sa.Column(
            "project_id",
            sa.BigInteger(),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "project_type_id",
            sa.BigInteger(),
            sa.ForeignKey("project_types.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("project_id", "project_type_id"),
    )

    # Seed catalog cố định — idempotent để migration chạy lại an toàn
    # (vd khi apply lại qua script Data API ở T2).
    project_types_table = sa.table(
        "project_types", sa.column("code", sa.String(length=50))
    )
    for code in PROJECT_TYPE_CODES:
        op.execute(
            sa.dialects.postgresql.insert(project_types_table)
            .values(code=code)
            .on_conflict_do_nothing(index_elements=["code"])
        )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("project_project_types")
    op.drop_table("project_types")
    op.drop_table("project_tech_tags")
    op.drop_index("ix_tech_tags_name_lower", table_name="tech_tags")
    op.drop_table("tech_tags")
    op.drop_table("projects")
