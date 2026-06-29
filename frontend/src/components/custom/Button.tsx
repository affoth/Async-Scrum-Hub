import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary" | "text" | "outlined" | "ghost";
	size?: "sm" | "md" | "lg";
	isLoading?: boolean;
	isActive?: boolean;
	icon?: ReactNode;
	iconPosition?: "left" | "right";
	children: ReactNode;
}

export function Button({
	variant = "primary",
	size = "md",
	isLoading = false,
	isActive = false,
	icon,
	iconPosition = "left",
	children,
	className = "",
	disabled,
	...props
}: ButtonProps) {
	const baseStyles =
		"font-medium rounded-xl transition-all focus:outline-none inline-flex items-center justify-center gap-2";

	const variantStyles = {
		primary: "text-white bg-cyan-600 hover:bg-cyan-700",
		secondary: "text-gray-600 bg-white border border-gray-200 hover:bg-gray-50",
		text: "text-cyan-600 hover:text-cyan-700",
		outlined: "text-gray-600 bg-white border-2 border-gray-200 hover:border-gray-300",
		ghost: "text-cyan-700 bg-white border border-cyan-200 hover:bg-cyan-50",
	};

	const sizeStyles = {
		sm: "px-4 py-2 text-xs",
		md: "px-6 py-3 text-sm",
		lg: "px-6 py-3 text-sm",
	};

	const disabledStyles =
		isLoading || disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "";

	const activeStyles = isActive ? "!border-cyan-300 !bg-cyan-50 !text-cyan-700" : "";

	return (
		<button
			className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${activeStyles} ${className}`}
			disabled={isLoading || disabled}
			{...props}
		>
			{isLoading ? (
				"Loading..."
			) : (
				<>
					{icon && iconPosition === "left" && icon}
					{children}
					{icon && iconPosition === "right" && icon}
				</>
			)}
		</button>
	);
}
