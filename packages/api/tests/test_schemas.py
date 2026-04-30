from __future__ import annotations

from datetime import datetime

import pytest
from pydantic import ValidationError

from src.schemas import (
    LinkFilter,
    LinkRead,
    MessageRequest,
    TagRead,
)


class TestLinkFilter:
    def test_valid_filter_defaults(self):
        f = LinkFilter()
        assert f.page == 1
        assert f.per_page == 20
        assert f.sort == "posted_at"
        assert f.order == "desc"

    def test_valid_filter_with_all_fields(self):
        f = LinkFilter(
            source_id="github",
            tag_ids=["tag-1", "tag-2"],
            domain="github.com",
            channel_id=123,
            author_id=456,
            date_from=datetime(2025, 1, 1),
            date_to=datetime(2025, 12, 31),
            search_query="test",
            sort="title",
            order="asc",
            page=2,
            per_page=50,
        )
        assert f.source_id == "github"
        assert f.tag_ids == ["tag-1", "tag-2"]
        assert f.sort == "title"
        assert f.order == "asc"
        assert f.page == 2

    def test_sort_accepts_uppercase_and_lowercases_it(self):
        f = LinkFilter(sort="POSTED_AT")
        assert f.sort == "posted_at"

    def test_order_accepts_uppercase_and_lowercases_it(self):
        f = LinkFilter(order="ASC")
        assert f.order == "asc"

    def test_invalid_sort_raises_validation_error(self):
        with pytest.raises(ValidationError):
            LinkFilter(sort="invalid_sort")

    def test_invalid_order_raises_validation_error(self):
        with pytest.raises(ValidationError):
            LinkFilter(order="invalid_order")

    def test_page_must_be_positive(self):
        with pytest.raises(ValidationError):
            LinkFilter(page=0)

    def test_per_page_minimum(self):
        with pytest.raises(ValidationError):
            LinkFilter(per_page=0)

    def test_per_page_maximum(self):
        with pytest.raises(ValidationError):
            LinkFilter(per_page=101)

    def test_per_page_at_maximum_is_valid(self):
        f = LinkFilter(per_page=100)
        assert f.per_page == 100

    def test_null_fields_are_allowed(self):
        f = LinkFilter(source_id=None, tag_ids=None, domain=None)
        assert f.source_id is None
        assert f.tag_ids is None


class TestLinkRead:
    def test_minimal_link_read(self):
        link = LinkRead(
            id="link-1",
            url="https://example.com",
            domain="example.com",
            source_id="github",
            source_name="GitHub",
            posted_at=datetime(2025, 1, 1),
            llm_status="done",
            created_at=datetime(2025, 1, 1),
            updated_at=datetime(2025, 1, 1),
        )
        assert link.tags == []
        assert link.title is None
        assert link.author_id is None

    def test_full_link_read(self):
        link = LinkRead(
            id="link-1",
            url="https://example.com",
            domain="example.com",
            source_id="github",
            source_name="GitHub",
            author_id=123,
            author_username="testuser",
            channel_id=456,
            channel_name="dev",
            posted_at=datetime(2025, 1, 1),
            llm_status="done",
            title="Test",
            description="Desc",
            tags=[TagRead(id="t1", name="test")],
            created_at=datetime(2025, 1, 1),
            updated_at=datetime(2025, 1, 1),
        )
        assert link.author_id == 123
        assert link.author_username == "testuser"
        assert len(link.tags) == 1
        assert link.tags[0].name == "test"


class TestTagRead:
    def test_create_tag(self):
        tag = TagRead(id="tag-1", name="typescript")
        assert tag.id == "tag-1"
        assert tag.name == "typescript"


class TestMessageRequest:
    def test_valid_message(self):
        req = MessageRequest(message="What are the latest links?")
        assert req.message == "What are the latest links?"

    def test_strips_whitespace(self):
        req = MessageRequest(message="  hello  ")
        assert req.message == "hello"

    def test_strips_newlines(self):
        req = MessageRequest(message="\n  test  \n")
        assert req.message == "test"

    def test_empty_message_becomes_empty_string(self):
        req = MessageRequest(message="")
        assert req.message == ""

    def test_none_message_becomes_empty_string(self):
        req = MessageRequest(message=None)
        assert req.message == ""
