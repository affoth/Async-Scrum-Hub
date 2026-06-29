 # Async Scrum Hub – API Contract

## Overview

This document defines the HTTP API contract for the Async Scrum Hub backend.
It specifies available endpoints, request parameters, and response structures.
This document is framework-agnostic and serves as a reference for frontend and backend development.

---

## Base URL

```
http://localhost:8000/api/v1
```
---
## Authentication

This API uses JWT-based authentication.
All endpoints (except public ones) require a valid JWT token sent in the Authorization header:

```
Authorization: Bearer <jwt_token>
```
---

## Roles & Permissions

This API uses a role-based access control (RBAC) model.
Permissions are scoped to specific resources (organization, task, ticket, etc.).

---

### Roles

### Organization Roles
- admin
	- Full control over the organization.
	- Can manage members and their roles.
	- Can create and manage tickets within the organization.
- member
	- Can access organizations they belong to.
	- Can participate in tickets and tasks within the organization.

### Scrum Roles (Organization-Level)
- scrum_master
	- Can create and manage tickets.
	- Can manage organization timeline and planning.
- product_owner
	- Manages product backlog and priorities.
- developer
	- Works on tasks and submits standups.

**Note:** Scrum roles are assigned per-organization and affect ticket management permissions.

### Role Inheritance

- Organization admins have full control over all resources within their organization.
- Scrum roles (Scrum Master, Product Owner, Developer) are assigned at the organization level.
- Permissions are always evaluated at the organization scope.

### Ownership Rules

- The creator of a resource (task, standup, blocker) becomes its owner.
- Resource owners can update or delete their own resources.
- Organization admins can manage all resources within their organization.
- The assigned user has full edit permissions over the resource (task or blocker), equivalent to the resource owner.
- Assigned user permissions only apply when the resource has an assigned user.
- If `assignee_id` is null, permissions related to the assigned user are ignored.

### Membership Management Rules

- Membership in organizations is managed exclusively by organization admins.
- Users cannot remove themselves from organizations.
- An organization must always have at least one organization admin.
- The last remaining admin of an organization cannot be removed or demoted.

---

### Common HTTP Status Codes (Used in this API)

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `204 No Content` – Request successful, no response body
- `400 Bad Request` - Invalid request data (business logic errors)
- `401 Unauthorized` - Authentication required or invalid
- `403 Forbidden` - Insufficient permissions or prerequisite setup not completed
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate)
- `422 Unprocessable Entity` - Validation error (missing or invalid fields)
---

## 1. Authentication & Authorization

### 1.1 Register New User

**Endpoint:** `POST /auth/register`

**Description:** Creates a new user account.

**Authentication:** Public

**Request Body:**
```json
{
	"name": "string (display name)",
	"email": "string (valid email)",
	"password": "string (min 8 chars)"
}
```

**Success Response:** `201 Created`
```json
{
	"id": "uuid",
	"email": "string",
	"name": "string"
}
```

**Error Responses:**

`422 Unprocessable Entity` - Invalid input (example: validation error)
```json
{
	"detail": [
		{
			"type": "string",
			"loc": ["body", "field_name"],
			"msg": "validation error message",
			"input": "invalid_value"
		}
	]
}
```

`409 Conflict` - User already exists
```json
{
	"error": {
		"code": "USER_EXISTS",
		"message": "User with this email already exists"
	}
}
```
---

### 1.2 Login

**Endpoint:** `POST /auth/login`

**Description:** Authenticates a user and returns JWT tokens.

**Authentication:** Public

**Request Body:**
```json
{
	"email": "string",
	"password": "string"
}
```

**Success Response:** `200 OK`
```json
{
	"access_token": "string (JWT)",
	"token_type": "bearer"
}
```

**Error Responses:**

`422 Unprocessable Entity` - Invalid input (example: missing fields)
```json
{
	"detail": [
		{
			"type": "string",
			"loc": ["body", "field_name"],
			"msg": "validation error message",
			"input": "invalid_value"
		}
	]
}
```
`401 Unauthorized` - Invalid credentials
```json
{
	"error": {
		"code": "INVALID_CREDENTIALS",
		"message": "Email or password is incorrect"
	}
}
```
`403 Forbidden` - Team setup not completed
```json
{
	"error": {
		"code": "TEAM_SETUP_NOT_DONE",
		"message": "Team setup is not done"
	}
}
```
---

## 2. Users

### 2.1 Get Current User

**Endpoint:** `GET /users/me`

**Description:** Returns the profile of the currently authenticated user.

**Authentication:** Required (JWT)

**Permissions:**
- The authenticated user

**Success Response:** `200 OK`
```json
{
	"id": "uuid",
	"email": "string",
	"name": "string",
	"org_name": "string",
	"avatar_url": "string | null",
	"organization_id": "uuid | null",
	"scrum_role": "scrum_master | product_owner | developer | null",
	"org_role": "admin | member | null"
}
``````

**Error Responses:**

`401 Unauthorized` - Authentication required
```json
{
	"error": {
		"code": "UNAUTHORIZED",
		"message": "Authentication required"
	}
}
```
---

### 2.2 Update User

**Endpoint:** `PATCH /users/me`

**Description:** Updates the profile information of the currently authenticated user.

**Authentication:** Required (JWT)

**Permissions:**
- The authenticated user

**Request Body:**
```json
{
	"name": "string (optional)",
	"email": "string (optional)"
}
```

**Success Response:** `200 OK`
```json
{
	"id": "uuid",
	"email": "string",
	"name": "string",
	"org_name": "string",
	"avatar_url": "string | null",
	"organization_id": "uuid | null",
	"scrum_role": "scrum_master | product_owner | developer | null",
	"org_role": "admin | member | null"
}
```

**Error Responses:**

`422 Unprocessable Entity` - Invalid input
```json
{
	"detail": [
		{
		"type": "string",
		"loc": ["body", "field_name"],
		"msg": "validation error message",
		"input": "invalid_value"
		}
	]
}
```

`401 Unauthorized` - Authentication required
```json
{
	"error": {
		"code": "UNAUTHORIZED",
		"message": "Authentication required"
	}
}
```
---

### 2.3 Upload Avatar

**Endpoint:** `POST /users/me/avatar`

**Description:** Uploads or updates the avatar image for the currently authenticated user.

**Authentication:** Required (JWT)

**Permissions:**
- The authenticated user

**Rules:**
- Accepted formats: JPEG, PNG, GIF, WebP
- Maximum file size: 5MB
- Images are automatically resized to 256x256 pixels
- Previous avatar is replaced when a new one is uploaded

**Request Body:** `multipart/form-data`
```
file: binary (image file)
```

**Success Response:** `200 OK`
```json
{
  "avatar_url": "string (URL to the uploaded avatar)"
}
```

**Error Responses:**

`400 Bad Request` - Invalid file type
```json
{
	"error": {
		"code": "INVALID_FILE_TYPE",
		"message": "Only JPEG, PNG, GIF, and WebP images are allowed"
	}
}
```

`400 Bad Request` - File too large
```json
{
	"error": {
		"code": "FILE_TOO_LARGE",
		"message": "File size exceeds the maximum limit of 5MB"
	}
}
```

`401 Unauthorized` - Authentication required
```json
{
	"error": {
		"code": "UNAUTHORIZED",
		"message": "Authentication required"
	}
}
```
---

## 3. Organizations

### 3.1 Create Organization

**Endpoint:** `POST /organizations`

**Description:** Creates a new organization.

**Authentication:** Required (JWT)

**Permissions:**
- The authenticated user

**Rules:**
- The user creating the organization becomes the organization admin.
- The `join_code` is generated server-side when the organization is created.
- The join code does not expire.
- The join code consists of 3 letters followed by 3 numbers.

**Request Body:**
```json
{
	"name": "string",
}
```

**Success Response:** `201 Created`
```json
{
	"id": "uuid",
	"name": "string",
	"join_code": "SCR-493",
	"created_by": "uuid (owner)"
}
```

**Error Responses:**

`422 Unprocessable Entity` - Invalid input
```json
{
	"detail": [
		{
		"type": "string",
		"loc": ["body", "field_name"],
		"msg": "validation error message",
		"input": "invalid_value"
		}
	]
}
```

`401 Unauthorized` - Authentication required
```json
{
	"error": {
		"code": "UNAUTHORIZED",
		"message": "Authentication required"
	}
}
```

`409 Conflict` - Organization already exists
```json
{
	"error": {
		"code": "ORG_EXISTS",
		"message": "An organization with this name already exists."
	}
}
```
---
### 3.2 Select Role

**Endpoint:** `PATCH /organizations/{org_id}`

**Description:** Select the role inside the organization.

**Authentication:** Required (JWT)

**Permissions:**
- The authenticated user

**URL Parameters:**
- `org_id` - UUID of the organization

**Rules:**
- Only one `scrum_master` and one `product_owner` can exist per organization.
- Scrum roles are assigned only during organization creation and when joining an organization.
- Once both scrum roles are assigned, new members can only join as `developer`.

**Request Body:**
```json
{
	"scrum_role": "scrum_master | product_owner | developer"
}
```

**Success Response:** `201 Created`
```json
{
	"organization_id": "uuid",
	"scrum_role": "scrum_master | product_owner | developer"
}
```

**Error Responses:**

`401 Unauthorized` - Authentication required
```json
{
	"error": {
		"code": "UNAUTHORIZED",
		"message": "Authentication required"
	}
}
```

`404 Not Found` - Organization not found
```json
{
	"error": {
		"code": "NOT_FOUND",
		"message": "Organization not found"
	}
}
```
---

### 3.3 Get Organization Members

**Endpoint:** `GET /organizations/{org_id}/members`

**Description:** Returns members of an organization with all their information.

**Authentication:** Required (JWT)

**Permissions:**
- Any organization member.

**URL Parameters:**
- `org_id` - UUID of the organization

**Success Response:** `200 OK`
```json
[
	{
		"id": "uuid",
		"name": "string",
		"avatar_url": "string | null",
		"org_role": "admin | member",
		"scrum_role": "scrum_master | product_owner | developer",

		"tickets": [
			{
				"id": "uuid",
				"title": "string",
				"status": "todo | in_progress | completed",
				"priority": "low | medium | high"
			}
		],

		"tasks": [
			{
				"id": "uuid",
				"title": "string",
				"status": "in_progress | completed",
				"ticket_id": "uuid"
			}
		],

		"blockers": [
			{
				"id": "uuid",
				"description": "string",
				"status": "open | resolved",
				"created_at": "timestamp"
			}
		]
	}
]
```

**Error Responses:**

`401 Unauthorized` - Authentication required
```json
{
	"error": {
		"code": "UNAUTHORIZED",
		"message": "Authentication required"
	}
}
```

`403 Forbidden` - Insufficient permissions
```json
{
	"error": {
		"code": "FORBIDDEN",
		"message": "You do not have permission to perform this action"
	}
}
```

`404 Not Found` - Organization not found
```json
{
	"error": {
		"code": "NOT_FOUND",
		"message": "Organization not found"
	}
}
```
---

### 3.4 Invite Member to Organization

**Endpoint:** `POST /organizations/{org_id}/members`

**Description:** Send an email to a user with the join_code to join the organization.

**Authentication:** Required (JWT)

**Permissions:**
- Organization admin

**URL Parameters:**
- `org_id` - UUID of the organization

**Request Body:**
```json
{
	"name": "string",
	"email": "string"
}
```

**Success Response:** `201 Created`
```json
{
	"email": "string"
}
```

**Error Responses:**

`422 Unprocessable Entity` - Invalid input
```json
{
	"detail": [
		{
		"type": "string",
		"loc": ["body", "field_name"],
		"msg": "validation error message",
		"input": "invalid_value"
		}
	]
}
```

`401 Unauthorized` - Authentication required
```json
{
	"error": {
		"code": "UNAUTHORIZED",
		"message": "Authentication required"
	}
}
```

`403 Forbidden` - Insufficient permissions
```json
{
	"error": {
		"code": "FORBIDDEN",
		"message": "You do not have permission to perform this action"
	}
}
```

`404 Not Found` - Organization not found
```json
{
	"error": {
		"code": "NOT_FOUND",
		"message": "Organization not found"
	}
}
```

`409 Conflict` - User already a member
```json
{
	"error": {
		"code": "ALREADY_MEMBER",
		"message": "User is already a member of this organization"
	}
}
```
---

### 3.5 Remove Member from Organization

**Endpoint:** `DELETE /organizations/{org_id}/members/{user_id}`

**Description:** Removes a user from the organization.

**Authentication:** Required (JWT)

**Permissions:**
- Organization admin

**URL Parameters:**
- `org_id` - UUID of the organization
- `user_id` - UUID of the user to remove

**Success Response:** `204 No Content`

**Error Responses:**

`401 Unauthorized` - Authentication required
```json
{
	"error": {
		"code": "UNAUTHORIZED",
		"message": "Authentication required"
	}
}
```

`403 Forbidden` - Insufficient permissions
```json
{
	"error": {
		"code": "FORBIDDEN",
		"message": "You do not have permission to perform this action"
	}
}
```

`404 Not Found` - Organization or user not found
```json
{
	"error": {
		"code": "NOT_FOUND",
		"message": "Organization or user not found"
	}
}
```
---

### 3.6 Join Organization by Code

**Endpoint:** `POST /organizations/join`

**Permissions:**
- The authenticated user

**Notes**
- `available_scrum_role` only includes roles not yet taken in the org. `developer` is always present.
The frontend should use this list to show role options before calling `PATCH /organizations/{org_id}` (3.2).

**Authentication:** Required (JWT)

**Request Body:**
```json
{
	"join_code": "SCR-493",
}
```

**Success Response:** `200 OK`
```json
{
	"organization_id": "uuid",
	"org_role": "member",
	"available_scrum_role": [
		{ "role": "scrum_master" },
		{ "role": "product_owner" },
		{ "role": "developer" }
	]
}
```

**Error Responses:**
`400 Bad Request` - Wether a code exists
```json
{
	"error": {
		"code": "INVALID_CODE",
		"message": "Invalid code."
	}
}
```

`409 Conflict` - User already a member
```json
{
	"error": {
		"code": "ALREADY_MEMBER",
		"message": "User is already a member of this organization"
	}
}
```
---

## 4. Tickets

### 4.1 Create Tickets

**Endpoint:** `POST /organizations/{org_id}/tickets`

**Description:** Creates a new ticket within an organization.

**Assignment Rules:**
- The `assignee_id` field can only be assigned to users with the **Developer** role.
- Scrum Masters and Product Owners cannot be assigned to tickets.
- If `assignee_id` is provided, the backend must validate that the user has the Developer role.

**Authentication:** Required (JWT)

**Permissions:**
- Scrum Master
- Product Owner

**URL Parameters:**
- `org_id` - UUID of the organization

**Request Body:**
```json
{
	"title": "string",
	"description": "string | null",
	"priority": "low | medium | high",
	"assignee_id": "uuid | null"  // Must be a user with Developer role
}
```

**Success Response:** `201 Created`
```json
{
	"id": "uuid",
	"title": "string",
	"description": "string | null",
	"status": "todo | in_progress | completed",
	"priority": "low | medium | high",
	"created_by": "uuid",
	"assignee_id": "uuid | null",
	"organization_id": "uuid",
	"created_at": "timestamp",
	"updated_at": "timestamp"
}
```

**Error Responses:**

`422 Unprocessable Entity` - Invalid input
```json
{
	"detail": [
		{
		"type": "string",
		"loc": ["body", "field_name"],
		"msg": "validation error message",
		"input": "invalid_value"
		}
	]
}
```

`400 Bad Request` - Invalid assignee role
```json
{
	"error": {
		"code": "INVALID_ASSIGNEE",
		"message": "Only users with Developer role can be assigned to tickets"
	}
}
```

`401 Unauthorized` - Authentication required
```json
{
	"error": {
		"code": "UNAUTHORIZED",
		"message": "Authentication required"
	}
}
```

`403 Forbidden` - Insufficient permissions
```json
{
	"error": {
		"code": "FORBIDDEN",
		"message": "You do not have permission to perform this action"
	}
}
```

`404 Not Found` - Organization not found
```json
{
	"error": {
		"code": "NOT_FOUND",
		"message": "Organization not found"
	}
}
```
---

### 4.2 List Tickets (Board)

**Endpoint:** `GET /organizations/{org_id}/tickets`

**Description:** Returns tickets for an organization, optionally filtered by status.
Used to render the organization board.

**Authentication:** Required (JWT)

**Permissions:**
- Any organization member.

**URL Parameters:**
- `org_id` - UUID of the organization

**Query Parameters:**
- status – todo | in_progress | completed
- priority - low | medium | high

**Examples:**
- `GET /organizations/{org_id}/tickets`
- `GET /organizations/{org_id}/tickets?status=todo`
- `GET /organizations/{org_id}/tickets?status=in_progress`
- `GET /organizations/{org_id}/tickets?status=completed`
- `GET /organizations/{org_id}/tickets?priority=low`
- `GET /organizations/{org_id}/tickets?priority=medium`
- `GET /organizations/{org_id}/tickets?priority=high`

**Success Response:** `200 OK`
```json
[
	{
		"id": "uuid",
		"title": "string",
		"status": "todo | in_progress | completed",
		"priority": "low | medium | high",
		"assignee": {
			"id": "uuid",
			"name": "string",
			"avatar_url": "string | null"
		},
		"created_at": "timestamp",
		"updated_at": "timestamp"
	}
]
```

**Error Responses:**

`401 Unauthorized` - Authentication required
```json
{
	"error": {
		"code": "UNAUTHORIZED",
		"message": "Authentication required"
	}
}
```

`403 Forbidden` - Insufficient permissions
```json
{
	"error": {
		"code": "FORBIDDEN",
		"message": "You do not have permission to perform this action"
	}
}
```

`404 Not Found` - Ticket not found
```json
{
	"error": {
		"code": "NOT_FOUND",
		"message": "Ticket not found"
	}
}
```
---

### 4.3 Get Ticket Details

**Endpoint:** `GET /tickets/{ticket_id}`

**Description:** Returns detailed information about a specific ticket.

**Authentication:** Required (JWT)

**Permissions:**
- Any organization member.

**URL Parameters:**
- `ticket_id` - UUID of the ticket

**Success Response:** `200 OK`
```json
{
	"id": "uuid",
	"title": "string",
	"description": "string | null",
	"status": "todo | in_progress | completed",
	"priority": "low | medium | high",
	"created_by": "UserBrief",
	"assignee_id": "uuid | null",
	"organization_id": "uuid",
	"created_at": "timestamp",
	"updated_at": "timestamp",
	"tasks": [
		{
			"id": "uuid",
			"title": "string",
			"status": "in_progress | completed",
			"assignee_id": "uuid | null",
		}
	],
	"blockers": [
		{
			"id": "uuid",
			"description": "string",
			"status": "open | resolved",
			"created_by": "UserBrief"
		}
	]
}

```

**Error Responses:**

`401 Unauthorized` - Authentication required
```json
{
	"error": {
		"code": "UNAUTHORIZED",
		"message": "Authentication required"
	}
}
```

`403 Forbidden` - Insufficient permissions
```json
{
	"error": {
		"code": "FORBIDDEN",
		"message": "You do not have permission to perform this action"
	}
}
```

`404 Not Found` - Ticket not found
```json
{
	"error": {
		"code": "NOT_FOUND",
		"message": "Ticket not found"
	}
}
```
---

### 4.4 Update Ticket

**Endpoint:** `PATCH /tickets/{ticket_id}`

**Description:** Updates ticket fields such as title, description, priority, assignee, or status.

**Assignment Rules:**
- The `assignee_id` field can only be assigned to users with the **Developer** role.
- Scrum Masters and Product Owners cannot be assigned to tickets.
- Only Product Owners can change the priority.
- If `assignee_id` is provided, the backend must validate that the user has the Developer role.

**Authentication:** Required (JWT)

**Permissions:**
- Scrum Master (except priority)
- Product Owner

**URL Parameters:**
- `ticket_id` - UUID of the ticket

**Request Body:**
```json
{
	"title": "string (optional)",
	"description": "string | null (optional)",
	"priority": "low | medium | high (optional)",
	"status": "todo | in_progress | completed (optional)",
	"assignee_id": "uuid | null (optional)"  // Must be a user with Developer role
}
```

**Success Response:** `200 OK`
```json
{
	"id": "uuid",
	"title": "string",
	"description": "string | null",
	"status": "todo | in_progress | completed",
	"priority": "low | medium | high",
	"created_by": "uuid",
	"assignee_id": "uuid | null",
	"organization_id": "uuid",
	"created_at": "timestamp",
	"updated_at": "timestamp",
	"tasks": [
		{
			"id": "uuid",
			"title": "string",
			"status": "in_progress | completed"
		}
	],
	"blockers": [
		{
			"id": "uuid",
			"description": "string",
			"status": "open | resolved",
			"created_by": "UserBrief"
		}
	]
}
```

**Error Responses:**

`422 Unprocessable Entity` - Invalid input
```json
{
	"detail": [
		{
		"type": "string",
		"loc": ["body", "field_name"],
		"msg": "validation error message",
		"input": "invalid_value"
		}
	]
}
```

`400 Bad Request` - Invalid assignee role
```json
{
	"error": {
		"code": "INVALID_ASSIGNEE",
		"message": "Only users with Developer role can be assigned to tickets"
	}
}
```

`401 Unauthorized` - Authentication required
```json
{
	"error": {
		"code": "UNAUTHORIZED",
		"message": "Authentication required"
	}
}
```

`403 Forbidden` - Insufficient permissions
```json
{
	"error": {
		"code": "FORBIDDEN",
		"message": "You do not have permission to perform this action"
	}
}
```

`404 Not Found` - Ticket not found
```json
{
	"error": {
		"code": "NOT_FOUND",
		"message": "Ticket not found"
	}
}
```
---

### 4.5 Move Ticket (Drag & Drop)

**Endpoint:** `PATCH /tickets/{ticket_id}/move`

**Description:** Moves a ticket between board columns by updating its status.

**Authentication:** Required (JWT)

**Permissions:**
- Scrum Master
- Product Owner

**URL Parameters:**
- `ticket_id` - UUID of the ticket

**Request Body:**
```json
{
	"status": "todo | in_progress | completed"
}
```

**Success Response:** `200 OK`
```json
{
	"id": "uuid",
	"status": "todo | in_progress | completed",
	"updated_at": "timestamp"
}
```

**Error Responses:**

`422 Unprocessable Entity` - Invalid input
```json
{
	"detail": [
		{
			"type": "string",
			"loc": ["body", "field_name"],
			"msg": "validation error message",
			"input": "invalid_value"
		}
	]
}
```

`401 Unauthorized` - Authentication required
```json
{
	"error": {
		"code": "UNAUTHORIZED",
		"message": "Authentication required"
	}
}
```

`403 Forbidden` - Insufficient permissions
```json
{
	"error": {
		"code": "FORBIDDEN",
		"message": "You do not have permission to perform this action"
	}
}
```

`404 Not Found` - Ticket not found
```json
{
	"error": {
		"code": "NOT_FOUND",
		"message": "Ticket not found"
	}
}
```
---

### 4.6 Delete Ticket

**Endpoint:** `DELETE /tickets/{ticket_id}`

**Description:** Deletes a ticket and all its associated tasks and blockers.

**Authentication:** Required (JWT)

**Permissions:**
- Scrum Master
- Product Owner

**URL Parameters:**
- `ticket_id` - UUID of the ticket

**Success Response:** `204 No Content`

**Error Responses:**

`401 Unauthorized` - Authentication required
```json
{
	"error": {
		"code": "UNAUTHORIZED",
		"message": "Authentication required"
	}
}
```

`403 Forbidden` - Insufficient permissions
```json
{
	"error": {
		"code": "FORBIDDEN",
		"message": "You do not have permission to perform this action"
	}
}
```

`404 Not Found` - Ticket not found
```json
{
	"error": {
		"code": "NOT_FOUND",
		"message": "Ticket not found"
	}
}
```
---

## 5. Tasks

### 5.1 Create Task

**Endpoint:** `POST /tickets/{ticket_id}/tasks`

**Description:** Creates a new task within a ticket.

**Assignment Rules:**
- The `assignee_id` field can only be assigned to users with the **Developer** role.
- Scrum Masters and Product Owners cannot be assigned to tasks.
- If `assignee_id` is provided, the backend must validate that the user has the Developer role.

**Authentication:** Required (JWT)

**Permissions:**
- Any organization member (creator becomes the task owner).

**URL Parameters:**
- `ticket_id` - UUID of the ticket

**Request Body:**
```json
{
	"title": "string",
	"description": "string | null",
	"assignee_id": "uuid | null"  // Must be a user with Developer role
}
```

**Success Response:** `201 Created`
```json
{
	"id": "uuid",
	"title": "string",
	"description": "string | null",
	"status": "in_progress",
	"created_by": "uuid (owner)",
	"assignee_id": "uuid | null",
	"ticket_id": "uuid"
}
```

**Error Responses:**

`422 Unprocessable Entity` - Invalid input
```json
{
	"detail": [
		{
			"type": "string",
			"loc": ["body", "field_name"],
			"msg": "validation error message",
			"input": "invalid_value"
		}
	]
}
```

`400 Bad Request` - Invalid assignee role
```json
{
	"error": {
		"code": "INVALID_ASSIGNEE",
		"message": "Only users with Developer role can be assigned to tasks"
	}
}
```

`401 Unauthorized` - Authentication required
```json
{
	"error": {
		"code": "UNAUTHORIZED",
		"message": "Authentication required"
	}
}
```

`403 Forbidden` - Insufficient permissions
```json
{
	"error": {
		"code": "FORBIDDEN",
		"message": "You do not have permission to perform this action"
	}
}
```

`404 Not Found` - Ticket not found
```json
{
	"error": {
		"code": "NOT_FOUND",
		"message": "Ticket not found"
	}
}
```
---

### 5.2 List Tasks

**Endpoint:** `GET /tickets/{ticket_id}/tasks"`

**Description:** Returns all tasks belonging to a specific ticket.

**Authentication:** Required (JWT)

**Permissions:**
- Any organization member.

**URL Parameters:**
- `ticket_id` - UUID of the ticket

**Query Parameters:**
- status – in_progress | completed

**Examples:**
- `GET /tickets/{ticket_id}/tasks`
- `GET /tickets/{ticket_id}/tasks?status=in_progress`
- `GET /tickets/{ticket_id}/tasks?status=completed`

**Success Response:** `200 OK`
```json
[
	{
		"id": "uuid",
		"title": "string",
		"status": "in_progress | completed",
	}
]
```

**Error Responses:**

`401 Unauthorized` - Authentication required
```json
{
	"error": {
		"code": "UNAUTHORIZED",
		"message": "Authentication required"
	}
}
```

`403 Forbidden` - Insufficient permissions
```json
{
	"error": {
		"code": "FORBIDDEN",
		"message": "You do not have permission to perform this action"
	}
}
```

`404 Not Found` - Ticket not found
```json
{
	"error": {
		"code": "NOT_FOUND",
		"message": "Ticket not found"
	}
}
```
---

### 5.3 Get Task Details

**Endpoint:** `GET /tasks/{task_id}`

**Description:** Returns detailed information about a specific task.

**Authentication:** Required (JWT)

**Permissions:**
- Any organization member.

**URL Parameters:**
- `task_id` - UUID of the task


**Success Response:** `200 OK`
```json
{
	"id": "uuid",
	"title": "string",
	"description": "string | null",
	"status": "in_progress | completed",
	"created_by": "uuid (owner)",
	"assignee_id": "uuid | null",
	"ticket_id": "uuid"
}
```

**Error Responses:**

`401 Unauthorized` - Authentication required
```json
{
	"error": {
		"code": "UNAUTHORIZED",
		"message": "Authentication required"
	}
}
```

`403 Forbidden` - Insufficient permissions
```json
{
	"error": {
		"code": "FORBIDDEN",
		"message": "You do not have permission to perform this action"
	}
}
```

`404 Not Found` - Task not found
```json
{
	"error": {
		"code": "NOT_FOUND",
		"message": "Task not found"
	}
}
```
---

### 5.4 Update Task

**Endpoint:** `PATCH /tasks/{task_id}`

**Description:** Updates task information.

**Assignment Rules:**
- The `assignee_id` field can only be assigned to users with the **Developer** role.
- Scrum Masters and Product Owners cannot be assigned to tasks.
- If `assignee_id` is provided, the backend must validate that the user has the Developer role.

**Authentication:** Required (JWT)

**Permissions:**
- Scrum Master
- Product Owner
- Developer (Task owner/assignee)

**URL Parameters:**
- `task_id` - UUID of the task

**Request Body:**
```json
{
	"title": "string (optional)",
	"description": "string (optional)",
	"status": "in_progress | completed (optional)",
	"assignee_id": "uuid | null (optional)"  // Must be a user with Developer role
}
```

**Success Response:** `200 OK`
```json
{
	"id": "uuid",
	"title": "string | null",
	"description": "string | null",
	"status": "in_progress | completed",
	"created_by": "uuid (owner)",
	"assignee_id": "uuid | null",
	"ticket_id": "uuid"
}
```

**Error Responses:**

`422 Unprocessable Entity` - Invalid input
```json
{
	"detail": [
		{
			"type": "string",
			"loc": ["body", "field_name"],
			"msg": "validation error message",
			"input": "invalid_value"
		}
	]
}
```

`400 Bad Request` - Invalid assignee role
```json
{
	"error": {
		"code": "INVALID_ASSIGNEE",
		"message": "Only users with Developer role can be assigned to tasks"
	}
}
```

`401 Unauthorized` - Authentication required
```json
{
	"error": {
		"code": "UNAUTHORIZED",
		"message": "Authentication required"
	}
}
```

`403 Forbidden` - Insufficient permissions
```json
{
	"error": {
		"code": "FORBIDDEN",
		"message": "You do not have permission to perform this action"
	}
}
```

`404 Not Found` - Task not found
```json
{
	"error": {
		"code": "NOT_FOUND",
		"message": "Task not found"
	}
}
```
---

### 5.5 Delete Task

**Endpoint:** `DELETE /tasks/{task_id}`

**Description:** Deletes a task.

**Authentication:** Required (JWT)

**Permissions:**
- Scrum Master
- Product Owner
- Developer (Task owner)

**URL Parameters:**
- `task_id` - UUID of the task

**Success Response:** `204 No Content`

**Error Responses:**

`401 Unauthorized` - Authentication required
```json
{
	"error": {
		"code": "UNAUTHORIZED",
		"message": "Authentication required"
	}
}
```

`403 Forbidden` - Insufficient permissions
```json
{
	"error": {
		"code": "FORBIDDEN",
		"message": "You do not have permission to perform this action"
	}
}
```

`404 Not Found` - Task not found
```json
{
	"error": {
		"code": "NOT_FOUND",
		"message": "Task not found"
	}
}
```
---

## 6. Standups

### 6.1 Create Standup

**Endpoint:** `POST /organizations/{org_id}/standups`

**Description:** Creates a new standup within an organization.

**Rules:**
- A user can create only one standup per day per organization.
- If a standup already exists for today, creation is rejected.

**Automatic Fields:**
- **`yesterday`**: Automatically populated by the backend by retrieving the `today` content from the user's previous standup (created the day before). If no standup exists from the previous day, `yesterday` will be `null`.
- **`blocker_ids`**: Automatically populated with an array of active (status: `open`) blockers associated with the organization. This allows the standup overview to display current blockers without manual input.
- Users only need to provide the `today` field in the request body.

**Authentication:** Required (JWT)

**Permissions:**
- Any organization member (creator becomes the standup owner).

**URL Parameters:**
- `org_id` - UUID of the organization

**Request Body:**
```json
{
	"today": "string"
}
```

**Success Response:** `201 Created`
```json
{
	"id": "uuid",
	"created_at": "timestamp (today)",
	"standup_date": "date (YYYY-MM-DD)",
	"today": "string",
	"yesterday": "string | null",
	"blocker_ids": ["uuid"],
	"created_by": {
		"id": "uuid (owner)",
		"name": "string",
		"avatar_url": "string",
	},
}
```

**Error Responses:**

`422 Unprocessable Entity` - Invalid input
```json
{
	"detail": [
		{
		"type": "string",
		"loc": ["body", "field_name"],
		"msg": "validation error message",
		"input": "invalid_value"
		}
	]
}
```

`401 Unauthorized` - Authentication required
```json
{
	"error": {
		"code": "UNAUTHORIZED",
		"message": "Authentication required"
	}
}
```

`403 Forbidden` - Insufficient permissions
```json
{
	"error": {
		"code": "FORBIDDEN",
		"message": "You do not have permission to perform this action"
	}
}
```

`404 Not Found` - Organization not found
```json
{
	"error": {
		"code": "NOT_FOUND",
		"message": "Organization not found"
	}
}
```

`409 Conflict` - Standup already exists for today
```json
{
	"error": {
		"code": "STANDUP_ALREADY_EXISTS",
		"message": "You have already created a standup for today"
	}
}
```
---

### 6.2 List Organization Standups

**Endpoint:** `GET /organizations/{org_id}/standups`

**Description:** Returns standup entries for an organization (usually filtered by date).

**Authentication:** Required (JWT)

**Permissions:**
- Any organization member.

**Notes:**
- This endpoint returns all standups created within the organization.
- Standups are visible to all organization members to provide team-wide visibility.

**URL Parameters:**
- `org_id` - UUID of the organization

**Success Response:** `200 OK`
```json
[
	{
		"id": "uuid",
		"created_at": "timestamp(today)",
		"standup_date": "date (YYYY-MM-DD)",
		"today": "string",
		"yesterday": "string | null",
		"blockers": [
			{
				"id": "uuid",
				"title": "string",
				"ticket" {
					"id":  "uuid",
					"title": "string",
				}
		}],
		"created_by": {
			"id": "uuid (owner)",
			"name": "string",
			"avatar_url": "string | null"
		}
	}
]
```

**Error Responses:**

`401 Unauthorized` - Authentication required
```json
{
	"error": {
		"code": "UNAUTHORIZED",
		"message": "Authentication required"
	}
}
```

`403 Forbidden` - Insufficient permissions
```json
{
	"error": {
		"code": "FORBIDDEN",
		"message": "You do not have permission to perform this action"
	}
}
```

`404 Not Found` - Organization not found
```json
{
	"error": {
		"code": "NOT_FOUND",
		"message": "Organization not found"
	}
}
```
---

### 6.3 Update Standup

**Endpoint:** `PATCH /standups/{standup_id}`

**Description:** Updates standup information. Only the `today` field can be updated by the user.

**Rules:**
- A standup can only be edited on the same day it was created.
- Editing past standups is not allowed.

**Notes:**
- The `yesterday` and `blocker_ids` fields are automatically managed by the backend and cannot be manually updated.
- Users can only update the `today` field.

**Authentication:** Required (JWT)

**Permissions:**
- Developer (Standup owner)

**URL Parameters:**
- `standup_id` - UUID of the Standup

**Request Body:**
```json
{
	"today": "string (optional)"
}
```

**Success Response:** `200 OK`
```json
{
	{
		"id": "uuid",
		"created_at": "timestamp(today)",
		"standup_date": "date (YYYY-MM-DD)",
		"today": "string",
		"yesterday": "string | null",
		"blockers": [
			{
				"id": "uuid",
				"title": "string",
				"ticket" {
					"id":  "uuid",
					"title": "string",
				}
			}
		],
		"created_by": {
			"id": "uuid (owner)",
			"name": "string",
			"avatar_url": "string | null"
		}
	}
}
```

**Error Responses:**

`422 Unprocessable Entity` - Invalid input
```json
{
	"detail": [
		{
			"type": "string",
			"loc": ["body", "field_name"],
			"msg": "validation error message",
			"input": "invalid_value"
		}
	]
}
```

`401 Unauthorized` - Authentication required
```json
{
	"error": {
		"code": "UNAUTHORIZED",
		"message": "Authentication required"
	}
}
```

`403 Forbidden` - Insufficient permissions
```json
{
	"error": {
		"code": "FORBIDDEN",
		"message": "You do not have permission to perform this action"
	}
}
```

`409 Conflict` - Standup can no longer be edited
```json
{
	"error": {
		"code": "EDIT_WINDOW_EXPIRED",
		"message": "Standups can only be edited on the day they are created"
	}
}
```

`404 Not Found` - Standup not found
```json
{
	"error": {
		"code": "NOT_FOUND",
		"message": "Standup not found"
	}
}
```
---

### 6.4 Delete Standup

**Endpoint:** `DELETE /standups/{standup_id}`

**Description:** Deletes a Standup.

**Authentication:** Required (JWT)

**Permissions:**
- Developer (Standup owner)

**URL Parameters:**
- `standup_id` - UUID of the standup

**Success Response:** `204 No Content`

**Error Responses:**

`401 Unauthorized` - Authentication required
```json
{
	"error": {
		"code": "UNAUTHORIZED",
		"message": "Authentication required"
	}
}
```

`403 Forbidden` - Insufficient permissions
```json
{
	"error": {
		"code": "FORBIDDEN",
		"message": "You do not have permission to perform this action"
	}
}
```

`404 Not Found` - Standup not found
```json
{
	"error": {
		"code": "NOT_FOUND",
		"message": "Standup not found"
	}
}
```
---

## 7. Blockers

### 7.1 Create Blocker

**Endpoint:** `POST /organizations/{org_id}/blockers`

**Description:** Creates a new blocker within an organization.

**Assignment Rules:**
- The `assignee_id` field can only be assigned to users with the **Developer** role.
- Scrum Masters and Product Owners cannot be assigned to blockers.
- If `assignee_id` is provided, the backend must validate that the user has the Developer role.

**Authentication:** Required (JWT)

**Permissions:**
- Any organization member (creator becomes the blocker owner).

**URL Parameters:**
- `org_id` - UUID of the organization

**Request Body:**
```json
{
	"description": "string",
	"ticket_id": "uuid",
	"assignee_id": "uuid | null"  // Must be a user with Developer role
}
```

**Success Response:** `201 Created`
```json
{
	"id": "uuid",
	"description": "string",
	"status": "open",
	"created_by": "uuid (owner)",
	"assignee_id": "uuid | null",
	"ticket_id": "uuid | null",
	"created_at": "timestamp (today)",
	"resolved_at": "timestamp | null"
}
```

**Error Responses:**

`422 Unprocessable Entity` - Invalid input
```json
{
	"detail": [
		{
		"type": "string",
		"loc": ["body", "field_name"],
		"msg": "validation error message",
		"input": "invalid_value"
		}
	]
}
```

`400 Bad Request` - Invalid assignee role
```json
{
	"error": {
		"code": "INVALID_ASSIGNEE",
		"message": "Only users with Developer role can be assigned to blockers"
	}
}
```

`401 Unauthorized` - Authentication required
```json
{
	"error": {
		"code": "UNAUTHORIZED",
		"message": "Authentication required"
	}
}
```

`403 Forbidden` - Insufficient permissions
```json
{
	"error": {
		"code": "FORBIDDEN",
		"message": "You do not have permission to perform this action"
	}
}
```

`404 Not Found` - Organization not found
```json
{
	"error": {
		"code": "NOT_FOUND",
		"message": "Organization not found"
	}
}
```
---

### 7.2 List Organization Blockers

**Endpoint:** `GET /organizations/{org_id}/blockers`

**Description:** Returns all blockers for an organization and it details.

**Authentication:** Required (JWT)

**Permissions:**
- Any organization member.

**URL Parameters:**
- `org_id` - UUID of the organization

**Query Parameters:**
- status – `open | resolved`

**Examples:**
- `GET /organizations/{org_id}/blockers`
- `GET /organizations/{org_id}/blockers?status=open`
- `GET /organizations/{org_id}/blockers?status=resolved`

**Success Response:** `200 OK`
```json
[
	{
		"id": "uuid",
		"created_by": {
			"id": "uuid",
			"name": "string",
			"avatar_url": "string | null"
		},
		"description": "string",
		"status": "open | resolved",
		"assignee": {
			"id": "uuid",
			"name": "string",
		} | null,
		"ticket": {
			"id": "uuid",
			"title": "string"
		},
		"created_at": "timestamp (today)",
		"resolved_at": "timestamp | null"
	}
]
```

**Error Responses:**

`401 Unauthorized` - Authentication required
```json
{
	"error": {
		"code": "UNAUTHORIZED",
		"message": "Authentication required"
	}
}
```

`403 Forbidden` - Insufficient permissions
```json
{
	"error": {
		"code": "FORBIDDEN",
		"message": "You do not have permission to perform this action"
	}
}
```

`404 Not Found` - Organization not found
```json
{
	"error": {
		"code": "NOT_FOUND",
		"message": "Organization not found"
	}
}
```
---

### 7.3 Update Blocker

**Endpoint:** `PATCH /blockers/{blocker_id}`

**Description:** Updates blocker information.

**Assignment Rules:**
- The `assignee_id` field can only be assigned to users with the **Developer** role.
- Scrum Masters and Product Owners cannot be assigned to blockers.
- If `assignee_id` is provided, the backend must validate that the user has the Developer role.

**Authentication:** Required (JWT)

**Permissions:**
- Scrum Master
- Product Owner
- Developer (Ticket owner)

**URL Parameters:**
- `blocker_id` - UUID of the Blocker

**Request Body:**
```json
{
	"description": "string (optional)",
	"ticket_id": "uuid | null (optional)",
	"assignee_id": "uuid | null (optional)"  // Must be a user with Developer role
}
```

**Success Response:** `200 OK`
```json
{
	"id": "uuid",
	"created_by": {
		"id": "uuid",
		"name": "string",
		"avatar_url": "string | null"
	},
	"description": "string",
	"status": "open | resolved",
	"assignee": {
		"id": "uuid",
		"name": "string",
	} | null,
	"ticket": {
		"id": "uuid",
		"title": "string"
	},
	"created_at": "timestamp (today)",
	"resolved_at": "timestamp | null"
}
```

**Error Responses:**

`422 Unprocessable Entity` - Invalid input
```json
{
	"detail": [
		{
			"type": "string",
			"loc": ["body", "field_name"],
			"msg": "validation error message",
			"input": "invalid_value"
		}
	]
}
```

`400 Bad Request` - Invalid assignee role
```json
{
	"error": {
		"code": "INVALID_ASSIGNEE",
		"message": "Only users with Developer role can be assigned to blockers"
	}
}
```

`401 Unauthorized` - Authentication required
```json
{
	"error": {
		"code": "UNAUTHORIZED",
		"message": "Authentication required"
	}
}
```

`403 Forbidden` - Insufficient permissions
```json
{
	"error": {
		"code": "FORBIDDEN",
		"message": "You do not have permission to perform this action"
	}
}
```

`404 Not Found` - Blocker not found
```json
{
	"error": {
		"code": "NOT_FOUND",
		"message": "Blocker not found"
	}
}
```
---

### 7.4 Resolve Blocker

**Endpoint:** `PATCH /blockers/{blocker_id}/resolve`

**Description:** Marks a blocker as resolved.

**Rules:**
- Blockers cannot be deleted. They can only be resolved.

**Authentication:** Required (JWT)

**Permissions:**
- Scrum Master
- Product Owner
- Developer (Ticket owner/assignee)

**URL Parameters:**
- `blocker_id` - UUID of the Blocker

**Success Response:** `204 No Content`

**Error Responses:**

`401 Unauthorized` - Authentication required
```json
{
	"error": {
		"code": "UNAUTHORIZED",
		"message": "Authentication required"
	}
}
```

`403 Forbidden` - Insufficient permissions
```json
{
	"error": {
		"code": "FORBIDDEN",
		"message": "You do not have permission to perform this action"
	}
}
```

`404 Not Found` - Blocker not found
```json
{
	"error": {
		"code": "NOT_FOUND",
		"message": "Blocker not found"
	}
}
```

`409 Conflict` - Blocker already resolved
```json
{
	"error": {
		"code": "BLOCKER_ALREADY_RESOLVED",
		"message": "Blocker already resolved"
	}
}
```
---

## 8. Legal

### 8.1 Get Legal Document

**Endpoint:** `GET /legal/documents/{key}`

**Description:** Returns a legal document by its key.

**Authentication:** Public

**URL Parameters:**
- `key` - Document identifier: `privacy` | `terms`

**Notes:**
- Documents are stored as Markdown in the repository (`legal/privacy.md`, `legal/terms.md`)
- Content is returned as raw Markdown plain text; the frontend is responsible for rendering

**Success Response:** `200 OK`
```json
{
	"key": "privacy",
	"title": "Privacy Policy",
	"content": "# Privacy Policy\n\n...",
	"updated_at": "timestamp"
}
```

**Error Responses:**

`404 Not Found` - Document not found
```json
{
	"error": {
		"code": "NOT_FOUND",
		"message": "Legal document not found"
	}
}
```
---

## 9. Analytics

### 9.1 Get Organization analytics

**Endpoint:** `GET /organizations/{org_id}/analytics`

**Description:** Returns a the analytics for the organization.

**Authentication:** Required (JWT)

**Permissions:**
- Any organization member.

**URL Parameters:**
- `org_id` - UUID of the organization

**Success Response:** `200 OK`
```json
{
	//line chart
	"tasks":[
	{ "week": "Week 1", "active": "int", "resolved": "int"},
	{ "week": "Week 2", "active": "int", "resolved": "int"},
	{ "week": "Week 3", "active": "int", "resolved": "int"},
	{ "week": "Week 4", "active": "int", "resolved": "int"}
	],
	//bar chart
	"tickets":[
	{ "week": "Week 1", "completed": "int"},
	{ "week": "Week 2", "completed": "int"},
	{ "week": "Week 3", "completed": "int"},
	{ "week": "Week 4", "completed": "int"}
	],
	//numeric cards
	"standups": {
		"posted": "int",
		"total": "int"
	},
	//numeric cards
	"blockers_avg_cycle_time": "float"
}
```

**Error Responses:**

`401 Unauthorized` - Authentication required
```json
{
	"error": {
		"code": "UNAUTHORIZED",
		"message": "Authentication required"
	}
}
```

`403 Forbidden` - Insufficient permissions
```json
{
	"error": {
		"code": "FORBIDDEN",
		"message": "You do not have permission to perform this action"
	}
}
```

`404 Not Found` - Organization not found
```json
{
	"error": {
		"code": "NOT_FOUND",
		"message": "Organization not found"
	}
}
```
---

## 10. Dashboard

### 10.1 Get Organization Dashboard

**Endpoint:** `GET /organizations/{org_id}/dashboard`

**Description:** Returns summary counts for the value cards and a feed of the 6 most recent activity events (tickets/tasks created or completed) from the last 7 days.

**Notes:**
- `recent_updates` only includes events from the last 7 days.
- A completed item uses `updated_at` as its timestamp; a created item uses `created_at`.
- `timestamp` is returned as a UTC datetime string — the frontend is responsible for formatting it as a relative time (e.g. "48 min ago", "2 days ago").

**Authentication:** Required (JWT)

**Permissions:**
- Any organization member.

**URL Parameters:**
- `org_id` - UUID of the organization

**Success Response:** `200 OK`
```json
{
	"summary": {
		"tasks_in_progress": "int",
		"tickets_completed": "int",
		"active_blockers": "int"
	},
  "recent_updates": [
		{
		"type": "task | ticket",
		"event": "created | completed",
		"title": "string",
		"timestamp": "ISO 8601 datetime (UTC)",
		"created_by": "UserBrief"
		}
	]
}
```

**Error Responses:**

`401 Unauthorized` - Authentication required
```json
{
	"error": {
		"code": "UNAUTHORIZED",
		"message": "Authentication required"
	}
}
```

`403 Forbidden` - User is not part of any organization
```json
{
	"error": {
		"code": "NO_ORGANIZATION",
		"message": "User is not part of any organization."
	}
}
```
`404 Not Found` - Organization not found
```json
{
	"error": {
		"code": "NOT_FOUND",
		"message": "Organization not found"
	}
}
```
---
**End of Document**
