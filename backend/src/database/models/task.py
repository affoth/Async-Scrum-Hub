import uuid
from datetime import datetime
from sqlalchemy import DateTime, String, ForeignKey, func, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..base import Base
from .enums import TaskStatus
from typing import TYPE_CHECKING

if TYPE_CHECKING:
	from .ticket import Ticket
	from .user import User
	from .organization import Organization


class Task(Base):
	"""
	Task model representing a sub-item of a ticket.

	Tasks break down a ticket into smaller actionable steps.
	Each task belongs to exactly one ticket and one organization.

	Business Rules:
	- Tasks are deleted when their parent ticket is deleted (cascade)
	- Default status when created: in_progress
	- Status values: in_progress, completed
	- created_by and assignee_id are set to NULL if the user is deleted
	"""

	__tablename__ = "tasks"

	id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True),
		primary_key=True,
		default=uuid.uuid4
	)

	title: Mapped[str] = mapped_column(
		String,
		nullable=False
	)

	description: Mapped[str | None] = mapped_column(
		String,
		nullable=True
	)

	status: Mapped[TaskStatus] = mapped_column(
		Enum(
			TaskStatus,
			name="task_status",
			native_enum=True,
			validate_strings=True,
			values_callable=lambda x: [e.value for e in x],
			),
		nullable=False,
		default=TaskStatus.IN_PROGRESS,
	)

	ticket_id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True),
		ForeignKey("tickets.id", ondelete="CASCADE"),
		nullable=False
	)

	created_by: Mapped[uuid.UUID | None] = mapped_column(
		UUID(as_uuid=True),
		ForeignKey("users.id", ondelete="SET NULL"),
		nullable=True
	)

	organization_id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True),
		ForeignKey("organizations.id", ondelete="CASCADE"),
		nullable=False,
	)

	assignee_id: Mapped[uuid.UUID | None] = mapped_column(
		UUID(as_uuid=True),
		ForeignKey("users.id", ondelete="SET NULL"),
		nullable=True
	)

	created_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True),
		server_default=func.now(),
		nullable=False
	)

	updated_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True),
		server_default=func.now(),
		onupdate=func.now(),
		nullable=False,
	)

	#Relationships
	ticket: Mapped["Ticket"] = relationship(
		"Ticket",
		back_populates="tasks",
		foreign_keys=[ticket_id],
	)

	creator: Mapped["User | None"] = relationship(
		"User",
		foreign_keys=[created_by],
		back_populates="tasks_created",
	)

	assignee: Mapped["User | None"] = relationship(
		"User",
		foreign_keys=[assignee_id],
		back_populates="tasks_assigned",
	)

	organization: Mapped["Organization"] = relationship(
		"Organization",
		back_populates="tasks",
	)