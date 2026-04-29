from __future__ import annotations

from typing import Any

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import Link, LinkTag, Source, Tag


class SearchService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def hybrid_search(
        self,
        query: str,
        embedding: list[float] | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[list[dict[str, Any]], int]:
        """
        Hybrid search combining keyword (60%) + vector (40%) scores.
        Falls back to keyword-only if pgvector is not available.
        """
        normalized_query = query.strip()
        if not normalized_query:
            return [], 0

        try:
            return await self._hybrid_search_with_vector(
                normalized_query, embedding, page, per_page
            )
        except Exception:
            return await self._keyword_search(normalized_query, page, per_page)

    async def keyword_search(
        self,
        query: str,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[list[dict[str, Any]], int]:
        """Pure keyword search using PostgreSQL full-text search."""
        normalized_query = query.strip()
        if not normalized_query:
            return [], 0
        return await self._keyword_search(normalized_query, page, per_page)

    async def _keyword_search(
        self,
        query: str,
        page: int,
        per_page: int,
    ) -> tuple[list[dict[str, Any]], int]:
        """Execute keyword search using pg_trgm similarity."""
        offset = (page - 1) * per_page

        # Count query
        count_sql = text("""
            SELECT COUNT(*)
            FROM links
            WHERE similarity(COALESCE(title, '') || ' ' || COALESCE(description, ''), :query) > 0.05
               OR (title || ' ' || COALESCE(description, '')) ILIKE '%' || :query || '%'
        """)
        count_result = await self.db.execute(count_sql, {"query": query})
        total = count_result.scalar_one()

        # Data query
        data_sql = text("""
            SELECT
                l.id,
                l.url,
                l.domain,
                l.source_id,
                u.username AS author_username,
                s.name AS source_name,
                l.discord_channel_name AS channel_name,
                l.discord_message_id,
                l.posted_at,
                l.llm_status,
                l.title,
                l.description,
                l.source_detected,
                l.created_at,
                l.updated_at,
                COALESCE(tags.tags, '[]') AS tags
            FROM links l
            JOIN sources s ON l.source_id = s.id
            LEFT JOIN users u ON l.author_id = u.id
            LEFT JOIN (
                SELECT lt.link_id,
                       json_agg(json_build_object('id', t.id, 'name', t.name)) AS tags
                FROM link_tags lt
                JOIN tags t ON t.id = lt.tag_id
                GROUP BY lt.link_id
            ) tags ON l.id = tags.link_id
            WHERE similarity(COALESCE(l.title, '') || ' ' || COALESCE(l.description, ''), :query) > 0.05
               OR (l.title || ' ' || COALESCE(l.description, '')) ILIKE '%' || :query || '%'
            ORDER BY similarity(COALESCE(l.title, '') || ' ' || COALESCE(l.description, ''), :query) DESC
            LIMIT :per_page OFFSET :offset
        """)

        result = await self.db.execute(data_sql, {"query": query, "per_page": per_page, "offset": offset})
        rows = result.all()

        links = []
        for row in rows:
            links.append({
                "id": str(row[0]),
                "url": row[1],
                "domain": row[2],
                "source_id": row[3],
                "source_name": row[5],
                "author_id": None,
                "author_username": row[4],
                "channel_id": None,
                "channel_name": row[6],
                "discord_message_id": row[7],
                "posted_at": row[8],
                "llm_status": row[9],
                "title": row[10],
                "description": row[11],
                "source_detected": row[12],
                "created_at": row[13],
                "updated_at": row[14],
                "tags": row[15] if isinstance(row[15], list) else [],
            })

        return links, total

    async def _hybrid_search_with_vector(
        self,
        query: str,
        embedding: list[float] | None,
        page: int,
        per_page: int,
    ) -> tuple[list[dict[str, Any]], int]:
        """Execute hybrid search using both pg_trgm similarity and vector similarity."""
        offset = (page - 1) * per_page

        if embedding is None:
            # No embedding provided, fall back to keyword search
            return await self._keyword_search(query, page, per_page)

        # Count query
        count_sql = text("""
            SELECT COUNT(*)
            FROM links
            WHERE similarity(COALESCE(title, '') || ' ' || COALESCE(description, ''), :query) > 0.05
               OR (title || ' ' || COALESCE(description, '')) ILIKE '%' || :query || '%'
        """)
        count_result = await self.db.execute(count_sql, {"query": query})
        total = count_result.scalar_one()

        if total == 0:
            # Fallback: try vector-only search if keyword finds nothing
            return await self._vector_only_search(query, embedding, page, per_page)

        # Data query with hybrid scoring
        data_sql = text("""
            SELECT
                l.id,
                l.url,
                l.domain,
                l.source_id,
                u.username AS author_username,
                s.name AS source_name,
                l.discord_channel_name AS channel_name,
                l.discord_message_id,
                l.posted_at,
                l.llm_status,
                l.title,
                l.description,
                l.source_detected,
                l.created_at,
                l.updated_at,
                COALESCE(tags.tags, '[]') AS tags,
                similarity(COALESCE(l.title, '') || ' ' || COALESCE(l.description, ''), :query) AS keyword_score,
                1.0 / (1.0 + COALESCE(l.embedding <=> :embedding_vec, 2.0)) AS vector_score
            FROM links l
            JOIN sources s ON l.source_id = s.id
            LEFT JOIN users u ON l.author_id = u.id
            LEFT JOIN (
                SELECT lt.link_id,
                       json_agg(json_build_object('id', t.id, 'name', t.name)) AS tags
                FROM link_tags lt
                JOIN tags t ON t.id = lt.tag_id
                GROUP BY lt.link_id
            ) tags ON l.id = tags.link_id
            WHERE similarity(COALESCE(l.title, '') || ' ' || COALESCE(l.description, ''), :query) > 0.05
               OR (l.title || ' ' || COALESCE(l.description, '')) ILIKE '%' || :query || '%'
            ORDER BY
                (0.6 * GREATEST(similarity(COALESCE(l.title, '') || ' ' || COALESCE(l.description, ''), :query), 0.05)
                 + 0.4 * (1.0 / (1.0 + COALESCE(l.embedding <=> :embedding_vec, 2.0)))) DESC
            LIMIT :per_page OFFSET :offset
        """)

        result = await self.db.execute(
            data_sql,
            {
                "query": query,
                "embedding_vec": embedding,
                "per_page": per_page,
                "offset": offset,
            },
        )
        rows = result.all()

        links = []
        for row in rows:
            links.append({
                "id": str(row[0]),
                "url": row[1],
                "domain": row[2],
                "source_id": row[3],
                "source_name": row[5],
                "author_id": None,
                "author_username": row[4],
                "channel_id": None,
                "channel_name": row[6],
                "discord_message_id": row[7],
                "posted_at": row[8],
                "llm_status": row[9],
                "title": row[10],
                "description": row[11],
                "source_detected": row[12],
                "created_at": row[13],
                "updated_at": row[14],
                "tags": row[15] if isinstance(row[15], list) else [],
            })

        return links, total

    async def _vector_only_search(
        self,
        query: str,
        embedding: list[float],
        page: int,
        per_page: int,
    ) -> tuple[list[dict[str, Any]], int]:
        """Vector-only fallback when keyword finds nothing."""
        offset = (page - 1) * per_page

        # Count query
        count_sql = text("""
            SELECT COUNT(*)
            FROM links
            WHERE embedding IS NOT NULL
        """)
        count_result = await self.db.execute(count_sql)
        total = count_result.scalar_one()

        # Data query
        data_sql = text("""
            SELECT
                l.id,
                l.url,
                l.domain,
                l.source_id,
                u.username AS author_username,
                s.name AS source_name,
                l.discord_channel_name AS channel_name,
                l.discord_message_id,
                l.posted_at,
                l.llm_status,
                l.title,
                l.description,
                l.source_detected,
                l.created_at,
                l.updated_at,
                COALESCE(tags.tags, '[]') AS tags
            FROM links l
            JOIN sources s ON l.source_id = s.id
            LEFT JOIN users u ON l.author_id = u.id
            LEFT JOIN (
                SELECT lt.link_id,
                       json_agg(json_build_object('id', t.id, 'name', t.name)) AS tags
                FROM link_tags lt
                JOIN tags t ON t.id = lt.tag_id
                GROUP BY lt.link_id
            ) tags ON l.id = tags.link_id
            WHERE l.embedding IS NOT NULL
            ORDER BY l.embedding <=> :embedding_vec DESC
            LIMIT :per_page OFFSET :offset
        """)

        result = await self.db.execute(
            data_sql,
            {
                "embedding_vec": embedding,
                "per_page": per_page,
                "offset": offset,
            },
        )
        rows = result.all()

        links = []
        for row in rows:
            links.append({
                "id": str(row[0]),
                "url": row[1],
                "domain": row[2],
                "source_id": row[3],
                "source_name": row[5],
                "author_id": None,
                "author_username": row[4],
                "channel_id": None,
                "channel_name": row[6],
                "discord_message_id": row[7],
                "posted_at": row[8],
                "llm_status": row[9],
                "title": row[10],
                "description": row[11],
                "source_detected": row[12],
                "created_at": row[13],
                "updated_at": row[14],
                "tags": row[15] if isinstance(row[15], list) else [],
            })

        return links, total
