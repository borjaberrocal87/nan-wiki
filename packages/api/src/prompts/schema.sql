-- Enable pgvector extension for semantic search (kept for reference, not used by NL2SQL)
CREATE EXTENSION IF NOT EXISTS vector;

-- Users from the Discord server
CREATE TABLE users (
    id BIGINT NOT NULL,
    username TEXT NOT NULL
        CONSTRAINT chk__users__username__max_length
            CHECK (length(username) <= 100),
    avatar_url TEXT,
    discriminator VARCHAR(4),
    joined_at TIMESTAMP,
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
    created_at TIMESTAMP,
    CONSTRAINT pk__channels PRIMARY KEY (id)
);

-- Sources (static lookup table)
CREATE TABLE sources (
    id TEXT NOT NULL
        CONSTRAINT chk__sources__id__max_length
            CHECK (length(id) <= 50),
    name TEXT NOT NULL
        CONSTRAINT chk__sources__name__max_length
            CHECK (length(name) <= 100),
    CONSTRAINT pk__sources PRIMARY KEY (id)
);

-- Seed sources with known values
INSERT INTO sources (id, name) VALUES
    ('github', 'GitHub'),
    ('twitter', 'Twitter'),
    ('youtube', 'YouTube'),
    ('twitch', 'Twitch'),
    ('linkedin', 'LinkedIn'),
    ('reddit', 'Reddit'),
    ('medium', 'Medium'),
    ('blog', 'Blog'),
    ('other', 'Link');

-- Seed tags with common topics
INSERT INTO tags (name) VALUES
    ('python'), ('rust'), ('javascript'), ('typescript'), ('go'),
    ('react'), ('docker'), ('kubernetes'), ('ai'), ('machine-learning'),
    ('web3'), ('blockchain'), ('devops'), ('security'), ('database'),
    ('sql'), ('postgresql'), ('linux'), ('git'), ('open-source');

-- Tags
CREATE TABLE tags (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT pk__tags PRIMARY KEY (id),
    CONSTRAINT uk__tags__name UNIQUE (name)
);

-- Captured links
CREATE TABLE links (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    url TEXT NOT NULL,
    domain TEXT NOT NULL
        CONSTRAINT chk__links__domain__max_length
            CHECK (length(domain) <= 255),
    source_id TEXT NOT NULL
        CONSTRAINT chk__links__source_id__max_length
            CHECK (length(source_id) <= 50),
    author_id BIGINT REFERENCES users (id),
    channel_id BIGINT REFERENCES channels (id),
    discord_message_id BIGINT,
    discord_channel_name TEXT
        CONSTRAINT chk__links__discord_channel_name__max_length
            CHECK (length(discord_channel_name) <= 200),
    posted_at TIMESTAMP NOT NULL,
    llm_status TEXT NOT NULL
        CONSTRAINT chk__links__llm_status__max_length
            CHECK (length(llm_status) <= 20),
    title TEXT
        CONSTRAINT chk__links__title__max_length
            CHECK (length(title) <= 500),
    description TEXT,
    source_detected TEXT
        CONSTRAINT chk__links__source_detected__max_length
            CHECK (length(source_detected) <= 50),
    embedding vector(1024),
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT pk__links PRIMARY KEY (id),
    CONSTRAINT uk__links__url UNIQUE (url),
    CONSTRAINT fk_links_source_id FOREIGN KEY (source_id) REFERENCES sources (id)
);

-- Seed links with sample data for NL2SQL testing
INSERT INTO links (url, domain, source_id, author_id, channel_id, posted_at, llm_status, title, description, embedding) VALUES
    ('https://github.com/anthropic/anthropic-sdk-python', 'github.com', 'github', NULL, NULL, NOW() - INTERVAL '45 days', 'done', 'anthropic-sdk-python', 'Official Python SDK for the Anthropic API.', NULL),
    ('https://github.com/tokio-rs/tokio', 'github.com', 'github', NULL, NULL, NOW() - INTERVAL '30 days', 'done', 'Tokio', 'Async runtime for Rust.', NULL),
    ('https://github.com/golang/go', 'github.com', 'github', NULL, NULL, NOW() - INTERVAL '20 days', 'done', 'Go', 'The Go programming language.', NULL),
    ('https://github.com/tailwindlabs/tailwindcss', 'github.com', 'github', NULL, NULL, NOW() - INTERVAL '10 days', 'done', 'Tailwind CSS', 'A utility-first CSS framework.', NULL),
    ('https://github.com/vercel/next.js', 'github.com', 'github', NULL, NULL, NOW() - INTERVAL '5 days', 'done', 'Next.js', 'The React framework for production.', NULL),
    ('https://blog.postgresql.org', 'blog.postgresql.org', 'blog', NULL, NULL, NOW() - INTERVAL '3 days', 'done', 'PostgreSQL Blog', 'Official PostgreSQL blog.', NULL),
    ('https://www.youtube.com/watch?v=example', 'youtube.com', 'youtube', NULL, NULL, NOW() - INTERVAL '1 day', 'done', 'Example Video', 'An example video about databases.', NULL);

-- Link tags junction table
CREATE TABLE link_tags (
    link_id UUID NOT NULL REFERENCES links (id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT pk__link_tags PRIMARY KEY (link_id, tag_id)
);

-- Chat conversations
CREATE TABLE chat_conversations (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id BIGINT REFERENCES users (id),
    session_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT pk__chat_conversations PRIMARY KEY (id)
);

-- Chat messages
CREATE TABLE chat_messages (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    conversation_id UUID NOT NULL REFERENCES chat_conversations (id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT pk__chat_messages PRIMARY KEY (id)
);

-- Indices
CREATE INDEX idx_links_source_id ON links (source_id);
CREATE INDEX idx_links_posted_at ON links (posted_at DESC);
CREATE INDEX idx_links_domain ON links (domain);
CREATE INDEX idx_link_tags_tag_id ON link_tags (tag_id);
CREATE INDEX idx_links_embedding_hnsw ON links USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
CREATE INDEX idx_links_llm_status ON links (llm_status);
