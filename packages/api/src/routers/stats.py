from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.dependencies import AuthUser, get_current_user_required, get_db
from src.schemas import StatsResponse
from src.services.stats_service import StatsService

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("", response_model=StatsResponse)
async def get_stats_endpoint(
    user: Annotated[AuthUser, Depends(get_current_user_required)],
    db: Annotated[AsyncSession, Depends(get_db)] = None,
) -> StatsResponse:
    service = StatsService(db)
    stats = await service.get_stats(user.user_id)
    return StatsResponse(**stats)
