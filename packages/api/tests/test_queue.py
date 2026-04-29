from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import Link
from src.workers.queue import POLL_QUERY, _fetch_pending_link


class TestFetchPendingLink:
    @pytest.fixture
    def mock_link(self):
        return Link(
            id="550e8400-e29b-41d4-a716-446655440000",
            url="https://github.com/test/repo",
            domain="github.com",
            source_id="github",
            posted_at=datetime.now(UTC),
            llm_status="pending",
            retry_count=0,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

    @pytest.fixture
    def mock_db(self, mocker):
        return AsyncMock(spec=AsyncSession)

    @pytest.mark.asyncio
    async def test_returns_link_when_pending(self, mock_db, mock_link, mocker):
        result_mock = AsyncMock()
        result_mock.scalar_one_or_none.return_value = mock_link
        mock_db.execute = AsyncMock(return_value=result_mock)

        result = await _fetch_pending_link(mock_db)

        assert result is not None
        assert result.id == mock_link.id
        assert result.llm_status == "pending"
        mock_db.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_returns_link_when_failed(self, mock_db, mock_link, mocker):
        mock_link.llm_status = "failed"
        mock_link.retry_count = 2

        result_mock = AsyncMock()
        result_mock.scalar_one_or_none.return_value = mock_link
        mock_db.execute = AsyncMock(return_value=result_mock)

        result = await _fetch_pending_link(mock_db)

        assert result is not None
        assert result.llm_status == "failed"

    @pytest.mark.asyncio
    async def test_returns_none_when_no_pending_links(self, mock_db):
        result_mock = AsyncMock()
        result_mock.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=result_mock)

        result = await _fetch_pending_link(mock_db)

        assert result is None

    @pytest.mark.asyncio
    async def test_respects_max_retries_filter(self, mock_db, mock_link):
        mock_link.retry_count = 10  # Should be filtered out

        result_mock = AsyncMock()
        result_mock.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=result_mock)

        with patch("src.workers.queue.settings") as mock_settings:
            mock_settings.MAX_RETRIES = 5
            result = await _fetch_pending_link(mock_db)

        assert result is None

    @pytest.mark.asyncio
    async def test_query_contains_skip_locked(self):
        assert "SKIP LOCKED" in POLL_QUERY
        assert "FOR UPDATE" in POLL_QUERY

    @pytest.mark.asyncio
    async def test_query_filters_pending_and_failed(self):
        assert "'pending'" in POLL_QUERY
        assert "'failed'" in POLL_QUERY

    @pytest.mark.asyncio
    async def test_query_orders_by_posted_at_asc(self):
        assert "ORDER BY posted_at ASC" in POLL_QUERY
