"""
Organizations API routes.

Endpoints:
- POST   /organizations                            → create organization        (authenticated)
- POST   /organizations/join                       → join org by join_code      (authenticated)
- PATCH  /organizations/{org_id}                   → select scrum role          (authenticated member)
- GET    /organizations/{org_id}/members           → list members + active work (any member)
- POST   /organizations/{org_id}/members           → invite member by email     (admin)
- DELETE /organizations/{org_id}/members/{user_id} → remove member              (admin)

Authorization follows the dependency helpers in src.api.deps:
- require_org_permission(action): for endpoints that require org membership or admin role
"""

import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.database.models import User
from src.api.deps import get_current_user, require_org_permission
from src.organizations import service
from src.organizations.schemas import (
	OrgCreateRequest,
	OrgCreateResponse,
	OrgSelectRoleRequest,
	OrgSelectRoleResponse,
	OrgGetMemberResponse,
	OrgInviteMemberRequest,
	OrgInviteMemberResponse,
	OrgJoinRequest,
	OrgJoinResponse,
)
from src.tickets.schemas import TicketBriefOrg
from src.tasks.schemas import TaskBriefOrg
from src.blockers.schemas import BlockerBriefOrg
from src.database.models.enums import TicketStatus, TaskStatus, BlockerStatus

router = APIRouter()


# ── Routes ────────────────────────────────────────────────────────────

@router.post(
	"/organizations",
	response_model=OrgCreateResponse,
	status_code=status.HTTP_201_CREATED,
)
def create_organization(
	body: OrgCreateRequest,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
):
	org = service.create_organization(db=db, user=current_user, name=body.name)
	return OrgCreateResponse(
		id=org.id,
		name=org.name,
		join_code=org.join_code,
		created_by=org.created_by,
	)


# NOTE: /organizations/join must be registered BEFORE /organizations/{org_id}
# to prevent FastAPI from interpreting "join" as an org_id path parameter.
@router.post(
	"/organizations/join",
	response_model=OrgJoinResponse,
	status_code=status.HTTP_200_OK,
)
def join_organization(
	body: OrgJoinRequest,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
):
	result = service.join_organization(
		db=db,
		user=current_user,
		join_code=body.join_code,
	)
	return OrgJoinResponse(**result)


@router.patch(
	"/organizations/{org_id}",
	response_model=OrgSelectRoleResponse,
	status_code=status.HTTP_201_CREATED,
)
def select_role(
	org_id: uuid.UUID,
	body: OrgSelectRoleRequest,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
):
	scrum_role = service.select_role(
		db=db,
		user=current_user,
		org_id=org_id,
		scrum_role=body.scrum_role,
	)
	return OrgSelectRoleResponse(organization_id=org_id, scrum_role=scrum_role)


@router.get(
	"/organizations/{org_id}/members",
	response_model=list[OrgGetMemberResponse],
	status_code=status.HTTP_200_OK,
)
def get_organization_members(
	org_id: uuid.UUID,
	db: Session = Depends(get_db),
	current_user: User = Depends(require_org_permission("organizations:members:list")),
):
	members = service.get_organization_members(db=db, org_id=org_id)
	return [
		OrgGetMemberResponse(
			id=m.id,
			name=m.name,
			avatar_url=m.avatar_url,
			org_role=m.org_role,
			scrum_role=m.scrum_role,
			tickets=[TicketBriefOrg.model_validate(t) for t in m.tickets_assigned if t.status != TicketStatus.COMPLETED],
			tasks=[TaskBriefOrg.model_validate(t) for t in m.tasks_assigned if t.status != TaskStatus.COMPLETED],
			blockers=[BlockerBriefOrg.model_validate(b) for b in m.created_blockers if b.status == BlockerStatus.OPEN],
		)
		for m in members
	]


@router.post(
	"/organizations/{org_id}/members",
	response_model=OrgInviteMemberResponse,
	status_code=status.HTTP_201_CREATED,
)
def invite_member(
	org_id: uuid.UUID,
	body: OrgInviteMemberRequest,
	db: Session = Depends(get_db),
	current_user: User = Depends(require_org_permission("organizations:members:invite")),
):
	email = service.invite_member(
		db=db,
		org_id=org_id,
		name=body.name,
		email=body.email,
	)
	return OrgInviteMemberResponse(email=email)


@router.delete(
	"/organizations/{org_id}/members/{user_id}",
	status_code=status.HTTP_204_NO_CONTENT,
)
def remove_member(
	org_id: uuid.UUID,
	user_id: uuid.UUID,
	db: Session = Depends(get_db),
	current_user: User = Depends(require_org_permission("organizations:members:remove")),
):
	service.remove_member(db=db, org_id=org_id, user_id=user_id)
