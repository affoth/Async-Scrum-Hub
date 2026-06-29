import type { ReactNode } from "react";
import { CheckCircle2, ShieldAlert } from "lucide-react";

interface ModalConfirmationProps {
	isOpen: boolean;
	onClose: () => void;
	icon?: ReactNode;
	iconBgColor?: string;
	title: string;
	description?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	confirmVariant?: "danger" | "success";
	onConfirm: () => void;
	isConfirming?: boolean;
	confirmingLabel?: string;
}

export function ModalConfirmation({
	isOpen,
	onClose,
	icon,
	iconBgColor,
	title,
	description,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	confirmVariant = "danger",
	onConfirm,
	isConfirming = false,
	confirmingLabel = "Loading...",
}: ModalConfirmationProps) {
	if (!isOpen) return null;

	const confirmStyles = {
		danger: "bg-rose-600 hover:bg-rose-700 text-white",
		success: "bg-emerald-600 hover:bg-emerald-700 text-white",
	};

	const defaultIcons = {
		danger: <ShieldAlert className="w-6 h-6 text-rose-600" />,
		success: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
	};

	const defaultIconBgColors = {
		danger: "bg-rose-100",
		success: "bg-emerald-100",
	};

	const resolvedIcon = icon ?? defaultIcons[confirmVariant];
	const resolvedIconBg = iconBgColor ?? defaultIconBgColors[confirmVariant];

	return (
		<>
			{/* Backdrop */}
			<div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />

			{/* Modal */}
			<div className="fixed inset-0 flex items-center justify-center z-50 p-4">
				<div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
					{/* Body */}
					<div className="px-6 py-5">
						<div
							className={`w-12 h-12 rounded-full ${resolvedIconBg} flex items-center justify-center mx-auto mb-4`}
						>
							{resolvedIcon}
						</div>
						<h3 className="text-lg text-gray-900 text-center mb-2">{title}</h3>
						{description && (
							<p className="text-sm text-gray-500 text-center">{description}</p>
						)}
					</div>

					{/* Actions */}
					<div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100">
						<button
							onClick={onClose}
							className="flex-1 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
						>
							{cancelLabel}
						</button>
						<button
							onClick={onConfirm}
							disabled={isConfirming}
							className={`flex-1 px-4 py-2 text-sm rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${confirmStyles[confirmVariant]}`}
						>
							{isConfirming ? confirmingLabel : confirmLabel}
						</button>
					</div>
				</div>
			</div>
		</>
	);
}
