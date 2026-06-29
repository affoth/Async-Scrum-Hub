## Modules Used

# WEB

• Minor: Use a frontend framework (React 19 and TypeScript).

• Minor: Use a backend framework (FastAPI).

• Minor: Custom-made design system with reusable components, including a proper
color palette, typography, and icons (minimum: 10 reusable components).

• Major: Implement real-time features using WebSockets or similar technology.
	◦ Real-time updates across clients.
	◦ Handle connection/disconnection gracefully.
	◦ Efficient message broadcasting.

• Major: A public API to interact with the database with a secured API key, rate limiting, documentation, and at least 5 endpoints:
	◦ GET /api/{something}
	◦ POST /api/{something}
	◦ PUT /api/{something}
	◦ DELETE /api/{something}

• Minor: Use an ORM for the database.


# User Management

(on the making AVATAR?)
• Major: Standard user management and authentication.
	◦ Users can update their profile information.
	◦ Users can upload an avatar (with a default avatar if none provided).
	◦ Users can add other users as friends and see their online status.
	◦ Users have a profile page displaying their information.

• Major: Advanced permissions system:
	◦ View, edit, and delete users (CRUD).
	◦ Roles management (admin, user, guest, moderator, etc.).
	◦ Different views and actions based on user role.

• Minor: User activity analytics and insights dashboard.


# Modules of choice

• Minor (Custom): Drag & Drop system
	◦ Implement a complete drag & drop interface for task and resource management.
	◦ Allow users to move tickets, tasks, and blockers between different states or columns dynamically.
	◦ Ensure real-time synchronization across connected clients when items are moved.
	◦ Provide visual feedback (hover states, drop zones, animations) to enhance user experience.
	◦ Include proper validation and permission checks before allowing state changes.
	◦ Adds meaningful value by improving usability and supporting collaborative workflow management.
	◦ Justification provided in README.md explaining its technical implementation and added value.

• Minor (Custom): An organization system
	◦ Create organizations.
	◦ Add users to organizations.
	◦ Remove users from organizations.
	◦ View organizations and allow users to perform specific actions within an organization (minimum: create, read, update).

• Minor (Custom): Team workload visibility and capacity overview
	◦ Dedicated operational dashboard showing each member's assigned tickets, active tasks, and open blockers in a unified per-member expandable view.
	◦ Team-wide stat cards aggregate totals across all members.
	◦ Real-time updates via WebSocket — workload counts reflect live changes without page refresh.
	◦ Distinct from the analytics dashboard (historical trends); this module covers current workload state per person.
	◦ Supports Scrum Master and Product Owner in identifying capacity imbalances and blocker concentration.
	◦ Implemented with full test coverage (~1200 lines, 40+ test cases).
	◦ Justification provided in README.md explaining its technical implementation and added value.
