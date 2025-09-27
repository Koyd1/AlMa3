from pydantic import BaseSettings


class Settings(BaseSettings):
    app_name: str = "AI Agents API"
    environment: str = "development"
    secret_key: str = "change-me"
    database_url: str = "sqlite:///./dev.db"

    class Config:
        env_file = ".env"


settings = Settings()

