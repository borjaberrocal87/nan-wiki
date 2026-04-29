from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    DISCORD_CLIENT_ID: str
    DISCORD_CLIENT_SECRET: str
    DISCORD_REDIRECT_URI: str
    DISCORD_GUILD_ID: str
    FRONTEND_URL: str = "http://localhost:3000"
    OPENAI_API_KEY: str

    class Config:
        env_file = ".env"

settings = Settings()
