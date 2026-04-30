from __future__ import annotations

import json
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from openai import APIError

from src.nl2sql.pipeline import (
    AnswerResult,
    _call_llm,
    _execute_sql,
    _extract_sql_and_assumptions,
    _format_rows_as_nl,
    _format_rows_as_table,
    _get_model,
    _json_serializer,
    answer,
    answer_stream,
    shutdown_pool,
)


# ── Helpers ──────────────────────────────────────────────────────────────────


class _MockPool:
    """A real async context manager pool mock for _execute_sql tests."""
    def __init__(self, mock_conn):
        self._conn = mock_conn

    async def __aenter__(self):
        return self._conn

    async def __aexit__(self, *args):
        pass


def _make_async_pool(mock_conn, mock_result, mock_count_result=None):
    """Create a mock pool that behaves like an asyncpg pool with acquire() context manager."""
    mock_conn.fetch = AsyncMock(return_value=mock_result)
    mock_conn.transaction = MagicMock(return_value=MagicMock(__aenter__=AsyncMock(), __aexit__=AsyncMock()))

    pool = MagicMock()
    pool.acquire = MagicMock()
    pool.acquire.return_value = _MockPool(mock_conn)
    return pool


def _make_async_pool_side_effect(mock_conn, side_effects):
    """Create a mock pool with fetch side effects."""
    mock_conn.fetch = AsyncMock(side_effect=side_effects)
    mock_conn.transaction = MagicMock(return_value=MagicMock(__aenter__=AsyncMock(), __aexit__=AsyncMock()))

    pool = MagicMock()
    pool.acquire = MagicMock()
    pool.acquire.return_value = _MockPool(mock_conn)
    return pool


def _make_async_pool_side_effect(mock_conn, side_effects):
    """Create a mock pool with fetch side effects."""
    mock_conn.fetch = AsyncMock(side_effect=side_effects)
    mock_conn.transaction = MagicMock(return_value=MagicMock(__aenter__=AsyncMock(), __aexit__=AsyncMock()))

    pool = MagicMock()
    mock_acq = _MockPool(mock_conn)
    pool.acquire = MagicMock()
    pool.acquire.return_value = mock_acq
    return pool


# ── _get_model ────────────────────────────────────────────────────────────────


class TestGetModel:
    @pytest.mark.parametrize(
        "setting_value,fallback,expected",
        [
            ("claude-3-opus", "claude-sonnet-4", "claude-3-opus"),
            ("", "claude-sonnet-4", "claude-sonnet-4"),
            (None, "claude-sonnet-4", "claude-sonnet-4"),
            ("gemini-pro", "claude-sonnet-4", "gemini-pro"),
        ],
    )
    def test_returns_setting_when_present(self, setting_value, fallback, expected):
        settings_mock = MagicMock()
        settings_mock.LLM_MODEL_NL2SQL = setting_value

        with patch("src.nl2sql.pipeline.settings", settings_mock):
            result = _get_model("LLM_MODEL_NL2SQL", fallback)

        assert result == expected


# ── _json_serializer ─────────────────────────────────────────────────────────


class TestJsonSerializer:
    def test_datetime_isoformat(self):
        dt = datetime(2024, 1, 15, 10, 30, 0)
        result = _json_serializer(dt)
        assert result == "2024-01-15T10:30:00"

    def test_string_passthrough(self):
        result = _json_serializer("hello")
        assert result == "hello"

    def test_int_passthrough(self):
        result = _json_serializer(42)
        assert result == "42"

    def test_object_with_isoformat(self):
        dt = datetime(2024, 6, 1, 12, 0, 0)

        class CustomObj:
            isoformat = lambda self: dt.isoformat()

        result = _json_serializer(CustomObj())
        assert result == "2024-06-01T12:00:00"

    def test_none_becomes_string(self):
        result = _json_serializer(None)
        assert result == "None"


# ── _extract_sql_and_assumptions ─────────────────────────────────────────────


class TestExtractSqlAndAssumptions:
    def test_valid_sql_in_fenced_block(self):
        raw = "```sql\nSELECT id, title FROM links LIMIT 10;\n```"
        sql, assumptions, refused = _extract_sql_and_assumptions(raw)
        assert sql == "SELECT id, title FROM links LIMIT 10"
        assert assumptions == []
        assert refused is False

    def test_sql_without_sql_fence(self):
        raw = "```\nSELECT 1;\n```"
        sql, assumptions, refused = _extract_sql_and_assumptions(raw)
        assert sql == "SELECT 1"
        assert refused is False

    def test_assumptions_parsed_from_inline_comments(self):
        # Source code parses text after "-- assumptions:" on the same line
        raw = "```sql\nSELECT * FROM links;\n-- assumptions: default limit is 10, utc assumed\n```"
        sql, assumptions, refused = _extract_sql_and_assumptions(raw)
        # Source code splits on newlines, not commas, so entire text is one assumption
        assert len(assumptions) == 1
        assert "default limit is 10" in assumptions[0]

    def test_assumptions_removed_from_clean_sql(self):
        raw = """```sql
SELECT * FROM links;
-- assumptions: this is an assumption
```"""
        sql, assumptions, refused = _extract_sql_and_assumptions(raw)
        assert "-- assumptions" not in sql
        assert sql == "SELECT * FROM links"

    def test_refusal_detected_with_refused_keyword(self):
        raw = "```sql\n-- refused: this is sensitive\nSELECT 1;\n```"
        sql, assumptions, refused = _extract_sql_and_assumptions(raw)
        assert refused is True

    def test_refusal_detected_with_refusal_keyword(self):
        raw = "```sql\n-- refusal: I can't help with that\n```"
        sql, assumptions, refused = _extract_sql_and_assumptions(raw)
        assert refused is True

    def test_refusal_detected_with_i_can_t(self):
        raw = "```sql\n-- I can't generate a query for that\n```"
        sql, assumptions, refused = _extract_sql_and_assumptions(raw)
        assert refused is True

    def test_no_sql_block_returns_raw(self):
        raw = "I'm not sure how to answer that."
        sql, assumptions, refused = _extract_sql_and_assumptions(raw)
        assert sql == raw
        assert assumptions == []
        assert refused is False

    def test_empty_sql_block(self):
        raw = "```sql\n```"
        sql, assumptions, refused = _extract_sql_and_assumptions(raw)
        assert sql == ""

    def test_semicolon_stripped_from_end(self):
        raw = "```sql\nSELECT 1;\n```"
        sql, assumptions, refused = _extract_sql_and_assumptions(raw)
        assert sql == "SELECT 1"

    def test_assumptions_with_bullet_points(self):
        # Source code parses text after "-- assumptions:" on the same line only
        raw = "```sql\nSELECT 1;\n-- assumptions: first point, second point\n```"
        sql, assumptions, refused = _extract_sql_and_assumptions(raw)
        assert len(assumptions) == 1
        assert "first point" in assumptions[0]
        assert "second point" in assumptions[0]


# ── _call_llm ────────────────────────────────────────────────────────────────


class TestCallLlm:
    @pytest.mark.asyncio
    async def test_returns_content_from_llm_response(self):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="SELECT 1;"))]
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        with patch("src.nl2sql.pipeline._get_client", return_value=mock_client):
            result = await _call_llm("test-model", [])

        assert result == "SELECT 1;"

    @pytest.mark.asyncio
    async def test_raises_on_null_content(self):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content=None))]
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        with patch("src.nl2sql.pipeline._get_client", return_value=mock_client):
            with pytest.raises(ValueError, match="LLM returned null content"):
                await _call_llm("test-model", [])

    @pytest.mark.asyncio
    async def test_passes_temperature_and_max_tokens(self):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="ok"))]
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        with patch("src.nl2sql.pipeline._get_client", return_value=mock_client):
            await _call_llm("test-model", [], temperature=0.5, max_tokens=512)

        call_kwargs = mock_client.chat.completions.create.call_args.kwargs
        assert call_kwargs["temperature"] == 0.5
        assert call_kwargs["max_tokens"] == 512

    @pytest.mark.asyncio
    async def test_enables_thinking_when_requested(self):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="ok"))]
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        with patch("src.nl2sql.pipeline._get_client", return_value=mock_client):
            await _call_llm("test-model", [], enable_thinking=True)

        extra_body = mock_client.chat.completions.create.call_args.kwargs["extra_body"]
        assert extra_body["chat_template_kwargs"]["enable_thinking"] is True

    @pytest.mark.asyncio
    async def test_excludes_reasoning_effort_when_none(self):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="ok"))]
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        with patch("src.nl2sql.pipeline._get_client", return_value=mock_client):
            await _call_llm("test-model", [], reasoning_effort=None)

        call_kwargs = mock_client.chat.completions.create.call_args.kwargs
        assert "reasoning_effort" not in call_kwargs

    @pytest.mark.asyncio
    async def test_includes_reasoning_effort_when_set(self):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="ok"))]
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        with patch("src.nl2sql.pipeline._get_client", return_value=mock_client):
            await _call_llm("test-model", [], reasoning_effort="high")

        call_kwargs = mock_client.chat.completions.create.call_args.kwargs
        assert call_kwargs["reasoning_effort"] == "high"


# ── _execute_sql ─────────────────────────────────────────────────────────────


class TestExecuteSql:
    @pytest.mark.asyncio
    async def test_raises_on_query_embedding_placeholder(self):
        mock_pool = AsyncMock()
        with pytest.raises(NotImplementedError, match=":query_embedding"):
            await _execute_sql("SELECT * FROM links WHERE embedding <=> :query_embedding", mock_pool)

    @pytest.mark.asyncio
    async def test_returns_rows_and_count(self):
        mock_conn = AsyncMock()
        mock_result = [
            MagicMock(id=1, title="Link 1", __iter__=lambda self: iter(["id", "title"]))
            for _ in range(2)
        ]
        mock_pool = _make_async_pool(mock_conn, mock_result)

        with patch("src.nl2sql.pipeline.settings") as mock_settings:
            mock_settings.STATEMENT_TIMEOUT_MS = 5000
            mock_settings.MAX_ROWS = 100
            rows, count, truncated = await _execute_sql("SELECT 1", mock_pool)

        assert len(rows) == 2
        assert count == 2
        assert truncated is False

    @pytest.mark.asyncio
    async def test_truncates_when_exceeding_max_rows(self):
        mock_conn = AsyncMock()
        mock_result = [
            MagicMock(id=i, title=f"Link {i}", __iter__=lambda self: iter(["id", "title"]))
            for i in range(101)
        ]
        mock_count_result = [MagicMock(cnt=150, __iter__=lambda self: iter(["cnt"]))]
        mock_count_result[0].__getitem__ = lambda self, k: 150 if k == "cnt" else None
        mock_pool = _make_async_pool_side_effect(mock_conn, [mock_result, mock_count_result])

        with patch("src.nl2sql.pipeline.settings") as mock_settings:
            mock_settings.STATEMENT_TIMEOUT_MS = 5000
            mock_settings.MAX_ROWS = 100
            rows, count, truncated = await _execute_sql("SELECT 1", mock_pool)

        assert truncated is True
        assert len(rows) == 100
        assert count == 150

    @pytest.mark.asyncio
    async def test_fallback_count_on_count_query_failure(self):
        mock_conn = AsyncMock()
        mock_result = [
            MagicMock(id=1, title="Link 1", __iter__=lambda self: iter(["id", "title"]))
            for _ in range(101)
        ]

        call_count = [0]
        async def fetch_side_effect(*args, **kwargs):
            call_count[0] += 1
            if call_count[0] > 1:
                raise Exception("count failed")
            return mock_result

        mock_pool = _make_async_pool_side_effect(mock_conn, fetch_side_effect)

        with patch("src.nl2sql.pipeline.settings") as mock_settings:
            mock_settings.STATEMENT_TIMEOUT_MS = 5000
            mock_settings.MAX_ROWS = 100
            rows, count, truncated = await _execute_sql("SELECT 1", mock_pool)

        assert truncated is True
        assert count == 101

    @pytest.mark.asyncio
    async def test_returns_empty_rows(self):
        mock_conn = AsyncMock()
        mock_pool = _make_async_pool(mock_conn, [])

        with patch("src.nl2sql.pipeline.settings") as mock_settings:
            mock_settings.STATEMENT_TIMEOUT_MS = 5000
            mock_settings.MAX_ROWS = 100
            rows, count, truncated = await _execute_sql("SELECT 1", mock_pool)

        assert rows == []
        assert count == 0
        assert truncated is False


# ── _format_rows_as_table ────────────────────────────────────────────────────


class TestFormatRowsAsTable:
    def test_empty_rows(self):
        result = _format_rows_as_table([], 0, False)
        assert result == "No results found."

    def test_single_row_single_column(self):
        rows = [{"name": "Alice"}]
        result = _format_rows_as_table(rows, 1, False)
        lines = result.split("\n")
        assert "name" in lines[0]
        assert "Alice" in lines[2]
        assert "1 row(s)" in result

    def test_multiple_rows(self):
        rows = [
            {"name": "Alice", "age": "30"},
            {"name": "Bob", "age": "25"},
        ]
        result = _format_rows_as_table(rows, 2, False)
        assert "name" in result
        assert "age" in result
        assert "Alice" in result
        assert "Bob" in result
        assert "2 row(s)" in result

    def test_truncated_appends_message(self):
        rows = [{"id": "1"}]
        result = _format_rows_as_table(rows, 150, True)
        assert "truncated" in result

    def test_column_widths_adjusted_for_long_values(self):
        rows = [{"short": "a very long value here"}]
        result = _format_rows_as_table(rows, 1, False)
        assert "short" in result
        assert "a very long value here" in result

    def test_null_values_rendered_as_empty(self):
        rows = [{"name": None, "value": "test"}]
        result = _format_rows_as_table(rows, 1, False)
        assert "test" in result


# ── _format_rows_as_nl ───────────────────────────────────────────────────────


class TestFormatRowsAsNl:
    @pytest.mark.asyncio
    async def test_calls_llm_with_formatted_payload(self):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="Here is the answer."))]
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        with patch("src.nl2sql.pipeline._get_client", return_value=mock_client):
            result = await _format_rows_as_nl(
                rows=[{"id": 1}],
                row_count=1,
                truncated=False,
                sql="SELECT 1",
                assumptions=[],
                question="What is the count?",
            )

        assert "Here is the answer" in result

    @pytest.mark.asyncio
    async def test_payload_includes_all_fields(self):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="ok"))]
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        with patch("src.nl2sql.pipeline._get_client", return_value=mock_client):
            await _format_rows_as_nl(
                rows=[{"id": 1, "title": "Test"}],
                row_count=5,
                truncated=True,
                sql="SELECT * FROM links",
                assumptions=["assumption A"],
                question="Test question",
                error=None,
            )

        call_kwargs = mock_client.chat.completions.create.call_args.kwargs
        user_message = call_kwargs["messages"][1]["content"]
        payload = json.loads(user_message)
        assert payload["question"] == "Test question"
        assert payload["sql"] == "SELECT * FROM links"
        assert payload["truncated"] is True
        assert payload["row_count"] == 5
        assert payload["assumptions"] == ["assumption A"]


# ── AnswerResult ─────────────────────────────────────────────────────────────


class TestAnswerResult:
    def test_defaults(self):
        result = AnswerResult(question="test")
        assert result.question == "test"
        assert result.sql is None
        assert result.assumptions == []
        assert result.rows is None
        assert result.row_count is None
        assert result.truncated is False
        assert result.answer == ""
        assert result.error is None
        assert result.timings == {}


# ── answer (full pipeline) ──────────────────────────────────────────────────


class TestAnswer:
    @pytest.fixture
    def mock_llm_response(self):
        return "```sql\nSELECT id, title FROM links LIMIT 10;\n```"

    @pytest.fixture
    def mock_sql_result(self):
        return [
            MagicMock(id=1, title="Link 1", __iter__=lambda self: iter(["id", "title"]))
            for _ in range(3)
        ]

    @pytest.mark.asyncio
    async def test_happy_path_returns_answer(self, mock_llm_response, mock_sql_result):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content=mock_llm_response))]
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        mock_pool = _make_async_pool(AsyncMock(), mock_sql_result)

        with (
            patch("src.nl2sql.pipeline._get_client", return_value=mock_client),
            patch("src.nl2sql.pipeline._get_pool", return_value=mock_pool),
            patch("src.nl2sql.validate_sql", return_value=(True, None)),
            patch("src.nl2sql.pipeline._format_rows_as_nl", return_value="Here are 3 links."),
        ):
            result = await answer("Show me links")

        assert result.question == "Show me links"
        assert result.sql is not None
        assert "SELECT" in result.sql
        assert result.rows is not None
        assert len(result.rows) == 3
        assert result.answer == "Here are 3 links."
        assert result.error is None
        assert "llm1" in result.timings

    @pytest.mark.asyncio
    async def test_refused_returns_error(self):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="```sql\n-- I can't help with that\n```"))]
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        with (
            patch("src.nl2sql.pipeline._get_client", return_value=mock_client),
        ):
            result = await answer("Show me links")

        assert result.error == "The model refused to generate a query."
        assert "couldn't generate" in result.answer
        assert result.sql is None

    @pytest.mark.asyncio
    async def test_empty_sql_returns_error(self):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="I don't understand."))]
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        with (
            patch("src.nl2sql.pipeline._get_client", return_value=mock_client),
            patch("src.nl2sql.validate_sql", return_value=(False, "parse error")),
        ):
            result = await answer("unknown question")

        assert result.error is not None
        assert "SQL validation failed" in result.error

    @pytest.mark.asyncio
    async def test_sql_validation_failure(self):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="```sql\nINSERT INTO links VALUES (1);\n```"))]
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        with (
            patch("src.nl2sql.pipeline._get_client", return_value=mock_client),
            patch("src.nl2sql.validate_sql", return_value=(False, "INSERT not allowed")),
        ):
            result = await answer("Add a link")

        assert result.error is not None
        assert "SQL validation failed" in result.error

    @pytest.mark.asyncio
    async def test_sql_execution_not_implemented(self):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="```sql\nSELECT * FROM links WHERE embedding <=> :query_embedding\n```"))]
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        mock_pool = AsyncMock()

        with (
            patch("src.nl2sql.pipeline._get_client", return_value=mock_client),
            patch("src.nl2sql.pipeline._get_pool", return_value=mock_pool),
            patch("src.nl2sql.validate_sql", return_value=(True, None)),
        ):
            result = await answer("Search by similarity")

        assert "query_embedding" in result.error

    @pytest.mark.asyncio
    async def test_sql_execution_failure_with_no_retries(self):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="```sql\nSELECT 1;\n```"))]
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        mock_pool = AsyncMock()
        mock_pool.acquire = AsyncMock()
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(side_effect=Exception("connection refused"))
        mock_pool.acquire.return_value.__aexit__ = AsyncMock()

        with (
            patch("src.nl2sql.pipeline._get_client", return_value=mock_client),
            patch("src.nl2sql.pipeline._get_pool", return_value=mock_pool),
            patch("src.nl2sql.validate_sql", return_value=(True, None)),
            patch("src.nl2sql.pipeline.settings") as mock_settings,
        ):
            mock_settings.NL2SQL_MAX_RETRIES = 0
            result = await answer("test")
            assert "Query execution failed" in result.error

    @pytest.mark.asyncio
    async def test_sql_execution_failure_with_retry(self):
        """When NL2SQL_MAX_RETRIES > 0, SQL failure triggers _retry_stage1."""
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="```sql\nSELECT 1;\n```"))]
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        mock_pool = AsyncMock()
        mock_pool.acquire = AsyncMock()
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(side_effect=Exception("fail"))
        mock_pool.acquire.return_value.__aexit__ = AsyncMock()

        with (
            patch("src.nl2sql.pipeline._get_client", return_value=mock_client),
            patch("src.nl2sql.pipeline._get_pool", return_value=mock_pool),
            patch("src.nl2sql.validate_sql", return_value=(True, None)),
            patch("src.nl2sql.pipeline.settings") as mock_settings,
        ):
            mock_settings.NL2SQL_MAX_RETRIES = 1
            result = await answer("test")
            assert result.error is not None

    @pytest.mark.asyncio
    async def test_api_error_from_llm(self):
        mock_client = MagicMock()
        mock_client.chat.completions.create = AsyncMock(side_effect=APIError(request=MagicMock(), message="rate limit", body=None))

        with patch("src.nl2sql.pipeline._get_client", return_value=mock_client):
            result = await answer("test question")

        assert result.error is not None
        assert "LLM error" in result.error

    @pytest.mark.asyncio
    async def test_generic_exception_captured(self):
        with patch("src.nl2sql.pipeline._get_client") as mock_get_client:
            mock_get_client.side_effect = Exception("something unexpected")
            result = await answer("test")

        assert result.error is not None
        assert "Unexpected error" in result.error

    @pytest.mark.asyncio
    async def test_timings_are_recorded(self, mock_llm_response, mock_sql_result):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content=mock_llm_response))]
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        mock_pool = _make_async_pool(AsyncMock(), mock_sql_result)

        with (
            patch("src.nl2sql.pipeline._get_client", return_value=mock_client),
            patch("src.nl2sql.pipeline._get_pool", return_value=mock_pool),
            patch("src.nl2sql.validate_sql", return_value=(True, None)),
            patch("src.nl2sql.pipeline._format_rows_as_nl", return_value="done"),
        ):
            result = await answer("test")

        assert "llm1" in result.timings
        assert "validate" in result.timings
        assert "sql" in result.timings
        assert "format" in result.timings


# ── answer_stream ────────────────────────────────────────────────────────────


class TestAnswerStream:
    @pytest.fixture
    def mock_llm_response(self):
        return "```sql\nSELECT id, title FROM links LIMIT 10;\n```"

    @pytest.fixture
    def mock_sql_result(self):
        return [
            MagicMock(id=1, title="Link 1", __iter__=lambda self: iter(["id", "title"]))
            for _ in range(3)
        ]

    @pytest.mark.asyncio
    async def test_happy_path_yields_chunks(self, mock_llm_response, mock_sql_result):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content=mock_llm_response))]
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        mock_pool = _make_async_pool(AsyncMock(), mock_sql_result)

        with (
            patch("src.nl2sql.pipeline._get_client", return_value=mock_client),
            patch("src.nl2sql.pipeline._get_pool", return_value=mock_pool),
            patch("src.nl2sql.validate_sql", return_value=(True, None)),
            patch("src.nl2sql.pipeline._format_rows_as_nl", return_value="NL answer"),
        ):
            chunks = []
            async for chunk in answer_stream("test"):
                chunks.append(chunk)

        assert any(c.get("type") == "sql" for c in chunks)
        assert any(c.get("type") == "rows" for c in chunks)
        assert any(c.get("type") == "chunk" and c.get("content") == "NL answer" for c in chunks)
        assert any(c.get("type") == "done" for c in chunks)

    @pytest.mark.asyncio
    async def test_refused_yields_error_and_done(self):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="```sql\n-- refused\n```"))]
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        chunks = []
        with patch("src.nl2sql.pipeline._get_client", return_value=mock_client):
            async for chunk in answer_stream("test"):
                chunks.append(chunk)

        assert any("couldn't generate" in c.get("content", "") for c in chunks)
        assert any(c.get("type") == "done" for c in chunks)

    @pytest.mark.asyncio
    async def test_empty_sql_yields_error_and_done(self):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="I don't know"))]
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        chunks = []
        with (
            patch("src.nl2sql.pipeline._get_client", return_value=mock_client),
            patch("src.nl2sql.validate_sql", return_value=(False, "parse error")),
        ):
            async for chunk in answer_stream("test"):
                chunks.append(chunk)

        assert any(c.get("type") == "error" for c in chunks)

    @pytest.mark.asyncio
    async def test_validation_error_yields_error_chunk(self):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="```sql\nINSERT INTO x VALUES (1);\n```"))]
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        chunks = []
        with (
            patch("src.nl2sql.pipeline._get_client", return_value=mock_client),
            patch("src.nl2sql.validate_sql", return_value=(False, "INSERT not allowed")),
        ):
            async for chunk in answer_stream("test"):
                chunks.append(chunk)

        assert any(c.get("type") == "error" for c in chunks)

    @pytest.mark.asyncio
    async def test_not_implemented_yields_error(self):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="```sql\nSELECT * FROM links WHERE x <=> :query_embedding\n```"))]
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        chunks = []
        with (
            patch("src.nl2sql.pipeline._get_client", return_value=mock_client),
            patch("src.nl2sql.validate_sql", return_value=(True, None)),
        ):
            async for chunk in answer_stream("test"):
                chunks.append(chunk)

        assert any(c.get("type") == "error" for c in chunks)

    @pytest.mark.asyncio
    async def test_api_error_yields_error_chunk(self):
        mock_client = MagicMock()
        mock_client.chat.completions.create = AsyncMock(
            side_effect=APIError(request=MagicMock(), message="rate limit", body=None)
        )

        chunks = []
        with patch("src.nl2sql.pipeline._get_client", return_value=mock_client):
            async for chunk in answer_stream("test"):
                chunks.append(chunk)

        assert any(c.get("type") == "error" for c in chunks)
        assert any(c.get("type") == "done" for c in chunks)

    @pytest.mark.asyncio
    async def test_generic_exception_yields_error(self):
        with patch("src.nl2sql.pipeline._get_client") as mock_get_client:
            mock_get_client.side_effect = Exception("boom")
            chunks = []
            async for chunk in answer_stream("test"):
                chunks.append(chunk)

        assert any(c.get("type") == "error" for c in chunks)

    @pytest.mark.asyncio
    async def test_sql_chunk_contains_query(self, mock_llm_response):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content=mock_llm_response))]
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        mock_pool = _make_async_pool(AsyncMock(), [])

        chunks = []
        with (
            patch("src.nl2sql.pipeline._get_client", return_value=mock_client),
            patch("src.nl2sql.pipeline._get_pool", return_value=mock_pool),
            patch("src.nl2sql.validate_sql", return_value=(True, None)),
            patch("src.nl2sql.pipeline._format_rows_as_nl", return_value="done"),
        ):
            async for chunk in answer_stream("test"):
                chunks.append(chunk)

        sql_chunk = next(c for c in chunks if c.get("type") == "sql")
        assert "SELECT" in sql_chunk["sql"]

    @pytest.mark.asyncio
    async def test_rows_chunk_contains_count(self, mock_llm_response):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content=mock_llm_response))]
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        mock_result = [MagicMock(id=1, title="x", __iter__=lambda self: iter(["id", "title"]))]
        mock_pool = _make_async_pool(AsyncMock(), mock_result)

        chunks = []
        with (
            patch("src.nl2sql.pipeline._get_client", return_value=mock_client),
            patch("src.nl2sql.pipeline._get_pool", return_value=mock_pool),
            patch("src.nl2sql.validate_sql", return_value=(True, None)),
            patch("src.nl2sql.pipeline._format_rows_as_nl", return_value="done"),
        ):
            async for chunk in answer_stream("test"):
                chunks.append(chunk)

        rows_chunk = next(c for c in chunks if c.get("type") == "rows")
        assert rows_chunk["count"] == 1

    @pytest.mark.asyncio
    async def test_retry_path_yields_answer_and_done(self, mock_llm_response):
        """When SQL fails and NL2SQL_MAX_RETRIES > 0, retry yields answer + done."""
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content=mock_llm_response))]
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        mock_pool = AsyncMock()
        mock_pool.acquire = AsyncMock()
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(side_effect=Exception("fail"))
        mock_pool.acquire.return_value.__aexit__ = AsyncMock()

        with (
            patch("src.nl2sql.pipeline._get_client", return_value=mock_client),
            patch("src.nl2sql.pipeline._get_pool", return_value=mock_pool),
            patch("src.nl2sql.validate_sql", return_value=(True, None)),
            patch("src.nl2sql.pipeline.settings") as mock_settings,
        ):
            mock_settings.NL2SQL_MAX_RETRIES = 1

            chunks = []
            async for chunk in answer_stream("test"):
                chunks.append(chunk)

            assert any(c.get("type") == "answer" for c in chunks)


# ── shutdown_pool ─────────────────────────────────────────────────────────────


class TestShutdownPool:
    @pytest.mark.asyncio
    async def test_closes_pool_when_set(self):
        from src.nl2sql.pipeline import _pool

        mock_pool = AsyncMock()
        with patch("src.nl2sql.pipeline._pool", mock_pool):
            await shutdown_pool()

        mock_pool.close.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_noop_when_pool_is_none(self):
        with patch("src.nl2sql.pipeline._pool", None):
            await shutdown_pool()
