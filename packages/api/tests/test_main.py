from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from src.main import app


class TestHealthCheck:
    def test_health_returns_ok(self):
        client = TestClient(app)
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    def test_health_is_get_only(self):
        client = TestClient(app)
        response = client.post("/health")
        assert response.status_code == 405


class TestRouters:
    def test_links_router_is_registered(self):
        client = TestClient(app)
        response = client.get("/api/links")
        # Should not be 404 — router is registered
        assert response.status_code != 404

    def test_auth_router_is_registered(self):
        client = TestClient(app)
        # Auth logout endpoint should exist
        response = client.post("/api/auth/logout")
        assert response.status_code != 404

    def test_stats_router_is_registered(self):
        client = TestClient(app)
        response = client.get("/api/stats")
        assert response.status_code != 404

    def test_chat_router_is_registered(self):
        client = TestClient(app)
        response = client.get("/api/chat/message")
        assert response.status_code != 404


class TestAppConfig:
    def test_app_title(self):
        assert app.title == "Link Library API"

    def test_app_version(self):
        assert app.version == "1.0.0"

    def test_cors_middleware_is_configured(self):
        client = TestClient(app)
        response = client.options(
            "/health",
            headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "GET"},
        )
        # CORS preflight should succeed
        assert response.status_code == 200
