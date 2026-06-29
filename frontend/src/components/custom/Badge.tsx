interface BadgeProps {
	children: React.ReactNode;
	variant?: "default" | "primary" | "success" | "warning" | "danger";
	size?: "sm" | "md";
	className?: string;
}

export function Badge({ children, variant = "default", size = "sm", className = "" }: BadgeProps) {
	const variantStyles = {
		default: "bg-gray-100 text-gray-600",
		primary: "bg-cyan-100 text-cyan-700",
		success: "bg-emerald-100 text-emerald-700",
		warning: "bg-amber-100 text-amber-700",
		danger: "bg-rose-100 text-rose-700",
	};

	const sizeStyles = {
		sm: "text-xs px-2 py-1",
		md: "text-sm px-3 py-1.5",
	};

	return (
		<span
			className={`inline-flex items-center rounded-lg font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
		>
			{children}
		</span>
	);
}
