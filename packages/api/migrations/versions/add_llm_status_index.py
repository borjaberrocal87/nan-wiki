"""add index on links llm_status

Revision ID: add_llm_status_index
Revises: add_pgvector_index
Create Date: 2026-04-29 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_llm_status_index'
down_revision = 'add_pgvector_index'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index('idx_links_llm_status', 'links', ['llm_status'])


def downgrade() -> None:
    op.drop_index('idx_links_llm_status', table_name='links')
