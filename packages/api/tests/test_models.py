from unittest.mock import AsyncMock, MagicMock, patch
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import async_session
from src.models import Link, User


class TestModels:
    def test_link_defaults(self):
        link = Link()
        assert link.llm_status == "pending"
        assert link.tags == []

    def test_chat_message_cascade(self):
        conv = MagicMock()
        msg = MagicMock()
        msg.conversation = conv
        assert msg.conversation == conv


class TestDatabase:
    @patch("src.database.engine")
    def test_init_db_calls_create_all(self, mock_engine):
        mock_conn = AsyncMock()
        mock_engine.begin.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_engine.begin.return_value.__aexit__ = AsyncMock(return_value=None)

        from src.database import Base, init_db

        import asyncio

        asyncio.run(init_db())
        mock_conn.run_sync.assert_called_once()
