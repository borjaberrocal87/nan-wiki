"""add pgvector index on links embedding

Revision ID: add_pgvector_index
Revises: add_tags_table
Create Date: 2026-04-29 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_pgvector_index'
down_revision = 'add_tags_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enable pgvector extension
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')

    # Resize embedding column from 4096 to 1024 dimensions (qwen3-embedding)
    op.execute('ALTER TABLE links ALTER COLUMN embedding TYPE vector(1024)')

    # Create HNSW index on embedding column
    op.create_index(
        'idx_links_embedding_hnsw',
        'links',
        ['embedding'],
        postgresql_using='hnsw',
        postgresql_ops={'embedding': 'vector_cosine_ops'},
        postgresql_with={'m': 16, 'ef_construction': 64},
    )


def downgrade() -> None:
    op.drop_index('idx_links_embedding_hnsw', table_name='links')
    op.execute('ALTER TABLE links ALTER COLUMN embedding TYPE vector(4096)')
