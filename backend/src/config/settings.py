"""
Application configuration loaded from environment variables (.env).

This class centralizes security-related settings such as:
- JWT secret key (required)
- JWT signing algorithm (default: HS256)
- Access token expiration time (minutes)
- SMTP email settings (optional, for invitation emails)

Using pydantic-settings ensures:
- Strong typing and validation
- Automatic loading from .env
- Clear separation between configuration and business logic
"""

from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
	jwt_secret_key: str = Field(..., alias="JWT_SECRET_KEY")
	jwt_algorithm: str = Field("HS256", alias="JWT_ALGORITHM")

	smtp_host: Optional[str] = Field(None, alias="SMTP_HOST")
	smtp_port: int = Field(587, alias="SMTP_PORT")
	smtp_user: Optional[str] = Field(None, alias="SMTP_USER")
	smtp_password: Optional[str] = Field(None, alias="SMTP_PASSWORD")
	smtp_from_email: Optional[str] = Field(None, alias="SMTP_FROM_EMAIL")

	model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
