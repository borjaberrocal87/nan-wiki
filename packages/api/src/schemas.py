from __future__ import annotations

from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, Field, FieldValidationInfo, field_validator


# ── Link schemas ──────────────────────────────────────────────────────────────


class LinkRead(BaseModel):
    id: str
    url: str
    domain: str
    source: str
    raw_content: str | None = None
    author_id: int | None = None
    author_username: str | None = None
    channel_id: int | None = None
    channel_name: str | None = None
    discord_message_id: int | None = None
    posted_at: datetime
    llm_status: str
    title: str | None = None
    description: str | None = None
    tags: list[str] = []
    source_detected: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LinkFilter(BaseModel):
    source: str | None = None
    tags: list[str] | None = None
    domain: str | None = None
    channel_id: int | None = None
    author_id: int | None = None
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


class SourcesResponse(BaseModel):
    data: list[dict[str, str]]
