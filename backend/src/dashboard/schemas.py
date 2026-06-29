from pydantic import BaseModel
from datetime import datetime
from typing import Literal
from src.schemas.common import UserBrief

# Section 1: Value cards
class DashboardSummary(BaseModel):
	tasks_in_progress: int
	tickets_completed: int
	active_blockers: int

# Section 2: Recent updates feed
class RecentUpdateItem(BaseModel):
	type: Literal["task", "ticket"]
	event: Literal["created", "completed"]
	title: str
	timestamp: datetime  # ISO UTC – frontend formats as "X min ago", "2 days ago"
	created_by: UserBrief

class DashboardResponse(BaseModel):
	summary: DashboardSummary
	recent_updates: list[RecentUpdateItem]  # up to 6 items, most recent first