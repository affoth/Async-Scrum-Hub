from uuid import UUID
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from src.schemas.common import UserBrief


STANDUP_MAX_LENGTH = 2000

class StandupCreateRequest(BaseModel):
	today: str = Field(..., min_length=1, max_length=STANDUP_MAX_LENGTH)


class StandupUpdateRequest(BaseModel):
	today: Optional[str] = Field(None, min_length=1, max_length=STANDUP_MAX_LENGTH)


class TicketBrief(BaseModel):
	id: UUID
	title: str

	model_config = ConfigDict(from_attributes=True)


# NOTE: API contract names this field "title" but the Blocker model uses "description".
# Using "description" here to match the model. If the contract needs "title",
# the Blocker model should be updated to add a title field.
class BlockerBriefInStandup(BaseModel):
	id: UUID
	description: str
	ticket: Optional[TicketBrief] = None

	model_config = ConfigDict(from_attributes=True)


class StandupCreateResponse(BaseModel):
	id: UUID
	created_at: datetime
	standup_date: date
	today: str
	yesterday: Optional[str]
	blocker_ids: Optional[list[UUID]]
	created_by: Optional[UserBrief]

	model_config = ConfigDict(from_attributes=True)


class StandupResponse(BaseModel):
	id: UUID
	created_at: datetime
	standup_date: date
	today: str
	yesterday: Optional[str]
	blockers: list[BlockerBriefInStandup]
	created_by: Optional[UserBrief]

	model_config = ConfigDict(from_attributes=True)
