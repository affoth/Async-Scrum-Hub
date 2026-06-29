import type { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	subtitle?: string | React.ReactNode;
	children: ReactNode;
	size?: "sm" | "md" | "lg" | "xl";
	className?: string;
}

export function Modal({
	isOpen,
	onClose,
	title,
	subtitle,
	children,
	size = "md",
	className = "",
}: ModalProps) {
	if (!isOpen) return null;

	const sizeClasses = {
		sm: "max-w-sm",
		md: "max-w-lg",
		lg: "max-w-2xl",
		xl: "max-w-4xl",
	};

	return (
		<>
			{/* Backdrop */}
			<div className="fixed inset-0 bg-black/40 z-50" onClick={onClose}></div>

			{/* Modal */}
			<div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
				<div
					className={`bg-white rounded-2xl shadow-xl w-full max-h-screen flex flex-col pointer-events-auto ${sizeClasses[size]} ${className}`}
				>
					{/* Header */}
					<div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
						<div>
							<h2 className="text-2xl text-gray-900">{title}</h2>
							{subtitle && <div className="text-xs text-gray-500 mt-1.5">{subtitle}</div>}
						</div>
						<button
							className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
							onClick={onClose}
						>
							<X className="w-5 h-5 text-gray-400" />
						</button>
					</div>

					{/* Content */}
					<div className="px-6 pt-2 py-5">{children}</div>
				</div>
			</div>
		</>
	);
}
