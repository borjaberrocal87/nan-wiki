# 🎯 Prisma + Alembic Dual ORM Strategy

## 💡 Convention

The bot uses **Prisma** as its ORM while the API uses **SQLAlchemy + Alembic** for the same PostgreSQL database. This dual-ORM approach is intentional: the bot has a simple, read/write schema that Prisma handles well, while the API needs complex queries, vector operations, and async patterns where SQLAlchemy excels.

**Schema ownership:**
- **Prisma** (`packages/bot/prisma/schema.prisma`) defines the canonical schema and is the source of truth for the bot's data model.
- **Alembic** (`packages/api/migrations/versions/`) generates migration files from SQLAlchemy models (`packages/api/src/models.py`).
- Both ORMs map to the same database tables — column names use `@map()` in Prisma to match the snake_case names defined in Alembic.

**Rules:**
- When adding a new table or column, update both the Prisma schema and the SQLAlchemy models.
- New tables must be created via Alembic migration first (since Alembic is the migration tool).
- After creating the migration, run `npx prisma generate` to update the Prisma client.
- Prisma `@map()` annotations must match the exact snake_case column names from the DB.
- Both ORMs must stay in sync — if one changes a column type, the other must match.

## 🏆 Benefits

- The bot gets Prisma's type safety, auto-generated client, and simple CRUD without boilerplate.
- The API gets SQLAlchemy's async support, complex query composition, and pgvector integration.
- Alembic provides explicit, readable migration files that can be reviewed and version-controlled.
- Each service uses the ORM best suited to its workload without forcing the other to adapt.
- Type safety in the bot reduces runtime errors when reading/writing Discord data.

## 👀 Examples

### ✅ Good: Prisma schema with @map for snake_case columns

```prisma
model Link {
  id                  UUID       @id @default(uuid()) @map("id")
  url                 String     @unique
  domain              String
  source              String
  rawContent          String?    @map("raw_content")
  authorId            BigInt?    @map("author_id")
  author              User?      @relation(fields: [authorId], references: [id])
  llmStatus           String     @default("pending") @map("llm_status")
  postedAt            DateTime   @map("posted_at")
  createdAt           DateTime   @default(now()) @map("created_at")
  updatedAt           DateTime   @updatedAt @map("updated_at")
}
```

### ✅ Good: SQLAlchemy model matching the same table

```python
class Link(Base):
    __tablename__ = "links"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    url: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    domain: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)
    source: Mapped[str] = mapped_column(VARCHAR(50), nullable=False)
    raw_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    author_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    llm_status: Mapped[str] = mapped_column(VARCHAR(20), default="pending")
    posted_at: Mapped[str] = mapped_column(nullable=False)
    created_at: Mapped[str] = mapped_column(nullable=True)
    updated_at: Mapped[str] = mapped_column(nullable=True)
```

### ❌ Bad: Mismatched column names between Prisma and SQLAlchemy

```prisma
// Prisma uses camelCase without @map
model Link {
  rawContent String?    // Maps to "rawContent" in DB — WRONG
}
```

```python
# SQLAlchemy expects snake_case
class Link(Base):
    raw_content: Mapped[str | None]  # Column "raw_content" doesn't exist
```

## 🧐 Real world examples

- `packages/bot/prisma/schema.prisma` — Prisma schema with `@map()` annotations
- `packages/api/src/models.py` — SQLAlchemy ORM models
- `packages/api/migrations/versions/initial.py` — Initial Alembic migration

## 🔗 Related agreements

- [Creating new tables convention](database/creating-new-tables.md)
- [Text over varchar/char convention](database/text-over-varchar-char-convention.md)

Doc created by 🐢 💨 (Turbotuga™, [Codely](https://codely.com)'s mascot)
