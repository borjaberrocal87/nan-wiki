from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from src.schemas import LinkFilter, LinksListResponse, LinkDetailResponse, LinkRead, SourcesResponse, SourceRead


def link_to_dict(link) -> dict:
    tags = getattr(link, "_tags", [])
    return {
        "id": str(link.id),
        "url": link.url,
        "domain": link.domain,
        "source_id": link.source_id,
        "source_name": getattr(link, "source_name", None),
        "author_id": link.author_id,
        "author_username": getattr(link, "author_username", None),
        "channel_id": link.channel_id,
        "channel_name": link.discord_channel_name,
        "discord_message_id": link.discord_message_id,
        "posted_at": link.posted_at,
        "llm_status": link.llm_status,
        "title": link.title,
        "description": link.description,
        "tags": tags,
        "source_detected": link.source_detected,
        "created_at": link.created_at,
        "updated_at": link.updated_at,
    }


async def list_links(db: AsyncSession, filters: LinkFilter) -> LinksListResponse:
    link_service = _get_link_service(db)
    filters_dict = filters.model_dump(exclude_none=True)
    links, total = await link_service.list(filters_dict)

    return LinksListResponse(
        data=[LinkRead(**link_to_dict(link)) for link in links],
        total=total,
        page=filters.page,
        per_page=filters.per_page,
    )


async def get_link(db: AsyncSession, link_id: str) -> LinkDetailResponse | None:
    link_service = _get_link_service(db)
    link = await link_service.get_by_id(link_id)
    if link is None:
        return None
    return LinkDetailResponse(data=LinkRead(**link_to_dict(link)))


async def get_sources(db: AsyncSession) -> SourcesResponse:
    link_service = _get_link_service(db)
    sources = await link_service.get_sources()
    return SourcesResponse(data=[SourceRead(id=s.id, name=s.name) for s in sources])


async def get_authors(db: AsyncSession) -> dict:
    link_service = _get_link_service(db)
    authors = await link_service.get_authors()
    return {"data": authors}


async def get_channels(db: AsyncSession) -> dict:
    link_service = _get_link_service(db)
    channels = await link_service.get_channels()
    return {"data": channels}


async def get_tags(db: AsyncSession) -> dict:
    link_service = _get_link_service(db)
    tags = await link_service.get_tags()
    return {"data": [SourceRead(id=t["id"], name=t["tag"]) for t in tags]}


def _get_link_service(db: AsyncSession):
    from src.services.link_service import LinkService
    return LinkService(db)
