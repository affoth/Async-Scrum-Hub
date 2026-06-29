import uuid
from datetime import datetime, date
from sqlalchemy import DateTime, Text, Date, ForeignKey, UniqueConstraint, func, JSON
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..base import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
	from .user import User
	from .organization import Organization


class Standup(Base):
	"""
	Standup model representing daily standup submissions.

	A standup captures what a team member accomplished yesterday and plans to work on today.
	One standup per user per day per organization is enforced via unique constraint.

	Business Rules:
	- One standup per user per day per organization
	- Editable only on the day of creation
	- `yesterday` is auto-populated from previous day's `today` field
	- `blocker_ids` is auto-populated with active (open) blockers
	"""

	__tablename__ = "standups"

	# Primary key
	id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True),
		primary_key=True,
		default=uuid.uuid4
	)

	# Authorization fields (required for permission checks)
	organization_id: Mapped[uuid.UUID] = mapped_column(
		UUID(as_uuid=True),
		ForeignKey("organizations.id", ondelete="CASCADE"),
		nullable=False,
		index=True
	)

	created_by: Mapped[uuid.UUID | None] = mapped_column(
		UUID(as_uuid=True),
		ForeignKey("users.id", ondelete="SET NULL"),
		nullable=True,
		index=True
	)

	# Standup content fields
	today: Mapped[str] = mapped_column(
		Text,
		nullable=False
	)

	yesterday: Mapped[str | None] = mapped_column(
		Text,
		nullable=True
	)

	blocker_ids: Mapped[list[uuid.UUID] | None] = mapped_column(
		ARRAY(UUID(as_uuid=True)).with_variant(JSON(), "sqlite"),
		nullable=True,
		default=list
	)

	# Date field for uniqueness constraint
	standup_date: Mapped[date] = mapped_column(
		Date,
		nullable=False,
		server_default=func.current_date(),
		index=True
	)

	# Timestamps
	created_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True),
		server_default=func.now(),
		nullable=False
	)

	updated_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True),
		server_default=func.now(),
		onupdate=func.now(),
		nullable=False
	)

	# Relationships
	organization: Mapped["Organization"] = relationship(
		"Organization",
		back_populates="standups"
	)

	creator: Mapped["User | None"] = relationship(
		"User",
		foreign_keys=[created_by],
		back_populates="standups_created"
	)

	# Table constraints
	__table_args__ = (
		UniqueConstraint(
			'organization_id',
			'created_by',
			'standup_date',
			name='uq_standup_per_user_per_day_per_org'
		),
	)

	def __repr__(self):
		return f"<Standup(id={self.id}, created_by={self.created_by}, date={self.standup_date})>"
