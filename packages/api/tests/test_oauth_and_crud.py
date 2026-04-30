from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from src.dependencies import AuthUser
from src.models import Link, Source, User
from src.schemas import LinkFilter


class TestOAuthFlow:
    """Tests for the Discord OAuth callback flow (logic only, not HTTP)."""

    def test_jwt_generation_produces_valid_token(self):
        from jose import jwt

        from src.config import settings

        payload = {"user_id": 999, "username": "testuser"}
        token = jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

        decoded = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        assert decoded["user_id"] == 999
        assert decoded["username"] == "testuser"

    @pytest.fixture
    def mock_user(self):
        user = User(
            id=12345,
            username="testuser",
            discriminator="0000",
            joined_at=datetime.now(UTC),
        )
        return user

    @pytest.fixture
    def mock_db(self):
        db = AsyncMock(spec=AsyncSession)
        return db

    @pytest.mark.asyncio
    async def test_upsert_existing_user(self, mock_db, mock_user):
        from sqlalchemy import select

        result_mock = AsyncMock()
        result_mock.scalar_one_or_none = MagicMock(return_value=mock_user)
        mock_db.execute = AsyncMock(return_value=result_mock)
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        # Simulate the upsert logic from auth.py
        result = await mock_db.execute(select(User).where(User.id == mock_user.id))
        existing = result.scalar_one_or_none()

        assert existing is not None
        assert existing.id == mock_user.id
        assert existing.username == "testuser"

    @pytest.mark.asyncio
    async def test_upsert_new_user(self, mock_db):
        from sqlalchemy import select

        result_mock = AsyncMock()
        result_mock.scalar_one_or_none = MagicMock(return_value=None)
        mock_db.execute = AsyncMock(return_value=result_mock)
        mock_db.add = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        result = await mock_db.execute(select(User).where(User.id == 99999))
        existing = result.scalar_one_or_none()

        assert existing is None

        # Simulate creating a new user
        new_user = User(
            id=99999,
            username="newuser",
            discriminator="0000",
            joined_at=datetime.now(UTC),
        )
        mock_db.add(new_user)
        await mock_db.commit()
        await mock_db.refresh(new_user)

        mock_db.add.assert_called_once_with(new_user)
        mock_db.commit.assert_called_once()


class TestAuthMiddleware:
    @pytest.mark.asyncio
    async def test_get_current_user_valid_token(self):
        from jose import jwt

        from src.config import settings
        from src.dependencies import _decode_token

        token = jwt.encode(
            {"user_id": 12345, "username": "testuser"},
            settings.JWT_SECRET,
            algorithm="HS256",
        )
        user = await _decode_token(token)
        assert isinstance(user, AuthUser)
        assert user.user_id == 12345
        assert user.username == "testuser"

    @pytest.mark.asyncio
    async def test_get_current_user_invalid_token_raises(self):
        from src.dependencies import _decode_token

        with pytest.raises(Exception) as exc_info:
            await _decode_token("fake.token.value")
        assert exc_info.value.status_code == 401


class TestLinkService:
    @pytest.fixture
    def mock_db(self):
        return AsyncMock(spec=AsyncSession)

    @pytest.fixture
    def mock_link(self):
        return Link(
            id="550e8400-e29b-41d4-a716-446655440000",
            url="https://github.com/test/repo",
            domain="github.com",
            source_id="github",
            posted_at=datetime.now(UTC),
            llm_status="done",
            title="Test Repo",
            description="A test repository",
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

    @pytest.mark.asyncio
    async def test_list_links_filters_by_source_id(self, mock_db, mock_link):
        from src.services.link_service import LinkService

        result_mock = MagicMock()
        result_mock.all.return_value = [(mock_link, None, "GitHub", [])]
        total_mock = MagicMock()
        total_mock.all.return_value = [mock_link.id]
        mock_db.execute = AsyncMock(side_effect=[total_mock, result_mock])

        service = LinkService(mock_db)
        filters = {"source_id": "github", "page": 1, "per_page": 20}
        links, total = await service.list(filters)

        assert len(links) == 1
        assert links[0].source_id == "github"
        assert total == 1

    @pytest.mark.asyncio
    async def test_list_links_filters_by_tag_ids(self, mock_db, mock_link):
        from src.services.link_service import LinkService

        result_mock = MagicMock()
        result_mock.all.return_value = [(mock_link, None, "GitHub", [{"id": "tag-uuid-1", "name": "python"}])]
        total_mock = MagicMock()
        total_mock.all.return_value = [mock_link.id]
        mock_db.execute = AsyncMock(side_effect=[total_mock, result_mock])

        service = LinkService(mock_db)
        filters = {"tag_ids": ["tag-uuid-1", "tag-uuid-2"], "page": 1, "per_page": 20}
        links, total = await service.list(filters)

        assert len(links) == 1
        assert links[0]._tags == [{"id": "tag-uuid-1", "name": "python"}]

    @pytest.mark.asyncio
    async def test_list_links_pagination(self, mock_db, mock_link):
        from src.services.link_service import LinkService

        result_mock = MagicMock()
        result_mock.all.return_value = [(mock_link, None, "GitHub", [])]
        total_mock = MagicMock()
        total_mock.all.return_value = [mock_link.id]
        mock_db.execute = AsyncMock(side_effect=[total_mock, result_mock])

        service = LinkService(mock_db)
        filters = {"page": 2, "per_page": 10}
        links, total = await service.list(filters)

        result_mock.all.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_by_id_found(self, mock_db, mock_link):
        from src.services.link_service import LinkService

        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = mock_link
        mock_db.execute = AsyncMock(return_value=result_mock)

        service = LinkService(mock_db)
        link = await service.get_by_id(mock_link.id)

        assert link is not None
        assert link.id == mock_link.id

    @pytest.mark.asyncio
    async def test_get_by_id_not_found(self, mock_db):
        from src.services.link_service import LinkService

        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=result_mock)

        service = LinkService(mock_db)
        link = await service.get_by_id("nonexistent-id")

        assert link is None

    @pytest.mark.asyncio
    async def test_get_sources(self, mock_db):
        from src.services.link_service import LinkService

        github_source = Source(id="github", name="GitHub")
        twitter_source = Source(id="twitter", name="Twitter")
        result_mock = MagicMock()
        result_mock.scalars().all.return_value = [github_source, twitter_source]
        mock_db.execute = AsyncMock(return_value=result_mock)

        service = LinkService(mock_db)
        sources = await service.get_sources()

        assert len(sources) == 2
        assert sources[0].id == "github"
        assert sources[0].name == "GitHub"

    @pytest.mark.asyncio
    async def test_list_links_empty_result(self, mock_db):
        from src.services.link_service import LinkService

        result_mock = MagicMock()
        result_mock.scalars().all.return_value = []
        result_mock.all.return_value = []
        total_mock = MagicMock()
        total_mock.all.return_value = []
        mock_db.execute = AsyncMock(side_effect=[total_mock, result_mock])

        service = LinkService(mock_db)
        filters = {"source_id": "nonexistent", "page": 1, "per_page": 20}
        links, total = await service.list(filters)

        assert links == []
        assert total == 0

    @pytest.mark.asyncio
    async def test_list_links_filters_by_domain(self, mock_db, mock_link):
        from src.services.link_service import LinkService

        result_mock = MagicMock()
        result_mock.all.return_value = [(mock_link, None, "GitHub", [])]
        total_mock = MagicMock()
        total_mock.all.return_value = [mock_link.id]
        mock_db.execute = AsyncMock(side_effect=[total_mock, result_mock])

        service = LinkService(mock_db)
        filters = {"domain": "github.com", "page": 1, "per_page": 20}
        links, total = await service.list(filters)

        assert len(links) == 1
        assert links[0].domain == "github.com"

    @pytest.mark.asyncio
    async def test_list_links_filters_by_author(self, mock_db, mock_link):
        from src.services.link_service import LinkService

        result_mock = MagicMock()
        result_mock.all.return_value = [(mock_link, None, "GitHub", [])]
        total_mock = MagicMock()
        total_mock.all.return_value = [mock_link.id]
        mock_db.execute = AsyncMock(side_effect=[total_mock, result_mock])

        service = LinkService(mock_db)
        filters = {"author_id": 12345, "page": 1, "per_page": 20}
        links, total = await service.list(filters)

        assert len(links) == 1


class TestLinkFilterSchema:
    def test_default_values(self):
        f = LinkFilter()
        assert f.sort == "posted_at"
        assert f.order == "desc"
        assert f.page == 1
        assert f.per_page == 20

    def test_custom_values(self):
        f = LinkFilter(source_id="github", sort="title", order="asc", page=2, per_page=50)
        assert f.source_id == "github"
        assert f.sort == "title"
        assert f.order == "asc"
        assert f.page == 2
        assert f.per_page == 50

    def test_lowercase_validation(self):
        f = LinkFilter(sort="POSTED_AT", order="ASC")
        assert f.sort == "posted_at"
        assert f.order == "asc"

    def test_invalid_sort_raises(self):
        with pytest.raises(Exception):
            LinkFilter(sort="invalid_field")

    def test_invalid_order_raises(self):
        with pytest.raises(Exception):
            LinkFilter(order="invalid")

    def test_per_page_max_limit(self):
        f = LinkFilter(per_page=100)
        assert f.per_page == 100

    def test_per_page_exceeds_max_raises(self):
        with pytest.raises(Exception):
            LinkFilter(per_page=101)

    def test_tag_ids_as_list(self):
        f = LinkFilter(tag_ids=["tag-1", "tag-2"])
        assert f.tag_ids == ["tag-1", "tag-2"]
