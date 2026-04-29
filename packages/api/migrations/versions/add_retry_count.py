"""add retry_count column to links

Revision ID: add_retry_count
Revises: add_sources_table
Create Date: 2026-04-29 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_retry_count'
down_revision = 'add_sources_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('links', sa.Column('retry_count', sa.Integer(), server_default='0', nullable=False))


def downgrade() -> None:
    op.drop_column('links', 'retry_count')
