from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.dependencies import AuthUser, get_current_user_required, get_db
from src.schemas import LinkDetailResponse, LinkFilter, LinksListResponse, SourcesResponse
from src.services.links import get_link, get_sources, list_links

router = APIRouter(prefix="/api/links", tags=["links"])


@router.get("", response_model=LinksListResponse)
async def list_links_endpoint(
    user: Annotated[AuthUser, Depends(get_current_user_required)],
    source: str | None = Query(None),
    tags: str | None = Query(None, description="Comma-separated tag list"),
    domain: str | None = Query(None),
    channel_id: int | None = Query(None),
    author_id: int | None = Query(None),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    search_query: str | None = Query(None),
    sort: str = Query(default="posted_at"),
    order: str = Query(default="desc"),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    db: Annotated[AsyncSession, Depends(get_db)] = None,
) -> LinksListResponse:
    filter_obj = LinkFilter(
        source=source,
        tags=tags.split(",") if tags else None,
        domain=domain,
        channel_id=channel_id,
        author_id=author_id,
        date_from=date_from,
        date_to=date_to,
        search_query=search_query,
        sort=sort,
        order=order,
        page=page,
        per_page=per_page,
    )
    return await list_links(db, filter_obj)


@router.get("/sources", response_model=SourcesResponse)
async def list_sources(
    user: Annotated[AuthUser, Depends(get_current_user_required)],
    db: Annotated[AsyncSession, Depends(get_db)] = None,
) -> SourcesResponse:
    return await get_sources(db)


@router.get("/{link_id}", response_model=LinkDetailResponse)
async def get_link_endpoint(
    user: Annotated[AuthUser, Depends(get_current_user_required)],
    link_id: str,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
) -> LinkDetailResponse:
    result = await get_link(db, link_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Link not found")
    return result
