-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Users from the Discord server
CREATE TABLE users (
    id BIGINT NOT NULL,
    username TEXT NOT NULL
        CONSTRAINT chk__users__username__max_length
            CHECK (length(username) <= 100),
    avatar_url TEXT,
    discriminator VARCHAR(4),
    joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE NOT NULL,
    CONSTRAINT pk__users PRIMARY KEY (id)
);

-- Monitored channels
CREATE TABLE channels (
    id BIGINT NOT NULL,
    name TEXT NOT NULL
        CONSTRAINT chk__channels__name__max_length
            CHECK (length(name) <= 200),
    guild_id BIGINT NOT NULL,
    category TEXT
        CONSTRAINT chk__channels__category__max_length
            CHECK (length(category) <= 200),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT pk__channels PRIMARY KEY (id)
);

-- Captured links
CREATE TABLE links (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    url TEXT NOT NULL
        CONSTRAINT chk__links__url__max_length
            CHECK (length(url) <= 2048),
    domain TEXT NOT NULL
        CONSTRAINT chk__links__domain__max_length
            CHECK (length(domain) <= 255),
    source TEXT NOT NULL
        CONSTRAINT chk__links__source__max_length
            CHECK (length(source) <= 50),
    raw_content TEXT,
    author_id BIGINT REFERENCES users (id),
    channel_id BIGINT REFERENCES channels (id),
    discord_message_id BIGINT,
    discord_channel_name TEXT
        CONSTRAINT chk__links__discord_channel_name__max_length
            CHECK (length(discord_channel_name) <= 200),
    posted_at TIMESTAMPTZ NOT NULL,
    llm_status TEXT NOT NULL
        CONSTRAINT chk__links__llm_status__max_length
            CHECK (length(llm_status) <= 20),
    title TEXT
        CONSTRAINT chk__links__title__max_length
            CHECK (length(title) <= 500),
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    source_detected TEXT
        CONSTRAINT chk__links__source_detected__max_length
            CHECK (length(source_detected) <= 50),
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT pk__links PRIMARY KEY (id),
    CONSTRAINT uk__links__url UNIQUE (url)
);

-- Chat conversations
CREATE TABLE chat_conversations (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id BIGINT REFERENCES users (id),
    session_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT pk__chat_conversations PRIMARY KEY (id)
);

-- Chat messages
CREATE TABLE chat_messages (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    conversation_id UUID NOT NULL,
    role TEXT NOT NULL
        CONSTRAINT chk__chat_messages__role__max_length
            CHECK (length(role) <= 10),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT pk__chat_messages PRIMARY KEY (id),
    CONSTRAINT fk__chat_messages__conversation
        FOREIGN KEY (conversation_id)
        REFERENCES chat_conversations (id)
        ON DELETE CASCADE
);

-- Indices
CREATE INDEX idx_links_source ON links (source);
CREATE INDEX idx_links_tags ON links USING GIN (tags);
CREATE INDEX idx_links_posted_at ON links (posted_at DESC);
CREATE INDEX idx_links_domain ON links (domain);
CREATE INDEX idx_links_embedding ON links USING ivfflat (embedding vector_cosine_ops);
