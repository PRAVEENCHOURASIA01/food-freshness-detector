"""
Application configuration via environment variables.
Uses pydantic-settings for validated, typed settings.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    app_reload: bool = True

    # Model paths (relative to backend root)
    yolo_weights_path: str = "weights/yolov8n.pt"
    freshness_weights_path: str = "weights/freshness_classifier.pt"
    device: str = "cpu"

    # CORS — comma-separated list of allowed origins
    allowed_origins: str = "http://localhost:3000"

    # Inference
    detection_confidence: float = 0.25

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    """Cached singleton so settings are parsed once at startup."""
    return Settings()
