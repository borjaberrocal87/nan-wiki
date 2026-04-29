from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from src.schemas import SearchResponse


class TestSearchService:
    @pytest.fixture
    def mock_db(self):
        return AsyncMock(spec=AsyncSession)

    @pytest.mark.asyncio
    async def test_keyword_search_returns_links(self, mock_db):
        from src.services.search import SearchService

        result_mock = AsyncMock()
        count_result_mock = AsyncMock()
        count_result_mock.scalar_one.return_value = 1

        data_result_mock = AsyncMock()
        data_result_mock.all.return_value = [
            (
                "550e8400-e29b-41d4-a716-446655440000",  # id
                "https://github.com/test/repo",          # url
                "github.com",                             # domain
                "github",                                 # source_id
                "testuser",                               # author_username
                "GitHub",                                 # source_name
                "general",                                # channel_name
                111222,                                   # discord_message_id
                "2024-01-01T00:00:00",                    # posted_at
                "done",                                   # llm_status
                "Test Repo",                              # title
                "A test repository",                      # description
                "github",                                 # source_detected
                "2024-01-01T00:00:00",                    # created_at
                "2024-01-01T00:00:00",                    # updated_at
                '[{"id": "tag-1", "name": "test"}]',      # tags json
            ),
        ]

        async def execute_side_effect(*args, **kwargs):
            if "COUNT" in str(args[0]):
                return count_result_mock
            return data_result_mock

        mock_db.execute = AsyncMock(side_effect=execute_side_effect)

        svc = SearchService(mock_db)
        links, total = await svc.keyword_search("test", page=1, per_page=20)

        assert len(links) == 1
        assert links[0]["title"] == "Test Repo"
        assert links[0]["url"] == "https://github.com/test/repo"
        assert total == 1

    @pytest.mark.asyncio
    async def test_keyword_search_empty_result(self, mock_db):
        from src.services.search import SearchService

        result_mock = AsyncMock()
        result_mock.scalar_one.return_value = 0
        mock_db.execute = AsyncMock(return_value=result_mock)

        svc = SearchService(mock_db)
        links, total = await svc.keyword_search("nonexistent", page=1, per_page=20)

        assert links == []
        assert total == 0

    @pytest.mark.asyncio
    async def test_hybrid_search_fallback_to_keyword(self, mock_db):
        from src.services.search import SearchService

        # Simulate pgvector failure
        result_mock = AsyncMock()
        result_mock.scalar_one.return_value = 0
        mock_db.execute = AsyncMock(return_value=result_mock)

        svc = SearchService(mock_db)
        links, total = await svc.hybrid_search("test", embedding=[0.1] * 1024, page=1, per_page=20)

        assert links == []
        assert total == 0

    @pytest.mark.asyncio
    async def test_hybrid_search_no_embedding_falls_back(self, mock_db):
        from src.services.search import SearchService

        result_mock = AsyncMock()
        result_mock.scalar_one.return_value = 0
        mock_db.execute = AsyncMock(return_value=result_mock)

        svc = SearchService(mock_db)
        links, total = await svc.hybrid_search("test", embedding=None, page=1, per_page=20)

        assert links == []
        assert total == 0

    @pytest.mark.asyncio
    async def test_empty_query_returns_empty(self, mock_db):
        from src.services.search import SearchService

        svc = SearchService(mock_db)
        links, total = await svc.keyword_search("", page=1, per_page=20)
        assert links == []
        assert total == 0

        links, total = await svc.hybrid_search("", page=1, per_page=20)
        assert links == []
        assert total == 0


class TestSearchEndpoint:
    @pytest.fixture
    def mock_db(self):
        return AsyncMock(spec=AsyncSession)

    @pytest.mark.asyncio
    async def test_search_endpoint_returns_search_response(self, mock_db):
        from fastapi.testclient import TestClient
        from unittest.mock import patch

        from src.main import app

        mock_result = AsyncMock()
        count_mock = AsyncMock()
        count_mock.scalar_one.return_value = 1
        data_mock = AsyncMock()
        data_mock.all.return_value = [
            (
                "550e8400-e29b-41d4-a716-446655440000",
                "https://github.com/test/repo",
                "github.com",
                "github",
                "testuser",
                "GitHub",
                "general",
                111222,
                "2024-01-01T00:00:00",
                "done",
                "Test Repo",
                "A test repository",
                "github",
                "2024-01-01T00:00:00",
                "2024-01-01T00:00:00",
                '[]',
            ),
        ]

        async def execute_side_effect(*args, **kwargs):
            if "COUNT" in str(args[0]):
                return count_mock
            return data_mock

        mock_db.execute = AsyncMock(side_effect=execute_side_effect)

        mock_user = MagicMock()
        mock_user.id = 12345

        with (
            patch("src.routers.links.get_db", return_value=mock_db),
            patch("src.routers.links.get_current_user_required", return_value=mock_user),
            patch("src.services.search.SearchService.hybrid_search", new_callable=AsyncMock) as mock_hybrid,
        ):
            mock_hybrid.return_value = (
                [
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "url": "https://github.com/test/repo",
                        "domain": "github.com",
                        "source_id": "github",
                        "source_name": "GitHub",
                        "author_id": None,
                        "author_username": "testuser",
                        "channel_id": None,
                        "channel_name": "general",
                        "discord_message_id": 111222,
                        "posted_at": "2024-01-01T00:00:00",
                        "llm_status": "done",
                        "title": "Test Repo",
                        "description": "A test repository",
                        "source_detected": "github",
                        "created_at": "2024-01-01T00:00:00",
                        "updated_at": "2024-01-01T00:00:00",
                        "tags": [],
                    }
                ],
                1,
            )

            client = TestClient(app)
            resp = client.get("/api/links/search?q=test&type=hybrid&embedding=0.1,0.2,0.3")

            assert resp.status_code == 200
            data = resp.json()
            assert isinstance(data, dict)
            assert "data" in data
            assert "total" in data
            assert "page" in data
            assert "per_page" in data
            assert data["total"] == 1
            assert len(data["data"]) == 1
            assert data["data"][0]["title"] == "Test Repo"
