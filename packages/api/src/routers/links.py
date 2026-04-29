from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.dependencies import AuthUser, get_current_user_required, get_db
from src.schemas import LinkDetailResponse, LinkFilter, LinkRead, LinksListResponse, SearchResponse, SourceRead, SourcesResponse
from src.services.links import get_authors, get_channels, get_link, get_sources, get_tags, list_links
from src.services.search import SearchService
from src.services.llm import generate_embedding

router = APIRouter(prefix="/api/links", tags=["links"])


@router.get("", response_model=LinksListResponse)
async def list_links_endpoint(
    user: Annotated[AuthUser, Depends(get_current_user_required)],
    source_id: str | None = Query(None),
    tag_ids: str | None = Query(None, description="Comma-separated tag ID list"),
    domain: str | None = Query(None),
    channel_id: int | None = Query(None),
    author_id: int | None = Query(None),
    llm_status: str | None = Query(None),
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
        source_id=source_id,
        tag_ids=tag_ids.split(",") if tag_ids else None,
        domain=domain,
        channel_id=channel_id,
        author_id=author_id,
        llm_status=llm_status,
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


@router.get("/authors", response_model=SourcesResponse)
async def list_authors(
    user: Annotated[AuthUser, Depends(get_current_user_required)],
    db: Annotated[AsyncSession, Depends(get_db)] = None,
) -> SourcesResponse:
    result = await get_authors(db)
    return SourcesResponse(data=[SourceRead(id=a["id"], name=a["username"]) for a in result["data"]])


@router.get("/channels", response_model=SourcesResponse)
async def list_channels(
    user: Annotated[AuthUser, Depends(get_current_user_required)],
    db: Annotated[AsyncSession, Depends(get_db)] = None,
) -> SourcesResponse:
    result = await get_channels(db)
    return SourcesResponse(data=[SourceRead(id=c["id"], name=c["name"]) for c in result["data"]])


@router.get("/tags", response_model=SourcesResponse)
async def list_tags(
    user: Annotated[AuthUser, Depends(get_current_user_required)],
    db: Annotated[AsyncSession, Depends(get_db)] = None,
) -> SourcesResponse:
    result = await get_tags(db)
    return result


@router.get("/search", response_model=SearchResponse)
async def search_links(
    user: Annotated[AuthUser, Depends(get_current_user_required)],
    q: str = Query(..., description="Search query"),
    type: str = Query(default="hybrid", pattern="^(hybrid|text)$"),
    embedding: str | None = Query(None, description="Comma-separated embedding values (required for hybrid)"),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    db: Annotated[AsyncSession, Depends(get_db)] = None,
) -> SearchResponse:
    search_svc = SearchService(db)

    if type == "hybrid":
        if not embedding:
            emb = await generate_embedding(q)
            if emb is None:
                raise HTTPException(status_code=500, detail="Failed to generate embedding")
            links, total = await search_svc.hybrid_search(q, embedding=emb, page=page, per_page=per_page)
        else:
            try:
                emb = [float(x) for x in embedding.split(",")]
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail="embedding must be comma-separated float values",
                )
            links, total = await search_svc.hybrid_search(q, embedding=emb, page=page, per_page=per_page)
    else:
        links, total = await search_svc.keyword_search(q, page=page, per_page=per_page)

    return SearchResponse(
        data=[LinkRead(**link) for link in links],
        total=total,
        page=page,
        per_page=per_page,
    )
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
