from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import async_session, init_db


@pytest.fixture
def mock_engine(mocker):
    return mocker.patch("src.database.engine")


class TestDatabaseInit:
    @patch("src.database.engine")
    def test_init_db_creates_tables(self, mock_engine, mocker):
        mock_conn = AsyncMock()
        mock_metadata = MagicMock()
        mocker.patch("src.database.Base.metadata", mock_metadata)

        mock_engine.begin.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_engine.begin.return_value.__aexit__ = AsyncMock(return_value=None)

        import asyncio

        asyncio.run(init_db())

        mock_conn.run_sync.assert_called_once()
        mock_metadata.create_all.assert_called_once()


class TestAsyncSession:
    def test_session_is_configured(self):
        assert async_session is not None
        assert issubclass(async_session, AsyncMock.__class__ or type)
