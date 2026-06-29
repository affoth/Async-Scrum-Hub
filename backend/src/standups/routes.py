"""
Standups API routes.

Endpoints:
- POST   /organizations/{org_id}/standups          → create standup         (any member)
- GET    /organizations/{org_id}/standups          → list standups          (any member)
- PATCH  /standups/{standup_id}                    → update standup         (owner only, same day)
- DELETE /standups/{standup_id}                    → delete standup         (owner or SM)

Authorization follows the dependency helpers in src.api.deps:
- require_org_permission(action):            for endpoints with org_id in path
- require_resource_permission(action, loader): for endpoints with standup_id in path
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.database.models import User
from src.database.models.organization import Organization
from src.database.models.standup import Standup
from src.api.deps import get_current_user, require_org_permission, require_resource_permission
from src.standups import service
from src.standups.schemas import (
	StandupCreateRequest,
	StandupUpdateRequest,
	StandupCreateResponse,
	StandupResponse,
)
from src.realtime.connection_manager import manager

router = APIRouter()


def get_standup_loader(standup_id: uuid.UUID, db: Session = Depends(get_db)) -> Standup:
	return service.get_standup_by_id(standup_id, db)


@router.post(
	"/organizations/{org_id}/standups",
	response_model=StandupCreateResponse,
	status_code=status.HTTP_201_CREATED,
)
async def create_standup(
	org_id: uuid.UUID,
	body: StandupCreateRequest,
	db: Session = Depends(get_db),
	current_user: User = Depends(require_org_permission("organizations:standups:create")),
):
	org = db.query(Organization).filter(Organization.id == org_id).first()
	if not org:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail={"error": {"code": "NOT_FOUND", "message": "Organization not found"}},
		)

	standup = service.create_standup(db, org_id, current_user, body.today)
	response = StandupCreateResponse(
		id=standup.id,
		created_at=standup.created_at,
		standup_date=standup.standup_date,
		today=standup.today,
		yesterday=standup.yesterday,
		blocker_ids=standup.blocker_ids,
		created_by=standup.creator,
	)
	await manager.broadcast(
		str(org_id),
		"standup.created",
		{
			"id": str(standup.id),
			"created_at": standup.created_at.isoformat(),
			"today": standup.today,
			"yesterday": standup.yesterday,
			"blocker_ids": [str(bid) for bid in (standup.blocker_ids or [])],
			"created_by": {
				"id": str(standup.creator.id),
				"name": standup.creator.name,
				"avatar_url": standup.creator.avatar_url,
			},
		},
	)
	return response


@router.get(
	"/organizations/{org_id}/standups",
	response_model=list[StandupResponse],
	status_code=status.HTTP_200_OK,
)
def list_standups(
	org_id: uuid.UUID,
	db: Session = Depends(get_db),
	current_user: User = Depends(require_org_permission("organizations:standups:list")),
):
	org = db.query(Organization).filter(Organization.id == org_id).first()
	if not org:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail={"error": {"code": "NOT_FOUND", "message": "Organization not found"}},
		)

	standups = service.list_standups(db, org_id)
	result = []
	for standup in standups:
		blockers = service.resolve_blocker_ids(db, standup.blocker_ids)
		result.append(StandupResponse(
			id=standup.id,
			created_at=standup.created_at,
			standup_date=standup.standup_date,
			today=standup.today,
			yesterday=standup.yesterday,
			blockers=blockers,
			created_by=standup.creator,
		))
	return result


@router.patch(
	"/standups/{standup_id}",
	response_model=StandupResponse,
	status_code=status.HTTP_200_OK,
)
async def update_standup(
	body: StandupUpdateRequest,
	db: Session = Depends(get_db),
	standup: Standup = Depends(require_resource_permission("standups:update", get_standup_loader)),
	current_user: User = Depends(get_current_user),
):
	updated = service.update_standup(db, standup, body.today)
	blockers = service.resolve_blocker_ids(db, updated.blocker_ids)
	await manager.broadcast(
		str(updated.organization_id),
		"standup.updated",
		{
			"id": str(updated.id),
			"today": updated.today,
			"updated_by": {
				"id": str(current_user.id),
				"name": current_user.name,
			},
		},
	)
	return StandupResponse(
		id=updated.id,
		created_at=updated.created_at,
		standup_date=updated.standup_date,
		today=updated.today,
		yesterday=updated.yesterday,
		blockers=blockers,
		created_by=updated.creator,
	)


@router.delete(
	"/standups/{standup_id}",
	status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_standup(
	db: Session = Depends(get_db),
	standup: Standup = Depends(require_resource_permission("standups:delete", get_standup_loader)),
):
	org_id = str(standup.organization_id)
	standup_id = str(standup.id)
	service.delete_standup(db, standup)
	await manager.broadcast(org_id, "standup.deleted", {"id": standup_id})
