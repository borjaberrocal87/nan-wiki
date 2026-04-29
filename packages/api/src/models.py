from datetime import datetime

from sqlalchemy import BigInteger, Integer, Text, VARCHAR, Boolean, Index, ForeignKey, func, desc
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import VECTOR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


class Source(Base):
    __tablename__ = "sources"

    id: Mapped[str] = mapped_column(VARCHAR(50), primary_key=True)
    name: Mapped[str] = mapped_column(VARCHAR(100), nullable=False)

    links = relationship("Link", back_populates="source")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    username: Mapped[str] = mapped_column(VARCHAR(100), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    discriminator: Mapped[str | None] = mapped_column(VARCHAR(4), nullable=True)
    joined_at: Mapped[datetime] = mapped_column(nullable=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)

    links = relationship("Link", back_populates="author")


class Channel(Base):
    __tablename__ = "channels"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(VARCHAR(200), nullable=False)
    guild_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    category: Mapped[str | None] = mapped_column(VARCHAR(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(nullable=True)

    links = relationship("Link", back_populates="channel")


class Link(Base):
    __tablename__ = "links"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    url: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    domain: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)
    source_id: Mapped[str] = mapped_column(VARCHAR(50), ForeignKey("sources.id"), nullable=False)
    author_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=True)
    channel_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("channels.id"), nullable=True)
    discord_message_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    discord_channel_name: Mapped[str | None] = mapped_column(VARCHAR(200), nullable=True)
    posted_at: Mapped[datetime] = mapped_column(nullable=False)

    # LLM fields
    llm_status: Mapped[str] = mapped_column(VARCHAR(20), default="pending")
    title: Mapped[str | None] = mapped_column(VARCHAR(500), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_detected: Mapped[str | None] = mapped_column(VARCHAR(50), nullable=True)
    embedding: Mapped[list | None] = mapped_column(VECTOR(1024), nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(nullable=True)
    updated_at: Mapped[datetime] = mapped_column(nullable=True)

    author = relationship("User", back_populates="links")
    channel = relationship("Channel", back_populates="links")
    source = relationship("Source", back_populates="links")
    link_tags = relationship("LinkTag", back_populates="link", cascade="all, delete-orphan")


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    name: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())

    link_tags = relationship("LinkTag", back_populates="tag", cascade="all, delete-orphan")


class LinkTag(Base):
    __tablename__ = "link_tags"

    __table_args__ = ()

    link_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("links.id", ondelete="CASCADE"),
        primary_key=True,
    )
    tag_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
    )
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())

    link = relationship("Link", back_populates="link_tags")
    tag = relationship("Tag", back_populates="link_tags")


# Índices
Index("idx_links_source_id", Link.source_id)
Index("idx_links_posted_at", desc(Link.posted_at))
Index("idx_links_domain", Link.domain)
Index("idx_link_tags_tag_id", LinkTag.tag_id)
