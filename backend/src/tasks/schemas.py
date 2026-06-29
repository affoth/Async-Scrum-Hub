from uuid import UUID
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
from src.database.models.enums import TaskStatus
from src.schemas.common import UserBrief

TITLE_MAX_LENGTH = 255
DESCRIPTION_MAX_LENGTH = 2000

class CreateTaskRequest(BaseModel):
	title: str = Field(..., min_length=1, max_length=TITLE_MAX_LENGTH)
	description: Optional[str] = Field(None, max_length=DESCRIPTION_MAX_LENGTH)
	assignee_id: UUID

class CreateTaskResponse(BaseModel):
	id: UUID
	title: str
	description: Optional[str]
	status: TaskStatus
	created_by: Optional[UserBrief]
	assignee_id: Optional[UUID]
	ticket_id: UUID

	model_config = ConfigDict(from_attributes=True)

class TaskBrief(BaseModel):
	id: UUID
	title: str
	status: TaskStatus
	assignee_id: Optional[UUID]

	model_config = ConfigDict(from_attributes=True)

class TaskBriefOrg(TaskBrief):
	ticket_id: UUID

class TaskDetailResponse(CreateTaskResponse):
	pass

class UpdateTaskRequest(BaseModel):
	title: Optional[str] = Field(None, min_length=1, max_length=TITLE_MAX_LENGTH)
	description: Optional[str] = Field(None, max_length=DESCRIPTION_MAX_LENGTH)
	status: Optional[TaskStatus] = None
	assignee_id: Optional[UUID] = None

	@field_validator("title", mode="before")
	@classmethod
	def title_cannot_be_null(cls, v):
		if v is None:
			raise ValueError("title cannot be null")
		return v

class UpdateTaskResponse(CreateTaskResponse):
	pass
