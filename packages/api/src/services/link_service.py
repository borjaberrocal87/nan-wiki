from __future__ import annotations

from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import Link


class LinkService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, filters: dict[str, Any]) -> tuple[list[Link], int]:
        query = select(Link)
        total_query = select(Link.id)

        # Filters
        if filters.get("source"):
            query = query.where(Link.source == filters["source"])
            total_query = total_query.where(Link.source == filters["source"])

        if filters.get("tags"):
            tag_list = filters["tags"]
            query = query.where(Link.tags.overlap(tag_list))
            total_query = total_query.where(Link.tags.overlap(tag_list))

        if filters.get("domain"):
            query = query.where(Link.domain == filters["domain"])
            total_query = total_query.where(Link.domain == filters["domain"])

        if filters.get("channel_id"):
            query = query.where(Link.channel_id == filters["channel_id"])
            total_query = total_query.where(Link.channel_id == filters["channel_id"])

        if filters.get("author_id"):
            query = query.where(Link.author_id == filters["author_id"])
            total_query = total_query.where(Link.author_id == filters["author_id"])

        if filters.get("date_from"):
            query = query.where(Link.posted_at >= filters["date_from"])
            total_query = total_query.where(Link.posted_at >= filters["date_from"])

        if filters.get("date_to"):
            query = query.where(Link.posted_at <= filters["date_to"])
            total_query = total_query.where(Link.posted_at <= filters["date_to"])

        if filters.get("search_query"):
            search = filters["search_query"]
            search_vector = func.to_tsvector(
                "english",
                func.coalesce(Link.title, "")
                + " ' ' "
                + func.coalesce(Link.description, "")
                + " ' ' "
                + Link.url,
            )
            search_query = func.to_tsquery("english", search)

            query = query.where(search_vector.op("@@")(search_query))
            total_query = total_query.where(search_vector.op("@@")(search_query))

        # Sorting
        sort_field = filters.get("sort", "posted_at")
        order_desc = filters.get("order", "desc").lower() == "desc"

        column_map = {
            "posted_at": Link.posted_at,
            "title": Link.title,
        }
        sort_col = column_map.get(sort_field, Link.posted_at)
        if order_desc:
            query = query.order_by(sort_col.desc())
        else:
            query = query.order_by(sort_col.asc())

        # Pagination
        page = filters.get("page", 1)
        per_page = filters.get("per_page", 20)
        offset = (page - 1) * per_page
        query = query.offset(offset).limit(per_page)

        # Count
        total_result = await self.db.execute(total_query)
        total = len(total_result.all())

        # Fetch
        result = await self.db.execute(query)
        links = result.scalars().all()

        return list(links), total

    async def get_by_id(self, link_id: str) -> Link | None:
        result = await self.db.execute(select(Link).where(Link.id == link_id))
        return result.scalar_one_or_none()

    async def get_sources(self) -> list[str]:
        result = await self.db.execute(select(Link.source).distinct())
        return [row[0] for row in result.all()]
