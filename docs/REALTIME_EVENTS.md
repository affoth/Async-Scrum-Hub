# Real-Time Events

Full catalog of WebSocket events emitted by the backend.

All events follow the format:
```json
{
  "event": "domain.action",
  "data": { }
}
```

Events are scoped to an organization — only clients connected to the relevant `org_id` receive them.

---

## Standup Events

### `standup.created`

Emitted when a user submits a new standup.

**Trigger:** `POST /organizations/{org_id}/standups`

**Received by:** All members of the organization.

**Payload:**
```json
{
  "event": "standup.created",
  "data": {
    "id": "uuid",
    "created_at": "timestamp",
    "today": "string",
    "yesterday": "string | null",
    "blocker_ids": ["uuid"],
    "created_by": {
      "id": "uuid",
      "name": "string",
      "avatar_url": "string | null"
    }
  }
}
```

---

### `standup.updated`

Emitted when a standup is edited.

**Trigger:** `PATCH /standups/{standup_id}`

**Received by:** All members of the organization.

**Payload:**
```json
{
  "event": "standup.updated",
  "data": {
    "id": "uuid",
    "today": "string",
    "updated_by": {
      "id": "uuid",
      "name": "string"
    }
  }
}
```

---

## Blocker Events

### `blocker.created`

Emitted when a new blocker is created.

**Trigger:** `POST /organizations/{org_id}/blockers`

**Received by:** All members of the organization.

**Payload:**
```json
{
  "event": "blocker.created",
  "data": {
    "id": "uuid",
    "description": "string",
    "status": "open",
    "created_by": {
      "id": "uuid",
      "name": "string",
      "avatar_url": "string | null"
    },
    "assignee": {
      "id": "uuid",
      "name": "string"
    } | null,
    "ticket": {
      "id": "uuid",
      "title": "string"
    } | null,
    "created_at": "timestamp"
  }
}
```

---

### `blocker.updated`

Emitted when a blocker's description, assignee, or linked ticket is changed.

**Trigger:** `PATCH /blockers/{blocker_id}`

**Received by:** All members of the organization.

**Payload:**
```json
{
  "event": "blocker.updated",
  "data": {
    "id": "uuid",
    "description": "string",
    "assignee": {
      "id": "uuid",
      "name": "string"
    } | null,
    "ticket": {
      "id": "uuid",
      "title": "string"
    } | null
  }
}
```

---

### `blocker.resolved`

Emitted when a blocker is marked as resolved.

**Trigger:** `PATCH /blockers/{blocker_id}/resolve`

**Received by:** All members of the organization.

**Payload:**
```json
{
  "event": "blocker.resolved",
  "data": {
    "id": "uuid",
    "resolved_at": "timestamp"
  }
}
```

---

## Ticket Events

### `ticket.created`

Emitted when a new ticket is created.

**Trigger:** `POST /organizations/{org_id}/tickets`

**Received by:** All members of the organization.

**Payload:**
```json
{
  "event": "ticket.created",
  "data": {
    "id": "uuid",
    "title": "string",
    "description": "string | null",
    "status": "todo",
    "priority": "low | medium | high",
    "assignee": {
      "id": "uuid",
      "name": "string",
      "avatar_url": "string | null"
    } | null,
    "created_by": "uuid",
    "created_at": "timestamp"
  }
}
```

---

### `ticket.updated`

Emitted when a ticket's fields (title, description, priority, assignee) are updated.

**Trigger:** `PATCH /tickets/{ticket_id}`

**Received by:** All members of the organization.

**Payload:**
```json
{
  "event": "ticket.updated",
  "data": {
    "id": "uuid",
    "title": "string",
    "description": "string | null",
    "priority": "low | medium | high",
    "assignee": {
      "id": "uuid",
      "name": "string",
      "avatar_url": "string | null"
    } | null,
    "updated_at": "timestamp"
  }
}
```

---

### `ticket.moved`

Emitted when a ticket is moved between board columns (status change via drag & drop).

**Trigger:** `PATCH /tickets/{ticket_id}/move`

**Received by:** All members of the organization.

**Payload:**
```json
{
  "event": "ticket.moved",
  "data": {
    "id": "uuid",
    "status": "todo | in_progress | completed",
    "updated_at": "timestamp"
  }
}
```

---

### `ticket.deleted`

Emitted when a ticket is deleted.

**Trigger:** `DELETE /tickets/{ticket_id}`

**Received by:** All members of the organization.

**Payload:**
```json
{
  "event": "ticket.deleted",
  "data": {
    "id": "uuid"
  }
}
```

---

## Task Events

### `task.created`

Emitted when a new task is created within a ticket.

**Trigger:** `POST /tickets/{ticket_id}/tasks`

**Received by:** All members of the organization.

**Payload:**
```json
{
  "event": "task.created",
  "data": {
    "id": "uuid",
    "title": "string",
    "status": "in_progress",
    "ticket_id": "uuid",
    "assignee_id": "uuid | null",
    "created_by": {
      "id": "uuid",
      "name": "string"
    }
  }
}
```

---

### `task.updated`

Emitted when a task is updated.

**Trigger:** `PATCH /tasks/{task_id}`

**Received by:** All members of the organization.

**Payload:**
```json
{
  "event": "task.updated",
  "data": {
    "id": "uuid",
    "title": "string",
    "status": "in_progress | completed",
    "assignee_id": "uuid | null",
    "ticket_id": "uuid"
  }
}
```

---

### `task.deleted`

Emitted when a task is deleted.

**Trigger:** `DELETE /tasks/{task_id}`

**Received by:** All members of the organization.

**Payload:**
```json
{
  "event": "task.deleted",
  "data": {
    "id": "uuid",
    "ticket_id": "uuid"
  }
}
```

---

## Summary Table

| Event              | Trigger endpoint                              | Receivers         |
|--------------------|-----------------------------------------------|-------------------|
| `standup.created`  | `POST /organizations/{org_id}/standups`       | All org members   |
| `standup.updated`  | `PATCH /standups/{standup_id}`                | All org members   |
| `blocker.created`  | `POST /organizations/{org_id}/blockers`       | All org members   |
| `blocker.updated`  | `PATCH /blockers/{blocker_id}`                | All org members   |
| `blocker.resolved` | `PATCH /blockers/{blocker_id}/resolve`        | All org members   |
| `ticket.created`   | `POST /organizations/{org_id}/tickets`        | All org members   |
| `ticket.updated`   | `PATCH /tickets/{ticket_id}`                  | All org members   |
| `ticket.moved`     | `PATCH /tickets/{ticket_id}/move`             | All org members   |
| `ticket.deleted`   | `DELETE /tickets/{ticket_id}`                 | All org members   |
| `task.created`     | `POST /tickets/{ticket_id}/tasks`             | All org members   |
| `task.updated`     | `PATCH /tasks/{task_id}`                      | All org members   |
| `task.deleted`     | `DELETE /tasks/{task_id}`                     | All org members   |
