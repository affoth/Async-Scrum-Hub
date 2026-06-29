from enum import StrEnum

class TicketStatus(StrEnum):
	TODO = "todo"
	IN_PROGRESS = "in_progress"
	COMPLETED = "completed"

class TaskStatus(StrEnum):
	IN_PROGRESS = "in_progress"
	COMPLETED = "completed"

class Priority(StrEnum):
	LOW = "low"
	MEDIUM = "medium"
	HIGH = "high"

class BlockerStatus(StrEnum):
	OPEN = "open"
	RESOLVED = "resolved"

class OrgRole(StrEnum):
	admin = "admin"
	member = "member"

class ScrumRole(StrEnum):
	scrum_master = "scrum_master"
	product_owner = "product_owner"
	developer = "developer"
