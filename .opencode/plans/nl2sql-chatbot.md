# NL2SQL Chatbot

## Convention

The chatbot has been refactored from a link-context QA assistant into a natural-language-to-SQL (NL2SQL) agent. Instead of retrieving relevant links and answering questions about them, the chatbot now translates natural-language questions into PostgreSQL queries using the database schema.

### Architecture

```
User question
    │
    ▼
chat.py router (POST /api/chat/message)
    │
    ├── Load system prompt from prompts/nl2sql.system.md
    ├── Inject schema from prompts/schema.sql
    ├── Build messages: [system, user]
    │
    ▼
chatbot.py → chat_complete()
    │
    └── Call LLM with temperature=0.7, max_tokens=2048
         │
         ▼
    Fenced ```sql block in response
```

### File layout

```
packages/api/src/
├── prompts/                          # New directory
│   ├── nl2sql.system.md              # System prompt template
│   └── schema.sql                    # Clean DDL (CREATE TABLE, INDEX, EXTENSION)
├── routers/
│   └── chat.py                       # Simplified: no SearchService, no context links
└── services/
    └── chatbot.py                    # Rewritten: build_prompt loads schema + prompt
```

### Schema injection

The schema SQL file (`prompts/schema.sql`) is read once at module import and injected into the system prompt template (`prompts/nl2sql.system.md`) at the `{{SCHEMA_SQL}}` placeholder. This happens in `chatbot.py` via `build_prompt()`.

```python
# chatbot.py
SYSTEM_PROMPT_TEMPLATE = Path(__file__).parent.parent.parent / "prompts" / "nl2sql.system.md"
SCHEMA_SQL = (Path(__file__).parent.parent.parent / "prompts" / "schema.sql").read_text()

# build_prompt() replaces {{SCHEMA_SQL}} with the schema content
```

### Prompt contract

The LLM response must follow a strict output contract:

1. A single fenced ````sql` code block
2. First line: `-- tables: <comma-separated list>`
3. Inline `--` comments on non-obvious choices
4. `-- assumptions:` bullets if the question required interpretation
5. No prose outside the SQL block
6. Only `SELECT` / `WITH` queries — any DDL or write operations are refused in a SQL comment

### What was removed

- `SearchService` dependency from the chat router
- `get_relevant_context()` function (hybrid search for links)
- Link context building in `build_prompt()`
- References UI in the frontend chat components
- `references` field from `MessageResponse`
- All semantic search / vector search logic from the chat endpoints

### What was added

- `packages/api/src/prompts/schema.sql` — clean DDL extracted from `databases/init.sql`
- `packages/api/src/prompts/nl2sql.system.md` — system prompt with examples and output contract
- Schema injection into the system prompt at build time
- Frontend updates to remove references display

### Schema file conventions

`prompts/schema.sql` must contain only the authoritative DDL:

- `CREATE EXTENSION IF NOT EXISTS vector` — pgvector setup
- `CREATE TABLE` statements for all tables
- `CREATE INDEX` statements for performance indexes
- `INSERT` seed data for lookup tables (e.g. `sources`)
- **No** application migrations, no `ALTER TABLE`, no comments about implementation

This file is the single source of truth for the LLM about the database structure.

## Benefits

- The LLM generates accurate queries because it has the exact schema, not a generated approximation.
- Separating the schema into its own file makes it easy to update without touching the prompt.
- The output contract ensures consistent, parseable responses (fenced SQL block).
- Removing link context search simplifies the chat endpoint and reduces latency.
- The prompt with examples (E1-E9) covers common patterns: aggregation, tags, semantic search, window functions.

## Examples

### ✅ Good: Clean schema file with only DDL

```sql
-- packages/api/src/prompts/schema.sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE users (
    id BIGINT NOT NULL,
    username TEXT NOT NULL,
    ...
    CONSTRAINT pk__users PRIMARY KEY (id)
);

CREATE INDEX idx_links_posted_at ON links (posted_at DESC);
```

### ❌ Bad: Schema file with migration statements and noise

```sql
-- Bad: includes ALTER TABLE from a migration
ALTER TABLE links ADD COLUMN new_field TEXT;

-- Bad: includes application comments
-- This table stores Discord users
CREATE TABLE users (
    id BIGINT NOT NULL,
    ...
);

-- Bad: includes raw_content from init.sql seed data
INSERT INTO sources (id, name) VALUES ...
```

### ✅ Good: Prompt template with placeholder

```markdown
# packages/api/src/prompts/nl2sql.system.md
You are an expert PostgreSQL analyst. Translate natural-language questions
into a single, correct, read-only SQL query against the schema below.

{{SCHEMA_SQL}}

# Output contract
Return exactly one fenced ```sql block.
```

### ❌ Bad: Hardcoded schema in the prompt

```markdown
# Bad: schema is duplicated in the prompt file
You are an expert PostgreSQL analyst...

CREATE TABLE users (id BIGINT, username TEXT, ...);
CREATE TABLE links (id UUID, url TEXT, ...);
-- If the schema changes, both files must be updated
```

## Real world examples

- System prompt template: `packages/api/src/prompts/nl2sql.system.md`
- Schema SQL: `packages/api/src/prompts/schema.sql`
- Chat service: `packages/api/src/services/chatbot.py`
- Chat router: `packages/api/src/routers/chat.py`

## Related agreements

- [Hexagonal Architecture](hexagonal-architecture.md) — service layer structure
- [PRISM Alembic Coexistence](prisma-alembic-coexistence.md) — database management
- [Text over VARCHAR convention](../database/text-over-varchar-char-convention.md) — schema design

Doc created by 🐢 💨 (Turbotuga™, [Codely](https://codely.com)'s mascot)
