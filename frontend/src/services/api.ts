import type{
	User,
	OrganizationMember,
	SignUpRequest,
	SignUpResponse,
	CreateOrgRequest,
	CreateOrgResponse,
	JoinOrgRequest,
	JoinOrgResponse,
	SelectRoleResponse,
	LoginRequest,
	LoginResponse,
	UpdateUserRequest,
	AvatarRequest,
	AvatarResponse,
	InviteMemberRequest,
	InviteMemberResponse,
	DashboardData,
	CreateTicketRequest,
	TicketResponse,
	ListTicketsBoardResponse,
	UpdateTicketRequest,
	MoveTicketRequest,
	MoveTicketResponse,
	CreateTaskRequest,
	CreateTaskResponse,
	ListTaskResponse,
	TaskResponse,
	UpdateTaskRequest,
	CreateStandupRequest,
	CreateStandupResponse,
	StandupListItem,
	EditStandupRequest,
	EditStandupResponse,
	CreateBlockerRequest,
	CreateBlockerResponse,
	BlockerListItem,
	UpdateBlockerRequest,
	UpdateBlockerResponse,
	AnalitycsData,
	LegalDocuments,
} from "../types/api.types"

const rawApiUrl = import.meta.env.VITE_API_URL;
if (!rawApiUrl) {
	throw new Error(
		"Missing VITE_API_URL. Set it in frontend/.env or frontend/.env.local (see frontend/.env.example)."
	);
}
const API_URL = rawApiUrl.replace(/\/+$/, "");


async function apiFetch(
	url: string,
	options?: RequestInit
) : Promise<Response> {
	if (import.meta.env.VITE_DEMO_MODE === "true") {
		const { demoFetch } = await import("../demo/router");
		return demoFetch(url, options);
	}
	const response = await fetch(url, options);
	if (response.status === 401 && !url.includes("/auth/")) {
		localStorage.removeItem("token");
		window.location.href = "/login";
	}

	return response;
}

// 1.1 REGISTER NEW USER
export async function signup(data:
	SignUpRequest
): Promise<SignUpResponse> {

	const response = await apiFetch(`${API_URL}/auth/register`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw errorData; // Contains { error: { code, message } }
	}

	return response.json();
}

// 1.2 LOGIN
export async function login(credentials:
	LoginRequest
): Promise<LoginResponse> {

	const response = await apiFetch(`${API_URL}/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(credentials)
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw errorData; // Contains { error: { code, message } }
	}

	const data = await response.json();

	// Store token in localStorage
	localStorage.setItem("token", data.access_token);

	return data;
}


// 2.1 GET CURRENT USER
export async function getCurrentUser(): Promise<User>
{
	const token = localStorage.getItem("token");

	const response = await apiFetch(`${API_URL}/users/me`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		}
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw errorData;
	}

	return response.json();
}

// 2.2 UPDATE USER
export async function updateUser(
	data: UpdateUserRequest
) : Promise<User> {
	const token = localStorage.getItem("token");

	const response = await apiFetch(`${API_URL}/users/me`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		},
		body: JSON.stringify(data)
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw errorData; // Contains { error: { code, message } }
	}

	return response.json();
}

// 2.3 UPLOAD AVATAR
export async function uploadAvatar(
	data: AvatarRequest
) : Promise<AvatarResponse> {
	const token = localStorage.getItem("token");

	const formData = new FormData();
	formData.append("file", data.file);

	const response = await apiFetch(`${API_URL}/users/me/avatar`, {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${token}`
		},
		body: formData
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw errorData; // Contains { error: { code, message } }
	}

	return response.json();
}


// 3.1 CREATE ORGANIZATION
export async function createOrganization(data:
	CreateOrgRequest
): Promise<CreateOrgResponse> {
	const token = localStorage.getItem("token");

	const response = await apiFetch(`${API_URL}/organizations`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		},
		body: JSON.stringify(data)
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw errorData; // Contains { error: { code, message } }
	}

	return response.json();
}

// 3.2 SELECT ROLE
export async function setUserRole(data: {
	org_id: string,
	scrum_role: "scrum_master" | "product_owner" | "developer"
}): Promise<SelectRoleResponse>{
	const token = localStorage.getItem("token");

	const response = await apiFetch(`${API_URL}/organizations/${data.org_id}`, {
		method: 'PATCH',
		headers: {
		'Content-Type': 'application/json',
		'Authorization': `Bearer ${token}`
		},
		body: JSON.stringify({ scrum_role: data.scrum_role })
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw errorData;
	}

	return response.json();//{ success: true };
}

// 3.3 GET ORGANIZATION MEMBERS
export async function getOrganizationMembers(
	org_id: string
): Promise<OrganizationMember[]> {
	const token = localStorage.getItem("token");

	const response = await apiFetch(`${API_URL}/organizations/${org_id}/members`, {
		method: 'GET',
		headers: {
		'Content-Type': 'application/json',
		'Authorization': `Bearer ${token}`
		}
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw errorData;
	}

	return response.json();
}

// 3.4 INVITE MEMBERS TO ORGANIZATION
export async function inviteMember(
	org_id: string,
	data: InviteMemberRequest
) : Promise<InviteMemberResponse> {
	const token = localStorage.getItem("token");

	const response = await apiFetch(`${API_URL}/organizations/${org_id}/members`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		},
		body: JSON.stringify(data)
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw errorData; // Contains { error: { code, message } }
	}

	return response.json();
}

// 3.5 REMOVE MEMBER FROM ORGANIZATION
export async function removeMember(
	org_id: string,
	user_id: string
): Promise<{ success: boolean}> {
	const token = localStorage.getItem("token");

	const response = await apiFetch(`${API_URL}/organizations/${org_id}/members/${user_id}`, {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		}
	});
	if (!response.ok) {
		const errorData = await response.json();
		throw errorData;
	}

	return { success: true };
}

// 3.6 JOIN ORGANIZATION BY CODE
export async function joinOrganization(data:
	JoinOrgRequest
): Promise<JoinOrgResponse> {
	const token = localStorage.getItem("token");

	const response = await apiFetch(`${API_URL}/organizations/join`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		},
		body: JSON.stringify(data)
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw errorData;
	}

	return response.json();
}


// 4.1 CREATE TICKETS
export async function createTicket(
	org_id: string,
	data: CreateTicketRequest
) : Promise<TicketResponse> {
	const token = localStorage.getItem("token");

	const response = await apiFetch(`${API_URL}/organizations/${org_id}/tickets`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		},
		body: JSON.stringify(data)
	});
	if (!response.ok) {
		const errorData = await response.json();
		throw errorData;
	}

	return response.json();
}

// 4.2 LIST TICKETS (SPRINTBOARD)
export async function listTicketsBoard(
	org_id: string,
	status?: "todo" | "in_progress" | "completed",
	priority?: "low" | "medium" | "high",
): Promise<ListTicketsBoardResponse[]> {
	const token = localStorage.getItem("token");

	const params = new URLSearchParams();
	if (status) params.append("status", status);
	if (priority) params.append("priority", priority);
	const query = params.size > 0 ? `?${params.toString()}` : "";
	const url = `${API_URL}/organizations/${org_id}/tickets${query}`;

	const response = await apiFetch(url, {
		method: 'GET',
		headers: {
		'Content-Type': 'application/json',
		'Authorization': `Bearer ${token}`
		}
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw errorData;
	}

	return response.json();
}

// 4.3 GET TICKET DETAILS
export async function getTicketDetails(
	ticket_id: string,
) : Promise<TicketResponse> {
	const token = localStorage.getItem("token");

	const response = await apiFetch(`${API_URL}/tickets/${ticket_id}`, {
		method: 'GET',
		headers: {
		'Content-Type': 'application/json',
		'Authorization': `Bearer ${token}`
		}
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw errorData;
	}

	return response.json();
}

// 4.4 UPDATE TICKETS
export async function updateTicket(
	ticket_id: string,
	data: UpdateTicketRequest
) : Promise<TicketResponse> {
	const token = localStorage.getItem("token");

	const response = await apiFetch(`${API_URL}/tickets/${ticket_id}`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		},
		body: JSON.stringify(data)
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw errorData;
	}

	return response.json();
}

// 4.5 MOVE TICKET (DRAG & DROP)
export async function moveTicket(
	ticket_id: string,
	data: MoveTicketRequest
) : Promise<MoveTicketResponse> {
	const token = localStorage.getItem("token");

	const response = await apiFetch(`${API_URL}/tickets/${ticket_id}/move`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		},
		body: JSON.stringify(data)
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw errorData;
	}

	return response.json();
}

// 4.6 DELETE TICKET
export async function deleteTicket(
	ticket_id: string
) : Promise <void> {
	const token = localStorage.getItem("token");

	const response = await apiFetch(`${API_URL}/tickets/${ticket_id}`, {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		}
	});
	if (!response.ok) {
		const errorData = await response.json();
		throw errorData;
	}
}


// 5.1 CREATE TASK
export async function createTask(
	ticket_id: string,
	data: CreateTaskRequest
) : Promise<CreateTaskResponse> {
	const token = localStorage.getItem("token");

	const response = await apiFetch(`${API_URL}/tickets/${ticket_id}/tasks`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		},
		body: JSON.stringify(data)
	});
	if (!response.ok) {
		const errorData = await response.json();
		throw errorData;
	}

	return response.json();
}

// 5.2 LIST TASKS
export async function listTasks(
	ticket_id: string,
	status?: "in_progress" | "completed",
): Promise<ListTaskResponse[]> {
	const token = localStorage.getItem("token");

	const url = status
		?  `${API_URL}/tickets/${ticket_id}/tasks?status=${status}`
		: `${API_URL}/tickets/${ticket_id}/tasks`;

	const response = await apiFetch(url, {
		method: 'GET',
		headers: {
		'Content-Type': 'application/json',
		'Authorization': `Bearer ${token}`
		}
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw errorData;
	}

	return response.json();
}

// 5.3 GET TASK DETAILS
export async function getTaskDetails(
	task_id: string,
) : Promise<TaskResponse> {
	const token = localStorage.getItem("token");

	const response = await apiFetch(`${API_URL}/tasks/${task_id}`, {
		method: 'GET',
		headers: {
		'Content-Type': 'application/json',
		'Authorization': `Bearer ${token}`
		}
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw errorData;
	}

	return response.json();
}

// 5.4 UPDATE TASK
export async function updateTask(
	task_id: string,
	data: UpdateTaskRequest
) : Promise<TaskResponse> {
	const token = localStorage.getItem("token");

	const response = await apiFetch(`${API_URL}/tasks/${task_id}`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		},
		body: JSON.stringify(data)
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw errorData;
	}

	return response.json();
}

// 5.6 DELETE TASK
export async function deleteTask(
	task_id: string
) : Promise <void> {
	const token = localStorage.getItem("token");

	const response = await apiFetch(`${API_URL}/tasks/${task_id}`, {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		}
	});
	if (!response.ok) {
		const errorData = await response.json();
		throw errorData;
	}
}


// 6.1 CREATE STANDUP
export async function createStandup(
	org_id: string,
	data: CreateStandupRequest
) : Promise<CreateStandupResponse> {
	const token = localStorage.getItem("token");

	const response = await apiFetch(`${API_URL}/organizations/${org_id}/standups`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		},
		body: JSON.stringify(data)
	});
	if (!response.ok) {
		const errorData = await response.json();
		throw errorData;
	}

	return response.json();
}

// 6.2 LIST ORGANIZATION STANDUPS
export async function listStandups(
	org_id: string,
): Promise<StandupListItem[]> {
	const token = localStorage.getItem("token");

	const response = await apiFetch(`${API_URL}/organizations/${org_id}/standups`, {
		method: 'GET',
		headers: {
		'Content-Type': 'application/json',
		'Authorization': `Bearer ${token}`
		}
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw errorData;
	}

	return response.json();
}

// 6.3 UPDATE STANDUP
export async function editStandup(
	standup_id: string,
	data: EditStandupRequest
): Promise<EditStandupResponse> {
	const token = localStorage.getItem("token");

	const response = await apiFetch(`${API_URL}/standups/${standup_id}`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		},
		body: JSON.stringify(data)
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw errorData;
	}

	return response.json();
}

// 6.4 DELETE STANDUP
export async function deleteStandup(
	standup_id: string
): Promise<void> {
	const token = localStorage.getItem("token");

	const response = await apiFetch(`${API_URL}/standups/${standup_id}`, {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		}
	});
	if (!response.ok) {
		const errorData = await response.json();
		throw errorData;
	}
}

// 7.1 CREATE BLOCKER
export async function createBlocker(
	org_id: string,
	data: CreateBlockerRequest
): Promise<CreateBlockerResponse> {
	const token = localStorage.getItem("token");

	const response = await apiFetch(`${API_URL}/organizations/${org_id}/blockers`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		},
		body: JSON.stringify(data)
	});
	if (!response.ok) {
		const errorData = await response.json();
		throw errorData;
	}

	return response.json();
}

// 7.2 LIST ORGANIZATION BLOCKERS
export async function listBlockers(
	org_id: string,
	status?: "open" | "resolved"
): Promise<BlockerListItem[]> {
	const token = localStorage.getItem("token");
	const url = status
		? `${API_URL}/organizations/${org_id}/blockers?status=${status}`
		: `${API_URL}/organizations/${org_id}/blockers`;

	const response = await apiFetch(url, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		}
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw errorData;
	}

	return response.json();
}

// 7.3 UPDATE BLOCKER
export async function updateBlocker(
	blocker_id: string,
	data: UpdateBlockerRequest
): Promise<UpdateBlockerResponse> {
	const token = localStorage.getItem("token");

	const response = await apiFetch(`${API_URL}/blockers/${blocker_id}`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		},
		body: JSON.stringify(data)
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw errorData; // Contains { error: { code, message } }
	}

	return response.json();
}

// 7.4 RESOLVE BLOCKER
export async function resolveBlocker(
	blocker_id: string
): Promise<void> {
	const token = localStorage.getItem("token");

	const response = await apiFetch(`${API_URL}/blockers/${blocker_id}/resolve`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		}
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw errorData;
	}
}


// 8.1 GET LEGAL DOCUMENT
export async function getLegalDocument(
	key: "privacy" | "terms"
) : Promise<LegalDocuments> {
	const token = localStorage.getItem("token");

	const response = await apiFetch(`${API_URL}/legal/documents/${key}`, {
		method: 'GET',
		headers: {
		'Content-Type': 'application/json',
		'Authorization': `Bearer ${token}`
		}
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw errorData;
	}

	return response.json();
}


// 9.1 ANALYITCS
export async function getAnalitycsData(
	org_id: string
) : Promise<AnalitycsData> {
	const token = localStorage.getItem("token");

	const response = await apiFetch(`${API_URL}/organizations/${org_id}/analytics`, {
		method: 'GET',
		headers: {
		'Content-Type': 'application/json',
		'Authorization': `Bearer ${token}`
		}
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw errorData;
	}

	return response.json();
}


// 10.1 GET ORGANIZATION DASHBOARD
export async function getDashboardData(
	org_id: string
) : Promise<DashboardData> {
	const token = localStorage.getItem("token");

	const response = await apiFetch(`${API_URL}/organizations/${org_id}/dashboard`, {
		method: 'GET',
		headers: {
		'Content-Type': 'application/json',
		'Authorization': `Bearer ${token}`
		}
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw errorData;
	}

	return response.json();
}
