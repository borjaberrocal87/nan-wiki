from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    DISCORD_CLIENT_ID: str
    DISCORD_CLIENT_SECRET: str
    DISCORD_REDIRECT_URI: str
    DISCORD_GUILD_ID: str
    FRONTEND_URL: str

    LLM_BASE_URL: str
    LLM_MODEL: str
    LLM_MODEL_NL2SQL: str = ""
    LLM_MODEL_ROWS2NL: str = ""
    EMBEDDING_MODEL: str
    LLM_API_KEY: str

    STATEMENT_TIMEOUT_MS: int = 8000
    MAX_ROWS: int = 100
    NL2SQL_MAX_RETRIES: int = 1

    WORKER_CONCURRENCY: int
    WORKER_POLL_INTERVAL: int
    MAX_RETRIES: int

    class Config:
        env_file = ".env"


settings = Settings()
