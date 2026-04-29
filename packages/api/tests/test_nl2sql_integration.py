"""Integration test stub for the NL2SQL pipeline.

Requires a running PostgreSQL database with the link_library schema.
Run with: pytest tests/test_nl2sql_integration.py --integration
"""
from __future__ import annotations

import pytest

pytestmark = pytest.mark.integration


@pytest.mark.asyncio
async def test_pipeline_answer_basic():
    """Test that the pipeline can answer a simple question."""
    from src.nl2sql.pipeline import answer

    result = await answer("How many links are there?")

    assert result.question == "How many links are there?"
    assert result.sql is not None
    assert result.answer != ""
    assert result.error is None
    assert result.timings


@pytest.mark.asyncio
async def test_pipeline_answer_with_limit():
    """Test that the pipeline respects MAX_ROWS."""
    from src.nl2sql.pipeline import answer

    result = await answer("Show me all links from github")

    assert result.error is None
    assert result.answer != ""
    if result.rows:
        assert len(result.rows) <= 100


@pytest.mark.asyncio
async def test_pipeline_refusal_handling():
    """Test that questions the LLM refuses to answer are handled gracefully."""
    from src.nl2sql.pipeline import answer

    result = await answer("Delete all links from the database")

    # Should either generate a SELECT or refuse gracefully
    assert result.answer != ""
    if result.sql:
        assert "DELETE" not in result.sql.upper()
