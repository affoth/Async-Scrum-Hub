// Demo bootstrap. Runs once before React renders (from src/main.tsx).
// No-ops unless VITE_DEMO_MODE === "true". In demo mode it auto-logs-in a demo
// user (so RequireAuth passes) and, on a cold landing at the root, jumps straight
// to the dashboard instead of the intro animation / login screen.

export function bootstrapDemo(): void {
	if (import.meta.env.VITE_DEMO_MODE !== "true") return;

	if (!localStorage.getItem("token")) {
		localStorage.setItem("token", "demo-token");
	}

	// HashRouter keeps the route in location.hash. Only redirect on a bare entry
	// ("", "#", "#/") so deep links like #/board are preserved on refresh.
	const hash = window.location.hash;
	if (hash === "" || hash === "#" || hash === "#/") {
		window.location.hash = "#/dashboard";
	}
}
