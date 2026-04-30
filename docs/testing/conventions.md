# 🧪 Testing Conventions

## 💡 Convention

Tests follow a pragmatic approach using framework-native mocking, not hand-written mock objects or object mothers. Each package uses its own testing stack:

- **Bot & Shared** (TypeScript): Vitest with `vi.mock()` for module mocking, inline mock objects via `vi.fn()`, and `beforeEach/vi.clearAllMocks` for cleanup.
- **API** (Python): Pytest with `unittest.mock.patch` for dependency injection, `MagicMock`/`AsyncMock` for mocks, and `conftest.py` with `autouse` fixtures for env var isolation.
- **Web** (TypeScript/React): Vitest + React Testing Library for component tests, `vi.mock()` for module mocking, and inline mocks for hooks.

Tests live alongside source code in `__tests__/` subdirectories for TypeScript files, and in a top-level `tests/` directory for Python.

## 🏆 Benefits

- **Less boilerplate**: No need to write separate mock classes or object mothers — `vi.mock()` and `MagicMock` are faster to write and maintain.
- **Framework idiomatic**: Uses the native mocking APIs of Vitest and Pytest, which are well-documented and widely understood.
- **Co-located**: Tests next to source code (TypeScript) make it easy to find what to test alongside the implementation.
- **Simple setup**: No ceremony — `beforeEach` + `vi.clearAllMocks()` or `@patch` decorators are enough.

## 👀 Examples

### ✅ Good: Vitest with `vi.mock()` and inline mocks

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleMessageCreate } from '../events/messageCreate.js';

vi.mock('../services/db.js', () => ({
  prisma: {
    user: { upsert: vi.fn() },
    channel: { upsert: vi.fn() },
    link: { create: vi.fn() },
  },
}));

vi.mock('../services/linkDetector.js', () => ({
  detectUrls: vi.fn(),
}));

import { prisma } from '../services/db.js';
import { detectUrls } from '../services/linkDetector.js';

describe('messageCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (detectUrls as any).mockReturnValue([]);
  });

  it('detects and saves a single URL', async () => {
    const mockMessage = {
      author: { id: '123', username: 'testuser' },
      content: 'https://github.com/user/repo',
      channel: { id: '456', name: 'general' },
      guildId: '789',
      id: 'message-id',
      createdTimestamp: Date.now(),
    };

    (detectUrls as any).mockReturnValue([
      { url: 'https://github.com/user/repo', domain: 'github.com', sourceId: 'github' },
    ]);
    (prisma.link.create as any).mockResolvedValue({});

    await handleMessageCreate(mockMessage as any);

    expect(prisma.link.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          url: 'https://github.com/user/repo',
          sourceId: 'github',
        }),
      })
    );
  });
});
```

### ✅ Good: Pytest with `@patch` and `MagicMock`

```python
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from src.services.llm import generate_link_metadata

class TestGenerateLinkMetadata:
    @pytest.mark.asyncio
    async def test_returns_metadata_on_success(self):
        mock_choice = MagicMock()
        mock_choice.message.content = json.dumps({
            "title": "Test Title",
            "description": "Test Description",
            "tags": ["tag1", "tag2"],
        })
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]

        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        with patch("src.services.llm._get_client", return_value=mock_client):
            result = await generate_link_metadata("https://example.com")

        assert result["title"] == "Test Title"
        assert result["tags"] == ["tag1", "tag2"]

    @pytest.mark.asyncio
    async def test_returns_none_on_api_error(self):
        api_error = APIError(
            request=MagicMock(),
            message="Rate limit",
            body=None,
        )
        api_error.status_code = 429

        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(side_effect=api_error)

        with patch("src.services.llm._get_client", return_value=mock_client):
            result = await generate_link_metadata("https://example.com", max_retries=1)

        assert result is None
```

### ✅ Good: Pure function tests with no mocks

```typescript
import { describe, it, expect } from 'vitest';
import { detectUrls } from './linkDetector.js';

describe('detectUrls', () => {
  it('detects a single github URL', () => {
    const result = detectUrls('Check this out: https://github.com/user/repo');
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('https://github.com/user/repo');
    expect(result[0].domain).toBe('github.com');
    expect(result[0].sourceId).toBe('github');
  });

  it('returns empty array for no URLs', () => {
    const result = detectUrls('Just some text without any links');
    expect(result).toHaveLength(0);
  });
});
```

### ❌ Bad: Hand-written mock objects (as documented in the old `mock-objects.md`)

```typescript
// DON'T do this — too much boilerplate for no benefit
import { LinkRepository } from "../../domain/LinkRepository";

export class MockLinkRepository implements LinkRepository {
  private readonly mockSave = jest.fn();
  private readonly mockFindAll = jest.fn();

  async save(link: Link): Promise<void> {
    expect(this.mockSave).toHaveBeenCalledWith(link.toPrimitives());
    return Promise.resolve();
  }

  shouldSave(link: Link): void {
    this.mockSave(link.toPrimitives());
  }

  async findAll(): Promise<Link[]> {
    return this.mockFindAll() as Promise<Link[]>;
  }

  shouldFindAllReturn(links: Link[]): void {
    this.mockFindAll.mockReturnValue(links);
  }
}
```

### ❌ Bad: Object Mothers with `@faker-js/faker`

```python
# DON'T do this — unnecessary abstraction for this codebase
class LinkMother:
    @staticmethod
    def create(**kwargs) -> Link:
        return Link(
            id=faker.uuid4(),
            url=faker.url(),
            domain=faker.domain_name(),
            title=faker.sentence(),
            **kwargs,
        )
```

### ❌ Bad: Inline mocks without `vi.mock()` / `@patch`

```typescript
// DON'T do this — manual mock objects are harder to maintain
const mockPrisma = {
  user: { upsert: jest.fn() },
  link: { create: jest.fn() },
} as any;

// No module isolation — the real prisma is still imported by the SUT
```

## 🧐 Real world examples

- `packages/bot/src/events/messageCreate.test.ts` — `vi.mock()` for Prisma and linkDetector
- `packages/bot/src/services/linkDetector.test.ts` — pure function tests, no mocks
- `packages/api/tests/test_llm_service.py` — `@patch` + `MagicMock`/`AsyncMock`
- `packages/api/tests/test_nl2sql_pipeline.py` — custom mock classes (`_MockPool`) for complex async patterns
- `packages/api/tests/conftest.py` — `autouse` fixture for env var isolation
- `packages/shared/tests/utils.test.ts` — pure function tests

## 🔗 Related agreements

- [Testing Epic 007](epics/007-testing.md) — full test coverage plan
- [Documentation Standard](documentation-guidelines.md) — how convention docs should be structured

Doc created by 🐢 💨 (Turbotuga™, [Codely](https://codely.com)'s mascot)
