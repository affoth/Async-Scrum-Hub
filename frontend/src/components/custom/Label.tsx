import type { LabelHTMLAttributes } from "react";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
	children: React.ReactNode;
}

export function Label({ children, className = "", ...props }: LabelProps) {
	return (
		<label className={`block text-sm text-gray-700 mb-2 ${className}`} {...props}>
			{children}
		</label>
	);
}
