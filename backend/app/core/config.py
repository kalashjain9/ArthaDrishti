from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import json


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # LLM
    OPENAI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    LLM_PROVIDER: str = "groq"  # "openai" | "groq"
    LLM_MODEL: str = "llama-3.3-70b-versatile"  # groq default
    EMBEDDING_MODEL: str = "text-embedding-3-small"

    # Market Data
    FINNHUB_API_KEY: str = ""
    NEWS_API_KEY: str = ""
    GNEWS_API_KEY: str = ""

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./arthadrishti.db"

    # Redis / Celery
    REDIS_URL: str = "redis://localhost:6379"

    # Auth
    SECRET_KEY: str = "change-me-in-production-use-32-chars-minimum"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    # Clerk (optional)
    CLERK_SECRET_KEY: str = ""
    CLERK_WEBHOOK_SECRET: str = ""

    # ChromaDB
    CHROMA_PERSIST_DIR: str = "./chroma_db"

    # App
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: str = '["http://localhost:3000"]'

    @property
    def cors_origins_list(self) -> List[str]:
        try:
            return json.loads(self.CORS_ORIGINS)
        except Exception:
            return ["http://localhost:3000"]

    @property
    def use_openai(self) -> bool:
        return self.LLM_PROVIDER == "openai"

    @property
    def llm_model(self) -> str:
        if self.use_openai:
            return "gpt-4o"
        return self.LLM_MODEL


settings = Settings()
