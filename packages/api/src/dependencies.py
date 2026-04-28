from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.database import get_db


class AuthUser:
    def __init__(self, user_id: int, username: str, expires_at: str = ""):
        self.user_id = user_id
        self.username = username
        self.expires_at = expires_at


_bearer = HTTPBearer()
_bearer_optional = HTTPBearer(auto_error=False)


async def _decode_token(token: str) -> AuthUser:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"], options={"verify_exp": True})
    except JWTError:
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"], options={"verify_exp": False})
        except JWTError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user_id = payload.get("user_id")
    username = payload.get("username")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    expires_at = ""
    exp = payload.get("exp")
    if exp:
        expires_at = datetime.fromtimestamp(exp, tz=UTC).isoformat().replace("+00:00", "Z")
    return AuthUser(user_id=int(user_id), username=username or "", expires_at=expires_at)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AuthUser:
    return await _decode_token(credentials.credentials)


async def get_current_user_optional(
    token: Annotated[str | None, Cookie(alias="nan_wiki_session")] = None,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)] = None,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
) -> AuthUser | None:
    if token:
        return await _decode_token(token)
    if credentials:
        return await _decode_token(credentials.credentials)
    return None


async def get_current_user_required(
    token: Annotated[str | None, Cookie(alias="nan_wiki_session")] = None,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_optional)] = None,
) -> AuthUser:
    if token:
        return await _decode_token(token)
    if credentials:
        return await _decode_token(credentials.credentials)
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
