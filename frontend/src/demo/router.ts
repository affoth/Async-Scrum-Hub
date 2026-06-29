// Demo request router. In demo mode, src/services/api.ts routes every apiFetch()
// call here instead of hitting the network. We parse the method + path against the
// in-memory store and return a real Response, so the .ok / .json() logic in each
// api function works unchanged. Only used when VITE_DEMO_MODE === "true".

import * as store from "./store";

const DELAY_MS = 150;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

function notFound(message = "Not found"): Response {
	return json({ error: { code: "NOT_FOUND", message } }, 404);
}

const noContent = () => new Response(null, { status: 204 });

interface JsonBody {
	[key: string]: unknown;
}

function parseBody(options?: RequestInit): JsonBody {
	const body = options?.body;
	if (typeof body === "string") {
		try {
			return JSON.parse(body) as JsonBody;
		} catch {
			return {};
		}
	}
	return {};
}

function route(method: string, path: string, params: URLSearchParams, body: JsonBody): Response {
	// helper: match a path against a /pattern/ with :params, returning captured values
	const match = (pattern: string): Record<string, string> | null => {
		const pSeg = pattern.split("/").filter(Boolean);
		const aSeg = path.split("/").filter(Boolean);
		if (pSeg.length !== aSeg.length) return null;
		const out: Record<string, string> = {};
		for (let i = 0; i < pSeg.length; i++) {
			if (pSeg[i].startsWith(":")) out[pSeg[i].slice(1)] = decodeURIComponent(aSeg[i]);
			else if (pSeg[i] !== aSeg[i]) return null;
		}
		return out;
	};
	const is = (m: string, pattern: string) => method === m && match(pattern) !== null;
	const params2 = (pattern: string) => match(pattern) as Record<string, string>;

	// ---- auth ----
	if (is("POST", "/auth/register")) return json(store.signup(body as never), 201);
	if (is("POST", "/auth/login")) return json(store.login());

	// ---- users ----
	if (is("GET", "/users/me")) return json(store.getCurrentUser());
	if (is("PATCH", "/users/me")) return json(store.updateCurrentUser(body as never));
	if (is("POST", "/users/me/avatar")) return json(store.uploadAvatar());

	// ---- organizations (specific before :id) ----
	if (is("POST", "/organizations/join")) return json(store.joinOrganization());
	if (is("POST", "/organizations")) return json(store.createOrganization(body as never), 201);

	if (is("GET", "/organizations/:id/members")) return json(store.getMembers());
	if (is("POST", "/organizations/:id/members")) return json(store.inviteMember(body as never), 201);
	if (is("DELETE", "/organizations/:id/members/:uid")) return json(store.removeMember());
	if (is("GET", "/organizations/:id/dashboard")) return json(store.getDashboard());
	if (is("GET", "/organizations/:id/analytics")) return json(store.getAnalytics());
	if (is("GET", "/organizations/:id/tickets"))
		return json(store.listTicketsBoard(params.get("status"), params.get("priority")));
	if (is("POST", "/organizations/:id/tickets")) return json(store.createTicket(body as never), 201);
	if (is("GET", "/organizations/:id/standups")) return json(store.listStandups());
	if (is("POST", "/organizations/:id/standups"))
		return json(store.createStandup(String(body.today ?? "")), 201);
	if (is("GET", "/organizations/:id/blockers")) return json(store.listBlockers(params.get("status")));
	if (is("POST", "/organizations/:id/blockers")) return json(store.createBlocker(body as never), 201);
	if (is("PATCH", "/organizations/:id")) return json(store.setUserRole(body.scrum_role as never));

	// ---- tickets (specific before :id) ----
	if (is("PATCH", "/tickets/:id/move")) {
		const r = store.moveTicket(params2("/tickets/:id/move").id, body.status as never);
		return r ? json(r) : notFound("Ticket not found");
	}
	if (is("GET", "/tickets/:id/tasks"))
		return json(store.listTasks(params2("/tickets/:id/tasks").id, params.get("status")));
	if (is("POST", "/tickets/:id/tasks"))
		return json(store.createTask(params2("/tickets/:id/tasks").id, body as never), 201);
	if (is("GET", "/tickets/:id")) {
		const r = store.getTicketDetail(params2("/tickets/:id").id);
		return r ? json(r) : notFound("Ticket not found");
	}
	if (is("PATCH", "/tickets/:id")) {
		const r = store.updateTicket(params2("/tickets/:id").id, body as never);
		return r ? json(r) : notFound("Ticket not found");
	}
	if (is("DELETE", "/tickets/:id"))
		return store.deleteTicket(params2("/tickets/:id").id) ? noContent() : notFound("Ticket not found");

	// ---- tasks ----
	if (is("GET", "/tasks/:id")) {
		const r = store.getTaskDetail(params2("/tasks/:id").id);
		return r ? json(r) : notFound("Task not found");
	}
	if (is("PATCH", "/tasks/:id")) {
		const r = store.updateTask(params2("/tasks/:id").id, body as never);
		return r ? json(r) : notFound("Task not found");
	}
	if (is("DELETE", "/tasks/:id"))
		return store.deleteTask(params2("/tasks/:id").id) ? noContent() : notFound("Task not found");

	// ---- standups ----
	if (is("PATCH", "/standups/:id")) {
		const r = store.editStandup(params2("/standups/:id").id, String(body.today ?? ""));
		return r ? json(r) : notFound("Standup not found");
	}
	if (is("DELETE", "/standups/:id"))
		return store.deleteStandup(params2("/standups/:id").id) ? noContent() : notFound("Standup not found");

	// ---- blockers (specific before :id) ----
	if (is("PATCH", "/blockers/:id/resolve"))
		return store.resolveBlocker(params2("/blockers/:id/resolve").id)
			? noContent()
			: notFound("Blocker not found");
	if (is("PATCH", "/blockers/:id")) {
		const r = store.updateBlocker(params2("/blockers/:id").id, body as never);
		return r ? json(r) : notFound("Blocker not found");
	}

	// ---- legal ----
	if (is("GET", "/legal/documents/:key")) return json(store.getLegal(params2("/legal/documents/:key").key));

	return notFound(`No demo handler for ${method} ${path}`);
}

export async function demoFetch(url: string, options?: RequestInit): Promise<Response> {
	await sleep(DELAY_MS);
	const u = new URL(url, window.location.origin);
	const path = u.pathname.replace(/^\/api\/v1/, "");
	const method = (options?.method ?? "GET").toUpperCase();
	return route(method, path, u.searchParams, parseBody(options));
}
