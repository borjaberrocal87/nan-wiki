import os
import pytest

# Set minimal env vars before any source module is imported
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
os.environ.setdefault("JWT_SECRET", "test-secret-key-for-testing")
os.environ.setdefault("DISCORD_CLIENT_ID", "test-client-id")
os.environ.setdefault("DISCORD_CLIENT_SECRET", "test-client-secret")
os.environ.setdefault("DISCORD_REDIRECT_URI", "http://localhost:3000/api/auth/discord/callback")
os.environ.setdefault("DISCORD_GUILD_ID", "123456789")
os.environ.setdefault("FRONTEND_URL", "http://localhost:3000")
os.environ.setdefault("LLM_BASE_URL", "http://localhost:11434/v1")
os.environ.setdefault("LLM_MODEL", "llama3")
os.environ.setdefault("EMBEDDING_MODEL", "nomic-embed-text")
os.environ.setdefault("LLM_API_KEY", "test-api-key")
os.environ.setdefault("WORKER_CONCURRENCY", "1")
os.environ.setdefault("WORKER_POLL_INTERVAL", "5")
os.environ.setdefault("MAX_RETRIES", "3")


@pytest.fixture(autouse=True)
def _clear_settings_cache():
    """
    Force re-import of src.config so each test gets fresh settings
    with the current env vars.
    """
    import sys

    # Remove cached config module so Settings() is re-evaluated
    modules_to_remove = [k for k in list(sys.modules.keys()) if k == "src.config"]
    for mod in modules_to_remove:
        del sys.modules[mod]

    yield
