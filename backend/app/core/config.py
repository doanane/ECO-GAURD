from pydantic_settings import BaseSettings
from typing import List
from pathlib import Path


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./ecoguard.db"
    DATABASE_URL_FALLBACK: str = ""
    SECRET_KEY: str = "ecoguard-dev-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    APP_NAME: str = "EcoGuard Technologies Pipeline Integrity Platform"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"

    SENSOR_TICK_INTERVAL_MS: int = 2000
    LEAK_EVENT_PROBABILITY: float = 0.002
    WEBSOCKET_HEARTBEAT_INTERVAL: int = 30

    CORS_ORIGINS: str = "http://localhost:8081,http://localhost:19006,exp://localhost:19000,http://localhost:3000"

    LOG_LEVEL: str = "INFO"
    REPORTS_DIR: str = "reports"

    class Config:
        # Load from .env.local first (secrets), then .env (public config)
        env_file = [".env.local", ".env"]
        env_file_encoding = "utf-8"
        extra = "ignore"

    def get_cors_origins(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()

