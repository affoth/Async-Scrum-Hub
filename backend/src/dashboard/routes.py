"""
Dashboard API routes.

Endpoints:
- GET    /organizations/{org_id}/dashboard         → get dashboard data     (authenticated member)

Returns aggregated data for the current user within the organization
(open blockers, today's standup, assigned tickets and tasks).
"""

import uuid
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from src.database import get_db
from src.api.deps import get_current_user
from src.database.models import User, Organization
from src.dashboard import service
from src.dashboard.schemas import DashboardResponse

router = APIRouter()

@router.get(
	"/organizations/{org_id}/dashboard",
	response_model=DashboardResponse,
	status_code=status.HTTP_200_OK
)
def dashboard(org_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
	org = db.query(Organization).filter(Organization.id == org_id).first()
	if not org:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail={"error": {"code": "NOT_FOUND", "message": "Organization not found"}},
		)
	return service.get_dashboard(db, current_user, org_id)
