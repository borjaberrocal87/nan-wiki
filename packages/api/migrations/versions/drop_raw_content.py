"""drop raw_content column from links

Revision ID: drop_raw_content
Revises: add_retry_count
Create Date: 2026-04-29 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'drop_raw_content'
down_revision = 'add_retry_count'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column('links', 'raw_content')


def downgrade() -> None:
    op.add_column('links', sa.Column('raw_content', sa.Text(), nullable=True))
