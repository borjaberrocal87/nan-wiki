from __future__ import annotations

from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import Channel, Link, Source, User


class LinkService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, filters: dict[str, Any]) -> tuple[list[Link], int]:
        query = (
            select(Link, User.username.label("author_username"), Source.name.label("source_name"))
            .outerjoin(User, Link.author_id == User.id)
            .join(Source, Link.source_id == Source.id)
        )
        total_query = select(Link.id)

        # Filters
        if filters.get("source_id"):
            query = query.where(Link.source_id == filters["source_id"])
            total_query = total_query.where(Link.source_id == filters["source_id"])

        if filters.get("tags"):
            tag_list = filters["tags"]
            if isinstance(tag_list, str):
                tag_list = [tag_list]
            if isinstance(tag_list, list) and len(tag_list) > 0:
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
            search = f"%{filters['search_query']}%"
            query = query.where(
                (Link.title.ilike(search))
                | (Link.description.ilike(search))
                | (Link.url.ilike(search))
            )
            total_query = total_query.where(
                (Link.title.ilike(search))
                | (Link.description.ilike(search))
                | (Link.url.ilike(search))
            )

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
        rows = result.all()
        links = []
        for row in rows:
            link = row[0]
            link.author_username = row[1]
            link.source_name = row[2]
            links.append(link)

        return list(links), total

    async def get_by_id(self, link_id: str) -> Link | None:
        result = await self.db.execute(select(Link).where(Link.id == link_id))
        return result.scalar_one_or_none()

    async def get_sources(self) -> list[Source]:
        result = await self.db.execute(select(Source))
        return list(result.scalars().all())

    async def get_authors(self) -> list[dict[str, Any]]:
        result = await self.db.execute(
            select(User.id, User.username, func.count(Link.id).label("link_count"))
            .join(Link, User.id == Link.author_id)
            .group_by(User.id)
            .order_by(func.count(Link.id).desc())
        )
        return [{"id": str(row[0]), "username": row[1], "linkCount": row[2]} for row in result.all()]

    async def get_channels(self) -> list[dict[str, Any]]:
        result = await self.db.execute(
            select(Channel.id, Channel.name, func.count(Link.id).label("link_count"))
            .join(Link, Channel.id == Link.channel_id)
            .group_by(Channel.id)
            .order_by(func.count(Link.id).desc())
        )
        return [{"id": str(row[0]), "name": row[1], "linkCount": row[2]} for row in result.all()]

    async def get_tags(self) -> list[dict[str, Any]]:
        result = await self.db.execute(
            select(
                func.unnest(Link.tags).label("tag"),
                func.count(Link.id).label("link_count")
            )
            .where(Link.tags != [])
            .group_by("tag")
            .order_by(func.count(Link.id).desc())
        )
        return [{"tag": row[0], "linkCount": row[1]} for row in result.all()]
