from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from src.schemas.common import UserBrief


class TicketBrief(BaseModel):
	id: UUID
	title: str

	model_config = ConfigDict(from_attributes=True)

class BlockerBriefOrg(BaseModel):
	id: UUID
	description: str
	status: str
	created_at: datetime

	model_config = ConfigDict(from_attributes=True)

DESCRIPTION_MAX_LENGTH = 2000

class BlockerCreateRequest(BaseModel):
	description: str = Field(..., min_length=1, max_length=DESCRIPTION_MAX_LENGTH)
	ticket_id: UUID
	assignee_id: Optional[UUID] = None


class BlockerUpdateRequest(BaseModel):
	description: Optional[str] = Field(None, min_length=1, max_length=DESCRIPTION_MAX_LENGTH)
	ticket_id: Optional[UUID] = None
	assignee_id: Optional[UUID] = None


class BlockerResponse(BaseModel):
	id: UUID
	description: str
	status: str
	created_by: Optional[UserBrief]
	assignee: Optional[UserBrief] = None
	ticket: TicketBrief
	created_at: datetime
	resolved_at: Optional[datetime] = None

	model_config = ConfigDict(from_attributes=True)
