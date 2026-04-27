"""Queue worker — processes links for LLM summarization."""

import asyncio
import logging

logger = logging.getLogger(__name__)


async def process_queue() -> None:
    """Process the Redis job queue. Not yet implemented."""
    logger.info("Queue worker started (stub)")
    while True:
        await asyncio.sleep(10)


if __name__ == "__main__":
    asyncio.run(process_queue())
