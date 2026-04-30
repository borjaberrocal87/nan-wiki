from __future__ import annotations

import json
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.main import app
from src.nl2sql.pipeline import AnswerResult, shutdown_pool


class TestChatMessage:
    @pytest.fixture(autouse=True)
    def _setup_and_teardown(self):
        # Set up dependency overrides before each test
        self._mock_user = type("AuthUser", (), {"id": 123, "user_id": 123, "username": "testuser"})()
        app.dependency_overrides = {
            lambda: None: self._mock_user,  # placeholder
        }
        yield
        # Clean up after each test
        app.dependency_overrides.clear()

    def _override_deps(self):
        app.dependency_overrides.clear()
        app.dependency_overrides[
            __import__("src.routers.chat", fromlist=["get_current_user_required"]).get_current_user_required
        ] = lambda: self._mock_user
        app.dependency_overrides[
            __import__("src.routers.chat", fromlist=["get_db"]).get_db
        ] = lambda: AsyncMock(spec=AsyncSession)

    def test_returns_answer_from_pipeline(self):
        self._override_deps()
        mock_result = AnswerResult(
            question="test",
            answer="Here is the answer.",
        )

        with patch("src.routers.chat.answer", return_value=mock_result):
            client = TestClient(app)
            response = client.post(
                "/api/chat/message",
                json={"message": "test question"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Here is the answer."

    def test_returns_400_on_empty_message(self):
        self._override_deps()

        client = TestClient(app)
        response = client.post(
            "/api/chat/message",
            json={"message": ""},
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "Message cannot be empty"

    def test_returns_400_on_whitespace_only_message(self):
        self._override_deps()

        client = TestClient(app)
        response = client.post(
            "/api/chat/message",
            json={"message": "   \n\t  "},
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "Message cannot be empty"

    def test_strips_message_before_sending_to_pipeline(self):
        self._override_deps()
        mock_result = AnswerResult(question="stripped", answer="ok")

        with patch("src.routers.chat.answer", return_value=mock_result) as mock_answer:
            client = TestClient(app)
            client.post(
                "/api/chat/message",
                json={"message": "  test question  "},
            )

        # MessageRequest strips whitespace, then route strips again
        call_arg = mock_answer.call_args[0][0]
        assert call_arg == "test question"

    def test_500_on_unexpected_error(self):
        self._override_deps()

        with patch("src.routers.chat.answer", side_effect=Exception("database connection lost")):
            client = TestClient(app)
            response = client.post(
                "/api/chat/message",
                json={"message": "test"},
            )

        assert response.status_code == 500
        assert response.json()["detail"] == "Failed to process chat message"

    def test_pipeline_error_handled_gracefully(self):
        self._override_deps()
        mock_result = AnswerResult(
            question="test",
            answer="",
            error="LLM error: rate limit",
        )

        with patch("src.routers.chat.answer", return_value=mock_result):
            client = TestClient(app)
            response = client.post(
                "/api/chat/message",
                json={"message": "test"},
            )

        # Pipeline returns an AnswerResult with error, but the route doesn't raise
        assert response.status_code == 200

    def test_sends_question_to_pipeline(self):
        self._override_deps()
        mock_result = AnswerResult(question="what are the top links?", answer="Top 5 links...")

        with patch("src.routers.chat.answer", return_value=mock_result) as mock_answer:
            client = TestClient(app)
            client.post(
                "/api/chat/message",
                json={"message": "what are the top links?"},
            )

        assert mock_answer.called
        assert mock_answer.call_args[0][0] == "what are the top links?"


class TestChatMessageStream:
    @pytest.fixture(autouse=True)
    def _setup_and_teardown(self):
        self._mock_user = type("AuthUser", (), {"id": 123, "user_id": 123, "username": "testuser"})()
        yield
        app.dependency_overrides.clear()

    def _override_deps(self):
        app.dependency_overrides.clear()
        app.dependency_overrides[
            __import__("src.routers.chat", fromlist=["get_current_user_required"]).get_current_user_required
        ] = lambda: self._mock_user
        app.dependency_overrides[
            __import__("src.routers.chat", fromlist=["get_db"]).get_db
        ] = lambda: AsyncMock(spec=AsyncSession)

    def test_returns_streaming_response(self):
        self._override_deps()

        async def mock_stream():
            yield {"type": "sql", "sql": "SELECT 1"}
            yield {"type": "done"}

        with patch("src.routers.chat.answer_stream", return_value=mock_stream()):
            client = TestClient(app)
            response = client.post(
                "/api/chat/message/stream",
                json={"message": "test"},
            )

        assert response.status_code == 200
        assert response.headers["content-type"] == "text/event-stream; charset=utf-8"

    def test_stream_contains_sql_chunk(self):
        self._override_deps()

        async def mock_stream():
            yield {"type": "sql", "sql": "SELECT id FROM links"}
            yield {"type": "done"}

        with patch("src.routers.chat.answer_stream", return_value=mock_stream()):
            client = TestClient(app)
            response = client.post(
                "/api/chat/message/stream",
                json={"message": "test"},
            )

        body = response.text
        assert "SELECT id FROM links" in body

    def test_stream_contains_answer_chunk(self):
        self._override_deps()

        async def mock_stream():
            yield {"type": "chunk", "content": "Here is the answer"}
            yield {"type": "done"}

        with patch("src.routers.chat.answer_stream", return_value=mock_stream()):
            client = TestClient(app)
            response = client.post(
                "/api/chat/message/stream",
                json={"message": "test"},
            )

        body = response.text
        assert "Here is the answer" in body

    def test_stream_contains_rows_chunk(self):
        self._override_deps()

        async def mock_stream():
            yield {"type": "rows", "count": 42, "truncated": False}
            yield {"type": "done"}

        with patch("src.routers.chat.answer_stream", return_value=mock_stream()):
            client = TestClient(app)
            response = client.post(
                "/api/chat/message/stream",
                json={"message": "test"},
            )

        body = response.text
        assert '"count"' in body
        assert '"truncated"' in body

    def test_stream_contains_error_chunk(self):
        self._override_deps()

        async def mock_stream():
            yield {"type": "error", "message": "Something went wrong"}
            yield {"type": "done"}

        with patch("src.routers.chat.answer_stream", return_value=mock_stream()):
            client = TestClient(app)
            response = client.post(
                "/api/chat/message/stream",
                json={"message": "test"},
            )

        body = response.text
        assert "Something went wrong" in body

    def test_returns_400_on_empty_message(self):
        self._override_deps()

        client = TestClient(app)
        response = client.post(
            "/api/chat/message/stream",
            json={"message": ""},
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "Message cannot be empty"

    def test_stream_handles_generator_exception(self):
        self._override_deps()

        async def failing_stream():
            yield {"type": "sql", "sql": "SELECT 1"}
            raise Exception("generator error")

        with patch("src.routers.chat.answer_stream", return_value=failing_stream()):
            client = TestClient(app)
            response = client.post(
                "/api/chat/message/stream",
                json={"message": "test"},
            )

        body = response.text
        assert "Streaming failed" in body

    def test_stream_headers_include_cache_control(self):
        self._override_deps()

        async def mock_stream():
            yield {"type": "done"}

        with patch("src.routers.chat.answer_stream", return_value=mock_stream()):
            client = TestClient(app)
            response = client.post(
                "/api/chat/message/stream",
                json={"message": "test"},
            )

        assert response.headers["cache-control"] == "no-cache"
        assert response.headers["connection"] == "keep-alive"
        assert response.headers["x-accel-buffering"] == "no"

    def test_stream_json_serialization(self):
        self._override_deps()

        async def mock_stream():
            yield {"type": "sql", "sql": "SELECT 1"}
            yield {"type": "done"}

        with patch("src.routers.chat.answer_stream", return_value=mock_stream()):
            client = TestClient(app)
            response = client.post(
                "/api/chat/message/stream",
                json={"message": "test"},
            )

        # Parse each data line as JSON
        for line in response.text.split("\n\n"):
            if line.startswith("data: "):
                data = line[6:]
                parsed = json.loads(data)
                assert isinstance(parsed, dict)
                assert "type" in parsed


class TestOnShutdown:
    @pytest.mark.asyncio
    async def test_shutdown_pool_called_on_app_shutdown(self):
        with patch("src.routers.chat.shutdown_pool") as mock_shutdown:
            await app.router.on_shutdown[0]()

        mock_shutdown.assert_awaited_once()
