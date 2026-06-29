from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict, EmailStr

class UpdateUserRequest(BaseModel):
	name: str | None = Field(None, min_length=1)
	email: EmailStr | None = None

class UserResponse(BaseModel):
	id: UUID
	email: str
	name: str
	org_name: str | None
	avatar_url: str | None
	organization_id: UUID | None
	scrum_role: str | None
	org_role: str | None

	model_config = ConfigDict(from_attributes=True)

class AvatarResponse(BaseModel):
	avatar_url: str

class UserBriefTicket(BaseModel):
	id: UUID
	name: str
	avatar_url: str | None

	model_config = ConfigDict(from_attributes=True)