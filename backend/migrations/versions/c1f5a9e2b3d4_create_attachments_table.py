"""create attachments table

Revision ID: c1f5a9e2b3d4
Revises: a4b7568918c1
Create Date: 2026-08-19 10:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'c1f5a9e2b3d4'
down_revision: str | Sequence[str] | None = 'a4b7568918c1'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# CHANGE-011-project-attachments — DM-PROJ-06.


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "attachments",
        sa.Column("id", sa.BigInteger(), sa.Identity(), primary_key=True),
        sa.Column(
            "project_id",
            sa.BigInteger(),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("s3_key", sa.String(length=512), nullable=False, unique=True),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("content_type", sa.String(length=100), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("created_by", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_attachments_project_id", "attachments", ["project_id"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_attachments_project_id", table_name="attachments")
    op.drop_table("attachments")
