// In-memory demo store. Holds the seed in mutable module state and derives every
// API response shape from it, so create/update/move/delete during a session stay
// consistent across the board, dashboard, analytics, standups and blockers.
// Resets to the seed on a full page reload. Only used when VITE_DEMO_MODE === "true".

import { createSeed } from "./seed";
import type { DemoState, DemoUser } from "./seed";
import type {
	User,
	OrganizationMember,
	DashboardData,
	TicketResponse,
	ListTicketsBoardResponse,
	MoveTicketResponse,
	CreateTaskResponse,
	ListTaskResponse,
	TaskResponse,
	CreateStandupResponse,
	StandupListItem,
	EditStandupResponse,
	CreateBlockerResponse,
	BlockerListItem,
	UpdateBlockerResponse,
	AnalitycsData,
	LegalDocuments,
	LoginResponse,
	SignUpResponse,
	CreateOrgResponse,
	JoinOrgResponse,
	SelectRoleResponse,
	AvatarResponse,
	InviteMemberResponse,
	CreateTicketRequest,
	UpdateTicketRequest,
	CreateTaskRequest,
	UpdateTaskRequest,
	CreateBlockerRequest,
	UpdateBlockerRequest,
	CreateOrgRequest,
	InviteMemberRequest,
	SignUpRequest,
} from "../types/api.types";

let state: DemoState = createSeed();

export function resetStore(): void {
	state = createSeed();
}

// ---- helpers --------------------------------------------------------------

const nowISO = () => new Date().toISOString();
const nextId = (prefix: string) => `${prefix}-${state.counter++}`;

function userById(id: string | null | undefined): DemoUser | undefined {
	return id ? state.users.find((u) => u.id === id) : undefined;
}

function userRef(id: string | null | undefined): { id: string; name: string; avatar_url: string | null } {
	const u = userById(id);
	return { id: u?.id ?? "", name: u?.name ?? "Unknown", avatar_url: u?.avatar_url ?? null };
}

function currentUser(): DemoUser {
	return userById(state.currentUserId) ?? state.users[0];
}

// ---- users / org ----------------------------------------------------------

export function getCurrentUser(): User {
	const u = currentUser();
	return {
		id: u.id,
		email: u.email,
		name: u.name,
		avatar_url: u.avatar_url,
		organization_id: state.org.id,
		org_name: state.org.name,
		scrum_role: u.scrum_role,
		org_role: u.org_role,
	};
}

export function getMembers(): OrganizationMember[] {
	return state.users.map((u) => ({
		id: u.id,
		name: u.name,
		avatar_url: u.avatar_url,
		org_role: u.org_role,
		scrum_role: u.scrum_role,
		tickets: state.tickets
			.filter((t) => t.assignee_id === u.id)
			.map((t) => ({ id: t.id, title: t.title, status: t.status, priority: t.priority })),
		tasks: state.tasks
			.filter((t) => t.assignee_id === u.id)
			.map((t) => ({ id: t.id, title: t.title, status: t.status, ticket_id: t.ticket_id })),
		blockers: state.blockers
			.filter((b) => b.assignee_id === u.id)
			.map((b) => ({ id: b.id, description: b.description, status: b.status, created_at: b.created_at })),
	}));
}

export function updateCurrentUser(data: { name?: string; email?: string }): User {
	const u = currentUser();
	if (data.name !== undefined) u.name = data.name;
	if (data.email !== undefined) u.email = data.email;
	return getCurrentUser();
}

export function uploadAvatar(): AvatarResponse {
	// No real upload in the demo; keep initials avatar (empty resolves to null).
	return { avatar_url: "" };
}

export function inviteMember(data: InviteMemberRequest): InviteMemberResponse {
	return { email: data.email };
}

export function removeMember(): { success: boolean } {
	return { success: true };
}

// ---- dashboard / analytics / legal ---------------------------------------

export function getDashboard(): DashboardData {
	const updates: DashboardData["recent_updates"] = [];

	for (const t of state.tickets) {
		if (t.status === "completed") {
			updates.push({
				created_by: userRef(t.assignee_id ?? t.created_by_id),
				type: "ticket",
				event: "completed",
				title: t.title,
				timestamp: t.updated_at,
			});
		}
	}

	for (const task of state.tasks) {
		const ticket = state.tickets.find((t) => t.id === task.ticket_id);
		updates.push({
			created_by: userRef(task.assignee_id ?? task.created_by_id),
			type: "task",
			event: task.status === "completed" ? "completed" : "created",
			title: task.title,
			timestamp: ticket?.updated_at ?? nowISO(),
		});
	}

	updates.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

	return {
		summary: {
			tasks_in_progress: state.tasks.filter((t) => t.status === "in_progress").length,
			tickets_completed: state.tickets.filter((t) => t.status === "completed").length,
			active_blockers: state.blockers.filter((b) => b.status === "open").length,
		},
		recent_updates: updates.slice(0, 6),
	};
}

export function getAnalytics(): AnalitycsData {
	return {
		tasks: [
			{ week: "Wk 1", in_progress: 9, completed: 3 },
			{ week: "Wk 2", in_progress: 7, completed: 6 },
			{ week: "Wk 3", in_progress: 6, completed: 9 },
			{ week: "Wk 4", in_progress: 4, completed: 12 },
		],
		tickets: [
			{ week: "Wk 1", completed: 2 },
			{ week: "Wk 2", completed: 4 },
			{ week: "Wk 3", completed: 5 },
			{ week: "Wk 4", completed: 7 },
		],
		standups: { posted: 18, total: 20 },
		blockers_avg_cycle_time: 1.8,
	};
}

export function getLegal(key: string): LegalDocuments {
	const isPrivacy = key === "privacy";
	return {
		key,
		title: isPrivacy ? "Privacy Policy" : "Terms of Service",
		content: isPrivacy
			? "# Privacy Policy\n\n_This is sample content shown in the ScrumHub demo._\n\nThe demo runs entirely in your browser with mock data. No information is collected, stored on a server, or shared."
			: "# Terms of Service\n\n_This is sample content shown in the ScrumHub demo._\n\nThis deployment is a static, read-only showcase. It is provided as-is for demonstration purposes only.",
		updated_at: new Date().toISOString(),
	};
}

// ---- tickets --------------------------------------------------------------

export function listTicketsBoard(
	status?: string | null,
	priority?: string | null,
): ListTicketsBoardResponse[] {
	return state.tickets
		.filter((t) => (status ? t.status === status : true))
		.filter((t) => (priority ? t.priority === priority : true))
		.map((t) => {
			const a = userById(t.assignee_id);
			return {
				id: t.id,
				title: t.title,
				status: t.status,
				priority: t.priority,
				assignee: a ? { id: a.id, name: a.name, avatar_url: a.avatar_url ?? "" } : null,
				created_at: t.created_at,
				updated_at: t.updated_at,
			};
		});
}

export function getTicketDetail(id: string): TicketResponse | undefined {
	const t = state.tickets.find((x) => x.id === id);
	if (!t) return undefined;
	return {
		id: t.id,
		title: t.title,
		description: t.description,
		status: t.status,
		priority: t.priority,
		created_by: userRef(t.created_by_id),
		assignee_id: t.assignee_id,
		organization_id: state.org.id,
		created_at: t.created_at,
		updated_at: t.updated_at,
		tasks: state.tasks
			.filter((task) => task.ticket_id === t.id)
			.map((task) => ({
				id: task.id,
				title: task.title,
				status: task.status,
				assignee_id: task.assignee_id,
			})),
		blockers: state.blockers
			.filter((b) => b.ticket_id === t.id)
			.map((b) => ({
				id: b.id,
				description: b.description,
				status: b.status,
				created_by: {
					id: userRef(b.created_by_id).id,
					name: userRef(b.created_by_id).name,
					avatar_url: userById(b.created_by_id)?.avatar_url ?? "",
				},
			})),
	};
}

export function createTicket(data: CreateTicketRequest): TicketResponse {
	const id = nextId("tkt");
	const ts = nowISO();
	state.tickets.unshift({
		id,
		title: data.title,
		description: data.description ?? null,
		status: "todo",
		priority: data.priority,
		created_by_id: state.currentUserId,
		assignee_id: data.assignee_id ?? null,
		created_at: ts,
		updated_at: ts,
	});
	return getTicketDetail(id)!;
}

export function updateTicket(id: string, data: UpdateTicketRequest): TicketResponse | undefined {
	const t = state.tickets.find((x) => x.id === id);
	if (!t) return undefined;
	if (data.title !== undefined) t.title = data.title;
	if (data.description !== undefined) t.description = data.description;
	if (data.priority !== undefined) t.priority = data.priority;
	if (data.status !== undefined) t.status = data.status;
	if (data.assignee_id !== undefined) t.assignee_id = data.assignee_id;
	t.updated_at = nowISO();
	return getTicketDetail(id);
}

export function moveTicket(id: string, status: TicketResponse["status"]): MoveTicketResponse | undefined {
	const t = state.tickets.find((x) => x.id === id);
	if (!t) return undefined;
	t.status = status;
	t.updated_at = nowISO();
	return { id: t.id, status: t.status, updated_at: t.updated_at };
}

export function deleteTicket(id: string): boolean {
	const before = state.tickets.length;
	state.tickets = state.tickets.filter((t) => t.id !== id);
	state.tasks = state.tasks.filter((task) => task.ticket_id !== id);
	state.blockers.forEach((b) => {
		if (b.ticket_id === id) b.ticket_id = null;
	});
	return state.tickets.length < before;
}

// ---- tasks ----------------------------------------------------------------

export function listTasks(ticketId: string, status?: string | null): ListTaskResponse[] {
	return state.tasks
		.filter((t) => t.ticket_id === ticketId)
		.filter((t) => (status ? t.status === status : true))
		.map((t) => ({ id: t.id, title: t.title, status: t.status }));
}

export function getTaskDetail(id: string): TaskResponse | undefined {
	const t = state.tasks.find((x) => x.id === id);
	if (!t) return undefined;
	return {
		id: t.id,
		title: t.title,
		description: t.description,
		status: t.status,
		created_by: t.created_by_id,
		assignee_id: t.assignee_id,
		ticket_id: t.ticket_id,
	};
}

export function createTask(ticketId: string, data: CreateTaskRequest): CreateTaskResponse {
	const id = nextId("tsk");
	state.tasks.push({
		id,
		title: data.title,
		description: data.description ?? null,
		status: "in_progress",
		created_by_id: state.currentUserId,
		assignee_id: data.assignee_id ?? null,
		ticket_id: ticketId,
	});
	return {
		id,
		title: data.title,
		description: data.description ?? null,
		status: "in_progress",
		created_by: state.currentUserId,
		assignee_id: data.assignee_id ?? null,
		ticket_id: ticketId,
	};
}

export function updateTask(id: string, data: UpdateTaskRequest): TaskResponse | undefined {
	const t = state.tasks.find((x) => x.id === id);
	if (!t) return undefined;
	if (data.title !== undefined) t.title = data.title;
	if (data.description !== undefined) t.description = data.description;
	if (data.status !== undefined) t.status = data.status;
	if (data.assignee_id !== undefined) t.assignee_id = data.assignee_id;
	return getTaskDetail(id);
}

export function deleteTask(id: string): boolean {
	const before = state.tasks.length;
	state.tasks = state.tasks.filter((t) => t.id !== id);
	return state.tasks.length < before;
}

// ---- standups -------------------------------------------------------------

function standupBlockers(blockerIds: string[]): StandupListItem["blockers"] {
	return blockerIds
		.map((bid) => state.blockers.find((b) => b.id === bid))
		.filter((b): b is NonNullable<typeof b> => Boolean(b))
		.map((b) => {
			const ticket = state.tickets.find((t) => t.id === b.ticket_id);
			return {
				id: b.id,
				title: b.description,
				ticket: { id: ticket?.id ?? "", title: ticket?.title ?? "Deleted ticket" },
			};
		});
}

export function listStandups(): StandupListItem[] {
	return state.standups.map((s) => ({
		id: s.id,
		created_at: s.created_at,
		standup_date: s.standup_date,
		today: s.today,
		yesterday: s.yesterday,
		blockers: standupBlockers(s.blocker_ids),
		created_by: userRef(s.created_by_id),
	}));
}

export function createStandup(today: string): CreateStandupResponse {
	const id = nextId("std");
	const ts = nowISO();
	const standupDate = new Date().toLocaleDateString("en-CA");
	state.standups.unshift({
		id,
		created_by_id: state.currentUserId,
		created_at: ts,
		standup_date: standupDate,
		today,
		yesterday: null,
		blocker_ids: [],
	});
	const ref = userRef(state.currentUserId);
	return {
		id,
		created_at: ts,
		standup_date: standupDate,
		today,
		yesterday: null,
		blocker_ids: [],
		created_by: { name: ref.name, id: ref.id, avatar_url: ref.avatar_url },
	};
}

export function editStandup(id: string, today: string): EditStandupResponse | undefined {
	const s = state.standups.find((x) => x.id === id);
	if (!s) return undefined;
	s.today = today;
	return { id: s.id, today: s.today };
}

export function deleteStandup(id: string): boolean {
	const before = state.standups.length;
	state.standups = state.standups.filter((s) => s.id !== id);
	return state.standups.length < before;
}

// ---- blockers -------------------------------------------------------------

function blockerListItem(b: DemoState["blockers"][number]): BlockerListItem {
	const assignee = userById(b.assignee_id);
	const ticket = state.tickets.find((t) => t.id === b.ticket_id);
	return {
		id: b.id,
		description: b.description,
		status: b.status,
		created_by: userRef(b.created_by_id),
		assignee: assignee ? { id: assignee.id, name: assignee.name } : null,
		ticket: { id: ticket?.id ?? "", title: ticket?.title ?? "Deleted ticket" },
		created_at: b.created_at,
		resolved_at: b.resolved_at,
	};
}

export function listBlockers(status?: string | null): BlockerListItem[] {
	return state.blockers
		.filter((b) => (status ? b.status === status : true))
		.map(blockerListItem);
}

export function createBlocker(data: CreateBlockerRequest): CreateBlockerResponse {
	const id = nextId("blk");
	const ts = nowISO();
	state.blockers.unshift({
		id,
		description: data.description,
		status: "open",
		created_by_id: state.currentUserId,
		assignee_id: data.assignee_id ?? null,
		ticket_id: data.ticket_id ?? null,
		created_at: ts,
		resolved_at: null,
	});
	return {
		id,
		description: data.description,
		status: "open",
		created_by: state.currentUserId,
		assignee_id: data.assignee_id ?? null,
		ticket_id: data.ticket_id ?? null,
		created_at: ts,
		resolved_at: null,
	};
}

export function updateBlocker(id: string, data: UpdateBlockerRequest): UpdateBlockerResponse | undefined {
	const b = state.blockers.find((x) => x.id === id);
	if (!b) return undefined;
	if (data.description !== undefined) b.description = data.description;
	if (data.ticket_id !== undefined) b.ticket_id = data.ticket_id;
	if (data.assignee_id !== undefined) b.assignee_id = data.assignee_id;
	return {
		id: b.id,
		description: b.description,
		status: b.status,
		created_by: b.created_by_id,
		assignee_id: b.assignee_id,
		ticket_id: b.ticket_id,
		created_at: b.created_at,
		resolved_at: b.resolved_at,
	};
}

export function resolveBlocker(id: string): boolean {
	const b = state.blockers.find((x) => x.id === id);
	if (!b) return false;
	b.status = "resolved";
	b.resolved_at = nowISO();
	return true;
}

// ---- auth / org setup (stubbed) ------------------------------------------

export function login(): LoginResponse {
	return { access_token: "demo-token", token_type: "bearer" };
}

export function signup(data: SignUpRequest): SignUpResponse {
	return { id: nextId("user"), name: data.name, email: data.email };
}

export function createOrganization(data: CreateOrgRequest): CreateOrgResponse {
	return { id: state.org.id, name: data.name, join_code: state.org.join_code, created_by: state.currentUserId };
}

export function setUserRole(scrumRole: SelectRoleResponse["scrum_role"]): SelectRoleResponse {
	return { organization_id: state.org.id, scrum_role: scrumRole };
}

export function joinOrganization(): JoinOrgResponse {
	return {
		organization_id: state.org.id,
		org_role: "member",
		available_scrum_role: [{ role: "developer" }],
	};
}
