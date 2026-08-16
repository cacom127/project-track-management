from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://app:app@localhost:5433/app"

    # Data API (production, chạy trên Lambda) — xem ARCH-16.
    db_backend: str = "sqlalchemy"  # "sqlalchemy" (local) | "data-api" (production)
    db_cluster_arn: str = ""
    db_secret_arn: str = ""
    db_name: str = "app"


settings = Settings()
