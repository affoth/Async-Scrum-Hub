from uuid import UUID
from pydantic import BaseModel, ConfigDict


class UserBrief(BaseModel):
	id: UUID
	name: str
	avatar_url: str | None

	model_config = ConfigDict(from_attributes=True)
