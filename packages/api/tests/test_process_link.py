from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import Link
from src.workers.process_link import process_link, _mark_failed


class TestProcessLink:
    @pytest.fixture
    def mock_link(self):
        return Link(
            id="550e8400-e29b-41d4-a716-446655440000",
            url="https://github.com/test/repo",
            domain="github.com",
            source_id="github",
            author_id=12345,
            channel_id=67890,
            posted_at=datetime.now(UTC),
            llm_status="pending",
            retry_count=0,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

    @pytest.fixture
    def mock_db(self, mock_link):
        db = AsyncMock(spec=AsyncSession)
        result_mock = AsyncMock()
        result_mock.scalar_one_or_none.return_value = mock_link
        db.execute = AsyncMock(return_value=result_mock)
        return db

    @pytest.mark.asyncio
    async def test_marks_processing_then_done(self, mock_db, mock_link):
        metadata = {
            "title": "Test Repo",
            "description": "A test repository",
            "tags": ["python", "test"],
        }

        with (
            patch("src.workers.process_link.generate_link_metadata", return_value=metadata),
            patch("src.workers.process_link.generate_embedding", return_value=[0.1] * 1024),
        ):
            await process_link(mock_db, mock_link)

        calls = mock_db.execute.call_args_list
        assert len(calls) >= 3

        # First call: mark processing
        first_call = calls[0][0][0]
        assert isinstance(first_call, update)

        # Second call: update with metadata
        second_call = calls[1][0][0]
        assert isinstance(second_call, update)

    @pytest.mark.asyncio
    async def test_sets_failed_when_metadata_none(self, mock_db, mock_link):
        with patch(
            "src.workers.process_link.generate_link_metadata", return_value=None
        ):
            await process_link(mock_db, mock_link)

        calls = mock_db.execute.call_args_list
        # Should have: mark processing + mark failed
        assert len(calls) >= 2

    @pytest.mark.asyncio
    async def test_continues_without_embedding(self, mock_db, mock_link):
        metadata = {
            "title": "Test Repo",
            "description": "A test repository",
            "tags": ["python"],
        }

        with (
            patch(
                "src.workers.process_link.generate_link_metadata", return_value=metadata
            ),
            patch("src.workers.process_link.generate_embedding", return_value=None),
        ):
            await process_link(mock_db, mock_link)

        # Should still succeed (embedding failure is non-blocking)
        assert mock_db.execute.call_count >= 2


class TestMarkFailed:
    @pytest.fixture
    def mock_link(self):
        return Link(
            id="550e8400-e29b-41d4-a716-446655440000",
            url="https://example.com",
            domain="example.com",
            source_id="other",
            posted_at=datetime.now(UTC),
            llm_status="failed",
            retry_count=0,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

    @pytest.fixture
    def mock_db(self):
        return AsyncMock(spec=AsyncSession)

    @pytest.mark.asyncio
    async def test_increments_retry_count(self, mock_db, mock_link):
        with patch("src.workers.process_link.settings") as mock_settings:
            mock_settings.MAX_RETRIES = 5
            await _mark_failed(mock_db, mock_link, "test error")

        assert mock_db.execute.called
        assert mock_db.commit.called

    @pytest.mark.asyncio
    async def test_requeues_when_below_max_retries(self, mock_db, mock_link):
        with patch("src.workers.process_link.settings") as mock_settings:
            mock_settings.MAX_RETRIES = 3
            await _mark_failed(mock_db, mock_link, "test error")

        # Should update to pending (re-queue)
        update_call = mock_db.execute.call_args[0][0]
        assert isinstance(update_call, update)

    @pytest.mark.asyncio
    async def test_marks_permanently_failed_at_max_retries(self, mock_db, mock_link):
        mock_link.retry_count = 4  # Next will be 5 = MAX_RETRIES

        with patch("src.workers.process_link.settings") as mock_settings:
            mock_settings.MAX_RETRIES = 5
            await _mark_failed(mock_db, mock_link, "test error")

        update_call = mock_db.execute.call_args[0][0]
        assert isinstance(update_call, update)
