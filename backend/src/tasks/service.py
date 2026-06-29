import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from src.database.models import User, Task, Ticket
from src.database.models.enums import TaskStatus, ScrumRole

def bad_request_exception() -> HTTPException:
	return HTTPException(
		status_code=status.HTTP_400_BAD_REQUEST,
		detail={"error": {"code": "INVALID_ASSIGNEE", "message": "Only users with Developer role can be assigned to tasks"}},
	)

def not_found_exception(message: str = "Not found") -> HTTPException:
	return HTTPException(
		status_code=status.HTTP_404_NOT_FOUND,
		detail={"error": {"code": "NOT_FOUND", "message": message}},
	)

def forbidden_exception() -> HTTPException:
	return HTTPException(
		status_code=status.HTTP_403_FORBIDDEN,
		detail={"error": {"code": "FORBIDDEN", "message": "You do not have permission to perform this action"}},
	)

def validate_assignee(db: Session, assignee_id: uuid.UUID | None, organization_id: uuid.UUID) -> None:
	"""Validate that the assignee exists and has the Developer role."""
	if assignee_id is None:
		return
	assignee = db.query(User).filter(User.id == assignee_id).first()
	if not assignee:
		raise not_found_exception("Assignee not found")
	if assignee.organization_id != organization_id:
		raise forbidden_exception()
	if assignee.scrum_role != ScrumRole.developer:
		raise bad_request_exception()

def get_ticket(db: Session, ticket_id: uuid.UUID) -> Ticket:
	"""Load ticket from DB or raise 404."""
	ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
	if not ticket:
		raise not_found_exception("Ticket not found")
	return ticket

def create_task(
	db: Session,
	current_user: User,
	ticket: Ticket,
	title: str,
	description: str | None,
	assignee_id: uuid.UUID | None,
) -> Task:
	# 1. Validate assignee has Developer role (400 if not)
	validate_assignee(db, assignee_id, ticket.organization_id)

	# 2. Create task — status defaults to IN_PROGRESS, creator = current user
	task = Task(
		title=title,
		description=description,
		status=TaskStatus.IN_PROGRESS,
		created_by=current_user.id,
		assignee_id=assignee_id,
		ticket_id=ticket.id,
		organization_id=ticket.organization_id,
	)
	db.add(task)
	db.commit()
	db.refresh(task)
	return task

def list_tasks(
	db: Session,
	ticket: Ticket,
	status_filter: TaskStatus | None,
) -> list[Task]:
	# Query tasks for this ticket, optionally filtered by status
	query = db.query(Task).filter(Task.ticket_id == ticket.id)
	if status_filter is not None:
		query = query.filter(Task.status == status_filter)
	return query.all()

def update_task(
	db: Session,
	task: Task,
	updates: dict,
) -> Task:
	# Short-circuit if nothing to update
	if not updates:
		return task

	# 1. Validate assignee if provided
	if "assignee_id" in updates:
		validate_assignee(db, updates["assignee_id"], task.organization_id)

	# 2. Apply only the fields that were explicitly sent
	for field, value in updates.items():
		setattr(task, field, value)

	db.commit()
	db.refresh(task)
	return task

def delete_task(
	db: Session,
	task: Task,
) -> None:
	db.delete(task)
	db.commit()
