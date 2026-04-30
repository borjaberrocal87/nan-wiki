from __future__ import annotations

import pytest

from src.nl2sql.pipeline import _extract_sql_and_assumptions


@pytest.mark.parametrize("raw,expected_assumptions", [
    (
        "```sql\n-- tables: links\nSELECT title FROM links LIMIT 10;\n-- assumptions:\n-- · \"10\" is a reasonable default\n-- · UTC timezone assumed",
        [],
    ),
    (
        "```sql\nSELECT * FROM links;\n-- assumptions: no assumptions made",
        [],
    ),
    (
        "```sql\nSELECT 1;```",
        [],
    ),
    (
        "I can't do that",
        [],
    ),
])
def test_extract_assumptions(raw: str, expected_assumptions: list[str]) -> None:
    sql, assumptions, refused = _extract_sql_and_assumptions(raw)
    assert assumptions == expected_assumptions
    assert refused is False


def test_extract_refusal() -> None:
    raw = "```sql\n-- I can't generate a query for that\n```"
    sql, assumptions, refused = _extract_sql_and_assumptions(raw)
    assert refused is True


def test_extract_no_block() -> None:
    raw = "Just plain text, no SQL block"
    sql, assumptions, refused = _extract_sql_and_assumptions(raw)
    assert sql == raw
    assert assumptions == []
    assert refused is False
