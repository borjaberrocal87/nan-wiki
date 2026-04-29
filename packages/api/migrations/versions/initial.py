"""empty message

Revision ID: initial
Revises:
Create Date: 2025-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')

    # Users
    op.create_table(
        'users',
        sa.Column('id', postgresql.BIGINT, primary_key=True),
        sa.Column('username', sa.String(100), nullable=False),
        sa.Column('avatar_url', sa.Text(), nullable=True),
        sa.Column('discriminator', sa.String(4), nullable=True),
        sa.Column('joined_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_admin', sa.Boolean(), server_default='false'),
    )

    # Channels
    op.create_table(
        'channels',
        sa.Column('id', postgresql.BIGINT, primary_key=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('guild_id', postgresql.BIGINT, nullable=False),
        sa.Column('category', sa.String(200), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    )

    # Sources (static lookup table)
    op.create_table(
        'sources',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
    )
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
    """)

    # Links
    op.create_table(
        'links',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('url', sa.Text(), nullable=False, unique=True),
        sa.Column('domain', sa.String(255), nullable=False),
        sa.Column('source_id', sa.String(50), nullable=False),
        sa.Column('author_id', postgresql.BIGINT, nullable=True),
        sa.Column('channel_id', postgresql.BIGINT, nullable=True),
        sa.Column('discord_message_id', postgresql.BIGINT, nullable=True),
        sa.Column('discord_channel_name', sa.String(200), nullable=True),
        sa.Column('posted_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('llm_status', sa.String(20), server_default='pending'),
        sa.Column('title', sa.String(500), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('tags', postgresql.ARRAY(sa.Text()), server_default='{}'),
        sa.Column('source_detected', sa.String(50), nullable=True),
        sa.Column('embedding', postgresql.ARRAY(sa.Float()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['author_id'], ['users.id']),
        sa.ForeignKeyConstraint(['channel_id'], ['channels.id']),
        sa.ForeignKeyConstraint(['source_id'], ['sources.id']),
    )

    # Chat conversations
    op.create_table(
        'chat_conversations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.BIGINT, nullable=True),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
    )

    # Chat messages
    op.create_table(
        'chat_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('conversation_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.String(10), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['conversation_id'], ['chat_conversations.id'], ondelete='CASCADE'),
    )

    # Indexes
    op.create_index('idx_links_source_id', 'links', ['source_id'])
    op.create_index('idx_links_tags', 'links', ['tags'], postgresql_using='gin')
    op.create_index('idx_links_posted_at', 'links', ['posted_at'], postgresql_ops={'posted_at': 'desc'})
    op.create_index('idx_links_domain', 'links', ['domain'])
    op.create_index(
        'idx_links_embedding',
        'links',
        ['embedding'],
        postgresql_using='ivfflat',
        postgresql_with={'lists': 100},
        postgresql_ops={'embedding': 'vector_cosine_ops'},
    )

    # Full-text search index using tsvector
    op.execute(
        "CREATE INDEX idx_links_fts ON links USING GIN ("
        "to_tsvector('english', "
        "coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || url"
        "))"
    )


def downgrade() -> None:
    op.drop_index('idx_links_embedding', 'links')
    op.drop_index('idx_links_domain', 'links')
    op.drop_index('idx_links_posted_at', 'links')
    op.drop_index('idx_links_tags', 'links')
    op.drop_index('idx_links_source', 'links')

    op.drop_table('chat_messages')
    op.drop_table('chat_conversations')
    op.drop_table('links')
    op.drop_table('channels')
    op.drop_table('users')
