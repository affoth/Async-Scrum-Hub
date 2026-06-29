import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	hasError?: boolean;
}

export function Input({ hasError = false, className = "", ...props }: InputProps) {
	const baseStyles =
		"w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent";
	const errorStyles = hasError ? "border-red-500" : "border-gray-200";

	return <input className={`${baseStyles} ${errorStyles} ${className}`} {...props} />;
}
