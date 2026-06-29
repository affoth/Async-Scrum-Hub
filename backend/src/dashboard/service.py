import uuid
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from datetime import datetime, timedelta, timezone, date
from src.database.models import Task, Ticket, User, Blocker
from src.database.models.enums import TaskStatus, TicketStatus, BlockerStatus
from src.dashboard.schemas import DashboardSummary, RecentUpdateItem, DashboardResponse
from src.schemas.common import UserBrief

def get_dashboard(db: Session, user: User, org_id: uuid.UUID) -> DashboardResponse:
	if user.organization_id != org_id:
		raise HTTPException(
			status_code=status.HTTP_403_FORBIDDEN,
			detail={"error": {"code": "NO_ORGANIZATION", "message": "User is not part of any organization."}},
		)
	
	# --- Section 1: Summary ---
	# --- Tasks ---   
	tasks_in_progress = db.query(Task).filter(
		Task.organization_id == user.organization_id,
		Task.status == TaskStatus.IN_PROGRESS
	).count()
	
	# --- Tickets ---
	tickets_completed = db.query(Ticket).filter(
		Ticket.organization_id == user.organization_id,
		Ticket.status == TicketStatus.COMPLETED		
	).count()
	
	# --- Blockers ---
	active_blockers = db.query(Blocker).filter(
		Blocker.organization_id == user.organization_id,
		Blocker.status == BlockerStatus.OPEN	
	).count()
	
	summary_dashboard = DashboardSummary(tasks_in_progress=tasks_in_progress, tickets_completed=tickets_completed, active_blockers=active_blockers)
		
	# --- Section 2: Recent updates ---
	updates_dashboard = [] 
	now = datetime.now(timezone.utc)
	start_1_week_ago = now - timedelta(weeks=1)

	# --- Tasks created ---
	tasksCreated = db.query(Task).filter(
		Task.organization_id == user.organization_id,
		Task.status == TaskStatus.IN_PROGRESS,
		Task.created_at < now,
		Task.created_at > start_1_week_ago		
	).all()

	for task in tasksCreated:
		updates_dashboard.append(
			RecentUpdateItem(
				type="task",
				event="created",
				title=task.title,
				timestamp=task.created_at,
				created_by=UserBrief.model_validate(task.creator)
			)
		)

	# --- Tasks completed ---
	tasksCompleted = db.query(Task).filter(
		Task.organization_id == user.organization_id,
		Task.status == TaskStatus.COMPLETED,
		Task.updated_at < now,
		Task.updated_at > start_1_week_ago
	).all()

	for task in tasksCompleted:
		updates_dashboard.append(
			RecentUpdateItem(
				type="task",
				event="completed",
				title=task.title,
				timestamp=task.updated_at,
				created_by=UserBrief.model_validate(task.creator)
			)
		)

	# --- Tickets created ---
	ticketsCreated = db.query(Ticket).filter(
		Ticket.organization_id == user.organization_id,
		Ticket.status == TicketStatus.IN_PROGRESS,
		Ticket.created_at < now,
		Ticket.created_at > start_1_week_ago
	).all()

	for ticket in ticketsCreated:
		updates_dashboard.append(
			RecentUpdateItem(
				type="ticket",
				event="created",
				title=ticket.title,
				timestamp=ticket.created_at,
				created_by=UserBrief.model_validate(ticket.creator)
			)
		)

	# --- Tickets completed ---
	ticketsCompleted = db.query(Ticket).filter(
		Ticket.organization_id == user.organization_id,
		Ticket.status == TicketStatus.COMPLETED,
		Ticket.updated_at < now,
		Ticket.updated_at > start_1_week_ago
	).all()

	for ticket in ticketsCompleted:
		updates_dashboard.append(
			RecentUpdateItem(
				type="ticket",
				event="completed",
				title=ticket.title,
				timestamp=ticket.updated_at,
				created_by=UserBrief.model_validate(ticket.creator)
			)
		)

	updates_dashboard = sorted(updates_dashboard, key=lambda x: x.timestamp, reverse=True)[:6]

	return DashboardResponse(
		summary=summary_dashboard, 
		recent_updates=updates_dashboard
	)

