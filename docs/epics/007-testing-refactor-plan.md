# Plan: Refactorización de Tests hacia Mock Objects + Object Mothers

## Contexto

Los docs `docs/testing/mock-objects.md` y `docs/testing/object-mothers.md` describen un patrón de testing estructurado:
- **Mock Objects**: implementaciones hand-written de interfaces de dominio con métodos `should*` para setup de expectativas
- **Object Mothers**: factories con `@faker-js/faker` para generación de datos de test con overrides parciales

El código actual usa mocking directo del framework (`vi.mock()`, `MagicMock`, `patch`). Para ceñirnos a los docs necesitamos:
1. **Extraer interfaces/gateways** en el código fuente (prerrequisito)
2. **Crear mock objects** hand-written para cada interface
3. **Crear object mothers** para datos de test
4. **Refactorizar tests** existentes para usarlos

---

## Fase 0: Extraer interfaces/gateways (prerrequisito)

Antes de tocar tests, el código fuente necesita interfaces para que los mock objects tengan algo que implementar.

### API (Python) — Interfaces a extraer

| # | Interface | Archivo destino | Métodos | Archivos que la usarían |
|---|-----------|---------------|---------|------------------------|
| 1 | `LLMClient` (protocol) | `src/services/llm.py` | `chat.completions.create()`, `embeddings.create()` | `llm.py`, `nl2sql/pipeline.py`, `process_link.py` |
| 2 | `SettingsProvider` (protocol) | `src/config.py` | `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`, `JWT_SECRET`, `DATABASE_URL`, `WORKER_CONCURRENCY`, etc. | TODOS los archivos que leen `settings.X` |
| 3 | `ChatPipeline` (protocol) | `src/services/chatbot.py` | `answer(str) -> AnswerResult`, `answer_stream(str) -> AsyncGenerator` | `routers/chat.py`, `services/chatbot.py` |
| 4 | `LlmService` (protocol) | `src/workers/process_link.py` | `generate_link_metadata(url) -> dict|None`, `generate_embedding(text) -> list|None`, `build_link_text(title, desc) -> str` | `process_link.py` |
| 5 | `SessionFactory` (protocol) | `src/workers/queue.py` | `create() -> AsyncSession` | `queue.py` |
| 6 | `LinkProcessor` (protocol) | `src/workers/queue.py` | `process_link(db, link) -> None` | `queue.py` |

**Nota:** Los servicios que ya usan `AsyncSession` como parámetro de constructor (`SearchService`, `LinkService`, `StatsService`) no necesitan nuevas interfaces — `AsyncSession` ya es mockeable directamente con `MagicMock`.

### Bot (TypeScript) — Interfaces a extraer

| # | Interface | Archivo destino | Métodos | Archivos que la usarían |
|---|-----------|---------------|---------|------------------------|
| 1 | `PrismaGateway` | `src/services/db.ts` | `user.upsert()`, `channel.upsert()`, `source.upsert()`, `link.create()` | `events/messageCreate.ts` |
| 2 | `MessageReplier` | `events/messageCreate.ts` (nuevo archivo) | `reply(message, embed, components) -> Promise<Reply>` | `events/messageCreate.ts` |

---

## Fase 1: Crear Object Mothers y Mock Objects compartidos

### Python — Object Mothers (`packages/api/tests/mothers/`)

| Mother | Clase | Campos default | Archivos que la usarían |
|--------|-------|----------------|------------------------|
| `LinkMother` | `tests/mothers/LinkMother.py` | `id=UUID()`, `url=faker.url()`, `domain=faker.domain_name()`, `source_id="github"`, `llm_status="done"`, `title=faker.sentence()`, `posted_at=faker.past_date()` | 6 archivos |
| `UserMother` | `tests/mothers/UserMother.py` | `id=faker.random_int(100000, 999999)`, `username=faker.user_name()` | 3 archivos |
| `SourceMother` | `tests/mothers/SourceMother.py` | `id="github"`, `name="GitHub"` | 3 archivos |
| `TagMother` | `tests/mothers/TagMother.py` | `id=UUID()`, `name=faker.word()` | 2 archivos |
| `LlmResponseMother` | `tests/mothers/LlmResponseMother.py` | `choices[0].message.content = json.dumps({...})` | 3 archivos |
| `MetadataMother` | `tests/mothers/MetadataMother.py` | `title=faker.sentence()`, `description=faker.paragraph()`, `tags=[faker.word() for _ in range(3)]` | 3 archivos |
| `AnswerResultMother` | `tests/mothers/AnswerResultMother.py` | `question=faker.sentence()`, `sql="SELECT 1"`, `answer="result"`, `rows=[{"id": 1}]` | 2 archivos |
| `AuthPayloadMother` | `tests/mothers/AuthPayloadMother.py` | `user_id=faker.random_int()`, `username=faker.user_name()` | 3 archivos |
| `AuthUserMother` | `tests/mothers/AuthUserMother.py` | `user_id=..., username=...` (usa AuthPayloadMother) | 3 archivos |
| `StreamChunkMother` | `tests/mothers/StreamChunkMother.py` | `type="chunk"`, `content="text"` | 2 archivos |
| `RowMother` | `tests/mothers/RowMother.py` | `__iter__`, `__getitem__` para mock rows SQLAlchemy | 2 archivos |
| `LinkFilterMother` | `tests/mothers/LinkFilterMother.py` | `page=1`, `per_page=20`, `source_id="github"` | 1 archivo |

### Python — Mock Objects (`packages/api/tests/mocks/`)

| Mock Object | Interface que implementa | Métodos `should*` | Archivos que lo usarían |
|-------------|------------------------|-------------------|------------------------|
| `MockAsyncSession` | `AsyncSession` (SQLAlchemy) | `shouldExecuteReturning(rows)`, `shouldExecuteSideEffect(side_effects)`, `shouldCommit()`, `shouldClose()` | 8 archivos |
| `MockLlmClient` | `LLMClient` protocol | `shouldChatCompletionReturn(response)`, `shouldChatCompletionSideEffect(side_effect)`, `shouldEmbeddingsReturn(response)` | 3 archivos |
| `MockSettings` | `SettingsProvider` protocol | `shouldReturnSetting(key, value)`, `shouldReturnAll(settings_dict)` | 5 archivos |
| `MockChatPipeline` | `ChatPipeline` protocol | `shouldAnswerReturn(result)`, `shouldStreamReturn(chunks)` | 1 archivo |
| `MockLlmService` | `LlmService` protocol | `shouldGenerateMetadataReturn(metadata)`, `shouldGenerateEmbeddingReturn(vector)`, `shouldBuildLinkTextReturn(text)` | 1 archivo |
| `MockSessionFactory` | `SessionFactory` protocol | `shouldCreateReturning(session)` | 2 archivos |

### TypeScript — Object Mothers (`packages/bot/src/__test_utils__/`)

| Mother | Campos default | Archivos que la usarían |
|--------|---------------|------------------------|
| `MessageMother` | `author.id`, `author.username`, `content`, `channel.id`, `channel.name`, `guildId`, `id`, `createdTimestamp` | `messageCreate.test.ts` |
| `DetectedUrlMother` | `url`, `domain`, `sourceId` | `messageCreate.test.ts`, `linkDetector.test.ts` |

### TypeScript — Mock Objects (`packages/bot/src/__test_utils__/`)

| Mock Object | Interface que implementa | Métodos `should*` | Archivos que lo usaría |
|-------------|------------------------|-------------------|----------------------|
| `MockPrismaGateway` | `PrismaGateway` | `shouldUpsertUser()`, `shouldCreateLink()`, `shouldUpsertSource()`, `shouldUpsertChannel()` | `messageCreate.test.ts` |
| `MockLinkDetector` | `LinkDetectorGateway` | `shouldDetectUrlsReturning(urls)` | `messageCreate.test.ts` |

---

## Fase 2: Refactorizar tests existentes

### P0 — Archivos sin cambios necesarios (70 tests, SKIP)

Estos archivos son tests de funciones puras o integration tests. No necesitan refactoring:

| Archivo | Tests | Razón |
|---------|-------|-------|
| `packages/shared/tests/utils.test.ts` | 28 | Pure functions, no mocks |
| `packages/bot/src/services/linkDetector.test.ts` | 17 | Pure functions, no mocks |
| `packages/api/tests/test_nl2sql_validator.py` | 18 | Pure functions, parametrized |
| `packages/api/tests/test_nl2sql_extract.py` | 5 | Pure functions |
| `packages/api/tests/test_nl2sql_integration.py` | 3 (skipped) | Integration tests, intentional |

### P1 — Small effort (57 tests)

| Archivo | Tests | Mock Objects | Object Mothers | Cambio principal |
|---------|-------|-------------|----------------|-----------------|
| `test_llm_service.py` | 12 | `MockLlmClient` | `LlmResponseMother`, `MetadataMother` | Reemplazar `MagicMock` chain → `MockLlmClient.shouldChatCompletionReturn()` + `LlmResponseMother` |
| `test_llm_service_gaps.py` | 22 | `MockLlmClient` | `LlmResponseMother`, `MetadataMother`, `ApiErrorMother` | Reemplazar `MagicMock` chain → mock object + mothers |
| `test_queue.py` | 7 | `MockAsyncSession` | `LinkMother` | Reemplazar `AsyncMock` → `MockAsyncSession` |
| `test_links_service.py` | 9 | `MockAsyncSession` | `LinkMother`, `SourceMother` | Reemplazar `AsyncMock` + inline `Link()` → mothers |
| `test_models.py` | 7 | `MockAsyncSession` | `LinkMother`, `UserMother`, `SourceMother` | Reemplazar inline model creation → mothers |

### P2 — Medium effort (60 tests)

| Archivo | Tests | Mock Objects | Object Mothers | Cambio principal |
|---------|-------|-------------|----------------|-----------------|
| `test_search.py` | 7 | `MockAsyncSession` | `LinkRowMother`, `AuthUserMother` | Reemplazar inline tuple mocks → `LinkRowMother` |
| `test_queue_worker.py` | 9 | `MockAsyncSession`, `MockSettings` | `LinkMother` | Reemplazar `_MockSession` → `MockAsyncSession` |
| `test_process_link.py` | 6 | `MockAsyncSession`, `MockLlmService` | `LinkMother`, `MetadataMother` | Reemplazar `patch` + inline mocks → mock objects |
| `test_oauth_and_crud.py` | 22 | `MockAsyncSession` | `LinkMother`, `UserMother`, `SourceMother`, `LinkFilterMother`, `AuthPayloadMother` | El más duplicado — 22 tests con setup repetitivo |
| `test_chat_router.py` | 17 | `MockChatPipeline` | `AnswerResultMother`, `StreamChunkMother`, `AuthUserMother` | Reemplazar `patch(answer)` → `MockChatPipeline.shouldAnswerReturn()` |
| `test_stats_service.py` | 15 | `MockAsyncSession` | `RowMother`, `StatsResultMother` | Reemplazar `side_effect` arrays → `MockAsyncSession.shouldExecuteReturning()` |

### P3 — Large effort (11 tests)

| Archivo | Tests | Mock Objects | Object Mothers | Cambio principal |
|---------|-------|-------------|----------------|-----------------|
| `messageCreate.test.ts` | 11 | `MockPrismaGateway`, `MockLinkDetector` | `MessageMother`, `DetectedUrlMother` | Reemplazar `vi.mock()` → mock objects hand-written + mother pattern |

---

## Resumen de trabajo

### Por fase

| Fase | Qué | Cuánto | Riesgo |
|------|-----|--------|--------|
| **Fase 0** | Extraer interfaces en source code | ~15h | **Alto** — cambia firmas de funciones, necesita refactorizar imports |
| **Fase 1** | Crear mothers + mocks compartidos | ~10h | **Bajo** — solo código de tests |
| **Fase 2** | Refactorizar tests existentes | ~25h | **Medio** — 172 tests a reescribir, hay que asegurar que siguen pasando |
| **Fase 3** | Validación total + CI | ~5h | **Bajo** |

**Total estimado:** ~55h

### Por impacto

| Categoría | Tests afectados | Tests sin cambios |
|-----------|----------------|-------------------|
| Python API | 145 tests (8 archivos) | 70 tests (5 archivos — puros/integration) |
| Bot TS | 11 tests (1 archivo) | 17 tests (1 archivo — puro) |
| Shared TS | 0 tests | 28 tests (puros) |
| **Total** | **156 tests** | **115 tests** |

### Dependencies entre fases

```
Fase 0 (extraer interfaces) ──→ Fase 1 (crear mothers/mocks) ──→ Fase 2 (refactorizar tests) ──→ Fase 3 (validar)
```

No se puede refactorizar tests sin antes tener las interfaces extraídas en el source code.

---

## Estrategia de branching

**Toda la épica se desarrolla en una rama aparte:** `feature/007-testing-refactor`

**Por qué:**
- Cambios en production code (extraer interfaces, inyectar DI) son arriesgados si se hacen en `main`
- No bloquea al equipo — el resto sigue trabajando en `main`
- Permite PRs incrementales por fase/paquete
- Rollback fácil si algo falla

**Flujo de trabajo:**
```
main ──────────────────────────────────────────────────→ merge final
  └─→ feature/007-testing-refactor ──────────────────┘
         ├─ Fase 0: shared (sin interfaces, directo)
         ├─ Fase 0: bot (extraer interfaces + refactorizar)
         ├─ Fase 0: api (extraer interfaces + refactorizar)
         └─ Fase 3: PR final de merge a main
```

**Commits:** uno por paquete validado, con `test` o `refactor` en conventional commits. El PR final de merge a `main` incluye todos los cambios validados.

## Decisiones a tomar

1. **¿Extraer interfaces en production code o solo en tests/?**
   - Opción A (recomendada): Interfaces en production code con DI real → tests más limpios en general
   - Opción B: Interfaces solo en `tests/` → menos cambio en production pero los mock objects son más frágiles

2. **¿Qué hacer con `conftest.py` env var approach?**
   - Mantenerlo como fallback + añadir `MockSettings` como opción preferida
   - O reemplazar completamente por `MockSettings` (requiere inyectar settings en todos los módulos)
