import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	const isDemo = env.VITE_DEMO_MODE === "true";

	// For the GitHub Pages demo, assets must be served from the repo sub-path.
	// Priority: explicit BASE_PATH (used by local sub-path preview, which runs in
	// production mode) → GITHUB_REPOSITORY in CI ("owner/repo" → "/repo/") → "/".
	// The normal (non-demo) build is unaffected and uses base "/".
	const repoFromCI = process.env.GITHUB_REPOSITORY?.split("/")[1];
	const base = process.env.BASE_PATH
		? process.env.BASE_PATH
		: isDemo && repoFromCI
			? `/${repoFromCI}/`
			: "/";

	return {
		base,
		plugins: [react()],
		server: {
			host: "0.0.0.0",
			port: 5173,
		},
	};
});
