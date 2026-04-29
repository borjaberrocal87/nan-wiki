from __future__ import annotations

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from openai import APIError

from src.services.llm import (
    _get_client,
    build_link_text,
    generate_embedding,
    generate_link_metadata,
)


class TestGetClient:
    @patch("src.services.llm.settings")
    def test_uses_custom_base_url(self, mock_settings):
        mock_settings.LLM_BASE_URL = "https://custom.api/v1"
        mock_settings.LLM_API_KEY = "test-key"
        mock_settings.LLM_MODEL = "test-model"
        mock_settings.EMBEDDING_MODEL = "test-embedding"

        client = _get_client()
        assert client.base_url == "https://custom.api/v1"
        assert client.api_key == "test-key"

    @patch("src.services.llm.settings")
    def test_uses_llm_api_key(self, mock_settings):
        mock_settings.LLM_BASE_URL = "https://custom.api/v1"
        mock_settings.LLM_API_KEY = "test-key"
        mock_settings.LLM_MODEL = "test-model"
        mock_settings.EMBEDDING_MODEL = "test-embedding"

        client = _get_client()
        assert client.api_key == "test-key"


class TestBuildLinkText:
    def test_both_title_and_description(self):
        result = build_link_text("My Title", "My Description")
        assert result == "My Title My Description"

    def test_title_only(self):
        result = build_link_text("My Title", None)
        assert result == "My Title"

    def test_description_only(self):
        result = build_link_text(None, "My Description")
        assert result == "My Description"

    def test_neither(self):
        result = build_link_text(None, None)
        assert result == ""


class TestGenerateLinkMetadata:
    @pytest.fixture
    def mock_response(self):
        mock_choice = MagicMock()
        mock_choice.message.content = json.dumps({
            "title": "Test Title",
            "description": "Test Description",
            "tags": ["tag1", "tag2", "tag3"],
        })
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]
        return mock_response

    @pytest.mark.asyncio
    async def test_returns_metadata_on_success(self, mock_response):
        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        with patch("src.services.llm._get_client", return_value=mock_client):
            result = await generate_link_metadata(
                "https://example.com", "blog"
            )

        assert result is not None
        assert result["title"] == "Test Title"
        assert result["description"] == "Test Description"
        assert result["tags"] == ["tag1", "tag2", "tag3"]

    @pytest.mark.asyncio
    async def test_truncates_title_to_100_chars(self, mock_response):
        mock_response.choices[0].message.content = json.dumps({
            "title": "A" * 200,
            "description": "Test",
            "tags": ["a", "b", "c"],
        })

        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        with patch("src.services.llm._get_client", return_value=mock_client):
            result = await generate_link_metadata(
                "https://example.com", "other"
            )

        assert len(result["title"]) == 100

    @pytest.mark.asyncio
    async def test_truncates_description_to_300_chars(self, mock_response):
        mock_response.choices[0].message.content = json.dumps({
            "title": "Test",
            "description": "B" * 500,
            "tags": ["a", "b", "c"],
        })

        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        with patch("src.services.llm._get_client", return_value=mock_client):
            result = await generate_link_metadata(
                "https://example.com", "other"
            )

        assert len(result["description"]) == 300

    @pytest.mark.asyncio
    async def test_limits_tags_to_5(self, mock_response):
        mock_response.choices[0].message.content = json.dumps({
            "title": "Test",
            "description": "Test",
            "tags": ["a", "b", "c", "d", "e", "f", "g"],
        })

        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        with patch("src.services.llm._get_client", return_value=mock_client):
            result = await generate_link_metadata(
                "https://example.com", "other"
            )

        assert len(result["tags"]) == 5

    @pytest.mark.asyncio
    async def test_returns_none_on_api_error_after_retries(self):
        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(
            side_effect=APIError(
                request=MagicMock(),
                message="Rate limit",
                body=None,
            )
        )

        with patch("src.services.llm._get_client", return_value=mock_client):
            result = await generate_link_metadata(
                "https://example.com", "other", max_retries=2
            )

        assert result is None

    @pytest.mark.asyncio
    async def test_returns_none_on_json_parse_error(self):
        mock_choice = MagicMock()
        mock_choice.message.content = "not valid json {{{"
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]

        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        with patch("src.services.llm._get_client", return_value=mock_client):
            result = await generate_link_metadata(
                "https://example.com", "other", max_retries=1
            )

        assert result is None

    @pytest.mark.asyncio
    async def test_includes_source_in_prompt(self, mock_response):
        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        with patch("src.services.llm._get_client", return_value=mock_client):
            await generate_link_metadata(
                "https://example.com", "github"
            )

        call_args = mock_client.chat.completions.create.call_args
        messages = call_args.kwargs["messages"]
        user_content = messages[1]["content"]
        assert "github" in user_content


class TestGenerateEmbedding:
    @pytest.mark.asyncio
    async def test_returns_embedding_vector(self):
        mock_data = MagicMock()
        mock_data.embedding = [0.1] * 1024
        mock_response = MagicMock()
        mock_response.data = [mock_data]

        mock_client = AsyncMock()
        mock_client.embeddings.create = AsyncMock(return_value=mock_response)

        with patch("src.services.llm._get_client", return_value=mock_client):
            result = await generate_embedding("test text")

        assert result is not None
        assert len(result) == 1024
        assert result[0] == 0.1

    @pytest.mark.asyncio
    async def test_returns_none_on_api_error(self):
        mock_client = AsyncMock()
        mock_client.embeddings.create = AsyncMock(
            side_effect=APIError(
                request=MagicMock(),
                message="Error",
                body=None,
            )
        )

        with patch("src.services.llm._get_client", return_value=mock_client):
            result = await generate_embedding("test text", max_retries=1)

        assert result is None
