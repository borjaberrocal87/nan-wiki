# 🎯 Object Mothers for Testing

## 💡 Convention

Use the Object Mother pattern to instantiate test data objects in tests. Each domain or ORM object has a corresponding `*Mother` class located in `tests/mothers/` for Python and `src/__test_utils__/` for TypeScript. Shared mothers live in a common `tests/mothers/` (Python) or `src/__test_utils__/` (TypeScript) directory.

Mothers use `faker` for random data generation and accept an optional `Partial<T>` parameter to override specific fields when needed. For Python ORM objects that don't use faker, use deterministic defaults with overrides.

## 🏆 Benefits

- Test data creation is centralized, avoiding duplication across test files.
- Tests clearly express which fields matter by overriding only relevant ones.
- Random data exposes hidden assumptions and coupling to specific values.
- Mothers evolve alongside the domain model in a single place.
- Reduces test boilerplate — no need to construct full objects inline in every test.

## 👀 Examples

### ✅ Good: Object Mother with partial overrides (Python ORM)

```python
from __future__ import annotations
from uuid import uuid4
from datetime import datetime, UTC

class LinkMother:
    @staticmethod
    def create(**kwargs) -> "Link":
        from src.models import Link

        return Link(
            id=str(uuid4()),
            url="https://github.com/test/repo",
            domain="github.com",
            source_id="github",
            author_id=12345,
            channel_id=67890,
            posted_at=datetime.now(UTC),
            llm_status="done",
            title="Test Repository",
            description="A test repository",
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
            **kwargs,
        )
```

Usage in tests:

```python
def test_list_links_returns_data(self, mock_db):
    # Only override the fields that matter for this test
    link = LinkMother.create(title="Custom Title")

    result_mock = MagicMock()
    result_mock.all.return_value = [(link, None, "GitHub", [])]
    mock_db.execute = AsyncMock(return_value=result_mock)

    response = await list_links(mock_db, LinkFilter(page=1, per_page=20))

    assert response.data[0].title == "Custom Title"
```

### ✅ Good: Object Mother with faker (Python)

```python
from __future__ import annotations
from faker import Faker
from uuid import uuid4

fake = Faker()

class LlmResponseMother:
    @staticmethod
    def create(**kwargs) -> MagicMock:
        content = kwargs.pop("content", json.dumps({
            "title": fake.sentence(),
            "description": fake.paragraph(),
            "tags": [fake.word() for _ in range(3)],
        }))
        mock_choice = MagicMock()
        mock_choice.message.content = content
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]
        return mock_response
```

Usage in tests:

```python
def test_returns_metadata(self):
    mock_response = LlmResponseMother.create(
        content=json.dumps({"title": "Custom", "description": "Desc", "tags": ["a", "b"]})
    )
    # Use mock_response in the test...
```

### ✅ Good: Object Mother with partial overrides (TypeScript)

```typescript
import type { Message } from 'discord.js';

export class MessageMother {
  static create(overrides: Partial<Message> = {}): Message {
    const messageCounter = Date.now();
    return {
      author: {
        id: `123456789${messageCounter}`,
        username: 'testuser',
        tag: 'testuser#0000',
        avatar: 'avatar_hash',
        discriminator: '0000',
        bot: false,
      },
      content: 'https://github.com/user/repo',
      channel: {
        id: `987654321${messageCounter}`,
        name: 'general',
        type: 0, // GUILD_TEXT
      },
      channelId: `987654321${messageCounter}`,
      guildId: `111222333${messageCounter}`,
      id: `555666777${messageCounter}`,
      createdTimestamp: Date.now(),
      reply: vi.fn().mockResolvedValue({ delete: vi.fn() }),
      ...overrides,
    } as unknown as Message;
  }
}
```

Usage in tests:

```typescript
it('handles custom content', async () => {
  const mockMessage = MessageMother.create({
    content: 'Check this: https://twitter.com/user/status',
  });

  await handleMessageCreate(mockMessage as any);

  // assertions...
});
```

### ❌ Bad: Hardcoded test data inline

```python
# DON'T do this — repetitive and hard to maintain
link = Link(
    id="550e8400-e29b-41d4-a716-446655440000",
    url="https://github.com/test/repo",
    domain="github.com",
    source_id="github",
    author_id=12345,
    channel_id=67890,
    posted_at=datetime.now(UTC),
    llm_status="done",
    title="Test Repo",
    created_at=datetime.now(UTC),
    updated_at=datetime.now(UTC),
)
```

### ❌ Bad: Inline objects in test body

```typescript
// DON'T do this — repeats ~30 fields every test
const mockMessage = {
  author: {
    id: '123456789',
    username: 'testuser',
    tag: 'testuser#0000',
    avatar: 'avatar_hash',
    discriminator: '0000',
  },
  content: 'https://github.com/user/repo',
  channel: {
    id: '987654321',
    name: 'general',
    type: 'GUILD_TEXT',
  },
  // ... 20+ more fields ...
};
```

## 🧐 Real world examples

- `packages/api/tests/mothers/LinkMother.py`
- `packages/api/tests/mothers/LlmResponseMother.py`
- `packages/api/tests/mothers/AnswerResultMother.py`
- `packages/bot/src/__test_utils__/MessageMother.ts`
- `packages/bot/src/__test_utils__/DetectedUrlMother.ts`

## 🔗 Related agreements

- [Mock Objects for Testing](mock-objects.md)
- [Testing Conventions](conventions.md)
