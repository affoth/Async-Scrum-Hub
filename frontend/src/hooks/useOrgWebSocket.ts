import { useEffect, useRef } from "react";
import { useAuth } from "../routes/useAuth";

type WSMessage = { event: string; data: unknown };

export function useOrgWebSocket(
	orgId: string | null,
	onMessage: (msg: WSMessage) => void
) {
	const onMessageRef = useRef(onMessage);
	const { refreshUser } = useAuth();
	const refreshUserRef = useRef(refreshUser);

	useEffect(() => {
		onMessageRef.current = onMessage;
		refreshUserRef.current = refreshUser;
	});

	useEffect(() => {
		if (import.meta.env.VITE_DEMO_MODE === "true") return; // no backend to connect to in demo mode
		if (!orgId) return;

		const token = localStorage.getItem("token");
		if (!token) return;

		let cancelled = false;

		const wsBase = (import.meta.env.VITE_API_URL as string)
			.replace(/^https/, "wss")
			.replace(/^http/, "ws")
			.replace(/\/api\/v1$/, "");
		const ws = new WebSocket(`${wsBase}/ws/${orgId}?token=${token}`);

		ws.onmessage = (event) => {
			try {
				const msg: WSMessage = JSON.parse(event.data);
				onMessageRef.current(msg);
			} catch {
				console.error("WS parse error", event.data);
			}
		};

		ws.onerror = () => {
			if (!cancelled) console.error("WS: connection error");
		};

		ws.onclose = (event) => {
			if (cancelled) return;
			if (event.code === 4001) console.error("WS: invalid token");
			if (event.code === 4003) {
				console.error("WS: not an org member");
				void refreshUserRef.current();
			}
		};

		return () => {
			cancelled = true;
			ws.close();
		};
	}, [orgId]); // only reconnect if orgId changes
}
