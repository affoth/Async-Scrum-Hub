const BACKEND_URL = (import.meta.env.VITE_API_URL as string ?? "").replace("/api/v1", "");

export function resolveAvatarUrl(url: string | null | undefined): string | null {
	if (!url) return null;
		return url.startsWith("http") ? url : `${BACKEND_URL}${url}`;
}

// Time formatters
export function formatRelativeTime(utcString: string): string {
	const diff = Date.now() - new Date(utcString).getTime();
	const minutes = Math.floor(diff / 60_000);
	if (minutes < 1) return "just now";
	if (minutes < 60) return `${minutes} min ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
	const weeks = Math.floor(days / 7);
	return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
}

// Scrum role helpers
export function getTakenRoles(members: Array<{ scrum_role: string }>): string[] {
	return members
		.map((m) => m.scrum_role)
		.filter((role) => role === "scrum_master" || role === "product_owner");
}

// Role formatters
export function formatScrumRole(
	role: "scrum_master" | "product_owner" | "developer"
): "Scrum Master" | "Product Owner" | "Developer" {
	switch (role) {
		case "scrum_master":
			return "Scrum Master";
		case "product_owner":
			return "Product Owner";
		case "developer":
			return "Developer";
	}
}

// UI generators
export function generateAvatarInitials(name: string): string {
	const parts = name.split(" ");
	return parts
		.map((part) => part[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}

const colorPalette = [
	"from-emerald-200 to-green-300",
	"from-cyan-200 to-blue-300",
	"from-pink-200 to-rose-300",
	"from-amber-200 to-yellow-300",
	"from-purple-200 to-violet-300",
	"from-rose-200 to-pink-300",
];

export function assignColor(index: number): string {
	return colorPalette[index % colorPalette.length];
}

export function assignColorById(userId: string): string {
	// Create a better hash from the user ID that distributes more evenly
	let hash = 0;
	for (let i = 0; i < userId.length; i++) {
		const char = userId.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}

	// Make it positive and get index
	const index = Math.abs(hash) % colorPalette.length;
	return colorPalette[index];
}
