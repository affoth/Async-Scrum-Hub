export type TicketStatus = "todo" | "in_progress" | "completed";
export type TaskStatus = "in_progress" | "completed";
export type BlockerStatus = "open" | "resolved";

//0. USER & ORGANIZATION MEMBERS
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


export interface OrganizationMember {
	id: string;
	name: string;
	avatar_url: string | null;
	org_role: "admin" | "member";
	scrum_role: "scrum_master" | "product_owner" | "developer";

	tickets: Array<{
		id: string;
		title: string;
		status: "todo" | "in_progress" | "completed";
		priority: "low" | "medium" | "high";
	}>;

	tasks: Array<{
		id: string;
		title: string;
		status: "in_progress" | "completed";
		ticket_id: string;
	}>;

	blockers: Array<{
		id: string;
		description: string;
		status: "open" | "resolved";
		created_at: string;
	}>;
}

//1. SIGNUP
export interface SignUpRequest {
	name: string;
	email: string;
	password: string;
}

export interface SignUpResponse {
	id: string;
	name: string;
	email: string;
}

//1.2 TEAM SETUP
export interface CreateOrgRequest {
	name: string;
}

export interface CreateOrgResponse {
	id: string;
	name: string;
	join_code: string;
	created_by: string;
}

export interface JoinOrgRequest {
	join_code: string;
}

export interface JoinOrgResponse {
	organization_id: string;
	org_role: "admin" | "member";
	available_scrum_role: Array <{
		role: "scrum_master" | "product_owner" | "developer";
	}>;
}

export interface SelectRoleResponse {
	organization_id: string,
	scrum_role: "scrum_master" | "product_owner" | "developer"
}

//2. LOGIN
export interface LoginRequest {
	email: string;
	password: string;
}

export interface LoginResponse {
	access_token: string;
	token_type: string;
}

//3. TOPBAR
export interface UpdateUserRequest {
	name: string;
	email: string;
}

export interface AvatarRequest {
	file: File;
}

export interface AvatarResponse {
	avatar_url: string;
}

export interface InviteMemberRequest {
	name: string;
	email: string;
}

export interface InviteMemberResponse {
	email: string;
}

//4. DASHBOARD
export interface DashboardData {
	summary: {
		tasks_in_progress: number;
		tickets_completed: number;
		active_blockers: number;
	};
	recent_updates: Array<{
		created_by: {
			id: string;
			name: string;
			avatar_url: string | null;
		};
		type: "task" | "ticket";
		event: "created" | "completed";
		title: string;
		timestamp: string;
	}>;
}

//5. SPRINT BOARD (Tickets)
export interface CreateTicketRequest {
	title: string;
	description: string;
	priority: "low" | "medium" | "high";
	assignee_id: string | null;
}

export interface TicketResponse {
	id: string;
	title: string;
	description: string | null;
	status: "todo" | "in_progress" | "completed";
	priority: "low" | "medium" | "high";
	created_by: {
		id: string;
		name: string;
		avatar_url: string | null;
	}
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

export interface ListTicketsBoardResponse {
	id: string;
	title: string;
	status: "todo" | "in_progress" | "completed";
	priority: "low" | "medium" | "high";
	assignee: {
		id: string;
		name: string;
		avatar_url: string;
	} | null;
	created_at: string;
	updated_at: string;
}

export interface UpdateTicketRequest {
	title?: string;
	description?: string;
	priority?: "low" | "medium" | "high";
	status?: "todo" | "in_progress" | "completed";
	assignee_id?: string | null;
}

export interface MoveTicketRequest {
	status: "todo" | "in_progress" | "completed";
}

export interface MoveTicketResponse {
	id: string;
	status: "todo" | "in_progress" | "completed";
	updated_at: string;
}

//5.2 SPRINT BOARD (Tasks)

export interface CreateTaskRequest {
	title: string;
	description: string | null;
	assignee_id: string | null;
}

export interface CreateTaskResponse {
	id: string;
	title: string;
	description: string | null;
	status: "in_progress";
	created_by: string;
	assignee_id: string | null;
	ticket_id: string;
}

export interface ListTaskResponse {
	id: string;
	title: string;
	status: "in_progress" | "completed";
}

export interface TaskResponse {
	id: string;
	title: string;
	description: string | null;
	status: "in_progress" | "completed";
	created_by: string;
	assignee_id: string | null;
	ticket_id: string;
}

export interface UpdateTaskRequest {
	title?: string;
	description?: string;
	status?: "in_progress" | "completed";
	assignee_id?: string | null;
}

//6. STANDUPS
export interface CreateStandupRequest {
	today: string;
}

export interface CreateStandupResponse {
	id: string;
	created_at: string;
	standup_date: string;
	today: string;
	yesterday: string | null;
	blocker_ids: string[];
	created_by: {
		name: string;
		id: string;
		avatar_url: string | null;
	}
};

export interface StandupListItem {
	id: string;
	created_at: string;
	standup_date: string;
	today: string;
	yesterday: string | null;
	blockers: {
		id: string;
		title: string;
		ticket: {
			id: string;
			title: string;
		}
	} [];
	created_by: {
		id: string;
		name: string;
		avatar_url: string | null;
	}
}

export interface EditStandupRequest {
	today?: string;
}

export interface EditStandupResponse {
	id: string;
	today: string;
}

//7. BLOCKERS
export interface CreateBlockerRequest {
	description: string;
	ticket_id: string | null;
	assignee_id: string | null;
}

export interface CreateBlockerResponse {
	id: string;
	description: string;
	status: "open";
	created_by: string;
	assignee_id: string | null;
	ticket_id: string | null;
	created_at: string;
	resolved_at: null;
}

export interface BlockerListItem {
	id: string;
	description: string;
	status: "open" | "resolved";
	created_by: {
		id: string;
		name: string;
		avatar_url: string | null;
	};
	assignee: {
		id: string;
		name: string;
	} | null;
	ticket: {
		id: string;
		title: string;
	};
	created_at: string;
	resolved_at: string | null;
}

export interface UpdateBlockerRequest {
	description?: string;
	ticket_id?: string | null;
	assignee_id?: string | null;
}

export interface UpdateBlockerResponse {
	id: string;
	description: string;
	status: "open" | "resolved";
	created_by: string;
	assignee_id: string | null;
	ticket_id: string | null;
	created_at: string;
	resolved_at: string | null;
}

//8. ANALYTICS
export interface AnalitycsData {
	tasks: Array<{
		week: string,
		in_progress: number,
		completed: number
	}>;

	tickets: Array<{
		week: string,
		completed: number,
	}>;

	standups: {
		posted: number,
		total: number,
	};
	blockers_avg_cycle_time: number;
}

//9. INFO

//10. TERMS & POLICY
export interface LegalDocuments {
	key: string;
	title: string;
	content: string;
	updated_at: string;
}

