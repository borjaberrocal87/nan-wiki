from __future__ import annotations

import asyncio
import json
import logging
import re
from dataclasses import dataclass, field
from datetime import datetime, date, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any

from openai import AsyncOpenAI, APIError
from openai.types.chat import ChatCompletionMessageParam
from pglast import parse_sql

from src.config import settings
from src.services.llm import _get_client

logger = logging.getLogger(__name__)

_PROMPTS_DIR = Path(__file__).parent.parent / "prompts"
_NL2SQL_SYSTEM_TEMPLATE = (_PROMPTS_DIR / "nl2sql.system.md").read_text()
_ROWS2NL_SYSTEM = (_PROMPTS_DIR / "rows2nl.system.md").read_text()
_SCHEMA_SQL = (_PROMPTS_DIR / "schema.sql").read_text()

_DEFAULT_NL2SQL_MODEL = "claude-sonnet-4-20250514"
_DEFAULT_ROWS2NL_MODEL = "claude-haiku-4-5-20251001"




def _get_model(var: str, fallback: str) -> str:
    val = getattr(settings, var, None)
    return val if val else fallback


def _json_serializer(obj: Any) -> Any:
    """Serialize non-JSON-native types for the LLM payload."""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, (bytes, bytearray)):
        return f"<binary, {len(obj)} bytes>"
    if isinstance(obj, set):
        return list(obj)
    raise TypeError(f"Type {type(obj).__name__} not serializable")


def _extract_sql_and_assumptions(raw: str) -> tuple[str, list[str], bool]:
    """Extract SQL from fenced block, parse assumptions, detect refusals."""
    sql_block = re.search(r"```(?:sql)?\s*\n?([\s\S]*?)```", raw)
    if not sql_block:
        return raw, [], False

    block = sql_block.group(1).strip()

    assumptions = []
    lines = block.split("\n")
    for line in lines:
        stripped = line.strip().lower()
        if stripped.startswith("-- assumptions:"):
            for bullet in stripped.replace("-- assumptions:", "").strip().split("\n"):
                bullet = bullet.strip().lstrip("-•").strip()
                if bullet:
                    assumptions.append(bullet)

    for line in lines:
        stripped = line.strip().lower()
        if stripped.startswith("-- refused") or stripped.startswith("-- i can't"):
            return block, assumptions, True

    clean_lines = []
    for line in lines:
        if line.strip().lower().startswith("-- assumptions:"):
            break
        clean_lines.append(line)
    clean_sql = "\n".join(clean_lines).strip().rstrip(";")

    return clean_sql, assumptions, False


async def _call_llm(
    model: str,
    messages: list[ChatCompletionMessageParam],
    temperature: float = 0.0,
    max_tokens: int = 2048,
    reasoning_effort: str | None = None,
) -> str:
    kwargs: dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if reasoning_effort is not None:
        kwargs["reasoning_effort"] = reasoning_effort
    client = _get_client()
    response = await client.chat.completions.create(**kwargs)
    content = response.choices[0].message.content
    if content is None:
        raise ValueError("LLM returned null content")
    return content


async def _execute_sql(sql: str, pool: Any) -> tuple[list[dict], int, bool]:
    """Execute SQL in READ ONLY transaction.

    Returns (rows, row_count, truncated).
    """
    timeout_ms = getattr(settings, "STATEMENT_TIMEOUT_MS", 8000)
    max_rows = getattr(settings, "MAX_ROWS", 100)

    if ":query_embedding" in sql:
        raise NotImplementedError(
            "Query references :query_embedding — embedding generation is out of scope. "
            "Implement embedding lookup in the calling layer before executing."
        )

    async with pool.acquire() as conn:
        await conn.execute(f"SET statement_timeout = {timeout_ms}")
        async with conn.transaction():
            await conn.execute("SET TRANSACTION READ ONLY")
            result = await conn.fetch(f"SELECT * FROM ({sql}) AS sub LIMIT {max_rows + 1}")

    rows = [dict(r) for r in result]
    truncated = len(rows) > max_rows
    if truncated:
        rows = rows[:max_rows]

    row_count = len(rows)
    if truncated:
        try:
            async with pool.acquire() as conn:
                count_result = await conn.fetch(f"SELECT COUNT(*) AS cnt FROM ({sql}) AS sub")
                row_count = int(count_result[0]["cnt"])
        except Exception as e:
            logger.warning("COUNT query failed, using truncated count: %s", e)
            row_count = max_rows + 1

    return rows, row_count, truncated


@dataclass
class AnswerResult:
    question: str
    sql: str | None = None
    assumptions: list[str] = field(default_factory=list)
    rows: list[dict] | None = None
    row_count: int | None = None
    truncated: bool = False
    answer: str = ""
    error: str | None = None
    timings: dict[str, float] = field(default_factory=dict)


async def answer(question: str) -> AnswerResult:
    """Run the full NL2SQL pipeline: NL→SQL → validate → execute → rows→NL.

    Returns a well-formed AnswerResult even on failure.
    """
    result = AnswerResult(question=question)
    timings = result.timings
    pool = None

    try:
        # ── Stage 1: NL → SQL ──────────────────────────────────────────────
        t0 = asyncio.get_event_loop().time()

        model1 = _get_model("LLM_MODEL_NL2SQL", _DEFAULT_NL2SQL_MODEL)
        system1 = _NL2SQL_SYSTEM_TEMPLATE.replace("{{SCHEMA_SQL}}", _SCHEMA_SQL)
        messages1: list[ChatCompletionMessageParam] = [
            {"role": "system", "content": system1},
            {"role": "user", "content": question},
        ]

        raw_response = await _call_llm(model1, messages1, temperature=0.0)
        timings["llm1"] = asyncio.get_event_loop().time() - t0

        logger.info("NL2SQL raw response: %s", raw_response[:1000].replace("\n", " "))

        sql, assumptions, refused = _extract_sql_and_assumptions(raw_response)
        result.assumptions = assumptions

        if refused:
            result.error = "The model refused to generate a query."
            result.answer = "I couldn't generate a query for that question. Please try rephrasing."
            logger.warning("NL2SQL refused: raw_response=%s", raw_response[:500].replace("\n", " "))
            return result

        if not sql.strip():
            result.error = "No SQL query was generated."
            result.answer = "I couldn't understand your question. Please try rephrasing."
            logger.warning("NL2SQL refused/empty: raw_response=%s", raw_response[:500].replace("\n", " "))
            return result

        result.sql = sql
        logger.info("NL2SQL generated: %s (%d chars)", sql[:200].replace("\n", " "), len(sql))

        # ── Stage 2: Validate ──────────────────────────────────────────────
        t0 = asyncio.get_event_loop().time()

        from src.nl2sql import validate_sql as _validate
        is_valid, error = _validate(sql)
        timings["validate"] = asyncio.get_event_loop().time() - t0

        if not is_valid:
            result.error = f"SQL validation failed: {error}"
            result.answer = f"I couldn't run that query: {error}. Please try rephrasing."
            return result

        # ── Stage 3: Execute ───────────────────────────────────────────────
        t0 = asyncio.get_event_loop().time()

        pool = await _get_pool()
        try:
            rows, row_count, truncated = await _execute_sql(sql, pool)
        except NotImplementedError as e:
            timings["sql"] = asyncio.get_event_loop().time() - t0
            result.error = str(e)
            result.answer = str(e)
            return result
        except Exception as e:
            timings["sql"] = asyncio.get_event_loop().time() - t0
            max_retries = getattr(settings, "NL2SQL_MAX_RETRIES", 1)
            if max_retries > 0:
                logger.info("SQL execution failed, retrying with LLM (attempt 1): %s", e)
                result = await _retry_stage1(question, sql, str(e), result, timings)
                return result

            result.error = f"Query execution failed: {e}"
            result.answer = f"Sorry, I couldn't run that query: {e}. Please try rephrasing."
            return result

        timings["sql"] = asyncio.get_event_loop().time() - t0
        result.rows = rows
        result.row_count = row_count
        result.truncated = truncated
        logger.info("SQL executed: %d rows (count: %d, truncated: %s)", len(rows), row_count, truncated)

        # ── Stage 4: Rows → NL ────────────────────────────────────────────
        t0 = asyncio.get_event_loop().time()

        model2 = _get_model("LLM_MODEL_ROWS2NL", _DEFAULT_ROWS2NL_MODEL)
        system2 = _ROWS2NL_SYSTEM

        rows_payload = {
            "question": question,
            "sql": sql,
            "assumptions": assumptions,
            "rows": rows,
            "row_count": row_count,
            "truncated": truncated,
        }

        messages2: list[ChatCompletionMessageParam] = [
            {"role": "system", "content": system2},
            {"role": "user", "content": json.dumps(rows_payload, default=_json_serializer)},
        ]

        answer_text = await _call_llm(model2, messages2, temperature=0.2, max_tokens=256)
        timings["llm2"] = asyncio.get_event_loop().time() - t0

        logger.info("Rows2NL final answer: %s", answer_text[:1000].replace("\n", " "))

        # Strip HTML tags that the LLM sometimes adds
        answer_text = answer_text.replace("<br><br>", "").replace("<br>", "")
        result.answer = answer_text.strip()

    except (APIError, ValueError) as e:
        result.error = f"LLM error: {e}"
        result.answer = "Sorry, I encountered an error generating a response. Please try again."
    except Exception as e:
        logger.error("Pipeline error: %s", e, exc_info=True)
        result.error = f"Unexpected error: {e}"
        result.answer = "Sorry, something went wrong. Please try again later."

    total_ms = sum(timings.values()) * 1000
    logger.info(
        "NL2SQL complete: question=%s sql=%s rows=%s answer_len=%d total_ms=%.0f",
        question[:80],
        result.sql is not None,
        len(result.rows) if result.rows else 0,
        len(result.answer),
        total_ms,
    )

    return result


async def answer_stream(question: str):
    """Stream intermediate chunks while the pipeline runs.

    Emits:
      - "sql" chunk: the generated SQL query (fast, after Stage 1)
      - "rows" chunk: row count (after Stage 3)
      - "answer" chunk: the final natural language answer (after Stage 4)
      - "error" chunk: on failure
    """
    result = AnswerResult(question=question)
    timings = result.timings
    pool = None

    try:
        # ── Stage 1: NL → SQL ──────────────────────────────────────────────
        t0 = asyncio.get_event_loop().time()

        model1 = _get_model("LLM_MODEL_NL2SQL", _DEFAULT_NL2SQL_MODEL)
        system1 = _NL2SQL_SYSTEM_TEMPLATE.replace("{{SCHEMA_SQL}}", _SCHEMA_SQL)
        messages1: list[ChatCompletionMessageParam] = [
            {"role": "system", "content": system1},
            {"role": "user", "content": question},
        ]

        raw_response = await _call_llm(model1, messages1, temperature=0.0)
        timings["llm1"] = asyncio.get_event_loop().time() - t0

        logger.info("NL2SQL raw response: %s", raw_response[:1000].replace("\n", " "))

        sql, assumptions, refused = _extract_sql_and_assumptions(raw_response)
        result.assumptions = assumptions

        if refused:
            yield {"type": "error", "message": "I couldn't generate a query for that question. Please try rephrasing."}
            yield {"type": "done"}
            return

        if not sql.strip():
            yield {"type": "error", "message": "I couldn't understand your question. Please try rephrasing."}
            yield {"type": "done"}
            return

        result.sql = sql
        logger.info("NL2SQL generated: %s (%d chars)", sql[:200].replace("\n", " "), len(sql))

        # Emit SQL chunk so frontend shows "analyzing..." immediately
        yield {"type": "sql", "sql": sql}

        # ── Stage 2: Validate ──────────────────────────────────────────────
        t0 = asyncio.get_event_loop().time()

        from src.nl2sql import validate_sql as _validate
        is_valid, error = _validate(sql)
        timings["validate"] = asyncio.get_event_loop().time() - t0

        if not is_valid:
            yield {"type": "error", "message": f"I couldn't run that query: {error}. Please try rephrasing."}
            yield {"type": "done"}
            return

        # ── Stage 3: Execute ───────────────────────────────────────────────
        t0 = asyncio.get_event_loop().time()

        pool = await _get_pool()
        try:
            rows, row_count, truncated = await _execute_sql(sql, pool)
        except NotImplementedError as e:
            timings["sql"] = asyncio.get_event_loop().time() - t0
            yield {"type": "error", "message": str(e)}
            yield {"type": "done"}
            return
        except Exception as e:
            timings["sql"] = asyncio.get_event_loop().time() - t0
            max_retries = getattr(settings, "NL2SQL_MAX_RETRIES", 1)
            if max_retries > 0:
                logger.info("SQL execution failed, retrying with LLM (attempt 1): %s", e)
                result = await _retry_stage1(question, sql, str(e), result, timings)
                yield {"type": "answer", "content": result.answer}
                yield {"type": "done"}
                return

            yield {"type": "error", "message": f"Sorry, I couldn't run that query: {e}. Please try rephrasing."}
            yield {"type": "done"}
            return

        timings["sql"] = asyncio.get_event_loop().time() - t0
        result.rows = rows
        result.row_count = row_count
        result.truncated = truncated
        logger.info("SQL executed: %d rows (count: %d, truncated: %s)", len(rows), row_count, truncated)

        # Emit row count chunk so frontend shows "found X results..."
        yield {"type": "rows", "count": row_count, "truncated": truncated}

        # ── Stage 4: Rows → NL (streaming LLM response) ────────────────────
        t0 = asyncio.get_event_loop().time()

        model2 = _get_model("LLM_MODEL_ROWS2NL", _DEFAULT_ROWS2NL_MODEL)
        system2 = _ROWS2NL_SYSTEM

        rows_payload = {
            "question": question,
            "sql": sql,
            "assumptions": assumptions,
            "rows": rows,
            "row_count": row_count,
            "truncated": truncated,
        }

        messages2: list[ChatCompletionMessageParam] = [
            {"role": "system", "content": system2},
            {"role": "user", "content": json.dumps(rows_payload, default=_json_serializer)},
        ]

        # Stream the LLM response char by char
        client = _get_client()
        stream = await client.chat.completions.create(
            model=model2,
            messages=messages2,
            temperature=0.2,
            max_tokens=256,
            stream=True,
        )

        answer_chunks = []
        async for chunk in stream:
            delta = chunk.choices[0].delta
            if delta and delta.content:
                # Strip HTML tags that the LLM sometimes adds
                cleaned = delta.content.replace("<br><br>", "").replace("<br>", "")
                answer_chunks.append(cleaned)
                yield {"type": "chunk", "content": cleaned}

        result.answer = "".join(answer_chunks)
        timings["llm2"] = asyncio.get_event_loop().time() - t0

        logger.info("Rows2NL final answer: %s", result.answer[:1000].replace("\n", " "))

    except (APIError, ValueError) as e:
        yield {"type": "error", "message": "Sorry, I encountered an error generating a response. Please try again."}
    except Exception as e:
        logger.error("Pipeline error: %s", e, exc_info=True)
        yield {"type": "error", "message": "Sorry, something went wrong. Please try again later."}

    yield {"type": "done"}


async def _retry_stage1(
    question: str,
    failed_sql: str,
    error_msg: str,
    result: AnswerResult,
    timings: dict[str, float],
) -> AnswerResult:
    """Retry Stage 1 with error context."""
    model1 = _get_model("LLM_MODEL_NL2SQL", _DEFAULT_NL2SQL_MODEL)

    messages1: list[ChatCompletionMessageParam] = [
        {"role": "system", "content": _NL2SQL_SYSTEM_TEMPLATE.replace("{{SCHEMA_SQL}}", _SCHEMA_SQL)},
        {"role": "user", "content": question},
        {"role": "assistant", "content": f"Previous query: ```sql\n{failed_sql}\n```"},
        {"role": "user", "content": f"The previous query failed with: {error_msg}. Please correct it."},
    ]

    t0 = asyncio.get_event_loop().time()
    raw_response = await _call_llm(model1, messages1, temperature=0.0)
    timings["llm1_retry"] = asyncio.get_event_loop().time() - t0

    logger.info("NL2SQL retry raw response: %s", raw_response[:1000].replace("\n", " "))

    sql, assumptions, refused = _extract_sql_and_assumptions(raw_response)
    result.assumptions = assumptions

    if refused or not sql.strip():
        result.error = "Retry failed: could not generate a corrected query."
        result.answer = "I couldn't generate a valid query after trying again. Please try rephrasing."
        return result

    result.sql = sql

    from src.nl2sql import validate_sql as _validate
    is_valid, error = _validate(sql)
    if not is_valid:
        result.error = f"Retry validation failed: {error}"
        result.answer = f"I couldn't run the corrected query: {error}. Please try rephrasing."
        return result

    try:
        pool = await _get_pool()
        rows, row_count, truncated = await _execute_sql(sql, pool)
        result.rows = rows
        result.row_count = row_count
        result.truncated = truncated

        model2 = _get_model("LLM_MODEL_ROWS2NL", _DEFAULT_ROWS2NL_MODEL)
        rows_payload = {
            "question": question,
            "sql": sql,
            "assumptions": assumptions,
            "rows": rows,
            "row_count": row_count,
            "truncated": truncated,
        }
        messages2: list[ChatCompletionMessageParam] = [
            {"role": "system", "content": _ROWS2NL_SYSTEM},
            {"role": "user", "content": json.dumps(rows_payload, default=_json_serializer)},
        ]
        answer_text = await _call_llm(model2, messages2, temperature=0.2, max_tokens=256)
        timings["llm2"] = asyncio.get_event_loop().time() - t0

        logger.info("Rows2NL final answer: %s", answer_text[:1000].replace("\n", " "))

        # Strip HTML tags that the LLM sometimes adds
        answer_text = answer_text.replace("<br><br>", "").replace("<br>", "")
        result.answer = answer_text.strip()

    except (APIError, ValueError) as e:
        result.error = f"LLM error: {e}"
        result.answer = "Sorry, I encountered an error generating a response. Please try again."
    except Exception as e:
        logger.error("Pipeline error: %s", e, exc_info=True)
        result.error = f"Unexpected error: {e}"
        result.answer = "Sorry, something went wrong. Please try again later."

    total_ms = sum(timings.values()) * 1000
    logger.info(
        "NL2SQL complete: question=%s sql=%s rows=%s answer_len=%d total_ms=%.0f",
        question[:80],
        result.sql is not None,
        len(result.rows) if result.rows else 0,
        len(result.answer),
        total_ms,
    )

    return result


_pool: Any = None


async def _get_pool() -> Any:
    global _pool
    if _pool is None:
        import asyncpg
        import re
        dsn = settings.DATABASE_URL
        # asyncpg doesn't accept "postgresql+asyncpg://", only "postgresql://" or "postgres://"
        dsn = re.sub(r"^postgresql\+asyncpg://", "postgresql://", dsn)
        _pool = await asyncpg.create_pool(dsn=dsn)
    return _pool


async def shutdown_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
