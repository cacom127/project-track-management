"""add project extra fields (industry/outcome_note/dev_process_phases)

Revision ID: 6aa383c17cc9
Revises: c1f5a9e2b3d4
Create Date: 2026-08-19 15:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '6aa383c17cc9'
down_revision: str | Sequence[str] | None = 'c1f5a9e2b3d4'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# CHANGE-012-project-extra-fields — DM-PROJ-07/08. Danh sách cố định,
# KHÔNG cho tạo thêm qua app (giống PROJECT_TYPE_CODES).
DEV_PROCESS_PHASE_CODES = (
    "requirements",
    "design",
    "implementation",
    "testing",
    "release",
    "maintenance_ops",
)


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("projects", sa.Column("industry", sa.String(length=255), nullable=True))
    op.add_column("projects", sa.Column("outcome_note", sa.Text(), nullable=True))

    op.create_table(
        "dev_process_phases",
        sa.Column("id", sa.BigInteger(), sa.Identity(), primary_key=True),
        sa.Column("code", sa.String(length=50), nullable=False, unique=True),
    )

    op.create_table(
        "project_dev_process_phases",
        sa.Column(
            "project_id",
            sa.BigInteger(),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "dev_process_phase_id",
            sa.BigInteger(),
            sa.ForeignKey("dev_process_phases.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("project_id", "dev_process_phase_id"),
    )

    # Seed catalog cố định — idempotent để migration chạy lại an toàn
    # (vd khi apply lại qua script Data API).
    dev_process_phases_table = sa.table(
        "dev_process_phases", sa.column("code", sa.String(length=50))
    )
    for code in DEV_PROCESS_PHASE_CODES:
        op.execute(
            sa.dialects.postgresql.insert(dev_process_phases_table)
            .values(code=code)
            .on_conflict_do_nothing(index_elements=["code"])
        )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("project_dev_process_phases")
    op.drop_table("dev_process_phases")
    op.drop_column("projects", "outcome_note")
    op.drop_column("projects", "industry")
