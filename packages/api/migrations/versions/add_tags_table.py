"""add tags table and link_tags junction table

Revision ID: add_tags_table
Revises: add_retry_count
Create Date: 2026-04-29 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_tags_table'
down_revision = 'add_retry_count'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Step 1: Create tags table
    op.create_table(
        'tags',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.CheckConstraint('length(name) > 0', name='chk__tags__name__not_empty'),
    )
    op.create_index('uq__tags__name', 'tags', ['name'], unique=True)

    # Step 2: Create link_tags junction table
    op.create_table(
        'link_tags',
        sa.Column('link_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tag_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.CheckConstraint('link_id != tag_id', name='chk__link_tags__link_neq_tag'),
        sa.PrimaryKeyConstraint('link_id', 'tag_id', name='pk__link_tags'),
    )
    op.create_foreign_key('fk__link_tags__link_id', 'link_tags', 'links', ['link_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk__link_tags__tag_id', 'link_tags', 'tags', ['tag_id'], ['id'], ondelete='CASCADE')
    op.create_index('idx_link_tags_tag_id', 'link_tags', ['tag_id'])

    # Step 3: Migrate existing tag strings from links.tags[] into tags table
    op.execute("""
        INSERT INTO tags (name)
        SELECT DISTINCT unnest(tags)
        FROM links
        WHERE tags != '{}'
        ON CONFLICT (name) DO NOTHING
    """)

    # Step 4: Create link_tags entries from existing data
    op.execute("""
        INSERT INTO link_tags (link_id, tag_id)
        SELECT l.id, t.id
        FROM links l
        CROSS JOIN LATERAL unnest(l.tags) AS tag_value
        JOIN tags t ON t.name = tag_value
        WHERE l.tags != '{}'
    """)

    # Step 5: Drop old GIN index on tags array
    op.drop_index('idx_links_tags', table_name='links')

    # Step 6: Drop old tags array column from links
    op.drop_column('links', 'tags')


def downgrade() -> None:
    # Step 1: Add back the tags array column
    op.add_column('links', sa.Column('tags', postgresql.ARRAY(sa.Text()), server_default='{}'))

    # Step 2: Rebuild tags array from link_tags + tags
    op.execute("""
        UPDATE links SET tags = sub.tag_array
        FROM (
            SELECT lt.link_id, array_agg(t.name) AS tag_array
            FROM link_tags lt
            JOIN tags t ON t.id = lt.tag_id
            GROUP BY lt.link_id
        ) sub
        WHERE links.id = sub.link_id
    """)

    # Step 3: Drop old index
    op.drop_index('idx_link_tags_tag_id', table_name='link_tags')

    # Step 4: Drop foreign keys
    op.drop_constraint('fk__link_tags__tag_id', 'link_tags', type_='foreignkey')
    op.drop_constraint('fk__link_tags__link_id', 'link_tags', type_='foreignkey')

    # Step 5: Drop junction table
    op.drop_table('link_tags')

    # Step 6: Drop tags table
    op.drop_table('tags')

    # Step 7: Recreate GIN index
    op.create_index('idx_links_tags', 'links', ['tags'], postgresql_using='gin')
