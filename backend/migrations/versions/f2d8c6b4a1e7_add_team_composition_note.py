"""add team_composition_note to projects

Revision ID: f2d8c6b4a1e7
Revises: 6aa383c17cc9
Create Date: 2026-08-19 16:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'f2d8c6b4a1e7'
down_revision: str | Sequence[str] | None = '6aa383c17cc9'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("projects", sa.Column("team_composition_note", sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("projects", "team_composition_note")
