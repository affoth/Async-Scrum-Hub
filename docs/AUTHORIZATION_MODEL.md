# Authorization Model – Async Scrum Hub

## Purpose

This document defines **how authorization is evaluated and enforced**
in the Async Scrum Hub backend.

It does **not** redefine roles, permissions, or endpoints.
Those are defined in:

- API_CONTRACTS.md
- PERMISSIONS_MATRIX.md

This document focuses exclusively on:
- authorization flow
- contextual resolution
- invariant rules
- backend enforcement guidelines

---

## 1. Authorization Scope

Every endpoint has one of three authorization scopes:

- **Public** – No JWT required (register, login, legal documents)
- **Global** – JWT required, no organization membership required (create org, join org, user profile)
- **Org** – JWT required + organization membership required (all resource endpoints: tickets, tasks, standups, blockers, analytics)

All resource-level permissions are organization-scoped.
Public and global endpoints do not involve role or ownership checks.

---

## 2. Authorization Prerequisites

For **org-scoped** endpoints, authorization is evaluated only after:

1. The request is authenticated (valid JWT)
2. The target resource exists
3. The organization context is resolved

Failure at any step aborts authorization.

---

## 3. Context Resolution

For every protected request, the backend must resolve:

- `user_id` from JWT
- `organization_id` from:
  - request path
  - resource ownership
- user belongs to that organization (via `user.organization_id`)

If the user does not belong to the organization,
authorization immediately fails.

---

### 4. Organization Identifier Resolution

The backend uses two different identifiers for the same concept,
depending on context:

- **`org_id`** is used in request paths as a route parameter  
  (e.g. `/organizations/{org_id}/members`)
- **`organization_id`** is used inside resource payloads and models  
  (e.g. tickets, tasks, blockers)

Authorization logic must follow this rule:

- If `org_id` is present in the request path, it defines the organization context.
- Otherwise, the organization context must be resolved from `resource.organization_id`.

This distinction is intentional and must be handled consistently.

---

## 5. Role Resolution

Each user has **two independent roles** within an organization:

- **Organization role** (admin | member)
- **Scrum role** (scrum_master | product_owner | developer)

Roles are **never inferred**.
They are stored directly on the User model (`user.org_role`, `user.scrum_role`).

---

## 6. Organization Admin Override

An organization admin:

- bypasses ownership and assignment checks
- can perform any action within the organization scope

This override applies **only for authorization**  
and does not imply scrum role semantics.

---

## 7. Ownership Rule

For resources that define ownership:

- The creator becomes the **owner**
- Ownership is immutable
- Ownership grants full modification rights

Ownership is identified via the `created_by` field.

---

## 8. Assignment Rule

Some resources support assignment:

- Assignment is optional
- Only valid assignees are allowed (validated at API level)
- When present, the assignee may gain additional permissions depending on the **resource type** and **action**.
- Assignee permissions are **not automatically equivalent** to owner permissions.
- The exact assignee capabilities are defined in PERMISSIONS_MATRIX.md (per resource/action).

> Example: For Blockers, assignees may resolve but may not update the blocker content unless explicitly allowed.

Assignment is identified via the `assignee_id` field.

---

## 9. Authorization Decision Order

Authorization checks must be evaluated in the following order:

1. Organization admin override
2. Role-based permission (if applicable to the action)
3. Ownership permission (if the action supports owner privileges)
4. Assignment permission (if the action supports assignee privileges)

The first rule that grants the action authorizes the request.
If no rule grants access, authorization fails.

---

## 10. Immutable Authorization Invariants

The following rules must **never** be violated:

- An organization must always have at least one admin
- Users cannot remove themselves from an organization
- Blockers cannot be deleted, only resolved
- Standups are limited to one per user per day
- Past standups cannot be edited

These rules are enforced independently of roles.

---

## 11. Authorization Failure Semantics

- Missing authentication → `401 Unauthorized`
- Failed authorization → `403 Forbidden`
- Invalid state transitions → `400 Bad Request`

Authorization failures must never leak resource existence
or internal role information.

---

## 12. Backend Enforcement Guidelines

Authorization must be enforced:

- exclusively in the backend
- before any state mutation
- consistently across all routes

Frontend authorization checks are considered advisory only
and must never be trusted.

---

## 13. Testing Expectations

Every authorization rule must be covered by tests:

- role-based access
- ownership checks
- assignment checks
- admin overrides
- invariant violations

Authorization tests are mandatory for every new endpoint.

---

## Related Documents

- API_CONTRACTS.md – endpoint definitions
- PERMISSIONS_MATRIX.md – permission tables
- ARCHITECTURE.md – system architecture
