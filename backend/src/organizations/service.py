import random
import string
import uuid

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import update as sa_update

from src.config.email import send_invite_email
from src.database.models import Organization, User
from src.database.models.blocker import Blocker
from src.database.models.enums import OrgRole, ScrumRole
from src.organizations.schemas import available_SR


# ── Helpers ───────────────────────────────────────────────────────────

def _not_found(message: str = "Organization not found"):
	return HTTPException(
		status_code=status.HTTP_404_NOT_FOUND,
		detail={"error": {"code": "NOT_FOUND", "message": message}},
	)


def _conflict(code: str, message: str):
	return HTTPException(
		status_code=status.HTTP_409_CONFLICT,
		detail={"error": {"code": code, "message": message}},
	)


def _forbidden(message: str = "You do not have permission to perform this action"):
	return HTTPException(
		status_code=status.HTTP_403_FORBIDDEN,
		detail={"error": {"code": "FORBIDDEN", "message": message}},
	)


def _bad_request(code: str, message: str):
	return HTTPException(
		status_code=status.HTTP_400_BAD_REQUEST,
		detail={"error": {"code": code, "message": message}},
	)


# ── Public service functions ──────────────────────────────────────────

def create_organization(db: Session, user: User, name: str) -> Organization:
	"""Create a new organization. The creator becomes admin."""

	if user.organization_id is not None:
		raise HTTPException(
			status_code=status.HTTP_409_CONFLICT,
			detail={"error": {"code": "ALREADY_IN_ORG", "message": "User already belongs to an organization"}},
		)

	# Case-insensitive name uniqueness
	existing = (
		db.query(Organization)
		.filter(func.lower(Organization.name) == name.lower())
		.first()
	)
	if existing:
		raise _conflict("ORG_EXISTS", "An organization with this name already exists.")

	# Generate join code (ABC-123) with collision retry
	while True:
		letters = "".join(random.choices(string.ascii_uppercase, k=3))
		digits = "".join(random.choices(string.digits, k=3))
		join_code = f"{letters}-{digits}"
		if not db.query(Organization).filter(Organization.join_code == join_code).first():
			break

	org = Organization(
		name=name,
		join_code=join_code,
		created_by=user.id,
	)
	db.add(org)
	db.flush()

	db.execute(
		sa_update(User)
		.where(User.id == user.id)
		.values(organization_id=org.id, org_role="admin")
	)

	db.commit()
	db.refresh(org)
	db.refresh(user)
	return org


def select_role(
	db: Session,
	user: User,
	org_id: uuid.UUID,
	scrum_role: ScrumRole,
) -> ScrumRole:
	"""Let the organization creator select their initial scrum role."""

	org = db.query(Organization).filter(Organization.id == org_id).first()
	if not org:
		raise _not_found()

	# If SM or PO, check no one else already holds that role in this org
	if scrum_role in (ScrumRole.scrum_master, ScrumRole.product_owner):
		taken = (
			db.query(User)
			.filter(
				User.organization_id == org_id,
				User.scrum_role == scrum_role,
				User.id != user.id,
			)
			.first()
		)
		if taken:
			raise _conflict(
				"ROLE_TAKEN",
				f"The {scrum_role.value} role is already assigned in this organization.",
			)

	user.scrum_role = scrum_role
	db.commit()
	db.refresh(user)
	return user.scrum_role


def get_organization_members(db: Session, org_id: uuid.UUID) -> list[User]:
	"""Return all members of an organization with their tickets, tasks, and blockers."""

	org = db.query(Organization).filter(Organization.id == org_id).first()
	if not org:
		raise _not_found()

	members = (
		db.query(User)
		.filter(User.organization_id == org_id)
		.options(
			selectinload(User.tickets_assigned),
			selectinload(User.tasks_assigned),
			selectinload(User.created_blockers),
		)
		.all()
	)
	return members


def invite_member(
	db: Session,
	org_id: uuid.UUID,
	name: str,
	email: str,
) -> str:
	"""Invite a user to the organization by email. Returns the email address."""

	org = db.query(Organization).filter(Organization.id == org_id).first()
	if not org:
		raise _not_found()

	# Check if a user with this email is already a member of this org
	existing_user = db.query(User).filter(User.email == email).first()
	if existing_user and existing_user.organization_id == org_id:
		raise _conflict("ALREADY_MEMBER", "User is already a member of this organization")

	# Send invitation email with the join code
	send_invite_email(
		to_email=email,
		to_name=name,
		organization_name=org.name,
		join_code=org.join_code,
	)
	return email


def remove_member(
	db: Session,
	org_id: uuid.UUID,
	user_id: uuid.UUID,
) -> None:
	"""Remove a user from the organization."""

	org = db.query(Organization).filter(Organization.id == org_id).first()
	if not org:
		raise _not_found("Organization or user not found")

	user = (
		db.query(User)
		.filter(User.id == user_id, User.organization_id == org_id)
		.first()
	)
	if not user:
		raise _not_found("Organization or user not found")

	if user.org_role == "admin":
		admin_count = db.query(User).filter(
			User.organization_id == org_id,
			User.org_role == "admin"
		).count()
		if admin_count <= 1:
			raise _conflict("LAST_ADMIN", "Cannot remove the last admin of an organization")


	user.organization_id = None
	user.org_role = None
	user.scrum_role = None

	db.query(Blocker).filter(
		Blocker.organization_id == org_id,
		Blocker.assignee_id == user_id,
	).update({"assignee_id": None})

	db.commit()


def join_organization(
	db: Session,
	user: User,
	join_code: str,
) -> dict:
	"""Join an organization using a join code."""

	org = db.query(Organization).filter(Organization.join_code == join_code).first()
	if not org:
		raise _bad_request("INVALID_CODE", "Invalid code.")

	if user.organization_id is not None:
		raise _conflict("ALREADY_IN_ORG", "User already belongs to an organization")

	db.execute(
		sa_update(User)
		.where(User.id == user.id)
		.values(organization_id=org.id, org_role="member")
	)

	# Check which unique roles (SM, PO) are still available in the org
	available_roles = []

	sm_taken = db.query(User).filter(
		User.organization_id == org.id,
		User.scrum_role == ScrumRole.scrum_master,
	).first()
	if not sm_taken:
		available_roles.append(available_SR(role="scrum_master"))

	po_taken = db.query(User).filter(
		User.organization_id == org.id,
		User.scrum_role == ScrumRole.product_owner,
	).first()
	if not po_taken:
		available_roles.append(available_SR(role="product_owner"))

	available_roles.append(available_SR(role="developer"))

	db.commit()
	db.refresh(user)

	return {
		"organization_id": org.id,
		"org_role": user.org_role,
		"available_scrum_role": available_roles
	}
