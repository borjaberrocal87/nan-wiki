from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import Link, User


class StatsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_stats(self, user_id: int) -> dict:
        total_links_result = await self.db.execute(select(func.count(Link.id)))
        total_links = total_links_result.scalar_one()

        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)
        week_start = today_start - timedelta(days=7)

        links_today = await self.db.execute(
            select(func.count(Link.id)).where(Link.posted_at >= today_start)
        )
        links_today = links_today.scalar_one()

        links_this_week = await self.db.execute(
            select(func.count(Link.id)).where(Link.posted_at >= week_start)
        )
        links_this_week = links_this_week.scalar_one()

        total_authors_result = await self.db.execute(select(func.count(User.id)))
        total_authors = total_authors_result.scalar_one()

        user_links_result = await self.db.execute(
            select(func.count(Link.id)).where(Link.author_id == user_id)
        )
        user_link_count = user_links_result.scalar_one()

        contribution_percent = round((user_link_count / total_links) * 100) if total_links > 0 else 0

        top_authors_query = (
            select(
                User.username,
                func.count(Link.id).label("link_count"),
            )
            .join(Link, User.id == Link.author_id)
            .group_by(User.id, User.username)
            .order_by(func.count(Link.id).desc())
            .limit(3)
        )
        top_authors_result = await self.db.execute(top_authors_query)
        top_authors_rows = top_authors_result.all()

        top_authors = [
            {"username": row[0], "linkCount": row[1]}
            for row in top_authors_rows
        ]

        return {
            "totalLinks": total_links,
            "linksToday": links_today,
            "linksThisWeek": links_this_week,
            "totalAuthors": total_authors,
            "userLinkCount": user_link_count,
            "contributionPercent": contribution_percent,
            "topAuthors": top_authors,
        }
