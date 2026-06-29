"""
Tasks API routes.

Endpoints:
- POST   /tickets/{ticket_id}/tasks                → create task            (SM, PO)
- GET    /tickets/{ticket_id}/tasks                → list tasks             (any member; ?status=in_progress|completed)
- GET    /tasks/{task_id}                          → task details           (any member)
- PATCH  /tasks/{task_id}                          → update task            (SM, PO)
- DELETE /tasks/{task_id}                          → delete task            (SM, PO)

Authorization follows the dependency helpers in src.api.deps:
- require_resource_permission(action, loader): for all endpoints (tasks are resource-scoped via their ticket)
"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.database.models import User
from src.database.models.task import Task
from src.database.models.ticket import Ticket
from src.database.models.enums import TaskStatus
from src.api.deps import get_current_user, require_resource_permission
from src.tasks import service
from src.schemas.common import UserBrief
from src.realtime.connection_manager import manager
from src.tasks.schemas import (
	CreateTaskRequest,
	CreateTaskResponse,
	TaskBrief,
	TaskDetailResponse,
	UpdateTaskRequest,
	UpdateTaskResponse,
)

router = APIRouter()


def get_ticket_loader(ticket_id: uuid.UUID, db: Session = Depends(get_db)) -> Ticket:
	ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
	if not ticket:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail={"error": {"code": "NOT_FOUND", "message": "Ticket not found"}},
		)
	return ticket


def get_task_loader(task_id: uuid.UUID, db: Session = Depends(get_db)) -> Task:
	task = db.query(Task).filter(Task.id == task_id).first()
	if not task:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail={"error": {"code": "NOT_FOUND", "message": "Task not found"}},
		)
	return task


@router.post(
	"/tickets/{ticket_id}/tasks",
	response_model=CreateTaskResponse,
	status_code=status.HTTP_201_CREATED,
)
async def create_task(
	body: CreateTaskRequest,
	db: Session = Depends(get_db),
	ticket: Ticket = Depends(require_resource_permission("tickets:tasks:create", get_ticket_loader)),
	current_user: User = Depends(get_current_user),
):
	task = service.create_task(
		db=db,
		current_user=current_user,
		ticket=ticket,
		title=body.title,
		description=body.description,
		assignee_id=body.assignee_id,
	)
	await manager.broadcast(
		str(ticket.organization_id),
		"task.created",
		{
			"id": str(task.id),
			"title": task.title,
			"status": task.status.value if hasattr(task.status, "value") else task.status,
			"ticket_id": str(task.ticket_id),
			"assignee_id": str(task.assignee_id) if task.assignee_id else None,
			"created_by": {
				"id": str(task.creator.id),
				"name": task.creator.name,
			},
		},
	)
	return CreateTaskResponse(
		id=task.id,
		title=task.title,
		description=task.description,
		status=task.status,
		created_by=UserBrief.model_validate(task.creator),
		assignee_id=task.assignee_id,
		ticket_id=task.ticket_id,
	)


@router.get(
	"/tickets/{ticket_id}/tasks",
	response_model=list[TaskBrief],
	status_code=status.HTTP_200_OK,
)
def list_tasks(
	status_filter: Optional[TaskStatus] = Query(None, alias="status"),
	db: Session = Depends(get_db),
	ticket: Ticket = Depends(require_resource_permission("tickets:tasks:list", get_ticket_loader)),
):
	tasks = service.list_tasks(
		db=db,
		ticket=ticket,
		status_filter=status_filter,
	)
	return [
		TaskBrief(id=t.id, title=t.title, status=t.status)
		for t in tasks
	]


@router.get(
	"/tasks/{task_id}",
	response_model=TaskDetailResponse,
	status_code=status.HTTP_200_OK,
)
def get_task_detail(
	task: Task = Depends(require_resource_permission("tasks:details", get_task_loader)),
):
	return TaskDetailResponse(
		id=task.id,
		title=task.title,
		description=task.description,
		status=task.status,
		created_by=UserBrief.model_validate(task.creator),
		assignee_id=task.assignee_id,
		ticket_id=task.ticket_id,
	)


@router.patch(
	"/tasks/{task_id}",
	response_model=UpdateTaskResponse,
	status_code=status.HTTP_200_OK,
)
async def update_task(
	body: UpdateTaskRequest,
	db: Session = Depends(get_db),
	task: Task = Depends(require_resource_permission("tasks:update", get_task_loader)),
):
	updates = body.model_dump(exclude_unset=True)
	updated_task = service.update_task(
		db=db,
		task=task,
		updates=updates,
	)
	await manager.broadcast(
		str(updated_task.organization_id),
		"task.updated",
		{
			"id": str(updated_task.id),
			"title": updated_task.title,
			"status": updated_task.status.value if hasattr(updated_task.status, "value") else updated_task.status,
			"assignee_id": str(updated_task.assignee_id) if updated_task.assignee_id else None,
			"ticket_id": str(updated_task.ticket_id),
		},
	)
	return UpdateTaskResponse(
		id=updated_task.id,
		title=updated_task.title,
		description=updated_task.description,
		status=updated_task.status,
		created_by=UserBrief.model_validate(updated_task.creator),
		assignee_id=updated_task.assignee_id,
		ticket_id=updated_task.ticket_id,
	)


@router.delete(
	"/tasks/{task_id}",
	status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_task(
	db: Session = Depends(get_db),
	task: Task = Depends(require_resource_permission("tasks:delete", get_task_loader)),
):
	org_id = str(task.organization_id)
	task_id = str(task.id)
	ticket_id = str(task.ticket_id)
	service.delete_task(db=db, task=task)
	await manager.broadcast(
		org_id,
		"task.deleted",
		{
			"id": task_id,
			"ticket_id": ticket_id,
		},
	)
