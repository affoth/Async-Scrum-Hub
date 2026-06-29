from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from src.database.models.enums import OrgRole, ScrumRole
from src.tickets.schemas import TicketBriefOrg
from src.tasks.schemas import TaskBriefOrg
from src.blockers.schemas import BlockerBriefOrg

class OrgCreateRequest(BaseModel):
	name: str = Field(..., min_length=1, max_length=50)

class OrgCreateResponse(BaseModel):
	id: UUID
	name: str
	join_code: str
	created_by: UUID

	model_config = ConfigDict(from_attributes=True)

class OrgSelectRoleRequest(BaseModel):
	scrum_role: ScrumRole

class OrgSelectRoleResponse(BaseModel):
	organization_id: UUID
	scrum_role: ScrumRole

	model_config = ConfigDict(from_attributes=True)

class OrgGetMemberResponse(BaseModel):
	id: UUID
	name: str
	avatar_url: Optional[str]
	org_role: OrgRole
	scrum_role: ScrumRole
	tickets: list[TicketBriefOrg]
	tasks: list[TaskBriefOrg]
	blockers: list[BlockerBriefOrg]

	model_config = ConfigDict(from_attributes=True)

class OrgInviteMemberRequest(BaseModel):
	name: str = Field(..., min_length=1)
	email: EmailStr

class OrgInviteMemberResponse(BaseModel):
	email: str
	model_config = ConfigDict(from_attributes=True)

class OrgJoinRequest(BaseModel):
	join_code: str = Field(..., min_length=1)

class available_SR(BaseModel):
	role: str

class OrgJoinResponse(BaseModel):
	organization_id: UUID
	org_role: OrgRole
	available_scrum_role: list[available_SR]

	model_config = ConfigDict(from_attributes=True)

