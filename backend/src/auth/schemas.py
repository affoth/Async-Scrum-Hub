from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, ConfigDict

class RegisterRequest(BaseModel):
	email: EmailStr
	name: str = Field(..., min_length=1)
	password: str = Field(..., min_length=8)

class RegisterResponse(BaseModel):
	id: UUID
	email: str
	name: str

	model_config = ConfigDict(from_attributes=True)
	
class LoginRequest(BaseModel):
	email: EmailStr
	password: str = Field(..., min_length=8)

class LoginResponse(BaseModel):
	access_token: str
	token_type: str