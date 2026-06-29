from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from src.database.models.enums import TicketStatus, Priority, TaskStatus
from src.users.schemas import UserBriefTicket
from src.schemas.common import UserBrief
from src.tasks.schemas import TaskBrief

class TicketBriefOrg(BaseModel):
	id: UUID
	title: str
	status: TicketStatus
	priority: Priority

	model_config = ConfigDict(from_attributes=True)

class TicketBriefList(TicketBriefOrg):
	assignee: Optional[UserBriefTicket] = None
	created_at: datetime
	updated_at: datetime

TITLE_MAX_LENGTH = 255
DESCRIPTION_MAX_LENGTH = 2000

class CreateTicketRequest(BaseModel):
	title: str = Field(..., min_length=1, max_length=TITLE_MAX_LENGTH)
	description: Optional[str] = Field(None, max_length=DESCRIPTION_MAX_LENGTH)
	priority: Priority
	assignee_id: UUID

class CreateTicketResponse(BaseModel):
	id: UUID
	title: str
	description: Optional[str]
	status: TicketStatus
	priority: Priority
	created_by: Optional[UserBrief]
	assignee_id: Optional[UUID]
	organization_id: UUID
	created_at: datetime
	updated_at: datetime
	
	model_config = ConfigDict(from_attributes=True)

class BlockerBriefTicket(BaseModel):
	id: UUID
	description: str
	status: str
	created_by: UserBrief

	model_config = ConfigDict(from_attributes=True)

class TicketDetailResponse(CreateTicketResponse):
	tasks: list[TaskBrief] = []
	blockers: list[BlockerBriefTicket] = []

class UpdateTicketRequest(BaseModel):
	title: Optional[str] = Field(None, min_length=1, max_length=TITLE_MAX_LENGTH)
	description: Optional[str] = Field(None, max_length=DESCRIPTION_MAX_LENGTH)
	priority: Optional[Priority] = None
	status: Optional[TicketStatus] = None
	assignee_id: Optional[UUID] = None

class UpdateTicketResponse(TicketDetailResponse):
	pass

class MoveTicketRequest(BaseModel):
	status: TicketStatus

class MoveTicketResponse(BaseModel):
	id: UUID
	status: TicketStatus
	updated_at: datetime

	model_config = ConfigDict(from_attributes=True)
