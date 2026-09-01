// Demo seed data — only used when VITE_DEMO_MODE === "true".
// Defines a small, internally-consistent dataset for the in-memory demo store.
// Nothing here is imported by the real app except via src/demo/* in demo mode.

import type { TicketStatus, TaskStatus, BlockerStatus } from "../types/api.types";

// ---- Canonical (normalized) demo entities ---------------------------------
// The store keeps these as the single source of truth and derives every API
// response shape from them, so create/update/move/delete stay consistent.

export type ScrumRole = "scrum_master" | "product_owner" | "developer";
export type OrgRole = "admin" | "member";

export interface DemoUser {
	id: string;
	name: string;
	email: string;
	avatar_url: string | null;
	scrum_role: ScrumRole;
	org_role: OrgRole;
}

export interface DemoTicket {
	id: string;
	title: string;
	description: string | null;
	status: TicketStatus;
	priority: "low" | "medium" | "high";
	created_by_id: string;
	assignee_id: string | null;
	created_at: string;
	updated_at: string;
}

export interface DemoTask {
	id: string;
	title: string;
	description: string | null;
	status: TaskStatus;
	created_by_id: string;
	assignee_id: string | null;
	ticket_id: string;
}

export interface DemoBlocker {
	id: string;
	description: string;
	status: BlockerStatus;
	created_by_id: string;
	assignee_id: string | null;
	ticket_id: string | null;
	created_at: string;
	resolved_at: string | null;
}

export interface DemoStandup {
	id: string;
	created_by_id: string;
	created_at: string;
	standup_date: string; // en-CA, e.g. "2026-06-29"
	today: string;
	yesterday: string | null;
	blocker_ids: string[];
}

export interface DemoState {
	org: { id: string; name: string; join_code: string };
	currentUserId: string;
	users: DemoUser[];
	tickets: DemoTicket[];
	tasks: DemoTask[];
	blockers: DemoBlocker[];
	standups: DemoStandup[];
	counter: number; // for generating new ids
}

// ---- time helpers ---------------------------------------------------------

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const hoursAgo = (h: number) => minutesAgo(h * 60);
const daysAgo = (d: number) => minutesAgo(d * 60 * 24);
const dateCA = (daysBack: number) =>
	new Date(Date.now() - daysBack * 86_400_000).toLocaleDateString("en-CA");

// ---- ids ------------------------------------------------------------------

const ORG_ID = "org-demo";

const U = {
	alex: "user-alex", // current demo user — Product Owner / admin
	sam: "user-sam", // Scrum Master
	jordan: "user-jordan", // Developer
	taylor: "user-taylor", // Developer
	morgan: "user-morgan", // Developer
} as const;

// ---- seed factory (called on first load and on reset) ---------------------

export function createSeed(): DemoState {
	const users: DemoUser[] = [
		{ id: U.alex, name: "Alex Rivera", email: "demo@scrumhub.app", avatar_url: null, scrum_role: "product_owner", org_role: "admin" },
		{ id: U.sam, name: "Sam Okafor", email: "sam@scrumhub.app", avatar_url: null, scrum_role: "scrum_master", org_role: "member" },
		{ id: U.jordan, name: "Jordan Lee", email: "jordan@scrumhub.app", avatar_url: null, scrum_role: "developer", org_role: "member" },
		{ id: U.taylor, name: "Taylor Kim", email: "taylor@scrumhub.app", avatar_url: null, scrum_role: "developer", org_role: "member" },
		{ id: U.morgan, name: "Morgan Diaz", email: "morgan@scrumhub.app", avatar_url: null, scrum_role: "developer", org_role: "member" },
	];

	const tickets: DemoTicket[] = [
		{ id: "tkt-1", title: "Set up CI/CD pipeline", description: "GitHub Actions for build, test and deploy.", status: "completed", priority: "high", created_by_id: U.alex, assignee_id: U.jordan, created_at: daysAgo(12), updated_at: daysAgo(8) },
		{ id: "tkt-2", title: "Design onboarding flow", description: "Welcome → team setup → first standup.", status: "completed", priority: "medium", created_by_id: U.alex, assignee_id: U.taylor, created_at: daysAgo(11), updated_at: daysAgo(6) },
		{ id: "tkt-3", title: "Implement JWT authentication", description: "Login, refresh tokens and route guards.", status: "in_progress", priority: "high", created_by_id: U.alex, assignee_id: U.jordan, created_at: daysAgo(7), updated_at: hoursAgo(5) },
		{ id: "tkt-4", title: "Build analytics dashboard", description: "Velocity and burndown charts with recharts.", status: "in_progress", priority: "medium", created_by_id: U.sam, assignee_id: U.taylor, created_at: daysAgo(5), updated_at: hoursAgo(20) },
		{ id: "tkt-5", title: "Add real-time board updates", description: "WebSocket sync across connected clients.", status: "in_progress", priority: "high", created_by_id: U.alex, assignee_id: U.morgan, created_at: daysAgo(4), updated_at: hoursAgo(2) },
		{ id: "tkt-6", title: "Refactor API error handling", description: "Consistent error codes and messages.", status: "todo", priority: "medium", created_by_id: U.sam, assignee_id: null, created_at: daysAgo(2), updated_at: daysAgo(2) },
		{ id: "tkt-7", title: "Dark mode support", description: "Theme tokens and a toggle in settings.", status: "todo", priority: "low", created_by_id: U.alex, assignee_id: U.morgan, created_at: daysAgo(1), updated_at: hoursAgo(26) },
	];

	const tasks: DemoTask[] = [
		// tkt-1 (completed)
		{ id: "tsk-1", title: "Write Dockerfile", description: null, status: "completed", created_by_id: U.jordan, assignee_id: U.jordan, ticket_id: "tkt-1" },
		{ id: "tsk-2", title: "Add deploy workflow", description: null, status: "completed", created_by_id: U.jordan, assignee_id: U.jordan, ticket_id: "tkt-1" },
		// tkt-3 (in progress)
		{ id: "tsk-3", title: "Login endpoint", description: "POST /auth/login", status: "completed", created_by_id: U.jordan, assignee_id: U.jordan, ticket_id: "tkt-3" },
		{ id: "tsk-4", title: "Token refresh logic", description: "Rotate refresh tokens", status: "in_progress", created_by_id: U.jordan, assignee_id: U.jordan, ticket_id: "tkt-3" },
		{ id: "tsk-5", title: "Protect private routes", description: null, status: "in_progress", created_by_id: U.alex, assignee_id: U.jordan, ticket_id: "tkt-3" },
		// tkt-4 (in progress)
		{ id: "tsk-6", title: "Velocity bar chart", description: null, status: "in_progress", created_by_id: U.taylor, assignee_id: U.taylor, ticket_id: "tkt-4" },
		{ id: "tsk-7", title: "Burndown line chart", description: null, status: "in_progress", created_by_id: U.taylor, assignee_id: U.taylor, ticket_id: "tkt-4" },
		// tkt-5 (in progress)
		{ id: "tsk-8", title: "WebSocket gateway", description: null, status: "completed", created_by_id: U.morgan, assignee_id: U.morgan, ticket_id: "tkt-5" },
		{ id: "tsk-9", title: "Board live refresh", description: null, status: "in_progress", created_by_id: U.morgan, assignee_id: U.morgan, ticket_id: "tkt-5" },
		// tkt-7 (todo)
		{ id: "tsk-10", title: "Define theme tokens", description: null, status: "in_progress", created_by_id: U.morgan, assignee_id: U.morgan, ticket_id: "tkt-7" },
	];

	const blockers: DemoBlocker[] = [
		{ id: "blk-1", description: "Waiting on staging secrets from infra team.", status: "open", created_by_id: U.jordan, assignee_id: U.jordan, ticket_id: "tkt-3", created_at: hoursAgo(6), resolved_at: null },
		{ id: "blk-2", description: "Recharts tooltip overlaps the legend on small screens.", status: "open", created_by_id: U.taylor, assignee_id: U.taylor, ticket_id: "tkt-4", created_at: daysAgo(1), resolved_at: null },
		{ id: "blk-3", description: "Flaky WebSocket reconnect under load.", status: "resolved", created_by_id: U.morgan, assignee_id: U.morgan, ticket_id: "tkt-5", created_at: daysAgo(3), resolved_at: daysAgo(1) },
	];

	const standups: DemoStandup[] = [
		{ id: "std-1", created_by_id: U.jordan, created_at: hoursAgo(4), standup_date: dateCA(0), today: "Wrapping up token refresh logic and reviewing route guards.", yesterday: "Shipped the login endpoint.", blocker_ids: ["blk-1"] },
		{ id: "std-2", created_by_id: U.taylor, created_at: hoursAgo(3), standup_date: dateCA(0), today: "Polishing the velocity chart and starting the burndown chart.", yesterday: "Hooked analytics data into recharts.", blocker_ids: ["blk-2"] },
		{ id: "std-3", created_by_id: U.morgan, created_at: hoursAgo(2), standup_date: dateCA(0), today: "Wiring live board refresh over WebSocket.", yesterday: "Finished the WebSocket gateway.", blocker_ids: [] },
		{ id: "std-4", created_by_id: U.sam, created_at: daysAgo(1), standup_date: dateCA(1), today: "Grooming the backlog and prepping sprint review.", yesterday: "Facilitated planning and updated the board.", blocker_ids: [] },
	];

	return {
		org: { id: ORG_ID, name: "Demo Mode", join_code: "DEMO-2F4A" },
		currentUserId: U.alex,
		users,
		tickets,
		tasks,
		blockers,
		standups,
		counter: 1,
	};
}
