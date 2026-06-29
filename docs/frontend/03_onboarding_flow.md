# User Onboarding & Auth Flow

---

## User Data Model

```typescript
{
  scrum_role: "scrum_master" | "product_owner" | "developer" | null,
  organization_id: uuid | null
}
```

A user is **fully onboarded** when both `scrum_role` and `organization_id` are set.

---

## Auth Implementation

### `AuthProvider.tsx`

Wraps the entire app. Provides auth state (user, token, login/logout) via React context.

### `useAuth.ts`

Hook to access auth context anywhere:
```tsx
const { user, token, login, logout } = useAuth();
```

### `RequireAuth.tsx`

Route guard component. If the user is not authenticated, redirects to `/login`. Wraps all authenticated routes in `App.tsx`.

---

## User Flows

### New User

```
/signup → /team-setup → /dashboard
```

- After signup, user is redirected to `/team-setup`
- TeamSetup lets them create a new team OR join an existing one via join code
- Developers must join; Scrum Masters / Product Owners can create or join

### Returning User

```
/login → /dashboard
```

- JWT from login is stored; `RequireAuth` checks for valid token
- Fully onboarded users go straight to `/dashboard`

---

## Route Structure in `App.tsx`

```tsx
<BrowserRouter>
  <AuthProvider>
    <Routes>
      {/* Public */}
      <Route path="/" element={<WelcomeAnimation />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/team-setup" element={<RequireAuth><TeamSetup /></RequireAuth>} />

      {/* Authenticated (Sidebar + TopBar) */}
      <Route path="/*" element={<AuthenticatedLayout />} />
    </Routes>
  </AuthProvider>
</BrowserRouter>
```

`AuthenticatedLayout` renders Sidebar + TopBar and wraps all feature routes in `RequireAuth`.

---

## Guard Logic

`RequireAuth` checks authentication and redirects to `/login` if the user has no valid session. Role-based redirection (e.g. developer → team-join vs SM/PO → team-creation) is handled during the team-setup step via `TeamSetup.tsx`.
