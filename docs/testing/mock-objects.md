# 🎯 Mock Objects for Testing

## 💡 Convention

Mock objects are hand-written implementations of domain interfaces (repositories, event buses, gateways) used in unit tests. They live in `tests/mocks/` for Python and `src/__test_utils__/` for TypeScript.

Each mock implements the corresponding domain interface and exposes `should*` methods to set up expectations, using `vi.fn()` (TypeScript) or `MagicMock` (Python) internally for assertion. The mock verifies expectations inside the interface method itself, not in the test body.

## 🏆 Benefits

- Tests verify behavior through domain contracts, not framework-specific mock APIs.
- `should*` methods make test setup read like a specification: "the repository should save this link".
- Mocks are reusable across all tests for the same interface.
- Swapping the assertion library only requires changing the mock, not every test.
- Clear separation between test setup (should* methods) and test assertions (expect/assertTrue).

## 👀 Examples

### ✅ Good: Mock implementing domain interface with should* setup methods

```typescript
import { PrismaGateway } from "../../services/db.js";
import { vi } from "vitest";

export class MockPrismaGateway implements PrismaGateway {
  private readonly mockUserUpsert = vi.fn();
  private readonly mockChannelUpsert = vi.fn();
  private readonly mockSourceUpsert = vi.fn();
  private readonly mockLinkCreate = vi.fn();

  async userUpsert(userId: string): Promise<void> {
    expect(this.mockUserUpsert).toHaveBeenCalledWith(userId);
    return Promise.resolve();
  }

  shouldUpsertUser(userId: string): void {
    this.mockUserUpsert(userId);
  }

  async channelUpsert(channelId: string): Promise<void> {
    expect(this.mockChannelUpsert).toHaveBeenCalledWith(channelId);
    return Promise.resolve();
  }

  shouldUpsertChannel(channelId: string): void {
    this.mockChannelUpsert(channelId);
  }

  async sourceUpsert(sourceId: string): Promise<void> {
    expect(this.mockSourceUpsert).toHaveBeenCalledWith(sourceId);
    return Promise.resolve();
  }

  shouldUpsertSource(sourceId: string): void {
    this.mockSourceUpsert(sourceId);
  }

  async linkCreate(data: LinkCreateInput): Promise<void> {
    expect(this.mockLinkCreate).toHaveBeenCalledWith(data);
    return Promise.resolve();
  }

  shouldCreateLink(data: LinkCreateInput): void {
    this.mockLinkCreate(data);
  }
}
```

### ✅ Good: Mock implementing a Python protocol

```python
from __future__ import annotations
from typing import Protocol
from unittest.mock import MagicMock, AsyncMock
import json

class LlmClient(Protocol):
    async def chat_completions_create(self, messages: list, **kwargs) -> MagicMock: ...
    async def embeddings_create(self, input: str, **kwargs) -> MagicMock: ...

class MockLlmClient:
    def __init__(self):
        self._chat_mock = MagicMock()
        self._embed_mock = MagicMock()

    async def chat_completions_create(self, messages: list, **kwargs) -> MagicMock:
        self._chat_mock.assert_called_with(messages, **kwargs)
        return self._chat_mock.return_value

    def should_chat_completion_return(self, response: MagicMock) -> None:
        self._chat_mock.return_value = response

    async def embeddings_create(self, input: str, **kwargs) -> MagicMock:
        self._embed_mock.assert_called_with(input, **kwargs)
        return self._embed_mock.return_value

    def should_embeddings_return(self, response: MagicMock) -> None:
        self._embed_mock.return_value = response
```

### ✅ Good: Using mock objects in tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { handleMessageCreate } from '../events/messageCreate.js';
import { MockPrismaGateway } from '../__test_utils__/MockPrismaGateway.js';
import { MockLinkDetector } from '../__test_utils__/MockLinkDetector.js';
import { MessageMother } from '../__test_utils__/MessageMother.js';

describe('messageCreate', () => {
  let prisma: MockPrismaGateway;
  let detector: MockLinkDetector;

  beforeEach(() => {
    prisma = new MockPrismaGateway();
    detector = new MockLinkDetector();
  });

  it('detects and saves a single URL', async () => {
    const mockMessage = MessageMother.create({
      content: 'https://github.com/user/repo',
    });

    detector.shouldDetectUrlsReturning([
      { url: 'https://github.com/user/repo', domain: 'github.com', sourceId: 'github' },
    ]);

    prisma.shouldUpsertSource('github');
    prisma.shouldCreateLink({
      url: 'https://github.com/user/repo',
      sourceId: 'github',
    });

    await handleMessageCreate(mockMessage, prisma, detector);

    // No need to assert — the mock objects verified expectations in should* methods
  });
});
```

### ❌ Bad: Using `vi.mock()` instead of hand-written mock objects

```typescript
// DON'T do this — loses the domain contract and should* pattern
vi.mock('../services/db.js', () => ({
  prisma: {
    user: { upsert: vi.fn() },
    link: { create: vi.fn() },
  },
}));

import { prisma } from '../services/db.js';

it('saves a link', async () => {
  (prisma.link.create as any).mockResolvedValue({});
  await handleMessageCreate(mockMessage);
  expect(prisma.link.create).toHaveBeenCalled();
});
```

### ❌ Bad: Inline mocking in test body

```typescript
// DON'T do this — manual mock objects are harder to maintain and don't verify expectations
const mockPrisma = {
  user: { upsert: vi.fn() },
  link: { create: vi.fn() },
} as any;

await handleMessageCreate(mockMessage, mockPrisma);
expect(mockPrisma.link.create).toHaveBeenCalled();
```

## 🧐 Real world examples

- `packages/bot/src/__test_utils__/MockPrismaGateway.ts`
- `packages/bot/src/__test_utils__/MockLinkDetector.ts`
- `packages/api/tests/mocks/MockAsyncSession.py`
- `packages/api/tests/mocks/MockLlmClient.py`
- `packages/api/tests/mocks/MockSettings.py`

## 🔗 Related agreements

- [Object Mothers for Testing](object-mothers.md)
- [Testing Conventions](conventions.md)
