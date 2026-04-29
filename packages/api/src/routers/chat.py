from __future__ import annotations

import json
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from src.dependencies import AuthUser, get_current_user_required, get_db
from src.schemas import MessageRequest, MessageResponse
from src.nl2sql.pipeline import answer, AnswerResult, shutdown_pool, answer_stream

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/message", response_model=MessageResponse)
async def chat_message(
    user: Annotated[AuthUser, Depends(get_current_user_required)],
    message: MessageRequest,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
) -> MessageResponse:
    """Process a chat message using the NL2SQL pipeline."""
    question = message.message.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        logger.info("NL2SQL pipeline request from user %s: %s", user.id, question)
        result = await answer(question)
        logger.info("NL2SQL pipeline response for user %s: %d chars", user.id, len(result.answer))
        return MessageResponse(message=result.answer)
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

    async def event_generator():
        try:
            async for chunk in answer_stream(question):
                yield f"data: {json.dumps(chunk)}\n\n"
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


@router.on_event("shutdown")
async def on_shutdown():
    """Close the DB pool on shutdown."""
    await shutdown_pool()
