# 🧪 Testing Conventions

## 💡 Convention

Tests use **mock objects** (hand-written implementations of domain interfaces with `should*` methods) and **object mothers** (factories with partial overrides for test data). Each package uses its own testing stack:

- **Bot & Shared** (TypeScript): Vitest with `vi.fn()` inside mock objects, mothers in `src/__test_utils__/`
- **API** (Python): Pytest with `MagicMock` inside mock objects, mothers in `tests/mothers/` and mocks in `tests/mocks/`
- **Web** (TypeScript/React): Vitest + React Testing Library, mock objects + mothers for dependencies

Tests live in `__tests__/` subdirectories alongside TypeScript source files, and in a top-level `tests/` directory for Python.

## 📦 Quick reference

| Pattern | When to use | Docs |
|---------|-------------|------|
| **Mock objects** | Any test that depends on an interface (DB, LLM, gateway, service) | [mock-objects.md](mock-objects.md) |
| **Object mothers** | Any test that creates domain/ORM objects as data | [object-mothers.md](object-mothers.md) |
| **Pure function tests** | Tests for functions with no dependencies (URL parsing, validation, formatting) | No mocks needed — just call the function and assert |

## 🏆 Benefits

- **Domain contracts**: Tests verify behavior through interfaces, not framework-specific mock APIs.
- **Readable setup**: `should*` methods make test setup read like a specification.
- **Centralized data**: Object mothers eliminate inline object construction across tests.
- **Reusable**: Mock objects and mothers are shared across all tests for the same interface/object.
- **Framework agnostic**: Swapping the assertion library only requires changing the mock/mother, not every test.

## 👀 Examples

### Mock object + mother pattern (complete example)

```typescript
// In the test file
import { describe, it, expect, beforeEach } from 'vitest';
import { handleMessageCreate } from '../events/messageCreate.js';
import { MockPrismaGateway } from '../__test_utils__/MockPrismaGateway.js';
import { MessageMother } from '../__test_utils__/MessageMother.js';

describe('messageCreate', () => {
  let prisma: MockPrismaGateway;

  beforeEach(() => {
    prisma = new MockPrismaGateway();
  });

  it('saves a link when URL is detected', async () => {
    const mockMessage = MessageMother.create({
      content: 'https://github.com/user/repo',
    });

    prisma.shouldUpsertSource('github');
    prisma.shouldCreateLink({ url: 'https://github.com/user/repo', sourceId: 'github' });

    await handleMessageCreate(mockMessage, prisma);
  });
});
```

### Pure function test (no mocks needed)

```typescript
import { describe, it, expect } from 'vitest';
import { detectUrls } from './linkDetector.js';

describe('detectUrls', () => {
  it('detects a single github URL', () => {
    const result = detectUrls('Check this: https://github.com/user/repo');
    expect(result).toHaveLength(1);
    expect(result[0].sourceId).toBe('github');
  });
});
```

## 🧐 Real world examples

- `packages/bot/src/__test_utils__/MockPrismaGateway.ts` — mock object for Prisma
- `packages/bot/src/__test_utils__/MessageMother.ts` — object mother for Discord messages
- `packages/api/tests/mocks/MockAsyncSession.py` — mock object for SQLAlchemy session
- `packages/api/tests/mothers/LinkMother.py` — object mother for Link ORM objects
- `packages/shared/tests/utils.test.ts` — pure function tests, no mocks
- `packages/bot/src/services/linkDetector.test.ts` — pure function tests, no mocks

## 🔗 Related agreements

- [Mock Objects for Testing](mock-objects.md)
- [Object Mothers for Testing](object-mothers.md)
- [Documentation Standard](../documentation-guidelines.md)
- [Testing Epic 007](../epics/007-testing.md) — full test coverage plan

Doc created by 🐢 💨 (Turbotuga™, [Codely](https://codely.com)'s mascot)
