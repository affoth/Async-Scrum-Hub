"""
Realtime WebSocket routes.

Endpoints:
- WS     /ws/{org_id}                              → real-time event stream (authenticated member)

Authenticates via JWT passed as ?token= query param.
Closes with code 4001 if the token is invalid, 4003 if the user does not belong to org_id.
Server-push only — the server broadcasts events and ignores client messages.
"""

import uuid
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from sqlalchemy.orm import Session

from src.database import get_db
from src.database.models import User
from src.config.security import decode_access_token
from src.realtime.connection_manager import manager

router = APIRouter()


@router.websocket("/ws/{org_id}")
async def websocket_endpoint(
	websocket: WebSocket,
	org_id: uuid.UUID,
	token: str = Query(...),
	db: Session = Depends(get_db),
):
	# Validate JWT token and UUID before accepting the connection
	close_code = None
	payload = None
	user = None

	try:
		payload = decode_access_token(token)
		user_id = uuid.UUID(payload.get("sub"))
		user = db.query(User).filter(User.id == user_id).first()
		if not user:
			close_code = 4001
		elif user.organization_id != org_id:
			close_code = 4003
	except Exception:
		close_code = 4001

	# Accept the WebSocket handshake — close codes only work after accept()
	await websocket.accept()

	if close_code is not None:
		await websocket.close(code=close_code)
		return

	# Auth passed — register the connection (accept already called above)
	if str(org_id) not in manager.active_connections:
		manager.active_connections[str(org_id)] = []
	manager.active_connections[str(org_id)].append(websocket)
	try:
		while True:
			# Server-push only; block here until the client disconnects
			await websocket.receive_text()
	except WebSocketDisconnect:
		manager.disconnect(websocket, str(org_id))
