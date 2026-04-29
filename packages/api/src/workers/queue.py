from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.database import async_session
from src.models import Link
from src.workers.process_link import process_link

logger = logging.getLogger(__name__)


async def _fetch_pending_link(db: AsyncSession) -> Link | None:
    """Fetch the next pending link using FOR UPDATE SKIP LOCKED."""
    result = await db.execute(
        select(Link).from_statement(
            text(
                "SELECT * FROM links "
                "WHERE llm_status IN ('pending', 'failed') "
                "AND retry_count < :max_retries "
                "ORDER BY posted_at ASC "
                "LIMIT 1 "
                "FOR UPDATE SKIP LOCKED"
            ).bindparams(max_retries=settings.MAX_RETRIES)
        )
    )
    return result.scalar_one_or_none()


async def _worker_task(worker_id: int) -> None:
    """Individual worker task that polls and processes links."""
    logger.info("Worker %d started", worker_id)

    while True:
        db = None
        try:
            db = async_session()
            link = await _fetch_pending_link(db)

            if link is None:
                logger.debug("Worker %d: no pending links, sleeping %ds", worker_id, settings.WORKER_POLL_INTERVAL)
                await asyncio.sleep(settings.WORKER_POLL_INTERVAL)
                continue

            logger.info("Worker %d: processing link %s (URL: %s)", worker_id, str(link.id), link.url)
            await process_link(db, link)
            logger.info("Worker %d: finished processing link %s", worker_id, str(link.id))

        except Exception as e:
            logger.error("Worker %d: error processing link: %s", worker_id, e, exc_info=True)

        finally:
            if db:
                await db.close()


async def process_queue() -> None:
    """Main entry point: spawn N concurrent workers."""
    logger.info(
        "Starting queue worker with %d workers, poll interval %ds, max retries %d",
        settings.WORKER_CONCURRENCY,
        settings.WORKER_POLL_INTERVAL,
        settings.MAX_RETRIES,
    )

    workers = []
    for i in range(settings.WORKER_CONCURRENCY):
        workers.append(asyncio.create_task(_worker_task(i)))

    logger.info("All %d workers started", len(workers))

    try:
        await asyncio.gather(*workers)
    except asyncio.CancelledError:
        logger.info("Queue worker shutting down, cancelling workers...")
        for w in workers:
            w.cancel()
        await asyncio.gather(*workers, return_exceptions=True)
        logger.info("Queue worker stopped")


if __name__ == "__main__":
    import sys

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
    )

    asyncio.run(process_queue())
