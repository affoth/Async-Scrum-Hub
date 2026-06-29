import {
	LayoutDashboard,
	KanbanSquare,
	MessageSquare,
	AlertCircle,
	BarChart3,
	Users,
} from "lucide-react";
import {
	ErrorText,
	Modal,
} from "../../custom"
import { Link, useLocation } from "react-router-dom";
import { useSideBar } from "./useSideBar";
import ReactMarkdown from "react-markdown"

const navItems = [
	{ path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
	{ path: "/board", icon: KanbanSquare, label: "Sprint Board" },
	{ path: "/standup", icon: MessageSquare, label: "Async Standup" },
	{ path: "/blockers", icon: AlertCircle, label: "Blockers" },
	{ path: "/analytics", icon: BarChart3, label: "Analytics" },
	{ path: "/info", icon: Users, label: "Info" },
];

export function Sidebar() {
	const location = useLocation();
	const {
		// state
		document,
		activeDocument,
		isLoading,
		errors,

		// handlers
		openDocument,
		closeDocument,

	} = useSideBar();

	return (
		<>
			<aside className="w-64 border-r border-gray-100 bg-white h-screen flex flex-col">
				<div className="p-6 border-b border-gray-100">
					<h1 className="text-xl tracking-tight text-gray-900">ScrumHub</h1>
					<p className="text-sm text-gray-500 mt-1">Async collaboration</p>
				</div>

				<nav className="flex-1 p-4 space-y-1">
					{navItems.map((item) => {
						const isActive = location.pathname === item.path;
						const Icon = item.icon;

						return (
							<Link
								key={item.path}
								to={item.path}
								className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all active:scale-95 ${
									isActive
										? "bg-cyan-50 text-cyan-700"
										: "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
								}`}
							>
								<Icon className="w-5 h-5" />
								<span>{item.label}</span>
							</Link>
						);
					})}
				</nav>

				<div className="p-4 border-t border-gray-100">
					<div className="px-4 flex flex-col gap-2">
						<button
							onClick={() => openDocument("privacy")}
							className="text-xs text-gray-500 hover:text-gray-700 text-left transition-colors"
						>
							Privacy Policy
						</button>
						<button
							onClick={() => openDocument("terms")}
							className="text-xs text-gray-500 hover:text-gray-700 text-left transition-colors"
						>
							Terms of Service
						</button>
					</div>
				</div>
			</aside>

			{/* Legal Documents Modal */}
			{activeDocument && (
				<Modal
					isOpen={!!activeDocument}
					onClose={closeDocument}
					title={document?.title ?? ""}
					size="lg"
				>
					{isLoading && <p className="text-sm text-grey-500">Loading...</p>}
					{errors.doc && <ErrorText>{errors.doc}</ErrorText>}
					{document && (
						<div className="overflow-y-auto max-h-[60vh] prose prose-sm prose-headings:text-base">
							<ReactMarkdown>{document.content}</ReactMarkdown>
						</div>
					)}
				</Modal>
			)}
		</>
	);
}
