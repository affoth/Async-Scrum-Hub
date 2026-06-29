"""
Analytics API routes.

Endpoints:
- GET    /organizations/{org_id}/analytics         → get analytics data     (authenticated member)

Returns org-level metrics (ticket/task completion rates, blocker trends, etc.)
scoped to the current user's organization.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.api.deps import get_current_user
from src.database.models import User
from src.analytics import service
from src.analytics.schemas import AnalyticsResponse

router = APIRouter()

@router.get(
	"/organizations/{org_id}/analytics",
	response_model=AnalyticsResponse,
	status_code=status.HTTP_200_OK
)
def analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
	return service.get_analytics(db, current_user)
