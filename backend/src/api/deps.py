"""
FastAPI dependencies for authentication, context resolution, and authorization.

This module provides reusable dependencies that endpoints use to:
- Authenticate users via JWT tokens
- Verify organization membership
- Enforce permission checks before executing endpoint logic

Available dependencies:
- `get_current_user`: Extracts and validates the authenticated user from JWT token
- `require_org_member`: Verifies the user belongs to the organization (any role)
- `require_org_permission(action)`: Factory for endpoints with org_id in path
- `require_resource_permission(action, loader)`: Factory for endpoints that access resources directly

Usage examples:
	# For endpoints with org_id in path:
	@router.get("/organizations/{org_id}/members")
	def list_members(user: User = Depends(require_org_permission("members:list"))):
		...

	# For endpoints without org_id in path:
	@router.patch("/tickets/{ticket_id}")
	def update_ticket(ticket: Ticket = Depends(require_resource_permission("tickets:update", get_ticket))):
		...
"""

import uuid
from typing import Callable
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from src.database import get_db
from src.database.models import User
from src.config.security import decode_access_token
from src.api.authorize import authorize, AuthorizableResource

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# get_current_user receives token: str from a dependency that extracts the Bearer token.
def get_current_user(
	token: str = Depends(oauth2_scheme),
	db: Session = Depends(get_db),
) -> User:
	payload = decode_access_token(token)

	user_id_str = payload.get("sub")
	if not user_id_str:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail={"error": {"code": "INVALID_TOKEN", "message": "Token missing subject"}},
		)

	# Validates the string has a valid UUID format
	# Converts it to a Python UUID object → so it matches User.id
	try:
		user_id = uuid.UUID(user_id_str)
	except ValueError:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail={"error": {"code": "INVALID_TOKEN", "message": "Invalid token subject"}},
		)

	# Uses the db session to query the users table, filters by users.id == user_id, and returns the first result
	user = db.query(User).filter(User.id == user_id).first()
	if not user:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail={"error": {"code": "UNAUTHORIZED", "message": "User not found"}},
		)

	return user


"""
Simple membership check for endpoints where any organization member can access.
No role or permission checks - only verifies the user belongs to the organization.

Use this for endpoints like:
- GET /organizations/{org_id}/tickets (any member can list)
- GET /organizations/{org_id}/standups (any member can list)
- GET /organizations/{org_id}/blockers (any member can list)
"""
def require_org_member(
	org_id: uuid.UUID,
	current_user: User = Depends(get_current_user),
) -> User:
	if current_user.organization_id != org_id:
		raise HTTPException(
			status_code=status.HTTP_403_FORBIDDEN,
			detail={"error": {"code": "FORBIDDEN", "message": "Not a member of this organization"}},
		)
	return current_user


"""
This helper is used by endpoints that are scoped to an organization,
i.e. endpoints that include an `org_id` in the path, for example:
- GET  /organizations/{org_id}/members

Calling `require_org_permission(action)` does NOT perform any authorization.
It only creates and returns another function (the real dependency).
The returned function is executed later, per request, by FastAPI and it returns
the User object.
"""
def require_org_permission(action: str) -> Callable:
	def dependency(
		org_id: uuid.UUID,
		current_user: User = Depends(get_current_user),
	) -> User:
		if current_user.organization_id != org_id:
			raise HTTPException(
				status_code=status.HTTP_403_FORBIDDEN,
				detail={"error": {"code": "FORBIDDEN", "message": "Not a member of this organization"}},
			)
		authorize(
			action=action,
			user=current_user,
			org_id=org_id,
		)
		return current_user

	return dependency


"""
This helper is used by endpoints that access a resource directly,
i.e. endpoints that do NOT include org_id in the path, for example:
- PATCH /tickets/{ticket_id}
- DELETE /tasks/{task_id}

The loader is a FastAPI dependency that loads the resource from the database.
It should handle the 404 case if the resource doesn't exist.
"""
def require_resource_permission(action: str, loader: Callable) -> Callable:
	def dependency(
		resource: AuthorizableResource = Depends(loader),
		current_user: User = Depends(get_current_user),
	) -> AuthorizableResource:
		org_id = resource.organization_id

		if current_user.organization_id != org_id:
			raise HTTPException(
				status_code=status.HTTP_403_FORBIDDEN,
				detail={"error": {"code": "FORBIDDEN", "message": "Not a member of this organization"}},
			)

		authorize(
			action=action,
			user=current_user,
			org_id=org_id,
			resource=resource,
		)
		return resource

	return dependency
