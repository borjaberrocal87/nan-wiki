from __future__ import annotations

import logging
import re

from pglast import parse_sql
from pglast import ast
from pglast.ast import RawStmt, SelectStmt

logger = logging.getLogger(__name__)


def _has_table_reference(stmt: SelectStmt) -> bool:
    """Check if the SELECT references any table (FROM clause or JOINs)."""
    # Check FROM clause
    from_clause = stmt.fromClause or []
    if from_clause:
        return True
    # Check JOINs via larg/rarg (SetOperationStmt or JoinExpr)
    if stmt.larg:
        if isinstance(stmt.larg, SelectStmt) and _has_table_reference(stmt.larg):
            return True
    if stmt.rarg:
        if isinstance(stmt.rarg, SelectStmt) and _has_table_reference(stmt.rarg):
            return True
    return False


def validate_sql(sql: str) -> tuple[bool, str | None]:
    """Validate SQL using pglast parser.

    Returns (is_valid, error_message).
    Rejects: multiple statements, non-SELECT/WITH, locking clauses,
    and queries that don't reference any table (pure string literals).
    """
    try:
        parsed = parse_sql(sql)
    except Exception as e:
        return False, f"SQL parse error: {e}"

    statements = parsed
    if len(statements) > 1:
        return False, "Multiple SQL statements are not allowed"

    stmt = statements[0]

    # pglast wraps every statement in a RawStmt; unwrap it
    if isinstance(stmt, RawStmt):
        stmt = stmt.stmt

    # In pglast 6.x, SELECT and WITH (CTE) are both SelectStmt
    # WITH queries have a non-empty withClause
    if isinstance(stmt, SelectStmt):
        # Check for locking clauses (FOR UPDATE, FOR SHARE, etc.)
        for clause in stmt.lockingClause or []:
            return False, "Locking clauses (FOR UPDATE, FOR SHARE) are not allowed"

        # Reject pure string literal queries (no table references)
        # e.g. SELECT 'Please rephrase...' AS clarification
        if not _has_table_reference(stmt):
            # Check if it's a trivial SELECT like SELECT 1 or SELECT NOW()
            # These are allowed (useful for testing), but SELECT 'text' is not
            target_list = stmt.targetList or []
            has_real_target = False
            for target in target_list:
                expr = target.expressions[0] if hasattr(target, 'expressions') else target
                if isinstance(expr, ast.A_Const):
                    # It's a literal constant (string, number, etc.)
                    continue
                has_real_target = True
                break

            if not has_real_target and target_list:
                return False, "Query must reference at least one table (no pure string literals)"

        return True, None

    return False, f"Statement type {type(stmt).__name__} is not allowed (only SELECT/WITH)"
