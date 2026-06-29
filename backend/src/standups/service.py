import uuid
from datetime import date, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from src.database.models import User
from src.database.models.standup import Standup
from src.database.models.blocker import Blocker, BlockerStatus


def get_standup_by_id(standup_id: uuid.UUID, db: Session) -> Standup:
	standup = db.query(Standup).filter(Standup.id == standup_id).first()
	if not standup:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail={"error": {"code": "NOT_FOUND", "message": "Standup not found"}},
		)
	return standup


def create_standup(db: Session, org_id: uuid.UUID, user: User, today: str) -> Standup:
	today_date = date.today()

	# One standup per user per day per organization
	existing = db.query(Standup).filter(
		Standup.organization_id == org_id,
		Standup.created_by == user.id,
		Standup.standup_date == today_date,
	).first()
	if existing:
		raise HTTPException(
			status_code=status.HTTP_409_CONFLICT,
			detail={"error": {"code": "STANDUP_ALREADY_EXISTS", "message": "You have already created a standup for today"}},
		)

	# Auto-populate yesterday from previous day's standup
	yesterday_date = today_date - timedelta(days=1)
	previous = db.query(Standup).filter(
		Standup.organization_id == org_id,
		Standup.created_by == user.id,
		Standup.standup_date == yesterday_date,
	).first()
	yesterday_content = previous.today if previous else None

	# Auto-populate blocker_ids from open blockers created by or assigned to the user
	from sqlalchemy import or_
	open_blockers = db.query(Blocker).filter(
		Blocker.organization_id == org_id,
		Blocker.status == BlockerStatus.OPEN,
		or_(Blocker.created_by == user.id, Blocker.assignee_id == user.id),
	).all()
	blocker_ids = [b.id for b in open_blockers]

	standup = Standup(
		organization_id=org_id,
		created_by=user.id,
		today=today,
		yesterday=yesterday_content,
		blocker_ids=blocker_ids if blocker_ids else None,
		standup_date=today_date,
	)
	db.add(standup)
	db.commit()
	db.refresh(standup)
	return standup


def list_standups(db: Session, org_id: uuid.UUID) -> list[Standup]:
	return (
		db.query(Standup)
		.filter(Standup.organization_id == org_id)
		.order_by(Standup.standup_date.desc())
		.all()
	)


def resolve_blocker_ids(db: Session, blocker_ids: list[uuid.UUID] | None) -> list[Blocker]:
	if not blocker_ids:
		return []
	return db.query(Blocker).filter(Blocker.id.in_(blocker_ids)).all()


def update_standup(db: Session, standup: Standup, today: str | None) -> Standup:
	if standup.standup_date != date.today():
		raise HTTPException(
			status_code=status.HTTP_409_CONFLICT,
			detail={"error": {"code": "EDIT_WINDOW_EXPIRED", "message": "Standups can only be edited on the day they are created"}},
		)

	if today is not None:
		standup.today = today
	db.commit()
	db.refresh(standup)
	return standup


def delete_standup(db: Session, standup: Standup) -> None:
	db.delete(standup)
	db.commit()
