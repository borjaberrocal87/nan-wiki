from sqlalchemy import BigInteger, Text, VARCHAR, Boolean, ARRAY, Index
from sqlalchemy.dialects.postgresql import UUID, VECTOR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    username: Mapped[str] = mapped_column(VARCHAR(100), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    discriminator: Mapped[str | None] = mapped_column(VARCHAR(4), nullable=True)
    joined_at: Mapped[str] = mapped_column(nullable=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)

    links = relationship("Link", back_populates="author")
    conversations = relationship("ChatConversation", back_populates="user")


class Channel(Base):
    __tablename__ = "channels"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(VARCHAR(200), nullable=False)
    guild_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    category: Mapped[str | None] = mapped_column(VARCHAR(200), nullable=True)
    created_at: Mapped[str] = mapped_column(nullable=True)

    links = relationship("Link", back_populates="channel")


class Link(Base):
    __tablename__ = "links"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    url: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    domain: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)
    source: Mapped[str] = mapped_column(VARCHAR(50), nullable=False)
    raw_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    author_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    channel_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    discord_message_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    discord_channel_name: Mapped[str | None] = mapped_column(VARCHAR(200), nullable=True)
    posted_at: Mapped[str] = mapped_column(nullable=False)

    # LLM fields
    llm_status: Mapped[str] = mapped_column(VARCHAR(20), default="pending")
    title: Mapped[str | None] = mapped_column(VARCHAR(500), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags: Mapped[list] = mapped_column(ARRAY(Text), default=[])
    source_detected: Mapped[str | None] = mapped_column(VARCHAR(50), nullable=True)
    embedding: Mapped[list | None] = mapped_column(VECTOR(1536), nullable=True)

    created_at: Mapped[str] = mapped_column(nullable=True)
    updated_at: Mapped[str] = mapped_column(nullable=True)

    author = relationship("User", back_populates="links")
    channel = relationship("Channel", back_populates="links")


class ChatConversation(Base):
    __tablename__ = "chat_conversations"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    user_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    session_id: Mapped[str] = mapped_column(UUID(as_uuid=True), nullable=False)
    created_at: Mapped[str] = mapped_column(nullable=True)

    user = relationship("User", back_populates="conversations")
    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    conversation_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
    )
    role: Mapped[str] = mapped_column(VARCHAR(10), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[str] = mapped_column(nullable=True)

    conversation = relationship("ChatConversation", back_populates="messages")


# Índices
Index("idx_links_source", Link.source)
Index("idx_links_tags", Link.tags, postgresql_using="gin")
Index("idx_links_posted_at", Link.posted_at, postgresql_order_by="desc")
Index("idx_links_domain", Link.domain)
Index(
    "idx_links_embedding",
    Link.embedding,
    postgresql_using="ivfflat",
    postgresql_with={"lists": 100},
    postgresql_ops={"embedding": "vector_cosine_ops"},
)
