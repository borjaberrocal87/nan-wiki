from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from httpx import AsyncClient, HTTPStatusError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.database import get_db
from src.models import User

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/discord")
async def discord_login():
    import uuid

    state = uuid.uuid4().hex

    params = {
        "client_id": settings.DISCORD_CLIENT_ID,
        "redirect_uri": settings.DISCORD_REDIRECT_URI,
        "response_type": "code",
        "scope": "identify",
        "state": state,
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    url = f"https://discord.com/api/oauth2/authorize?{query}"

    return RedirectResponse(url=url, status_code=303)


@router.get("/discord/callback")
async def discord_callback_redirect(
    code: str,
    state: str,
):
    # Redirect to frontend callback with code and state
    frontend_url = f"{settings.FRONTEND_URL}/auth/discord/callback?code={code}&state={state}"
    return RedirectResponse(url=frontend_url)


@router.post("/discord/callback")
async def discord_callback(
    body: dict,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
):
    from jose import jwt

    code = body.get("code")
    state = body.get("state")

    if not code:
        raise HTTPException(status_code=400, detail="Missing code")

    async with AsyncClient() as client:
        try:
            token_resp = await client.post(
                "https://discord.com/api/oauth2/token",
                data={
                    "client_id": settings.DISCORD_CLIENT_ID,
                    "client_secret": settings.DISCORD_CLIENT_SECRET,
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": settings.DISCORD_REDIRECT_URI,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            token_data = token_resp.json()
            access_token = token_data.get("access_token")
            if not access_token:
                raise HTTPException(status_code=400, detail="No access token from Discord")
        except HTTPStatusError:
            raise HTTPException(status_code=400, detail="Failed to exchange code for token")

        user_resp = await client.get(
            "https://discord.com/api/users/@me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        user_data = user_resp.json()

    discord_id = int(user_data["id"])
    username = user_data.get("username", "unknown")
    discriminator = user_data.get("discriminator", "0")
    avatar = user_data.get("avatar")
    avatar_url = f"https://cdn.discordapp.com/avatars/{discord_id}/{avatar}.png" if avatar else None

    # Upsert user
    result = await db.execute(select(User).where(User.id == discord_id))
    existing = result.scalar_one_or_none()

    if existing:
        existing.username = username
        existing.avatar_url = avatar_url
        existing.discriminator = discriminator
        await db.commit()
        await db.refresh(existing)
        token_user = existing
    else:
        user = User(
            id=discord_id,
            username=username,
            avatar_url=avatar_url,
            discriminator=discriminator,
            joined_at=datetime.now(timezone.utc),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        token_user = user

    jwt_payload = {
        "user_id": token_user.id,
        "username": token_user.username,
    }
    jwt_token = jwt.encode(jwt_payload, settings.JWT_SECRET, algorithm="HS256")

    return {"token": jwt_token, "user": {"id": discord_id, "username": username, "avatar_url": avatar_url}}


@router.get("/me")
async def get_me():
    raise HTTPException(status_code=501, detail="Not implemented yet - requires auth middleware")


@router.post("/logout")
async def logout():
    raise HTTPException(status_code=501, detail="Not implemented yet - requires auth middleware")
