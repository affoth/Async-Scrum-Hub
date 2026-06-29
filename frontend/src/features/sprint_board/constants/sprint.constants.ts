export const PRIORITY_COLORS = {
	high: "bg-rose-100/50 text-rose-700 border border-rose-200",
	medium: "bg-amber-100/50 text-amber-700 border border-amber-200",
	low: "bg-gray-100 text-gray-600 border border-gray-200",
} as const;

export const BOARD_COLUMNS = [
	{ id: "todo", title: "To Do", borderColor: "border-l-gray-300" },
	{ id: "in_progress", title: "In Progress", borderColor: "border-l-cyan-400" },
	{ id: "completed", title: "Completed", borderColor: "border-l-emerald-400" },
] as const;

export const PRIORITY_OPTIONS = [
	"high", "medium", "low"
] as const;
