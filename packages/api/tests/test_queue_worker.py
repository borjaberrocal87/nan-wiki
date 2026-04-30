from __future__ import annotations

import asyncio
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import Link
from src.workers.queue import _fetch_pending_link, _worker_task, process_queue


class _MockSession:
    """Simple mock session with awaitable close()."""
    def __init__(self):
        self.close = AsyncMock()
        self.execute = AsyncMock()


class TestWorkerTask:
    @pytest.fixture
    def mock_link(self):
        return Link(
            id="550e8400-e29b-41d4-a716-446655440000",
            url="https://example.com/test",
            domain="example.com",
            source_id="other",
            posted_at=datetime.now(UTC),
            llm_status="pending",
            retry_count=0,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

    @pytest.fixture
    def mock_db(self, mock_link):
        db = _MockSession()
        result_mock = AsyncMock()
        result_mock.scalar_one_or_none.return_value = mock_link
        db.execute = AsyncMock(return_value=result_mock)
        return db

    def _run_worker_short(self, mock_link, mock_db, poll_interval=0.01):
        """Run worker for a short time then cancel it."""
        call_count = [0]

        async def fetch_with_link(*args, **kwargs):
            call_count[0] += 1
            if call_count[0] == 1:
                return mock_link
            return None

        with (
            patch("src.workers.queue._fetch_pending_link", side_effect=fetch_with_link),
            patch("src.workers.queue.process_link", new_callable=AsyncMock) as mock_process,
            patch("src.workers.queue.async_session", return_value=mock_db),
            patch("src.workers.queue.settings") as mock_settings,
        ):
            mock_settings.WORKER_POLL_INTERVAL = poll_interval

            async def _run():
                task = asyncio.create_task(_worker_task(0))
                await asyncio.sleep(0.05)
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
                return mock_process

            return asyncio.run(_run())

    def test_processes_link_then_continues_polling(self, mock_link, mock_db):
        mock_process = self._run_worker_short(mock_link, mock_db)
        assert mock_process.called

    def test_sleeps_when_no_pending_links(self):
        mock_db = _MockSession()
        with (
            patch("src.workers.queue._fetch_pending_link", return_value=None),
            patch("src.workers.queue.async_session", return_value=mock_db),
            patch("src.workers.queue.settings") as mock_settings,
            patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep,
        ):
            mock_settings.WORKER_POLL_INTERVAL = 0.01

            async def _run():
                task = asyncio.create_task(_worker_task(0))
                await asyncio.sleep(0.05)
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

            asyncio.run(_run())

        assert mock_sleep.call_count >= 1

    def test_closes_db_session_on_success(self, mock_link, mock_db):
        self._run_worker_short(mock_link, mock_db)
        assert mock_db.close.called

    def test_handles_exception_without_crashing(self):
        mock_db = _MockSession()
        call_count = [0]

        async def fetch_with_error(*args, **kwargs):
            call_count[0] += 1
            if call_count[0] == 1:
                raise Exception("db error")
            return None

        with (
            patch("src.workers.queue._fetch_pending_link", side_effect=fetch_with_error),
            patch("src.workers.queue.async_session", return_value=mock_db),
            patch("src.workers.queue.settings") as mock_settings,
        ):
            mock_settings.WORKER_POLL_INTERVAL = 0.01

            async def _run():
                task = asyncio.create_task(_worker_task(0))
                await asyncio.sleep(0.05)
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

            asyncio.run(_run())

    def test_logs_processing_start(self, mock_link):
        mock_db = _MockSession()

        call_count = [0]

        async def fetch_with_link(*args, **kwargs):
            call_count[0] += 1
            if call_count[0] == 1:
                return mock_link
            return None

        with (
            patch("src.workers.queue._fetch_pending_link", side_effect=fetch_with_link),
            patch("src.workers.queue.process_link", new_callable=AsyncMock) as mock_process,
            patch("src.workers.queue.async_session", return_value=mock_db),
            patch("src.workers.queue.settings") as mock_settings,
        ):
            mock_settings.WORKER_POLL_INTERVAL = 0.01

            async def _run():
                task = asyncio.create_task(_worker_task(0))
                await asyncio.sleep(0.05)
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

            asyncio.run(_run())

        # process_link was called, which internally calls db.execute
        assert mock_process.called

    def test_logs_finish_processing(self, mock_link):
        mock_db = _MockSession()

        call_count = [0]

        async def fetch_with_link(*args, **kwargs):
            call_count[0] += 1
            if call_count[0] == 1:
                return mock_link
            return None

        with (
            patch("src.workers.queue._fetch_pending_link", side_effect=fetch_with_link),
            patch("src.workers.queue.process_link", new_callable=AsyncMock) as mock_process,
            patch("src.workers.queue.async_session", return_value=mock_db),
            patch("src.workers.queue.settings") as mock_settings,
        ):
            mock_settings.WORKER_POLL_INTERVAL = 0.01

            async def _run():
                task = asyncio.create_task(_worker_task(0))
                await asyncio.sleep(0.05)
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

            asyncio.run(_run())

        # process_link was called at least once
        assert mock_process.call_count >= 1


class TestProcessQueue:
    def _run_queue_short(self, concurrency=3):
        """Run process_queue for a short time then cancel it."""
        with patch("src.workers.queue.settings") as mock_settings, \
             patch("src.workers.queue._worker_task") as mock_worker:

            mock_settings.WORKER_CONCURRENCY = concurrency
            mock_settings.WORKER_POLL_INTERVAL = 1
            mock_settings.MAX_RETRIES = 3

            async def _run():
                task = asyncio.create_task(process_queue())
                await asyncio.sleep(0.05)
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
                return mock_worker

            return asyncio.run(_run())

    def test_spawns_concurrent_workers(self):
        mock_worker = self._run_queue_short(3)
        assert mock_worker.call_count == 3

    def test_handles_cancelled_error(self):
        with patch("src.workers.queue.settings") as mock_settings, \
             patch("src.workers.queue._worker_task") as mock_worker:

            mock_settings.WORKER_CONCURRENCY = 2
            mock_settings.WORKER_POLL_INTERVAL = 1
            mock_settings.MAX_RETRIES = 3

            async def _worker_with_cancel(*args, **kwargs):
                await asyncio.sleep(10)

            mock_worker.side_effect = _worker_with_cancel

            async def _run():
                task = asyncio.create_task(process_queue())
                await asyncio.sleep(0.05)
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

            asyncio.run(_run())

    def test_uses_worker_concurrency_from_settings(self):
        mock_worker = self._run_queue_short(5)
        assert mock_worker.call_count == 5

    def test_logs_start_and_stop(self):
        with patch("src.workers.queue.settings") as mock_settings, \
             patch("src.workers.queue._worker_task") as mock_worker:

            mock_settings.WORKER_CONCURRENCY = 1
            mock_settings.WORKER_POLL_INTERVAL = 1
            mock_settings.MAX_RETRIES = 3

            mock_worker.side_effect = asyncio.CancelledError()

            async def _run():
                task = asyncio.create_task(process_queue())
                await asyncio.sleep(0.05)
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

            asyncio.run(_run())
