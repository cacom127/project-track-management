"""add projects deleted_at

Revision ID: a4b7568918c1
Revises: 9cdc4dbd9ca7
Create Date: 2026-08-19 09:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'a4b7568918c1'
down_revision: str | Sequence[str] | None = '9cdc4dbd9ca7'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# CHANGE-010-project-detail-edit-delete — DM-PROJ-05.


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "projects",
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("projects", "deleted_at")
