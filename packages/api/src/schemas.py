from __future__ import annotations

from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, Field, FieldValidationInfo, field_validator


# ── Tag schemas ───────────────────────────────────────────────────────────────


class TagRead(BaseModel):
    id: str
    name: str

    model_config = {"from_attributes": True}


# ── Source schemas ────────────────────────────────────────────────────────────


class SourceRead(BaseModel):
    id: str
    name: str

    model_config = {"from_attributes": True}


class SourcesResponse(BaseModel):
    data: list[SourceRead]


# ── Link schemas ──────────────────────────────────────────────────────────────


class LinkRead(BaseModel):
    id: str
    url: str
    domain: str
    source_id: str
    source_name: str | None = None
    author_id: int | None = None
    author_username: str | None = None
    channel_id: int | None = None
    channel_name: str | None = None
    discord_message_id: int | None = None
    posted_at: datetime
    llm_status: str
    title: str | None = None
    description: str | None = None
    tags: list[TagRead] = []
    source_detected: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LinkFilter(BaseModel):
    source_id: str | None = None
    tag_ids: list[str] | None = None
    domain: str | None = None
    channel_id: int | None = None
    author_id: int | None = None
    llm_status: str | None = None
    date_from: datetime | None = None
    date_to: datetime | None = None
    search_query: str | None = None
    sort: str = Field(default="posted_at", pattern="^(posted_at|title)$")
    order: str = Field(default="desc", pattern="^(asc|desc)$")
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)

    @field_validator("sort", "order", mode="before")
    @classmethod
    def lowercase(cls, v: str | None) -> str:
        if v:
            return v.lower()
        return v


class PaginatedResponse(BaseModel):
    data: list[LinkRead]
    total: int
    page: int
    per_page: int

    @field_validator("data", mode="before")
    @classmethod
    def coerce_data(cls, v, info: FieldValidationInfo):
        return v


class LinksListResponse(BaseModel):
    data: list[LinkRead]
    total: int
    page: int
    per_page: int


class LinkDetailResponse(BaseModel):
    data: LinkRead


class TopAuthor(BaseModel):
    username: str
    linkCount: int


class StatsResponse(BaseModel):
    totalLinks: int
    linksToday: int
    linksThisWeek: int
    totalAuthors: int
    userLinkCount: int
    contributionPercent: int
    topAuthors: list[TopAuthor]


class SourceSeed(BaseModel):
    id: str
    name: str


class SearchResponse(BaseModel):
    data: list[LinkRead]
    total: int
    page: int
    per_page: int
