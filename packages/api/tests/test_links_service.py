from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import Link, Source, User
from src.schemas import LinkFilter, LinksListResponse, SourceRead, SourcesResponse
from src.services.links import link_to_dict, list_links, get_link, get_sources


class TestLinkToDict:
    def test_basic_fields(self):
        link = Link(
            id="550e8400-e29b-41d4-a716-446655440000",
            url="https://github.com/test/repo",
            domain="github.com",
            source_id="github",
            author_id=12345,
            channel_id=67890,
            discord_message_id=111222,
            discord_channel_name="general",
            posted_at=datetime.now(UTC),
            llm_status="done",
            title="Test Repo",
            description="A test repository",
            tags=["test", "python"],
            source_detected="github",
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        result = link_to_dict(link)

        assert result["id"] == "550e8400-e29b-41d4-a716-446655440000"
        assert result["url"] == "https://github.com/test/repo"
        assert result["domain"] == "github.com"
        assert result["source_id"] == "github"
        assert result["author_id"] == 12345
        assert result["channel_id"] == 67890
        assert result["discord_message_id"] == 111222
        assert result["channel_name"] == "general"
        assert result["posted_at"] == link.posted_at
        assert result["llm_status"] == "done"
        assert result["title"] == "Test Repo"
        assert result["description"] == "A test repository"
        assert result["tags"] == ["test", "python"]
        assert result["source_detected"] == "github"

    def test_missing_optional_fields(self):
        link = Link(
            id="550e8400-e29b-41d4-a716-446655440001",
            url="https://example.com",
            domain="example.com",
            source_id="other",
            posted_at=datetime.now(UTC),
            llm_status="pending",
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        result = link_to_dict(link)

        assert result["source_name"] is None
        assert result["author_username"] is None
        assert result["tags"] == []

    def test_source_name_from_join(self):
        link = Link(
            id="550e8400-e29b-41d4-a716-446655440002",
            url="https://github.com/test/repo",
            domain="github.com",
            source_id="github",
            posted_at=datetime.now(UTC),
            llm_status="done",
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        link.source_name = "GitHub"

        result = link_to_dict(link)
        assert result["source_name"] == "GitHub"

    def test_author_username_from_join(self):
        link = Link(
            id="550e8400-e29b-41d4-a716-446655440003",
            url="https://github.com/test/repo",
            domain="github.com",
            source_id="github",
            posted_at=datetime.now(UTC),
            llm_status="done",
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        link.author_username = "testuser"

        result = link_to_dict(link)
        assert result["author_username"] == "testuser"


class TestListLinks:
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
            source_name="GitHub",
            posted_at=datetime.now(UTC),
            llm_status="done",
            title="Test Repo",
            description="A test repository",
            tags=["test", "python"],
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

    @pytest.mark.asyncio
    async def test_list_links_returns_paginated_response(self, mock_db, mock_link):
        from src.services.link_service import LinkService

        result_mock = AsyncMock()
        result_mock.all.return_value = [(mock_link, None, "GitHub")]
        mock_db.execute = AsyncMock(return_value=result_mock)

        filters = LinkFilter(page=1, per_page=20)
        response = await list_links(mock_db, filters)

        assert isinstance(response, LinksListResponse)
        assert len(response.data) == 1
        assert response.data[0].source_id == "github"
        assert response.data[0].source_name == "GitHub"
        assert response.total == 1
        assert response.page == 1
        assert response.per_page == 20

    @pytest.mark.asyncio
    async def test_list_links_empty_result(self, mock_db):
        result_mock = AsyncMock()
        result_mock.all.return_value = []
        mock_db.execute = AsyncMock(return_value=result_mock)

        filters = LinkFilter(page=1, per_page=20)
        response = await list_links(mock_db, filters)

        assert response.data == []
        assert response.total == 0

    @pytest.mark.asyncio
    async def test_list_links_with_source_filter(self, mock_db, mock_link):
        result_mock = AsyncMock()
        result_mock.all.return_value = [(mock_link, None, "GitHub")]
        mock_db.execute = AsyncMock(return_value=result_mock)

        filters = LinkFilter(source_id="github", page=1, per_page=20)
        response = await list_links(mock_db, filters)

        assert len(response.data) == 1
        assert response.data[0].source_id == "github"


class TestGetLink:
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
            source_name="GitHub",
            posted_at=datetime.now(UTC),
            llm_status="done",
            title="Test Repo",
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

    @pytest.mark.asyncio
    async def test_get_link_returns_link_detail(self, mock_db, mock_link):
        from src.services.link_service import LinkService

        result_mock = AsyncMock()
        result_mock.scalar_one_or_none.return_value = mock_link
        mock_db.execute = AsyncMock(return_value=result_mock)

        response = await get_link(mock_db, str(mock_link.id))

        assert response is not None
        assert response.data.source_id == "github"
        assert response.data.source_name == "GitHub"
        assert response.data.title == "Test Repo"

    @pytest.mark.asyncio
    async def test_get_link_returns_none_when_not_found(self, mock_db):
        result_mock = AsyncMock()
        result_mock.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=result_mock)

        response = await get_link(mock_db, "nonexistent-id")

        assert response is None


class TestGetSources:
    @pytest.fixture
    def mock_db(self):
        return AsyncMock(spec=AsyncSession)

    @pytest.mark.asyncio
    async def test_get_sources_returns_all_sources(self, mock_db):
        from src.services.link_service import LinkService

        sources = [
            Source(id="github", name="GitHub"),
            Source(id="twitter", name="Twitter"),
            Source(id="youtube", name="YouTube"),
        ]
        result_mock = AsyncMock()
        result_mock.scalars().all.return_value = sources
        mock_db.execute = AsyncMock(return_value=result_mock)

        response = await get_sources(mock_db)

        assert isinstance(response, SourcesResponse)
        assert len(response.data) == 3
        assert response.data[0].id == "github"
        assert response.data[0].name == "GitHub"
        assert response.data[1].id == "twitter"
        assert response.data[2].id == "youtube"

    @pytest.mark.asyncio
    async def test_get_sources_empty(self, mock_db):
        result_mock = AsyncMock()
        result_mock.scalars().all.return_value = []
        mock_db.execute = AsyncMock(return_value=result_mock)

        response = await get_sources(mock_db)

        assert response.data == []
