"""add sources table and migrate source to FK

Revision ID: add_sources_table
Revises: initial
Create Date: 2026-04-28 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_sources_table'
down_revision = 'initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Step 1: Create sources table
    op.create_table(
        'sources',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
    )

    # Step 2: Seed sources with all known values
    op.execute("""
        INSERT INTO sources (id, name) VALUES
            ('github', 'GitHub'),
            ('twitter', 'Twitter'),
            ('youtube', 'YouTube'),
            ('twitch', 'Twitch'),
            ('linkedin', 'LinkedIn'),
            ('reddit', 'Reddit'),
            ('medium', 'Medium'),
            ('blog', 'Blog'),
            ('other', 'Link')
        ON CONFLICT (id) DO NOTHING
    """)

    # Step 3: Add source_id column (nullable during migration)
    op.add_column('links', sa.Column('source_id', sa.String(50), nullable=True))

    # Step 4: Migrate existing data from source -> source_id
    op.execute("""
        UPDATE links SET source_id = source
        WHERE source IN (SELECT id FROM sources)
    """)

    # Step 5: Make source_id NOT NULL
    op.alter_column('links', 'source_id', nullable=False)

    # Step 6: Add foreign key constraint
    op.create_foreign_key(
        'fk_links_source_id',
        'links', 'sources',
        ['source_id'], ['id']
    )

    # Step 7: Drop old index on source column
    op.drop_index('idx_links_source', table_name='links')

    # Step 8: Create new index on source_id
    op.create_index('idx_links_source_id', 'links', ['source_id'])

    # Step 9: Drop old source column
    op.drop_column('links', 'source')


def downgrade() -> None:
    # Step 1: Add back the source column
    op.add_column('links', sa.Column('source', sa.String(50), nullable=False, server_default='other'))

    # Step 2: Migrate source_id -> source
    op.execute("UPDATE links SET source = source_id")

    # Step 3: Drop foreign key
    op.drop_constraint('fk_links_source_id', 'links', type_='foreignkey')

    # Step 4: Drop source_id column
    op.drop_column('links', 'source_id')

    # Step 5: Recreate old index
    op.create_index('idx_links_source', 'links', ['source'])

    # Step 6: Drop sources table
    op.drop_table('sources')
