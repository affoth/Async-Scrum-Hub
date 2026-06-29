import uuid
from datetime import datetime
from sqlalchemy import DateTime, String, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..base import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
	from .user import User
	from .standup import Standup
	from .blocker import Blocker
	from .ticket import Ticket
	from .task import Task

class Organization(Base):
	"""
	Organization model representing a team or workspace.

	An organization groups users together and owns all related entities
	(standups, blockers, tickets, tasks). Users join via a unique join_code.

	Business Rules:
	- join_code is unique across all organizations (max 10 chars)
	- The creator of an organization cannot be deleted while the org exists (RESTRICT)
	- Deleting an organization cascades to: standups, blockers, tickets, tasks
	- Users belonging to the org get their organization_id set to NULL (not deleted)
	"""

	__tablename__ = "organizations"

	id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True),
		primary_key=True,
		default=uuid.uuid4
	)

	name: Mapped[str] = mapped_column(
		String,
		nullable=False
	)

	join_code: Mapped[str] = mapped_column(
		String(10),
		unique=True,
		index=True,
		nullable=False
	)

	created_by: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True),
		ForeignKey("users.id", ondelete="RESTRICT"),  # Prevent deleting User if they created orgs
		nullable=False
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

	# Relationships
	creator: Mapped["User"] = relationship(
		"User",
		foreign_keys=[created_by],
		back_populates="created_organizations"
	)

	users: Mapped[list["User"]] = relationship(
		"User",
		foreign_keys="User.organization_id",
		back_populates="organization",
		passive_deletes=True
	)

	standups: Mapped[list["Standup"]] = relationship(
		"Standup",
		back_populates="organization",
		cascade="all, delete-orphan"
	)

	blockers: Mapped[list["Blocker"]] = relationship(
		"Blocker",
		back_populates="organization",
		cascade="all, delete-orphan"
	)

	tickets: Mapped[list["Ticket"]] = relationship(
		"Ticket",
		back_populates="organization",
		cascade="all, delete-orphan",
		passive_deletes=True,
	)

	tasks: Mapped[list["Task"]] = relationship(
		"Task",
		back_populates="organization",
		cascade="all, delete-orphan",
		passive_deletes=True,
	)
