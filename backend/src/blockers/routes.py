"""
Blockers API routes.

Endpoints:
- POST   /organizations/{org_id}/blockers          → create blocker         (any member)
- GET    /organizations/{org_id}/blockers          → list blockers          (any member; ?status=open|resolved)
- PATCH  /blockers/{blocker_id}                    → update blocker         (creator or SM)
- PATCH  /blockers/{blocker_id}/resolve            → resolve blocker        (creator or SM)

Authorization follows the dependency helpers in src.api.deps:
- require_org_permission(action):            for endpoints with org_id in path
- require_resource_permission(action, loader): for endpoints with blocker_id in path
"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.database.models import User
from src.database.models.organization import Organization
from src.database.models.blocker import Blocker
from src.api.deps import require_org_permission, require_resource_permission
from src.blockers import service
from src.blockers.schemas import (
	BlockerCreateRequest,
	BlockerUpdateRequest,
	BlockerResponse,
)
from src.realtime.connection_manager import manager

router = APIRouter()


def get_blocker_loader(blocker_id: uuid.UUID, db: Session = Depends(get_db)) -> Blocker:
	return service.get_blocker_by_id(blocker_id, db)


@router.post(
	"/organizations/{org_id}/blockers",
	response_model=BlockerResponse,
	status_code=status.HTTP_201_CREATED,
)
async def create_blocker(
	org_id: uuid.UUID,
	body: BlockerCreateRequest,
	db: Session = Depends(get_db),
	current_user: User = Depends(require_org_permission("organizations:blockers:create")),
):
	org = db.query(Organization).filter(Organization.id == org_id).first()
	if not org:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail={"error": {"code": "NOT_FOUND", "message": "Organization not found"}},
		)

	blocker = service.create_blocker(db, org_id, current_user, body.description, body.ticket_id, body.assignee_id)
	await manager.broadcast(
		str(org_id),
		"blocker.created",
		{
			"id": str(blocker.id),
			"description": blocker.description,
			"status": blocker.status.value if hasattr(blocker.status, "value") else blocker.status,
			"created_by": {
				"id": str(blocker.creator.id),
				"name": blocker.creator.name,
				"avatar_url": blocker.creator.avatar_url,
			},
			"assignee": {"id": str(blocker.assignee.id), "name": blocker.assignee.name} if blocker.assignee else None,
			"ticket": {"id": str(blocker.ticket.id), "title": blocker.ticket.title} if blocker.ticket else None,
			"created_at": blocker.created_at.isoformat(),
		},
	)
	return BlockerResponse(
		id=blocker.id,
		description=blocker.description,
		status=blocker.status,
		created_by=blocker.creator,
		assignee=blocker.assignee,
		ticket=blocker.ticket,
		created_at=blocker.created_at,
		resolved_at=blocker.resolved_at,
	)


@router.get(
	"/organizations/{org_id}/blockers",
	response_model=list[BlockerResponse],
	status_code=status.HTTP_200_OK,
)
def list_blockers(
	org_id: uuid.UUID,
	status_filter: Optional[str] = Query(None, alias="status"),
	db: Session = Depends(get_db),
	current_user: User = Depends(require_org_permission("organizations:blockers:list")),
):
	org = db.query(Organization).filter(Organization.id == org_id).first()
	if not org:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail={"error": {"code": "NOT_FOUND", "message": "Organization not found"}},
		)

	if status_filter is not None and status_filter not in ("open", "resolved"):
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail={"error": {"code": "INVALID_INPUT", "message": "status must be 'open' or 'resolved'"}},
		)

	blockers = service.list_blockers(db, org_id, status_filter)
	return [
		BlockerResponse(
			id=b.id,
			description=b.description,
			status=b.status,
			created_by=b.creator,
			assignee=b.assignee,
			ticket=b.ticket,
			created_at=b.created_at,
			resolved_at=b.resolved_at,
		)
		for b in blockers
	]


@router.patch(
	"/blockers/{blocker_id}",
	response_model=BlockerResponse,
	status_code=status.HTTP_200_OK,
)
async def update_blocker(
	body: BlockerUpdateRequest,
	db: Session = Depends(get_db),
	blocker: Blocker = Depends(require_resource_permission("blockers:update", get_blocker_loader)),
):
	updates = body.model_dump(exclude_unset=True)
	updated = service.update_blocker(db, blocker, updates)
	await manager.broadcast(
		str(updated.organization_id),
		"blocker.updated",
		{
			"id": str(updated.id),
			"description": updated.description,
			"assignee": {"id": str(updated.assignee.id), "name": updated.assignee.name} if updated.assignee else None,
			"ticket": {"id": str(updated.ticket.id), "title": updated.ticket.title} if updated.ticket else None,
		},
	)
	return BlockerResponse(
		id=updated.id,
		description=updated.description,
		status=updated.status,
		created_by=updated.creator,
		assignee=updated.assignee,
		ticket=updated.ticket,
		created_at=updated.created_at,
		resolved_at=updated.resolved_at,
	)


@router.patch(
	"/blockers/{blocker_id}/resolve",
	status_code=status.HTTP_204_NO_CONTENT,
)
async def resolve_blocker(
	db: Session = Depends(get_db),
	blocker: Blocker = Depends(require_resource_permission("blockers:resolve", get_blocker_loader)),
):
	service.resolve_blocker(db, blocker)
	await manager.broadcast(
		str(blocker.organization_id),
		"blocker.resolved",
		{
			"id": str(blocker.id),
			"resolved_at": blocker.resolved_at.isoformat(),
		},
	)
