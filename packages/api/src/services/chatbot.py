from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

from openai import AsyncOpenAI, APIError
from openai.types.chat import ChatCompletionMessageParam

from src.config import settings
from src.services.llm import _get_client
from src.services.search import SearchService

logger = logging.getLogger(__name__)

CHAT_SYSTEM_PROMPT = """You are a helpful assistant that answers questions about a collection of shared links.

Your task is to analyze the user's question and the provided link context to give accurate, well-referenced answers.

Guidelines:
- Answer based ONLY on the provided link context. If you don't have enough information, say so clearly.
- Always cite which links you're referencing by including clickable URLs in your answer.
- Be concise but thorough. Prioritize accuracy over length.
- If the question is unrelated to the provided links, politely say you can only answer questions about the shared links.
- Respond in the same language as the user's question.
- Format your answer with clear structure, using bullet points or paragraphs as appropriate.
- Include at least 3 link references when they are relevant to the answer."""


async def get_relevant_context(
    search_svc: SearchService,
    question: str,
    max_links: int = 10,
) -> list[dict[str, Any]]:
    """Find the most relevant links for a given question using hybrid search."""
    client = _get_client()
    embedding = await _generate_embedding(client, question)

    if embedding is None:
        links, _ = await search_svc.keyword_search(question, page=1, per_page=max_links)
    else:
        links, _ = await search_svc.hybrid_search(question, embedding=embedding, page=1, per_page=max_links)

    return links[:max_links]


async def _generate_embedding(client: AsyncOpenAI, text: str) -> list[float] | None:
    """Generate embedding for the question."""
    for attempt in range(1, 4):
        try:
            response = await client.embeddings.create(
                model=settings.EMBEDDING_MODEL,
                input=text,
            )
            data = response.data[0]
            embedding_raw = data.embedding if hasattr(data, "embedding") else None
            if embedding_raw is None:
                return None
            if hasattr(embedding_raw, "__iter__") and not isinstance(embedding_raw, (list, str, bytes)):
                embedding = [float(v) for v in embedding_raw]
            else:
                embedding = list(embedding_raw)
            if len(embedding) > 1024:
                embedding = embedding[:1024]
            return embedding
        except APIError as e:
            logger.warning("Chat embedding API error (attempt %d/3): %s", attempt, e)
            if e.status_code == 429 and attempt < 3:
                await asyncio.sleep(2 ** attempt)
                continue
    return None


def build_prompt(question: str, context_links: list[dict[str, Any]]) -> list[ChatCompletionMessageParam]:
    """Build the chat prompt with system message, context, and user question."""
    # Build context sections from relevant links
    context_sections = []
    for i, link in enumerate(context_links, 1):
        title = link.get("title") or "Untitled"
        description = link.get("description") or ""
        url = link.get("url", "")
        source = link.get("source_name") or ""
        author = link.get("author_username") or ""

        section = f"Link {i}:"
        section += f"\n  Title: {title}"
        if description:
            section += f"\n  Description: {description}"
        if source:
            section += f"\n  Source: {source}"
        if author:
            section += f"\n  Author: {author}"
        section += f"\n  URL: {url}"
        context_sections.append(section)

    context_text = "\n\n".join(context_sections)

    if context_text:
        context_instruction = (
            f"Here is the relevant context from the shared links:\n\n"
            f"--- CONTEXT ---\n"
            f"{context_text}\n"
            f"--- END CONTEXT ---\n\n"
            f"Use the above context to answer the user's question."
        )
    else:
        context_instruction = (
            "No relevant links were found for this question. "
            "Let the user know you couldn't find relevant information."
        )

    return [
        {"role": "system", "content": CHAT_SYSTEM_PROMPT},
        {"role": "user", "content": f"{context_instruction}\n\nUser question: {question}"},
    ]


async def chat_complete(
    messages: list[ChatCompletionMessageParam],
    stream: bool = True,
) -> str | Any:
    """Call the LLM to generate a chat response.

    Returns the full response text if stream=False,
    or an async generator yielding chunks if stream=True.
    """
    client = _get_client()

    try:
        if stream:
            response_stream = await client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=messages,
                temperature=0.7,
                max_tokens=2048,
                stream=True,
            )
            return _stream_chunks(response_stream)
        else:
            response = await client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=messages,
                temperature=0.7,
                max_tokens=2048,
                stream=False,
            )
            content = response.choices[0].message.content
            return content or ""
    except APIError as e:
        logger.error("LLM chat API error: %s", e)
        raise ChatbotError(f"Failed to generate response: {e.message}")


async def _stream_chunks(response_stream: Any):
    """Iterate over streaming response chunks and yield text deltas."""
    async for chunk in response_stream:
        choices = chunk.choices
        if not choices:
            continue
        delta = choices[0].delta
        if delta and delta.content:
            yield delta.content


class ChatbotError(Exception):
    """Custom error for chatbot failures."""
    pass
