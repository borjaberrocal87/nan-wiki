from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.database import async_session, init_db


@pytest.fixture
def mock_engine(mocker):
    return mocker.patch("src.database.engine")


class TestDatabaseInit:
    def test_init_db_creates_tables(self, mocker):
        mock_metadata = MagicMock()
        mock_conn = MagicMock()
        called_with_fn = []

        async def async_run_sync(fn):
            called_with_fn.append(fn)
            fn(mock_metadata)

        mock_conn.run_sync = async_run_sync

        mock_engine = MagicMock()
        mock_engine.begin.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_engine.begin.return_value.__aexit__ = AsyncMock(return_value=None)

        mocker.patch("src.database.engine", mock_engine)
        mocker.patch("src.database.Base.metadata", mock_metadata)

        from src.database import init_db
        import asyncio

        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(init_db())
        finally:
            loop.close()

        assert len(called_with_fn) == 1
        # run_sync receives Base.metadata.create_all as the callable
        assert called_with_fn[0] == mock_metadata.create_all
        mock_metadata.create_all.assert_called_once()


class TestAsyncSession:
    def test_session_is_configured(self):
        assert async_session is not None
        assert callable(async_session)
