from __future__ import annotations

from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import Channel, Link, LinkTag, Source, Tag, User


class LinkService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self, filters: dict[str, Any]) -> tuple[list[Link], int]:
        # Subquery to get tag objects (id + name) per link
        tag_agg_subq = (
            select(
                LinkTag.link_id,
                func.json_agg(
                    func.json_build_object('id', Tag.id, 'name', Tag.name)
                ).label("tags")
            )
            .join(Tag, Tag.id == LinkTag.tag_id)
            .group_by(LinkTag.link_id)
            .subquery()
        )

        query = (
            select(
                Link,
                User.username.label("author_username"),
                Source.name.label("source_name"),
                tag_agg_subq.c.tags.label("tags"),
            )
            .outerjoin(User, Link.author_id == User.id)
            .join(Source, Link.source_id == Source.id)
            .outerjoin(tag_agg_subq, Link.id == tag_agg_subq.c.link_id)
        )
        total_query = select(Link.id)

        # Filters
        # Always filter to only return processed links
        query = query.where(Link.llm_status == "done")
        total_query = total_query.where(Link.llm_status == "done")

        if filters.get("source_id"):
            query = query.where(Link.source_id == filters["source_id"])
            total_query = total_query.where(Link.source_id == filters["source_id"])

        if filters.get("tag_ids"):
            tag_ids = filters["tag_ids"]
            if isinstance(tag_ids, str):
                tag_ids = [tag_ids]
            if isinstance(tag_ids, list) and len(tag_ids) > 0:
                link_ids_with_tags = (
                    select(LinkTag.link_id)
                    .where(LinkTag.tag_id.in_(tag_ids))
                    .subquery()
                )
                query = query.where(Link.id.in_(link_ids_with_tags))
                total_query = total_query.where(Link.id.in_(link_ids_with_tags))

        if filters.get("domain"):
            query = query.where(Link.domain == filters["domain"])
            total_query = total_query.where(Link.domain == filters["domain"])

        if filters.get("channel_id"):
            query = query.where(Link.channel_id == filters["channel_id"])
            total_query = total_query.where(Link.channel_id == filters["channel_id"])

        if filters.get("author_id"):
            query = query.where(Link.author_id == filters["author_id"])
            total_query = total_query.where(Link.author_id == filters["author_id"])

        if filters.get("llm_status"):
            query = query.where(Link.llm_status == filters["llm_status"])
            total_query = total_query.where(Link.llm_status == filters["llm_status"])

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
            link._tags = row[3] or []
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
                Tag.id.label("tag_id"),
                Tag.name.label("tag_name"),
                func.count(LinkTag.link_id).label("link_count")
            )
            .join(LinkTag, Tag.id == LinkTag.tag_id)
            .group_by(Tag.id, Tag.name)
            .order_by(func.count(LinkTag.link_id).desc())
        )
        return [{"id": str(row[0]), "tag": row[1], "linkCount": row[2]} for row in result.all()]
