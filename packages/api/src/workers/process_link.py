from __future__ import annotations

import logging
from datetime import datetime

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.models import Link, LinkTag, Tag
from src.services.llm import build_link_text, generate_embedding, generate_link_metadata

logger = logging.getLogger(__name__)


def _now() -> datetime:
    """Return naive datetime matching TIMESTAMP WITHOUT TIME ZONE."""
    return datetime.utcnow()


async def process_link(db: AsyncSession, link: Link) -> None:
    """Process a single link: generate metadata, embedding, update DB.

    Flow:
    1. Mark as 'processing'
    2. Generate metadata (title, description, tags)
    3. Generate embedding from title + description
    4. Update link with results
    5. Mark as 'done' or 'failed'
    """
    link_id = str(link.id)
    url = link.url

    # Step 1: Mark as processing
    await db.execute(
        update(Link)
        .where(Link.id == link.id)
        .values(llm_status="processing", updated_at=_now())
    )
    await db.commit()

    logger.info("Processing link %s (URL: %s, retry_count: %d)", link_id, url, link.retry_count)

    # Step 2: Generate metadata
    metadata = await generate_link_metadata(url)

    if metadata is None:
        await _mark_failed(db, link, "LLM metadata generation failed")
        return

    # Step 3: Generate embedding from title + description
    link_text = await build_link_text(metadata.get("title"), metadata.get("description"))
    embedding = None
    if link_text:
        embedding = await generate_embedding(link_text)
        if embedding is None:
            logger.warning("Embedding failed for link %s, continuing without it", link_id)

    # Step 4: Upsert tags and create link_tags entries
    tag_names = metadata.get("tags", [])
    tag_ids = []
    if tag_names:
        for tag_name in tag_names:
            stmt = (
                insert(Tag)
                .values(name=tag_name)
                .on_conflict_do_nothing()
            )
            await db.execute(stmt)

        result = await db.execute(select(Tag.id, Tag.name).where(Tag.name.in_(tag_names)))
        rows = result.all()
        tag_ids = [row[0] for row in rows]

        if tag_ids:
            link_tags_to_insert = [
                {"link_id": link.id, "tag_id": tag_id}
                for tag_id in tag_ids
            ]
            await db.execute(LinkTag.__table__.insert(), link_tags_to_insert)

    # Step 5: Update link with results
    await db.execute(
        update(Link)
        .where(Link.id == link.id)
        .values(
            title=metadata.get("title"),
            description=metadata.get("description"),
            embedding=embedding,
            llm_status="done",
            updated_at=_now(),
        )
    )
    await db.commit()

    logger.info(
        "Link %s processed successfully: title='%s', tags=%s, embedding=%s",
        link_id,
        metadata.get("title"),
        tag_ids,
        "yes" if embedding else "no",
    )


async def _mark_failed(db: AsyncSession, link: Link, reason: str) -> None:
    """Mark link as failed, increment retry_count."""
    new_retry_count = link.retry_count + 1
    should_retry = new_retry_count < settings.MAX_RETRIES

    logger.warning(
        "Link %s processing failed (attempt %d/%d): %s",
        str(link.id), new_retry_count, settings.MAX_RETRIES, reason,
    )

    if should_retry:
        await db.execute(
            update(Link)
            .where(Link.id == link.id)
            .values(
                llm_status="pending",
                retry_count=new_retry_count,
                updated_at=_now(),
            )
        )
        await db.commit()
        logger.info("Link %s re-queued for retry (attempt %d/%d)", str(link.id), new_retry_count, settings.MAX_RETRIES)
    else:
        await db.execute(
            update(Link)
            .where(Link.id == link.id)
            .values(
                llm_status="failed",
                retry_count=new_retry_count,
                updated_at=_now(),
            )
        )
        await db.commit()
        logger.error("Link %s permanently failed after %d retries", str(link.id), new_retry_count)
