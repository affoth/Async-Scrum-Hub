"""
Tickets API routes.

Endpoints:
- POST   /organizations/{org_id}/tickets          → create ticket   (SM, PO)
- GET    /organizations/{org_id}/tickets          → list tickets    (any member)
- GET    /tickets/{ticket_id}                     → ticket details  (any member)
- PATCH  /tickets/{ticket_id}                     → update ticket   (SM, PO – priority PO only)
- PATCH  /tickets/{ticket_id}/move                → move ticket     (SM, PO)
- DELETE /tickets/{ticket_id}                     → delete ticket   (SM, PO)

Authorization follows the dependency helpers in src.api.deps:
- require_org_permission(action):           for endpoints with org_id in path
- require_resource_permission(action, loader): for endpoints with ticket_id in path
"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.database.models import User
from src.database.models.organization import Organization
from src.database.models.ticket import Ticket
from src.database.models.enums import TicketStatus, Priority
from src.api.deps import get_current_user, require_org_permission, require_resource_permission
from src.tickets import service
from src.schemas.common import UserBrief
from src.realtime.connection_manager import manager
from src.tickets.schemas import (
	CreateTicketRequest,
	CreateTicketResponse,
	TicketBriefList,
	TicketDetailResponse,
	BlockerBriefTicket,
	UpdateTicketRequest,
	UpdateTicketResponse,
	MoveTicketRequest,
	MoveTicketResponse,
)

router = APIRouter()


# ── Loader (FastAPI dependency for resource-scoped endpoints) ─────────

def get_ticket_loader(ticket_id: uuid.UUID, db: Session = Depends(get_db)) -> Ticket:
	return service.get_ticket_by_id(ticket_id, db)


# ── Routes ────────────────────────────────────────────────────────────

@router.post(
	"/organizations/{org_id}/tickets",
	response_model=CreateTicketResponse,
	status_code=status.HTTP_201_CREATED,
)
async def create_ticket(
	org_id: uuid.UUID,
	body: CreateTicketRequest,
	db: Session = Depends(get_db),
	current_user: User = Depends(require_org_permission("organizations:tickets:create")),
):
	org = db.query(Organization).filter(Organization.id == org_id).first()
	if not org:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail={"error": {"code": "NOT_FOUND", "message": "Organization not found"}},
		)

	ticket = service.create_ticket(
		db=db,
		org_id=org_id,
		user=current_user,
		title=body.title,
		description=body.description,
		priority=body.priority,
		assignee_id=body.assignee_id,
	)
	await manager.broadcast(
		str(org_id),
		"ticket.created",
		{
			"id": str(ticket.id),
			"title": ticket.title,
			"description": ticket.description,
			"status": ticket.status.value if hasattr(ticket.status, "value") else ticket.status,
			"priority": ticket.priority.value if hasattr(ticket.priority, "value") else ticket.priority,
			"assignee": {"id": str(ticket.assignee.id), "name": ticket.assignee.name} if ticket.assignee else None,
			"created_by": str(ticket.created_by),
			"created_at": ticket.created_at.isoformat(),
		},
	)
	return CreateTicketResponse(
		id=ticket.id,
		title=ticket.title,
		description=ticket.description,
		status=ticket.status,
		priority=ticket.priority,
		created_by=UserBrief.model_validate(ticket.creator),
		assignee_id=ticket.assignee_id,
		organization_id=ticket.organization_id,
		created_at=ticket.created_at,
		updated_at=ticket.updated_at,
	)


@router.get(
	"/organizations/{org_id}/tickets",
	response_model=list[TicketBriefList],
	status_code=status.HTTP_200_OK,
)
def list_tickets(
	org_id: uuid.UUID,
	status_filter: Optional[TicketStatus] = Query(None, alias="status"),
	priority_filter: Optional[Priority] = Query(None, alias="priority"),
	db: Session = Depends(get_db),
	current_user: User = Depends(require_org_permission("organizations:tickets:list")),
):
	org = db.query(Organization).filter(Organization.id == org_id).first()
	if not org:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail={"error": {"code": "NOT_FOUND", "message": "Organization not found"}},
		)

	tickets = service.list_tickets(
		db=db,
		org_id=org_id,
		status_filter=status_filter,
		priority_filter=priority_filter,
	)
	return [
		TicketBriefList(
			id=t.id,
			title=t.title,
			status=t.status,
			priority=t.priority,
			assignee=t.assignee,
			created_at=t.created_at,
			updated_at=t.updated_at,
		)
		for t in tickets
	]


@router.get(
	"/tickets/{ticket_id}",
	response_model=TicketDetailResponse,
	status_code=status.HTTP_200_OK,
)
def get_ticket_detail(
	ticket: Ticket = Depends(require_resource_permission("tickets:details", get_ticket_loader)),
):
	return TicketDetailResponse(
		id=ticket.id,
		title=ticket.title,
		description=ticket.description,
		status=ticket.status,
		priority=ticket.priority,
		created_by=UserBrief.model_validate(ticket.creator),
		assignee_id=ticket.assignee_id,
		organization_id=ticket.organization_id,
		created_at=ticket.created_at,
		updated_at=ticket.updated_at,
		tasks=ticket.tasks,
		blockers=[
			BlockerBriefTicket(
				id=b.id,
				description=b.description,
				status=b.status,
				created_by=UserBrief.model_validate(b.creator),
			)
			for b in ticket.blockers
		],
	)


@router.patch(
	"/tickets/{ticket_id}",
	response_model=UpdateTicketResponse,
	status_code=status.HTTP_200_OK,
)
async def update_ticket(
	body: UpdateTicketRequest,
	db: Session = Depends(get_db),
	ticket: Ticket = Depends(require_resource_permission("tickets:update", get_ticket_loader)),
	current_user: User = Depends(get_current_user),
):
	updates = body.model_dump(exclude_unset=True)
	updated = service.update_ticket(
		db=db,
		ticket=ticket,
		user=current_user,
		updates=updates,
	)
	await manager.broadcast(
		str(updated.organization_id),
		"ticket.updated",
		{
			"id": str(updated.id),
			"title": updated.title,
			"description": updated.description,
			"priority": updated.priority.value if hasattr(updated.priority, "value") else updated.priority,
			"assignee": {"id": str(updated.assignee.id), "name": updated.assignee.name} if updated.assignee else None,
			"updated_at": updated.updated_at.isoformat(),
		},
	)
	return UpdateTicketResponse(
		id=updated.id,
		title=updated.title,
		description=updated.description,
		status=updated.status,
		priority=updated.priority,
		created_by=UserBrief.model_validate(updated.creator),
		assignee_id=updated.assignee_id,
		organization_id=updated.organization_id,
		created_at=updated.created_at,
		updated_at=updated.updated_at,
		tasks=ticket.tasks,
		blockers=[
			BlockerBriefTicket(
				id=b.id,
				description=b.description,
				status=b.status,
				created_by=UserBrief.model_validate(b.creator),
			)
			for b in ticket.blockers
		],
	)


@router.patch(
	"/tickets/{ticket_id}/move",
	response_model=MoveTicketResponse,
	status_code=status.HTTP_200_OK,
)
async def move_ticket(
	body: MoveTicketRequest,
	db: Session = Depends(get_db),
	ticket: Ticket = Depends(require_resource_permission("tickets:move", get_ticket_loader)),
):
	moved = service.move_ticket(
		db=db,
		ticket=ticket,
		new_status=body.status,
	)
	await manager.broadcast(
		str(moved.organization_id),
		"ticket.moved",
		{
			"id": str(moved.id),
			"status": moved.status.value if hasattr(moved.status, "value") else moved.status,
			"updated_at": moved.updated_at.isoformat(),
		},
	)
	return MoveTicketResponse(
		id=moved.id,
		status=moved.status,
		updated_at=moved.updated_at,
	)


@router.delete(
	"/tickets/{ticket_id}",
	status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_ticket(
	db: Session = Depends(get_db),
	ticket: Ticket = Depends(require_resource_permission("tickets:delete", get_ticket_loader)),
):
	org_id = str(ticket.organization_id)
	ticket_id = str(ticket.id)
	service.delete_ticket(db=db, ticket=ticket)
	await manager.broadcast(
		org_id,
		"ticket.deleted",
		{"id": ticket_id},
	)
