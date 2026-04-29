from __future__ import annotations

import json
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from src.dependencies import AuthUser, get_current_user_required, get_db
from src.schemas import MessageRequest, MessageResponse
from src.services.chatbot import (
    ChatbotError,
    build_prompt,
    chat_complete,
    get_relevant_context,
)
from src.services.search import SearchService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/message", response_model=MessageResponse)
async def chat_message(
    user: Annotated[AuthUser, Depends(get_current_user_required)],
    message: MessageRequest,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
) -> MessageResponse:
    """Process a chat message and return a full response (non-streaming)."""
    question = message.message.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        search_svc = SearchService(db)
        context_links = await get_relevant_context(search_svc, question, max_links=10)
        messages = build_prompt(question, context_links)
        logger.info("Chat request from user %s: %s | context links: %d", user.id, question, len(context_links))
        response_text = await chat_complete(messages, stream=False)
        logger.info("Chat response for user %s: %s chars", user.id, len(response_text))
        return MessageResponse(message=response_text, references=[link["url"] for link in context_links])
    except ChatbotError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error("Chat message error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to process chat message")


@router.post("/message/stream")
async def chat_message_stream(
    user: Annotated[AuthUser, Depends(get_current_user_required)],
    message: MessageRequest,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
):
    """Process a chat message and stream the response via SSE."""
    question = message.message.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        search_svc = SearchService(db)
        context_links = await get_relevant_context(search_svc, question, max_links=10)
        messages = build_prompt(question, context_links)
        response_gen = chat_complete(messages, stream=True)

        async def event_generator():
            # Send references as initial event
            references = [link["url"] for link in context_links]
            yield f"data: {json.dumps({'type': 'references', 'urls': references})}\n\n"

            try:
                async for chunk in response_gen:
                    yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
            except Exception as e:
                logger.error("Streaming error: %s", e)
                yield f"data: {json.dumps({'type': 'error', 'message': 'Streaming failed'})}\n\n"

            yield "data: [DONE]\n\n"

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )
    except ChatbotError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error("Chat message stream error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to process chat message")
