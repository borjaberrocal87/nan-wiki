from __future__ import annotations

import pytest
from jose import JWTError, jwt

from src.config import settings
from src.dependencies import _decode_token


class TestDecodeToken:
    async def test_valid_token_returns_auth_user(self):
        token = jwt.encode(
            {"user_id": 12345, "username": "testuser"},
            settings.JWT_SECRET,
            algorithm="HS256",
        )
        user = await _decode_token(token)
        assert user.user_id == 12345
        assert user.username == "testuser"

    async def test_missing_user_id_raises_401(self):
        token = jwt.encode(
            {"username": "testuser"},
            settings.JWT_SECRET,
            algorithm="HS256",
        )
        with pytest.raises(Exception) as exc_info:
            await _decode_token(token)
        assert "401" in str(exc_info.value)

    async def test_invalid_token_raises_401(self):
        with pytest.raises(Exception) as exc_info:
            await _decode_token("invalid.token.here")
        assert "401" in str(exc_info.value)

    async def test_expired_token_raises_401(self):
        import time
        from unittest.mock import patch
        from fastapi import HTTPException

        payload = {
            "user_id": 12345,
            "username": "testuser",
            "exp": int(time.time()) - 100,
        }
        token = jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")
        with patch("src.dependencies.jwt.decode", side_effect=JWTError):
            with pytest.raises(HTTPException) as exc_info:
                await _decode_token(token)
            assert exc_info.value.status_code == 401

    async def test_empty_username_defaults_to_empty_string(self):
        token = jwt.encode(
            {"user_id": 12345},
            settings.JWT_SECRET,
            algorithm="HS256",
        )
        user = await _decode_token(token)
        assert user.user_id == 12345
        assert user.username == ""
