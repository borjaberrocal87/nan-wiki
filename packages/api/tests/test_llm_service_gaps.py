from __future__ import annotations

import asyncio
import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from openai import APIError

from src.services.llm import (
    METADATA_JSON_SCHEMA,
    build_link_text,
    generate_embedding,
    generate_link_metadata,
)


class TestMetadataJsonSchema:
    def test_schema_has_required_fields(self):
        assert "title" in METADATA_JSON_SCHEMA["schema"]["properties"]
        assert "description" in METADATA_JSON_SCHEMA["schema"]["properties"]
        assert "tags" in METADATA_JSON_SCHEMA["schema"]["properties"]

    def test_schema_has_no_additional_properties(self):
        assert METADATA_JSON_SCHEMA["schema"]["additionalProperties"] is False

    def test_tags_has_min_items(self):
        assert METADATA_JSON_SCHEMA["schema"]["properties"]["tags"]["minItems"] == 3

    def test_tags_has_max_items(self):
        assert METADATA_JSON_SCHEMA["schema"]["properties"]["tags"]["maxItems"] == 5

    def test_tags_has_enum_values(self):
        tags = METADATA_JSON_SCHEMA["schema"]["properties"]["tags"]["items"]["enum"]
        assert "llm" in tags
        assert "rag" in tags
        assert "prompt-engineering" in tags
        assert "news" in tags
        assert "coding" in tags

    def test_schema_is_strict(self):
        assert METADATA_JSON_SCHEMA["strict"] is True

    def test_schema_name(self):
        assert METADATA_JSON_SCHEMA["name"] == "generate_link_metadata"


class TestGenerateLinkMetadataGapCoverage:
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

    async def test_null_content_triggers_retry(self):
        mock_client = AsyncMock()
        # First call returns None response, second call succeeds
        mock_response_none = MagicMock()
        mock_response_none.choices = [MagicMock(message=MagicMock(content=None))]

        mock_response_ok = MagicMock()
        mock_choice = MagicMock()
        mock_choice.message.content = json.dumps({
            "title": "Recovery",
            "description": "Recovered",
            "tags": ["a", "b", "c"],
        })
        mock_response_ok.choices = [mock_choice]

        mock_client.chat.completions.create = AsyncMock(
            side_effect=[mock_response_none, mock_response_ok]
        )

        with patch("src.services.llm._get_client", return_value=mock_client):
            result = await generate_link_metadata(
                "https://example.com", max_retries=2
            )

        assert result is not None
        assert result["title"] == "Recovery"
        assert mock_client.chat.completions.create.call_count == 2

    async def test_null_content_exhausts_retries(self):
        mock_client = AsyncMock()
        mock_response_none = MagicMock()
        mock_response_none.choices = [MagicMock(message=MagicMock(content=None))]
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response_none)

        with patch("src.services.llm._get_client", return_value=mock_client):
            result = await generate_link_metadata(
                "https://example.com", max_retries=2
            )

        assert result is None
        assert mock_client.chat.completions.create.call_count == 2

    async def test_rate_limit_429_waits_before_retry(self):
        mock_client = AsyncMock()
        mock_response_ok = MagicMock()
        mock_choice = MagicMock()
        mock_choice.message.content = json.dumps({
            "title": "After retry",
            "description": "Got it",
            "tags": ["x", "y", "z"],
        })
        mock_response_ok.choices = [mock_choice]

        rate_limit_error = APIError(
            request=MagicMock(),
            message="Rate limit",
            body=None,
        )
        rate_limit_error.status_code = 429
        mock_client.chat.completions.create = AsyncMock(
            side_effect=[rate_limit_error, mock_response_ok]
        )

        with patch("src.services.llm._get_client", return_value=mock_client):
            result = await generate_link_metadata(
                "https://example.com", max_retries=2
            )

        assert result is not None
        assert result["title"] == "After retry"

    async def test_non_429_api_error_does_not_retry(self):
        mock_client = AsyncMock()
        error = APIError(
            request=MagicMock(),
            message="Bad request",
            body=None,
        )
        error.status_code = 400
        mock_client.chat.completions.create = AsyncMock(side_effect=error)

        with patch("src.services.llm._get_client", return_value=mock_client):
            result = await generate_link_metadata(
                "https://example.com", max_retries=1
            )

        assert result is None

    async def test_tags_truncated_to_50_chars_each(self):
        mock_choice = MagicMock()
        mock_choice.message.content = json.dumps({
            "title": "Test",
            "description": "Test",
            "tags": ["a" * 100, "short"],
        })
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]

        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        with patch("src.services.llm._get_client", return_value=mock_client):
            result = await generate_link_metadata(
                "https://example.com", max_retries=1
            )

        assert len(result["tags"][0]) == 50
        assert result["tags"][1] == "short"

    async def test_invalid_tags_become_empty_list(self):
        mock_choice = MagicMock()
        mock_choice.message.content = json.dumps({
            "title": "Test",
            "description": "Test",
            "tags": "not a list",
        })
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]

        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        with patch("src.services.llm._get_client", return_value=mock_client):
            result = await generate_link_metadata(
                "https://example.com", max_retries=1
            )

        assert result["tags"] == []

    async def test_missing_tags_key_becomes_empty_list(self):
        mock_choice = MagicMock()
        mock_choice.message.content = json.dumps({
            "title": "Test",
            "description": "Test",
        })
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]

        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        with patch("src.services.llm._get_client", return_value=mock_client):
            result = await generate_link_metadata(
                "https://example.com", max_retries=1
            )

        assert result["tags"] == []

    async def test_missing_title_and_description(self):
        mock_choice = MagicMock()
        mock_choice.message.content = json.dumps({
            "tags": ["a", "b", "c"],
        })
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]

        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        with patch("src.services.llm._get_client", return_value=mock_client):
            result = await generate_link_metadata(
                "https://example.com", max_retries=1
            )

        assert result["title"] == ""
        assert result["description"] == ""

    async def test_all_retries_exhausted_returns_none(self):
        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(
            side_effect=json.JSONDecodeError("expecting value", "", 0)
        )

        with patch("src.services.llm._get_client", return_value=mock_client):
            result = await generate_link_metadata(
                "https://example.com", max_retries=3
            )

        assert result is None
        assert mock_client.chat.completions.create.call_count == 3

    async def test_api_error_with_429_waits_between_retries(self):
        mock_client = AsyncMock()
        error = APIError(
            request=MagicMock(),
            message="Rate limited",
            body=None,
        )
        error.status_code = 429
        mock_client.chat.completions.create = AsyncMock(side_effect=error)

        with patch("src.services.llm._get_client", return_value=mock_client):
            result = await generate_link_metadata(
                "https://example.com", max_retries=2
            )

        assert result is None
        # Should have tried 2 times with waits between
        assert mock_client.chat.completions.create.call_count == 2

    async def test_key_error_from_malformed_response(self):
        mock_choice = MagicMock()
        mock_choice.message.content = json.dumps({
            "title": "Test",
            "description": "Test",
            "tags": ["a", "b", "c"],
        })
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]

        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        with patch("src.services.llm._get_client", return_value=mock_client):
            result = await generate_link_metadata(
                "https://example.com", max_retries=1
            )

        assert result is not None
        assert result["title"] == "Test"

    async def test_type_error_from_none_value(self):
        mock_choice = MagicMock()
        mock_choice.message.content = json.dumps({
            "title": "Test Title",
            "description": "Test Description",
            "tags": ["a", "b", "c"],
        })
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]

        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        with patch("src.services.llm._get_client", return_value=mock_client):
            result = await generate_link_metadata(
                "https://example.com", max_retries=1
            )

        assert result["title"] == "Test Title"
        assert result["description"] == "Test Description"
        assert result["tags"] == ["a", "b", "c"]


class TestGenerateEmbeddingGapCoverage:
    async def test_truncates_embedding_to_1024_dimensions(self):
        mock_data = MagicMock()
        mock_data.embedding = [0.5] * 2048
        mock_response = MagicMock()
        mock_response.data = [mock_data]

        mock_client = AsyncMock()
        mock_client.embeddings.create = AsyncMock(return_value=mock_response)

        with patch("src.services.llm._get_client", return_value=mock_client):
            result = await generate_embedding("test text")

        assert len(result) == 1024
        assert result[0] == 0.5

    async def test_returns_embedding_as_is_when_1024_or_less(self):
        mock_data = MagicMock()
        mock_data.embedding = [0.1] * 512
        mock_response = MagicMock()
        mock_response.data = [mock_data]

        mock_client = AsyncMock()
        mock_client.embeddings.create = AsyncMock(return_value=mock_response)

        with patch("src.services.llm._get_client", return_value=mock_client):
            result = await generate_embedding("test text")

        assert len(result) == 512

    async def test_null_embedding_triggers_retry(self):
        mock_data = MagicMock()
        mock_data.embedding = None
        mock_response_bad = MagicMock()
        mock_response_bad.data = [mock_data]

        mock_data_ok = MagicMock()
        mock_data_ok.embedding = [0.1] * 256
        mock_response_ok = MagicMock()
        mock_response_ok.data = [mock_data_ok]

        mock_client = AsyncMock()
        mock_client.embeddings.create = AsyncMock(
            side_effect=[mock_response_bad, mock_response_ok]
        )

        with patch("src.services.llm._get_client", return_value=mock_client):
            result = await generate_embedding("test text", max_retries=2)

        assert result is not None
        assert len(result) == 256

    async def test_null_embedding_exhausts_retries(self):
        mock_data = MagicMock()
        mock_data.embedding = None
        mock_response = MagicMock()
        mock_response.data = [mock_data]

        mock_client = AsyncMock()
        mock_client.embeddings.create = AsyncMock(return_value=mock_response)

        with patch("src.services.llm._get_client", return_value=mock_client):
            result = await generate_embedding("test text", max_retries=2)

        assert result is None

    async def test_unexpected_embedding_structure(self):
        mock_data = MagicMock()

        class WeirdEmbedding:
            def __iter__(self):
                raise TypeError("not iterable")

        mock_data.embedding = WeirdEmbedding()
        mock_response = MagicMock()
        mock_response.data = [mock_data]

        mock_data_ok = MagicMock()
        mock_data_ok.embedding = [0.1] * 128
        mock_response_ok = MagicMock()
        mock_response_ok.data = [mock_data_ok]

        mock_client = AsyncMock()
        mock_client.embeddings.create = AsyncMock(
            side_effect=[mock_response, mock_response_ok]
        )

        with patch("src.services.llm._get_client", return_value=mock_client):
            result = await generate_embedding("test text", max_retries=2)

        assert result is not None
        assert len(result) == 128

    async def test_rate_limit_429_waits_before_retry(self):
        mock_data = MagicMock()
        mock_data.embedding = [0.1] * 256
        mock_response_ok = MagicMock()
        mock_response_ok.data = [mock_data]

        error = APIError(
            request=MagicMock(),
            message="Rate limited",
            body=None,
        )
        error.status_code = 429

        mock_client = AsyncMock()
        mock_client.embeddings.create = AsyncMock(
            side_effect=[error, mock_response_ok]
        )

        with patch("src.services.llm._get_client", return_value=mock_client):
            result = await generate_embedding("test text", max_retries=2)

        assert result is not None

    async def test_all_retries_exhausted(self):
        mock_client = AsyncMock()
        error = APIError(
            request=MagicMock(),
            message="Server error",
            body=None,
        )
        error.status_code = 500
        mock_client.embeddings.create = AsyncMock(side_effect=error)

        with patch("src.services.llm._get_client", return_value=mock_client):
            result = await generate_embedding("test text", max_retries=3)

        assert result is None
        assert mock_client.embeddings.create.call_count == 3

    async def test_embedding_with_generator(self):
        """Test that embedding can handle iterator objects (e.g. from async generators)."""
        def embedding_gen():
            return iter([0.1, 0.2, 0.3])

        mock_data = MagicMock()
        mock_data.embedding = embedding_gen()
        mock_response = MagicMock()
        mock_response.data = [mock_data]

        mock_client = AsyncMock()
        mock_client.embeddings.create = AsyncMock(return_value=mock_response)

        with patch("src.services.llm._get_client", return_value=mock_client):
            result = await generate_embedding("test text")

        assert result == [0.1, 0.2, 0.3]


class TestBuildLinkTextGapCoverage:
    async def test_empty_strings(self):
        result = await build_link_text("", "")
        assert result == ""

    async def test_only_title_empty(self):
        result = await build_link_text("", "desc")
        assert result == "desc"

    async def test_only_description_empty(self):
        result = await build_link_text("title", "")
        assert result == "title"

    async def test_whitespace_title(self):
        result = await build_link_text("   ", "desc")
        assert result == "    desc"

    async def test_long_title_and_description(self):
        title = "T" * 500
        desc = "D" * 500
        result = await build_link_text(title, desc)
        assert result.startswith("T" * 500)
        assert result.endswith("D" * 500)
        assert " " in result

    async def test_unicode_content(self):
        result = await build_link_text("日本語タイトル", "Descripción en español")
        assert "日本語タイトル" in result
        assert "Descripción en español" in result
