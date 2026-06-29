from fastapi import WebSocket

class ConnectionManager:
	"""
	Manages active WebSocket connections grouped by organization ID.

	All clients connected to the same org_id receive the same broadcast messages.
	Dead connections are cleaned up silently during broadcast.
	"""

	def __init__(self):
		self.active_connections: dict[str, list[WebSocket]] = {}

	async def connect(self, websocket: WebSocket, org_id: str) -> None:
		await websocket.accept()
		if org_id not in self.active_connections:
			self.active_connections[org_id] = []
		self.active_connections[org_id].append(websocket)

	def disconnect(self, websocket: WebSocket, org_id: str) -> None:
		connections = self.active_connections.get(org_id, [])
		if websocket in connections:
			connections.remove(websocket)

	async def broadcast(self, org_id: str, event: str, data: dict) -> None:
		message = {"event": event, "data": data}
		connections = self.active_connections.get(org_id, [])
		dead = []
		for websocket in connections:
			try:
				await websocket.send_json(message)
			except Exception:
				dead.append(websocket)
		for ws in dead:
			self.disconnect(ws, org_id)


manager = ConnectionManager()
