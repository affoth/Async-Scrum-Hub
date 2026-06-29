# Real-Time Layer

This document describes the real-time communication layer for Async Scrum Hub.

---

## Overview

The real-time layer uses **WebSockets** to push live updates to connected clients.
It is intentionally limited to events that require immediate visibility:
- Standup submissions and edits
- Blocker creation, updates, and resolution
- Ticket creation, updates, moves, and deletion
- Task creation, updates, and deletion

All events are **scoped to an organization** — a client only receives events for the organization it is connected to.

---

## Technology

- Protocol: **WebSocket** (`ws://` / `wss://`)
- Backend: **FastAPI** WebSocket endpoint
- Authentication: JWT token passed as a query parameter

---

## Connecting

### Endpoint

```
ws://localhost:8000/ws/{org_id}?token={jwt_token}
```

| Parameter | Type   | Description                          |
|-----------|--------|--------------------------------------|
| `org_id`  | UUID   | The organization to subscribe to     |
| `token`   | string | Valid JWT access token (from login)  |

### Example (JavaScript)

```js
const socket = new WebSocket(
  `ws://localhost:8000/ws/${orgId}?token=${accessToken}`
);

socket.onopen = () => {
  console.log("Connected to real-time updates");
};

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log(message.event, message.data);
};

socket.onclose = (event) => {
  console.log("Connection closed", event.code, event.reason);
};
```

---

## Authentication

The JWT token is validated on connection.

| Scenario                          | Result                           |
|-----------------------------------|----------------------------------|
| Token missing                     | Connection rejected (4001)       |
| Token invalid or expired          | Connection rejected (4001)       |
| User not a member of `org_id`     | Connection rejected (4003)       |
| Valid token and correct org       | Connection accepted              |

If the token expires while the connection is open, the client should reconnect with a fresh token.

---

## Message Format

All messages sent from the server follow this structure:

```json
{
  "event": "domain.action",
  "data": { }
}
```

| Field   | Type   | Description                              |
|---------|--------|------------------------------------------|
| `event` | string | Event name in `domain.action` format     |
| `data`  | object | Event payload (varies per event type)    |

---

## Connection Lifecycle

| State          | Description                                                      |
|----------------|------------------------------------------------------------------|
| **Connecting** | Token and org membership are validated before the handshake completes |
| **Open**       | Client receives all events scoped to the connected organization  |
| **Closed**     | Server closes the connection on auth failure or server restart   |

Clients should implement reconnection logic with exponential backoff.

---

## Close Codes

| Code   | Reason                          |
|--------|---------------------------------|
| `1000` | Normal closure                  |
| `4001` | Authentication failed           |
| `4003` | Not a member of this organization |

---

## Event Catalog

See [REALTIME_EVENTS.md](REALTIME_EVENTS.md) for the full list of events with payloads.
