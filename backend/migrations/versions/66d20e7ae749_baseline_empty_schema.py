"""baseline empty schema

Revision ID: 66d20e7ae749
Revises: 
Create Date: 2026-08-15 12:30:25.352304

"""
from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = '66d20e7ae749'
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
