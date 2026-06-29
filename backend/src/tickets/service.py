import uuid
from sqlalchemy.orm import Session, selectinload
from fastapi import HTTPException, status

from src.database.models import User, Ticket
from src.database.models.enums import TicketStatus, Priority, ScrumRole
from src.api.permissions import PERMISSIONS

# ── HTTP exception helpers ────────────────────────────────────────────

def _not_found(message: str = "Ticket not found") -> HTTPException:
	return HTTPException(
		status_code=status.HTTP_404_NOT_FOUND,
		detail={"error": {"code": "NOT_FOUND", "message": message}},
	)

def _bad_assignee() -> HTTPException:
	return HTTPException(
		status_code=status.HTTP_400_BAD_REQUEST,
		detail={"error": {"code": "INVALID_ASSIGNEE", "message": "Only users with Developer role can be assigned to tickets"}},
	)

def _forbidden(message: str = "You do not have permission to perform this action") -> HTTPException:
	return HTTPException(
		status_code=status.HTTP_403_FORBIDDEN,
		detail={"error": {"code": "FORBIDDEN", "message": message}},
	)

# ── Internal helpers ──────────────────────────────────────────────────

def _validate_assignee(db: Session, assignee_id: uuid.UUID | None, organization_id: uuid.UUID) -> None:
	"""Validate that the assignee exists, belongs to the org, and has the Developer role."""
	if assignee_id is None:
		return
	assignee = db.query(User).filter(User.id == assignee_id).first()
	if not assignee:
		raise _not_found("Assignee not found")
	if assignee.organization_id != organization_id:
		raise _forbidden("Assignee is not a member of this organization")
	if assignee.scrum_role != ScrumRole.developer:
		raise _bad_assignee()

def _check_restricted_fields(user: User, updates: dict) -> None:
	"""
	Enforce restricted_fields from the tickets:update permission.
	Currently: only product_owner (and admin) can change priority.
	"""
	restricted = PERMISSIONS["tickets:update"].get("restricted_fields", {})
	for field, allowed_roles in restricted.items():
		if field in updates:
			# Admin override is already handled by authorize(), but we
			# still need to let admin through here.
			if user.org_role == "admin":
				continue
			if user.scrum_role not in allowed_roles:
				raise _forbidden(f"Only {', '.join(allowed_roles)} can update {field}")


# ── Public service functions ──────────────────────────────────────────

def get_ticket_by_id(ticket_id: uuid.UUID, db: Session) -> Ticket:
	"""Load a ticket from DB or raise 404."""
	ticket = (
		db.query(Ticket)
		.options(selectinload(Ticket.tasks), selectinload(Ticket.blockers))
		.filter(Ticket.id == ticket_id)
		.first()
	)
	if not ticket:
		raise _not_found()
	return ticket

def create_ticket(
	db: Session,
	org_id: uuid.UUID,
	user: User,
	title: str,
	description: str | None,
	priority: Priority,
	assignee_id: uuid.UUID | None,
) -> Ticket:
	_validate_assignee(db, assignee_id, org_id)

	ticket = Ticket(
		title=title,
		description=description,
		status=TicketStatus.TODO,
		priority=priority,
		created_by=user.id,
		assignee_id=assignee_id,
		organization_id=org_id,
	)
	db.add(ticket)
	db.commit()
	db.refresh(ticket)
	return ticket

def list_tickets(
	db: Session,
	org_id: uuid.UUID,
	status_filter: TicketStatus | None = None,
	priority_filter: Priority | None = None,
) -> list[Ticket]:
	query = db.query(Ticket).filter(Ticket.organization_id == org_id)
	if status_filter is not None:
		query = query.filter(Ticket.status == status_filter)
	if priority_filter is not None:
		query = query.filter(Ticket.priority == priority_filter)
	return query.order_by(Ticket.created_at.desc()).all()

def update_ticket(
	db: Session,
	ticket: Ticket,
	user: User,
	updates: dict,
) -> Ticket:
	if not updates:
		return ticket

	# Enforce restricted fields (e.g. only PO can change priority)
	_check_restricted_fields(user, updates)

	# Validate assignee if provided
	if "assignee_id" in updates:
		_validate_assignee(db, updates["assignee_id"], ticket.organization_id)

	for field, value in updates.items():
		setattr(ticket, field, value)

	db.commit()
	db.refresh(ticket)
	return ticket

def move_ticket(
	db: Session,
	ticket: Ticket,
	new_status: TicketStatus,
) -> Ticket:
	ticket.status = new_status
	db.commit()
	db.refresh(ticket)
	return ticket

def delete_ticket(db: Session, ticket: Ticket) -> None:
	db.delete(ticket)
	db.commit()
