from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import Link, User
from src.services.stats_service import StatsService


class TestStatsService:
    @pytest.fixture
    def mock_db(self):
        return AsyncMock(spec=AsyncSession)

    @pytest.fixture
    def now_utc(self):
        return datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)

    @pytest.mark.asyncio
    async def test_returns_total_links(self, mock_db, now_utc):
        mock_db.execute = AsyncMock(
            return_value=MagicMock(scalar_one=MagicMock(return_value=42))
        )

        service = StatsService(mock_db)

        with patch("src.services.stats_service.datetime") as mock_dt:
            mock_dt.now.return_value = now_utc
            result = await service.get_stats(123)

        assert result["totalLinks"] == 42

    @pytest.mark.asyncio
    async def test_returns_links_today(self, mock_db, now_utc):
        mock_db.execute = AsyncMock(
            return_value=MagicMock(scalar_one=MagicMock(return_value=5))
        )

        service = StatsService(mock_db)

        with patch("src.services.stats_service.datetime") as mock_dt:
            mock_dt.now.return_value = now_utc
            result = await service.get_stats(123)

        assert result["linksToday"] == 5

    @pytest.mark.asyncio
    async def test_returns_links_this_week(self, mock_db, now_utc):
        mock_db.execute = AsyncMock(
            return_value=MagicMock(scalar_one=MagicMock(return_value=20))
        )

        service = StatsService(mock_db)

        with patch("src.services.stats_service.datetime") as mock_dt:
            mock_dt.now.return_value = now_utc
            result = await service.get_stats(123)

        assert result["linksThisWeek"] == 20

    @pytest.mark.asyncio
    async def test_returns_total_authors(self, mock_db, now_utc):
        mock_db.execute = AsyncMock(
            return_value=MagicMock(scalar_one=MagicMock(return_value=15))
        )

        service = StatsService(mock_db)

        with patch("src.services.stats_service.datetime") as mock_dt:
            mock_dt.now.return_value = now_utc
            result = await service.get_stats(123)

        assert result["totalAuthors"] == 15

    @pytest.mark.asyncio
    async def test_returns_user_link_count(self, mock_db, now_utc):
        mock_db.execute = AsyncMock(
            return_value=MagicMock(scalar_one=MagicMock(return_value=7))
        )

        service = StatsService(mock_db)

        with patch("src.services.stats_service.datetime") as mock_dt:
            mock_dt.now.return_value = now_utc
            result = await service.get_stats(999)

        assert result["userLinkCount"] == 7

    @pytest.mark.asyncio
    async def test_contribution_percent_calculated_correctly(self, mock_db, now_utc):
        # get_stats calls scalar_one in order: total_links, links_today, links_week, total_authors, user_links, total_query
        # We need scalar_one to return different values for each call
        side_effects = [100, 5, 20, 15, 10, 100]
        call_index = [0]

        def scalar_one_side_effect():
            val = side_effects[call_index[0]]
            call_index[0] += 1
            return val

        mock_result = MagicMock()
        mock_result.scalar_one.side_effect = scalar_one_side_effect
        mock_db.execute = AsyncMock(return_value=mock_result)

        service = StatsService(mock_db)

        with patch("src.services.stats_service.datetime") as mock_dt:
            mock_dt.now.return_value = now_utc
            result = await service.get_stats(999)

        assert result["contributionPercent"] == 10

    @pytest.mark.asyncio
    async def test_contribution_percent_zero_when_no_links(self, mock_db, now_utc):
        side_effects = [0, 0, 0, 0, 0, 0]
        call_index = [0]

        def scalar_one_side_effect():
            val = side_effects[call_index[0]]
            call_index[0] += 1
            return val

        mock_result = MagicMock()
        mock_result.scalar_one.side_effect = scalar_one_side_effect
        mock_result.all.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)

        service = StatsService(mock_db)

        with patch("src.services.stats_service.datetime") as mock_dt:
            mock_dt.now.return_value = now_utc
            result = await service.get_stats(1)

        assert result["contributionPercent"] == 0

    @pytest.mark.asyncio
    async def test_top_authors_returned(self, mock_db, now_utc):
        mock_row = MagicMock()
        mock_row.__iter__ = lambda self: iter(["alice", 42])
        mock_row.__getitem__ = lambda self, i: ["alice", 42][i]

        mock_result = MagicMock()
        mock_result.all.return_value = [mock_row]
        mock_result.scalar_one.return_value = 10
        mock_db.execute = AsyncMock(return_value=mock_result)

        service = StatsService(mock_db)

        with patch("src.services.stats_service.datetime") as mock_dt:
            mock_dt.now.return_value = now_utc
            result = await service.get_stats(1)

        assert len(result["topAuthors"]) == 1
        assert result["topAuthors"][0]["username"] == "alice"
        assert result["topAuthors"][0]["linkCount"] == 42

    @pytest.mark.asyncio
    async def test_top_authors_empty(self, mock_db, now_utc):
        mock_result = MagicMock()
        mock_result.all.return_value = []
        mock_result.scalar_one.return_value = 0
        mock_db.execute = AsyncMock(return_value=mock_result)

        service = StatsService(mock_db)

        with patch("src.services.stats_service.datetime") as mock_dt:
            mock_dt.now.return_value = now_utc
            result = await service.get_stats(1)

        assert result["topAuthors"] == []

    @pytest.mark.asyncio
    async def test_top_authors_limited_to_3(self, mock_db, now_utc):
        mock_rows = []
        for i in range(3):
            row = MagicMock()
            row.__iter__ = lambda self, idx=i: iter([f"user{idx}", i * 10])
            row.__getitem__ = lambda self, idx=i, i=i: [f"user{idx}", i * 10][idx]
            mock_rows.append(row)

        mock_result = MagicMock()
        mock_result.all.return_value = mock_rows
        mock_result.scalar_one.return_value = 50
        mock_db.execute = AsyncMock(return_value=mock_result)

        service = StatsService(mock_db)

        with patch("src.services.stats_service.datetime") as mock_dt:
            mock_dt.now.return_value = now_utc
            result = await service.get_stats(1)

        assert len(result["topAuthors"]) == 3

    @pytest.mark.asyncio
    async def test_all_expected_keys_present(self, mock_db, now_utc):
        mock_db.execute = AsyncMock(
            return_value=MagicMock(
                scalar_one=MagicMock(return_value=10),
                all=MagicMock(return_value=[]),
            )
        )

        service = StatsService(mock_db)

        with patch("src.services.stats_service.datetime") as mock_dt:
            mock_dt.now.return_value = now_utc
            result = await service.get_stats(1)

        expected_keys = {
            "totalLinks",
            "linksToday",
            "linksThisWeek",
            "totalAuthors",
            "userLinkCount",
            "contributionPercent",
            "topAuthors",
        }
        assert set(result.keys()) == expected_keys

    @pytest.mark.asyncio
    async def test_queries_use_correct_date_filters(self, mock_db, now_utc):
        mock_db.execute = AsyncMock(
            return_value=MagicMock(scalar_one=MagicMock(return_value=0), all=MagicMock(return_value=[]))
        )

        service = StatsService(mock_db)

        with patch("src.services.stats_service.datetime") as mock_dt:
            mock_dt.now.return_value = now_utc
            await service.get_stats(1)

        execute_calls = mock_db.execute.call_args_list
        # Should have 6 execute calls: total_links, links_today, links_week, total_authors, user_links, top_authors
        assert len(execute_calls) == 6

    @pytest.mark.asyncio
    async def test_user_id_passed_to_query(self, mock_db, now_utc):
        mock_db.execute = AsyncMock(
            return_value=MagicMock(scalar_one=MagicMock(return_value=0), all=MagicMock(return_value=[]))
        )

        service = StatsService(mock_db)

        with patch("src.services.stats_service.datetime") as mock_dt:
            mock_dt.now.return_value = now_utc
            await service.get_stats(42)

        # get_stats should have executed 6 queries: total_links, links_today, links_week, total_authors, user_links, top_authors
        assert mock_db.execute.call_count == 6

    @pytest.mark.asyncio
    async def test_week_start_is_7_days_ago(self, mock_db, now_utc):
        mock_db.execute = AsyncMock(
            return_value=MagicMock(scalar_one=MagicMock(return_value=0), all=MagicMock(return_value=[]))
        )

        service = StatsService(mock_db)

        with patch("src.services.stats_service.datetime") as mock_dt:
            mock_dt.now.return_value = now_utc
            await service.get_stats(1)

    @pytest.mark.asyncio
    async def test_contribution_percent_rounded(self, mock_db, now_utc):
        side_effects = [3, 1, 2, 1, 1, 3]
        call_index = [0]

        def scalar_one_side_effect():
            val = side_effects[call_index[0]]
            call_index[0] += 1
            return val

        mock_result = MagicMock()
        mock_result.scalar_one.side_effect = scalar_one_side_effect
        mock_result.all.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)

        service = StatsService(mock_db)

        with patch("src.services.stats_service.datetime") as mock_dt:
            mock_dt.now.return_value = now_utc
            result = await service.get_stats(1)

        # (1/3) * 100 = 33.33... -> round -> 33
        assert result["contributionPercent"] == 33
