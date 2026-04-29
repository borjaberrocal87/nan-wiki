from __future__ import annotations

import json
import logging
from typing import Any

from openai import AsyncOpenAI, APIError, APIResponseValidationError
from openai.types.chat import ChatCompletion

from src.config import settings

logger = logging.getLogger(__name__)

METADATA_JSON_SCHEMA = {
    "name": "generate_link_metadata",
    "strict": True,
    "schema": {
        "type": "object",
        "properties": {
            "title": {
                "type": "string",
                "description": "Title for the link, maximum 100 characters",
            },
            "description": {
                "type": "string",
                "description": "Brief description of the link content, maximum 300 characters",
            },
            "tags": {
                "type": "array",
                "items": {
                    "type": "string",
                },
                "minItems": 3,
                "maxItems": 5,
                "description": "Relevant tags for categorizing the link (3-5 tags)",
            },
        },
        "required": ["title", "description", "tags"],
        "additionalProperties": False,
    },
}

SYSTEM_PROMPT = """You are a link metadata generator. Your task is to analyze a link and generate appropriate metadata.

Given the URL and source type, produce:
- A concise title (max 100 characters)
- A brief description (max 300 characters) that summarizes what the link is about
- 3-5 relevant tags for categorization

Respond ONLY with valid JSON matching the provided schema. Do not include any text outside the JSON object. Always respond in English."""


def _get_client() -> AsyncOpenAI:
    base_url = settings.LLM_BASE_URL
    api_key = settings.LLM_API_KEY

    return AsyncOpenAI(
        base_url=base_url,
        api_key=api_key,
    )


async def generate_link_metadata(
    url: str,
    source: str,
    max_retries: int = 3,
) -> dict[str, Any] | None:
    """Generate title, description, and tags for a link using LLM.

    Returns dict with keys: title, description, tags
    Returns None if all retries fail.
    """
    client = _get_client()

    user_prompt = f"URL: {url}\nSource: {source}"

    for attempt in range(1, max_retries + 1):
        try:
            response = await client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={
                    "type": "json_schema",
                    "json_schema": METADATA_JSON_SCHEMA,
                },
                temperature=0.3,
                max_tokens=500,
            )

            content = response.choices[0].message.content
            if content is None:
                logger.warning("LLM returned null content for URL: %s (attempt %d)", url, attempt)
                continue

            parsed = json.loads(content)
            title = str(parsed.get("title", "")[:100])
            description = str(parsed.get("description", "")[:300])
            tags = parsed.get("tags", [])
            if not isinstance(tags, list):
                tags = []
            tags = [str(t)[:50] for t in tags[:5]]

            return {
                "title": title,
                "description": description,
                "tags": tags,
            }

        except (json.JSONDecodeError, KeyError, TypeError, APIResponseValidationError) as e:
            logger.warning(
                "LLM parse error for URL %s (attempt %d/%d): %s",
                url, attempt, max_retries, e,
            )
        except APIError as e:
            logger.warning(
                "LLM API error for URL %s (attempt %d/%d): %s",
                url, attempt, max_retries, e,
            )
            if e.status_code == 429:
                wait = 2 ** attempt
                logger.info("Rate limited, waiting %ds before retry", wait)
                import asyncio
                await asyncio.sleep(wait)
                continue

        if attempt < max_retries:
            wait = 2 ** attempt
            logger.info("Retrying in %ds...", wait)
            import asyncio
            await asyncio.sleep(wait)

    logger.error("LLM metadata generation failed for URL %s after %d attempts", url, max_retries)
    return None


async def generate_embedding(text: str, max_retries: int = 3) -> list[float] | None:
    """Generate embedding vector for the given text.

    Returns list of floats or None if all retries fail.
    """
    client = _get_client()

    for attempt in range(1, max_retries + 1):
        try:
            logger.debug("Calling embedding API (model=%s, attempt %d/%d)", settings.EMBEDDING_MODEL, attempt, max_retries)
            response = await client.embeddings.create(
                model=settings.EMBEDDING_MODEL,
                input=text,
            )
            logger.debug("Embedding response type: %s, data length: %d", type(response), len(response.data) if hasattr(response, "data") else "N/A")

            data = response.data[0]
            embedding_raw = data.embedding if hasattr(data, "embedding") else None
            if embedding_raw is None:
                logger.warning("Embedding returned null for text (attempt %d)", attempt)
                continue
            # Ensure we get the actual float values, not nested objects/coroutines
            if hasattr(embedding_raw, "__iter__") and not isinstance(embedding_raw, (list, str, bytes)):
                try:
                    embedding = [float(v) for v in embedding_raw]
                except (TypeError, ValueError):
                    logger.error("Embedding has unexpected structure: %s", type(embedding_raw))
                    continue
            else:
                embedding = list(embedding_raw)
            return embedding

        except APIError as e:
            logger.warning(
                "Embedding API error (attempt %d/%d): %s",
                attempt, max_retries, e,
            )
            if e.status_code == 429:
                wait = 2 ** attempt
                import asyncio
                await asyncio.sleep(wait)
                continue

        if attempt < max_retries:
            import asyncio
            await asyncio.sleep(2 ** attempt)

    logger.error("Embedding generation failed after %d attempts", max_retries)
    return None


async def build_link_text(title: str | None, description: str | None) -> str:
    """Build combined text for embedding from title and description."""
    parts = []
    if title:
        parts.append(title)
    if description:
        parts.append(description)
    return " ".join(parts)
