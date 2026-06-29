from pydantic import BaseModel

#Tasks --> Line chart
class TaskWeekData(BaseModel):
	week: str
	in_progress: int  
	completed: int

#Tickets --> bar chart
class TicketWeekData(BaseModel):
	week: str
	completed: int  

#Standups --> numeric cards
class StandupParticipation(BaseModel):
	posted: int
	total: int  

class AnalyticsResponse(BaseModel):
	tasks: list[TaskWeekData]
	tickets: list[TicketWeekData] 
	standups: StandupParticipation
	blockers_avg_cycle_time: float

