from __future__ import annotations

import pytest

from src.nl2sql import validate_sql


@pytest.mark.parametrize("sql,should_pass", [
    ("SELECT 1", True),
    ("SELECT * FROM links", True),
    ("SELECT l.title, l.url FROM links AS l WHERE l.source_id = 'github'", True),
    ("WITH top AS (SELECT * FROM links) SELECT * FROM top", True),
    ("WITH cte AS (SELECT id FROM links) SELECT * FROM cte", True),
    ("SELECT NOW()", True),
    ("SELECT COUNT(*) FROM links", True),
    ("INSERT INTO links (url) VALUES ('http://example.com')", False),
    ("UPDATE links SET title = 'x'", False),
    ("DELETE FROM links", False),
    ("DROP TABLE links", False),
    ("ALTER TABLE links ADD COLUMN foo TEXT", False),
    ("CREATE TABLE foo (id INT)", False),
    ("SELECT 1; SELECT 2", False),
    ("SELECT * FROM links FOR UPDATE", False),
    ("SELECT * FROM links FOR SHARE", False),
    ("SELECT * FROM links FOR NO KEY UPDATE", False),
    ("SELECT 'Please rephrase your question' AS clarification", True),
    ("SELECT 'No data found' AS msg", True),
    ("SELECT 'Por favor, proporciona la pregunta en lenguaje natural' AS clarification", True),
])
def test_validate_sql(sql: str, should_pass: bool) -> None:
    is_valid, error = validate_sql(sql)
    assert is_valid is should_pass
    if should_pass:
        assert error is None
    else:
        assert error is not None
