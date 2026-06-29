import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from src.database.models import User
from src.database.models.blocker import Blocker, BlockerStatus


def get_blocker_by_id(blocker_id: uuid.UUID, db: Session) -> Blocker:
	blocker = db.query(Blocker).filter(Blocker.id == blocker_id).first()
	if not blocker:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail={"error": {"code": "NOT_FOUND", "message": "Blocker not found"}},
		)
	return blocker


def _validate_assignee(db: Session, assignee_id: uuid.UUID | None) -> None:
	"""Validate that the assignee exists and has the Developer role."""
	if assignee_id is None:
		return
	assignee = db.query(User).filter(User.id == assignee_id).first()
	if not assignee:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail={"error": {"code": "NOT_FOUND", "message": "Assignee not found"}},
		)
	if assignee.scrum_role != "developer":
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail={"error": {"code": "INVALID_ASSIGNEE", "message": "Only users with Developer role can be assigned to blockers"}},
		)


def create_blocker(
	db: Session,
	org_id: uuid.UUID,
	user: User,
	description: str,
	ticket_id: uuid.UUID | None,
	assignee_id: uuid.UUID | None,
) -> Blocker:
	_validate_assignee(db, assignee_id)

	blocker = Blocker(
		organization_id=org_id,
		created_by=user.id,
		description=description,
		ticket_id=ticket_id,
		assignee_id=assignee_id,
	)
	db.add(blocker)
	db.commit()
	db.refresh(blocker)
	return blocker


def list_blockers(
	db: Session,
	org_id: uuid.UUID,
	status_filter: str | None,
) -> list[Blocker]:
	query = db.query(Blocker).filter(Blocker.organization_id == org_id)
	if status_filter == "open":
		query = query.filter(Blocker.status == BlockerStatus.OPEN)
	elif status_filter == "resolved":
		query = query.filter(Blocker.status == BlockerStatus.RESOLVED)
	return query.order_by(Blocker.created_at.desc()).all()


def update_blocker(
	db: Session,
	blocker: Blocker,
	updates: dict,
) -> Blocker:
	"""Apply only the fields that were explicitly sent in the request body."""
	if "assignee_id" in updates:
		_validate_assignee(db, updates["assignee_id"])

	for field, value in updates.items():
		setattr(blocker, field, value)

	db.commit()
	db.refresh(blocker)
	return blocker


def resolve_blocker(db: Session, blocker: Blocker) -> None:
	if blocker.status == BlockerStatus.RESOLVED:
		raise HTTPException(
			status_code=status.HTTP_409_CONFLICT,
			detail={"error": {"code": "BLOCKER_ALREADY_RESOLVED", "message": "Blocker already resolved"}},
		)
	blocker.status = BlockerStatus.RESOLVED
	blocker.resolved_at = datetime.now(timezone.utc)
	db.commit()
