from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

from src.models import Link, LinkTag, Source, Tag, User


class TestModels:
    def test_link_defaults(self):
        link = Link()
        assert link.llm_status is None

    def test_chat_message_cascade(self):
        conv = MagicMock()
        msg = MagicMock()
        msg.conversation = conv
        assert msg.conversation == conv

    def test_user_defaults(self):
        user = User()
        assert user.is_admin is None

    def test_source_model(self):
        source = Source(id="github", name="GitHub")
        assert source.id == "github"
        assert source.name == "GitHub"

    def test_link_with_all_fields(self):
        link = Link(
            id="550e8400-e29b-41d4-a716-446655440000",
            url="https://github.com/test/repo",
            domain="github.com",
            source_id="github",
            posted_at=datetime.now(UTC),
            title="Test Repo",
            description="A test repository",
        )
        assert link.llm_status is None
        assert link.title == "Test Repo"
        assert link.source_id == "github"

    def test_tag_model(self):
        tag = Tag(name="python")
        assert tag.name == "python"

    def test_link_tag_model(self):
        link_tag = LinkTag()
        assert link_tag.link_id is None
        assert link_tag.tag_id is None


class TestDatabase:
    @patch("src.database.engine")
    def test_init_db_calls_create_all(self, mock_engine):
        mock_conn = AsyncMock()
        mock_engine.begin.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_engine.begin.return_value.__aexit__ = AsyncMock(return_value=None)

        import asyncio

        from src.database import init_db

        asyncio.run(init_db())
        mock_conn.run_sync.assert_called_once()
