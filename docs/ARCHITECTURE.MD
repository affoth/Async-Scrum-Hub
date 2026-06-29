## Table of Contents

1. [Overview](#1-overview)
2. [High-Level System Architecture](#2-high-level-system-architecture)
3. [Repository Organization](#3-repository-organization-monorepo)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [API Design](#6-api-design-api-first-approach)
7. [Authentication and Authorization](#7-authentication-and-authorization)
8. [Real-Time Architecture](#8-real-time-architecture)
9. [Database Design](#9-database-design)
10. [Configuration and Environments](#10-configuration-and-environments)
11. [Key Architectural Decisions](#11-key-architectural-decisions)
12. [Team Responsibilities](#12-team-responsibilities)
13. [Conclusion](#13-conclusion)
14. [Project Structure](#14-project-structure)

## 1. Overview

This project is an asynchronous collaboration platform designed to help small teams coordinate their work without relying on constant synchronous meetings.

The system focuses on structured communication patterns such as task management, daily standups, and blocker tracking. By moving these workflows into an asynchronous environment, the platform aims to reduce interruptions while maintaining visibility across the team.

The application is built as a multi-layer system composed of a frontend client, a backend API, a real-time communication layer, and a persistent database. Each component has a clearly defined responsibility and communicates with the others through well-defined interfaces.

## 2. High-Level System Architecture

The system follows a layered architecture in which each major component has a clearly defined role and responsibility.

The frontend acts as the primary user interface and communicates with the backend through REST APIs for all data-related operations. Real-time updates are delivered through a dedicated WebSocket channel to ensure timely synchronization between connected clients.

The backend serves as the central authority of the system, enforcing business rules, handling authentication and authorization, and coordinating communication between the different layers. The database is used exclusively by the backend, ensuring a single source of truth for all persisted data.

## 3. Repository Organization (Monorepo)

The project is organized as a monorepo to keep all components of the system aligned and versioned together.

This structure allows frontend, backend, and real-time components to evolve consistently while sharing documentation and configuration. Clear boundaries between folders reflect architectural responsibilities rather than individual implementations, making the system easier to understand and maintain.

## 4. Frontend Architecture

The frontend is implemented as a single-page application responsible for rendering the user interface and handling user interactions.

It consumes backend APIs for all data access and listens to real-time events to reflect changes immediately in the user interface. The frontend remains intentionally thin, delegating validation, permissions, and business logic enforcement to the backend in order to avoid duplicated logic and inconsistencies.

## 5. Backend Architecture

The backend is implemented in Python using FastAPI and represents the core of the system.

It is responsible for authentication, authorization, business logic enforcement, and data persistence. The backend codebase is organized by functional domains rather than technical layers, allowing each domain to encapsulate its routes, schemas, and services.

This approach improves readability, scalability, and collaboration by making responsibilities explicit and reducing coupling between unrelated parts of the system.

## 6. API Design (API-First Approach)

The system follows an API-first development approach.

All API contracts are defined before implementation, including request payloads, response formats, and error cases. This ensures a clear contract between frontend and backend and allows both sides to work in parallel without blocking each other.

API definitions are treated as a stable interface and documented separately to maintain consistency throughout the project lifecycle.

## 7. Authentication and Authorization

Authentication is handled using stateless mechanisms based on JSON Web Tokens (JWT).

Authorization is enforced at the backend level through role-based and organization-scoped permissions. Access to protected resources requires both authentication and explicit authorization checks to ensure that users can only perform actions within their allowed scope.

## 8. Real-Time Architecture

The system includes a real-time communication layer to propagate time-sensitive updates to connected clients.

Real-time functionality is intentionally limited to events that require immediate visibility, such as task state changes or standup submissions. WebSocket connections are authenticated and scoped to relevant contexts to prevent unnecessary traffic and maintain system stability.

## 9. Database Design

The application uses a relational database to model its domain entities and relationships.

Core entities such as users, organizations, tickets, and tasks are represented using normalized tables to ensure data consistency and integrity. The relational model allows the system to enforce constraints and represent complex relationships clearly.

### 9.1 Internal Model Fields for Authorization

All domain resources (Ticket, Task, Standup, Blocker) must include certain fields to support the authorization system, even if these fields are not exposed in API responses.

**Required fields for all domain resources:**
- `organization_id`: UUID foreign key to organizations table. Required for authorization scope checks and efficient queries.
- `created_by`: UUID foreign key to users table. Required for ownership permission checks.

**Required fields for assignable resources (Ticket, Task, Blocker):**
- `assignee_id`: UUID foreign key to users table (nullable). Required for assignee permission checks.

These fields enable the `authorize()` function to perform permission checks without additional database queries. The authorization system uses a `Protocol` type hint to ensure all resources implement these fields consistently.

## 10. Configuration and Environments

Configuration is managed through environment variables to separate code from environment-specific settings.

The project supports local development through containerized services, ensuring consistent environments across different machines. Sensitive information is never committed to the repository and is handled through configuration files excluded from version control.

## 11. Key Architectural Decisions

Several key architectural decisions guide the design of the system.

These include the use of a monorepo structure, an API-first approach, domain-driven backend organization, and a hybrid communication model combining REST APIs with WebSockets. Each decision aims to balance simplicity, scalability, and ease of collaboration within a small development team.

## 12. Team Responsibilities

Responsibilities within the project are clearly separated to avoid overlap and confusion.

Frontend development focuses on user experience and client-side interaction, backend development handles business logic and data consistency, and real-time functionality manages live communication. Architectural decisions and API contracts are maintained centrally to ensure consistency across the system.

## 13. Conclusion

This architecture provides a clear separation of concerns while supporting collaborative development and incremental growth.

By defining responsibilities explicitly and enforcing well-defined interfaces between components, the system remains maintainable, scalable, and easy to reason about throughout the development process.

## 14. Project Structure

The following directory structure reflects the architecture described above and highlights the separation of responsibilities across the system.

```
async-scrum-hub/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── custom/			# Project-specific reusable components
│   │   │   └── layout/
│   │   │        ├── SideBar/
│   │   │        |   ├── Sidebar.tsx
│   │   │        |   └── useSidebar.ts
│   │   │        └── TopBar/
│   │   │            ├── Topbar.tsx
│   │   │            └── useTopbar.ts
│   │   │
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   |    ├── Login.tsx
│   │   │   |    ├── SignUp.tsx
│   │   │   |    ├── TeampSetup.tsx
│   │   │   |    ├── WelcomeAnimation.tsx
│   │   │   |    └── Welcome.tsx
│   │   │   |
│   │   │   ├── analytics/			# Analytics dashboard page
│   │   │   ├── blockers/			# Blockers page
│   │   │   ├── dashboard/			# Main dashboard page
│   │   │   ├── info/				# Info/legal page
│   │   │   ├── sprint_board/		# Sprint board page
│   │   │   |    ├── components/	# Diverse UI components (board + kanban + Dialogue window)
│   │   │   |    |   └── modals/
│   │   │   |    |     ├── CreateBlockerModal.tsx
│   │   │   |    |     ├── CreateTaskModal.tsx
│   │   │   |    |     ├── CreateTicketModal.tsx
│   │   │   |    |     ├── EditTicketModal.tsx
│   │   │   |    |     ├── TaskDetailModal.tsx
│   │   │   |    |     └── TicketDetailModal.tsx
│   │   │   |    |
│   │   │   |    ├── constants/		# Static data
│   │   │   |    ├── hooks/			# Sprint board logic
│   │   │   |    |__ types/			# Interfaces and types
│   │   │   |
│   │   │   └── standups/			# Async standup page
│   │   │
│   │   ├── hooks/useOrgWebSocket.ts
│   │   ├── routes/					# Traffic controller
│   │   │   |── AuthProvider.tsx
│   │   │   |── RequireAuth.tsx
│   │   │   └── useAuth.ts
│   │   │
│   │   ├── services/
│   │   │   └── api.ts				# API client and typed request functions
│   │   ├── types/
│   │   │   └── api.types.ts		# Architectural and Data types
│   │   ├── utils/
│   │   │   └── formatters.ts
│   │   ├── test/
│   │   │   └── setup.ts
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   │
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── main.py             # FastAPI entrypoint
│   │   │
│   │   ├── config/
│   │   │   ├── settings.py
│   │   │   └── security.py     # JWT creation and verification, password hashing
│   │   │
│   │   ├── database/           # SQLAlchemy setup
│   │   │   ├── session.py
│   │   │   ├── base.py
│   │   │   └── models/
│   │   │       ├── __init__.py
│   │   │       ├── enums.py    # Shared enums (TicketStatus, TaskStatus, Priority, etc.)
│   │   │       ├── user.py
│   │   │       ├── organization.py
│   │   │       ├── ticket.py
│   │   │       ├── task.py
│   │   │       ├── standup.py
│   │   │       └── blocker.py
│   │   │
│   │   ├── api/
│   │   │   ├── routes.py       # Root API router (mounts all domain routers)
│   │   │   ├── deps.py         # FastAPI dependencies (auth, org membership)
│   │   │   ├── permissions.py  # Permission definitions (scope, roles, owner, assignee)
│   │   │   └── authorize.py    # Authorization guard (enforce permission rules)
│   │   │
│   │   ├── schemas/
│   │   │   └── common.py       # Shared Pydantic schemas
│   │   │
│   │   ├── auth/
│   │   │   ├── routes.py
│   │   │   ├── schemas.py
│   │   │   └── service.py
│   │   │
│   │   ├── users/
│   │   │   ├── routes.py
│   │   │   ├── schemas.py
│   │   │   └── service.py
│   │   │
│   │   ├── organizations/
│   │   │   └── routes.py
│   │   │
│   │   ├── tickets/
│   │   │   └── routes.py
│   │   │
│   │   ├── tasks/
│   │   │   └── routes.py
│   │   │
│   │   ├── standups/
│   │   │   ├── routes.py
│   │   │   ├── schemas.py
│   │   │   └── service.py
│   │   │
│   │   ├── blockers/
│   │   │   ├── routes.py
│   │   │   ├── schemas.py
│   │   │   └── service.py
│   │   │
│   │   ├── analytics/
│   │   │   ├── routes.py
│   │   │   ├── schemas.py
│   │   │   └── service.py
│   │   │
│   │   └── legal/
│   │       ├── routes.py
│   │       └── schemas.py
│   │
│   ├── alembic.ini
│   ├── migrations/
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── realtime/
│   ├── README.md
│   └── events.md
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API_CONTRACTS.md
│   ├── AUTHORIZATION_MODEL.md
│   ├── PERMISSIONS_MATRIX.md
│   ├── MODULES.md
│   ├── DOCKER_SETUP.md
│   └── DEVELOPMENT_STANDARDS.md
│
├── docker-compose.yml
├── .env
├── .env.example
├── .gitignore
└── README.md
```
