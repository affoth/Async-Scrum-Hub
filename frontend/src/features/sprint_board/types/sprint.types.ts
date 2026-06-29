//Domain value types
export type TicketStatus = "todo" | "in_progress" | "completed";
export type TaskStatus = "in_progress" | "completed";
export type Priority = "high" | "medium" | "low";
export type UserRole = "product_owner" | "scrum_master" | "developer";
export type BlockerStatus = "open" | "resolved";

//Domain Entities
export interface Ticket {
	id: string;
	title: string;
	description: string | null;
	status: TicketStatus;
	priority: Priority;
	created_by: UserRef;
	assignee_id: string | null;
	organization_id: string;
	created_at: string;
	updated_at: string;
	tasks: Array<{
		id: string;
		title: string;
		status: TaskStatus;
		assignee_id: string | null;
	}>
	blockers: Array<{
		id: string;
		description: string;
		status: BlockerStatus;
		created_by: {
			id: string;
			name: string;
			avatar_url: string;
		}
	}>
}

export interface ListTicketsBoard
{
	id: string;
	title: string;
	status: TicketStatus,
	priority: Priority;
	assignee: UserRef | null;
	created_at: string;
	updated_at: string;
}

export interface Task
{
	id: string;
	title: string;
	description: string | null;
	status: TaskStatus;
	created_by: string;
	assignee_id: string | null;
	ticket_id: string;
}

export type TaskSummary = Pick<Task, 'id' | 'title' | 'status' | 'assignee_id'>;

export interface Blocker
{
	id: string;
	description: string;
	status: BlockerStatus;
	created_by: UserRef;
	assignee_id: string | null;
	ticket_id: string | null;
	created_at: string;
	resolved_at: string | null;
}

export interface UserRef {
	id: string;
	name: string;
	avatar_url : string | null;
}

export interface User {
	id: string;
	email: string;
	name: string;
	avatar_url: string | null;
	organization_id: string | null;
	org_name: string | null;
	scrum_role: "scrum_master" | "product_owner" | "developer" | null;
	org_role: "admin" | "member" | null;
}

export interface OrgMember {
	id: string;
	name: string;
	avatar_url: string | null;
	scrum_role: UserRole;
}
