import uuid
from datetime import datetime
from sqlalchemy import DateTime, String, ForeignKey, func, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..base import Base
from .enums import TicketStatus, Priority
from typing import TYPE_CHECKING

if TYPE_CHECKING:
	from .task import Task
	from .user import User
	from .organization import Organization
	from .blocker import Blocker


class Ticket(Base):
	"""
	Ticket model representing a primary work item (e.g. user story, bug, feature).

	Tickets are the central unit of work in a project. They can be broken down
	into tasks and may have blockers associated with them.

	Business Rules:
	- Default status when created: todo
	- Default priority when created: medium
	- Status values: todo, in_progress, completed
	- Priority values: low, medium, high
	- Deleting a ticket cascades to all its tasks and blockers
	- created_by and assignee_id are set to NULL if the user is deleted
	"""

	__tablename__ = "tickets"

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

	status: Mapped[TicketStatus] = mapped_column(
		Enum(
			TicketStatus,
			name="ticket_status",
			native_enum=True,
			validate_strings=True,
			values_callable=lambda x: [e.value for e in x],
			),
		nullable=False,
		default=TicketStatus.TODO,
	)

	priority: Mapped[Priority] = mapped_column(
		Enum(
			Priority,
			name="ticket_priority",
			native_enum=True,
			validate_strings=True,
			values_callable=lambda x: [e.value for e in x],
			),
		nullable=False,
		default=Priority.MEDIUM,
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

	tasks: Mapped[list["Task"]] = relationship(
		"Task",
		back_populates = "ticket",
		cascade="all, delete-orphan",
		passive_deletes=True,
	)

	#Relationships
	creator: Mapped["User | None"] = relationship(
		"User",
		foreign_keys=[created_by],
		back_populates="tickets_created",
	)

	assignee: Mapped["User | None"] = relationship(
		"User",
		foreign_keys=[assignee_id],
		back_populates="tickets_assigned",
	)

	organization: Mapped["Organization"] = relationship(
		"Organization",
		back_populates="tickets",
	)

	blockers: Mapped[list["Blocker"]] = relationship(
		"Blocker",
		back_populates="ticket",
		cascade="all, delete-orphan",
		passive_deletes=True,
	)
