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
    EMBEDDING_MODEL: str
    LLM_API_KEY: str

    WORKER_CONCURRENCY: int
    WORKER_POLL_INTERVAL: int
    MAX_RETRIES: int

    class Config:
        env_file = ".env"


settings = Settings()
