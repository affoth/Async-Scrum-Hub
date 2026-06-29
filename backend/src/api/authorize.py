"""
Authorization guard for the API.

This module evaluates whether a request is allowed to perform a given action,
based on the authorization rules defined in `permissions.py` and the principles
documented in `AUTHORIZATION_MODEL.md`.

Responsibilities:
- Enforce scope rules (public / global / org)
- Apply organization admin override
- Evaluate role-based permissions
- Evaluate ownership and assignment permissions when applicable

Expected inputs:
- `action`: permission action string (e.g. "tickets:update")
- `user`: authenticated user object (or None for public endpoints).
		  Contains `org_role` and `scrum_role` directly.
- `org_id`: organization context when available
- `resource`: domain resource object (e.g. ticket) that contains all its variables
			(when ownership/assignment checks are required)

Raises:
	HTTPException: 401 if authentication is missing, 403 if not authorized
"""

import uuid
from typing import Optional, Protocol
from fastapi import HTTPException
from .permissions import PERMISSIONS
from src.database.models import User
import logging
logger = logging.getLogger("authz")

"""
Protocol defining the required attributes for resources that can be authorized.
Any ORM model (Ticket, Task, Standup, Blocker) that implements these attributes
will be compatible with the authorize() function.
See ARCHITECTURE.md section 9.1 for details.
"""
class AuthorizableResource(Protocol):
	organization_id: uuid.UUID
	created_by: uuid.UUID
	assignee_id: Optional[uuid.UUID]

def authorize(
	action: str,
	user: Optional[User] = None,
	org_id: Optional[uuid.UUID] = None,
	resource: Optional[AuthorizableResource] = None,
) -> None:

	if action not in PERMISSIONS:
		raise HTTPException(500, f"Unknown permission action: {action}")

	permission = PERMISSIONS[action]
	scope = permission["scope"]

	# PUBLIC: no JWT, no roles, no owner/assignee checks
	if scope == "public":
		return

	# GLOBAL and ORG: JWT required.
	if user is None:
		raise HTTPException(401, {"error": {"code": "UNAUTHORIZED", "message": "Authentication required"}})

	# GLOBAL
	if scope == "global":
		return

	# ORG
	if scope == "org":
		if org_id is None:
			if resource and resource.organization_id:
				org_id = resource.organization_id
			else:
				raise HTTPException(500, "Organization context missing")

		# Admin override
		if user.org_role == "admin":
			return


		if not user.org_role or not user.scrum_role:
			raise HTTPException(500, "User missing role information")


		# Role-based permission
		if user.scrum_role in permission["roles"]:
			return

		# Ownership check
		if permission["owner_allowed"] == True:
			if resource is None:
				raise HTTPException(500, "resource context missing")
			if resource.created_by == user.id:
				return

		# Assignee check
		if permission["assignee_allowed"] == True:
			if resource is None:
				raise HTTPException(500, "resource context missing")
			if resource.assignee_id == user.id:
				return

		logger.warning("DENIED | user=%s | action=%s | org=%s", user.id, action, org_id)
		raise HTTPException(403, {"error": {"code": "FORBIDDEN", "message": "You do not have permission to perform this action"}})
