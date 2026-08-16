from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://app:app@localhost:5433/app"

    # Data API (production, chạy trên Lambda) — xem ARCH-16.
    db_backend: str = "sqlalchemy"  # "sqlalchemy" (local) | "data-api" (production)
    db_cluster_arn: str = ""
    db_secret_arn: str = ""
    db_name: str = "app"

    # Danh sách origin cho phép CORS, phân cách bởi dấu phẩy.
    cors_origins: str = "http://localhost:5173"


settings = Settings()
