from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://zhinan:zhinan123@localhost:5432/zhinan"

    # LLM 配置 - 支持多模型
    llm_provider: str = "deepseek"
    llm_api_key: str = ""
    llm_model: str = "deepseek-chat"

    # API Base URLs
    deepseek_api_base: str = "https://api.deepseek.com/v1"
    openai_api_base: str = "https://api.openai.com/v1"
    custom_api_base: str = ""

    # Application
    secret_key: str = "your-secret-key-change-in-production"
    debug: bool = True

    # CORS
    cors_origins: list = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings():
    return Settings()
