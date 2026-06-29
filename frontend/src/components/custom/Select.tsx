import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
	label?: string;
	error?: string;
	helperText?: string;
	options: Array<{ value: string | null; label: string }>;
}

export function Select({
	label,
	error,
	helperText,
	options,
	className = "",
	...props
}: SelectProps) {
	const hasError = !!error;

	return (
		<div className="w-full">
			{label && (
				<label htmlFor={props.id} className="block text-sm text-gray-700 mb-2">
					{label}
				</label>
			)}
			<select
				className={`w-full px-4 py-3 border ${
					hasError ? "border-red-500" : "border-gray-200"
				} rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors ${className}`}
				{...props}
			>
				{options.map((option) => (
					<option key={option.value ?? ""} value={option.value ?? ""}>
						{option.label}
					</option>
				))}
			</select>
			{error && <p className="text-red-500 text-sm mt-1">{error}</p>}
			{!error && helperText && <p className="text-xs text-gray-400 mt-1.5">{helperText}</p>}
		</div>
	);
}
