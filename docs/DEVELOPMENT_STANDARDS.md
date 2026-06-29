# Development Standards & Best Practices
## Async Scrum Hub - Team Guidelines

**These are MANDATORY practices for successful remote collaboration.**

# Development Standards

This document defines how we work as a team.
These rules exist to reduce friction, avoid integration issues,
and keep the project shippable at all times.

If something here is unclear, we discuss it before coding.

---

## 1. Branching & Git Rules

### Branches
- `main` → protected, demo-ready only
- `dev` → integration branch
- `feat/<short-name>` → feature work (e.g. `feat/standups-ui`)

### Rules
- No direct commits to `main`
- All work goes through a Pull Request (PR) into `dev`
- `dev` → `main` merges only at milestone checkpoints

---

## 2. Pull Requests (PRs)

### What is a PR?
A Pull Request is a request to merge your feature branch into `dev`.
All PRs must be reviewed by at least one teammate.
git comm
---

## 3. Definition of Done (MANDATORY)

A PR can be merged only if **all** items below are true:

- Code compiles and runs locally
- No errors or warnings in browser console
- Types updated (including shared types if needed)
- Frontend + backend validation implemented
- Seed/demo data updated if feature affects data
- Feature is demoable manually
- No unrelated changes in the PR

If one item is missing → PR stays open.

---

## 4. API-First Development

- Backend defines endpoints and request/response shapes first
- API contracts are written before frontend integration
- Frontend builds against the contract, not assumptions

---

## 5. API Contracts & Types

- API contracts are documented in `docs/API_CONTRACTS.md`
- **Backend** (Python/FastAPI): Uses Pydantic schemas for request/response validation
- **Frontend** (TypeScript/React): Defines its own TypeScript interfaces

### API Contract Change Rule (MANDATORY)
If an API contract changes:
1. Update `docs/API_CONTRACTS.md`
2. Update backend Pydantic schemas
3. Notify the team in the communication channel
4. Frontend updates TypeScript types before merge

Breaking changes without notice are not allowed.

---

## 6. Authentication Strategy

- Authentication uses **JWT Bearer tokens**
- Frontend stores token and sends via `Authorization: Bearer <token>` header
- Backend validates tokens using `OAuth2PasswordBearer` (FastAPI)
- Token contains user ID in `sub` claim

This is a security decision and should not be changed mid-project.

---

## 7. Real-Time Scope (STRICT)

Real-time features are limited to:
- Task status changes
- Standup posts appearing
- Blockers raised or resolved

Everything else uses REST APIs.

No new WebSocket features are added without team agreement.

---

## 8. Code Style & Formatting

- TypeScript is used everywhere
- Prettier config is shared
- Format-on-save is enabled
- No formatting-only PRs

---

## 9. Component-Driven Frontend Development

- UI components are built in isolation first
- Components live in the design system
- Pages compose components, not custom styles

---

## 10. Data & Demo Discipline

- Seed data must look realistic
- No placeholder text like "test test test"
- Analytics features rely on seeded sprint data

Seed data is part of the product.

---

## 11. When in Doubt

- Ask before implementing
- Prefer simpler solutions
- Protect the demo at all times
---

## 🎯 Core Principles

1. **TypeScript Everywhere** - Catch bugs before they happen
2. **API-First Development** - Frontend and backend work in parallel
3. **Atomic Commits** - Small, focused, reversible changes
4. **Component Isolation** - Build UI in isolation, integrate later
5. **Realistic Test Data** - No "test test test", use real scenarios

---

## 📝 Commit Message Format

### `<type>(<scope>): <description>`

| Type        | Use                |Example
|-------------|--------------------|-----------------------
| `feat`      | New feature        | feat/auth-login
| `fix`       | Bug fix            | fix/login-validation
| `docs`      | Documentation      | docs/api-contracts
| `refactor`  | Code restructuring | refactor/auth-service
| `test`      | Adding tests       | test/auth-endpoints
| `chore`     | Maintenance        | chore/update-deps

```bash
git commit -m "feat(auth): add login endpoint with JWT generation"
git commit -m "fix(validation): handle edge case in email validator"
git commit -m "chore(deps): update dependencies to latest versions"
```

---

## 📊 Code Review Checklist

- All PRs require 1 approval before merging
- Assign reviewer based on area: backend team member for backend, frontend team member for frontend

Before approving, verify:

- [ ] Matches the API contract
- [ ] TypeScript types correct (no `any`)
- [ ] Code formatted (Prettier)
- [ ] Error handling implemented
- [ ] Tests added if applicable
- [ ] No `console.log` left in code
- [ ] No commented-out code

---

## 🚀 Before Merging to Main

- [ ] All tests pass (`docker-compose exec backend pytest`)
- [ ] No TypeScript errors
- [ ] No `console.log` or debugger statements
- [ ] ENV variables documented in `.env.example`
- [ ] PR approved by reviewer
- [ ] Tested in Docker environment (`docker-compose up --build`)

---

## 🎉 Summary

These practices ensure:

✅ **Fast development** - Frontend/backend work in parallel
✅ **Fewer bugs** - TypeScript catches issues early
✅ **Easy collaboration** - Clear boundaries, no conflicts
✅ **Professional quality** - Code evaluators expect
✅ **Remote-friendly** - Async-first, clear communication

**Remember:** These aren't bureaucracy, they're tools to help us ship faster and better. 🚀

**Questions?** Ask in Discord! We're a team.
