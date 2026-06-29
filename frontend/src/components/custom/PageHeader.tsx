import type { ReactNode } from "react";

interface PageHeaderProps {
	title: string;
	subtitle?: string;
	action?: ReactNode; // Optional action button/element on the right
	className?: string;
}

export function PageHeader({ title, subtitle, action, className = "" }: PageHeaderProps) {
	return (
		<div className={`mb-6 ${action ? "flex items-start justify-between" : ""} ${className}`}>
			<div>
				<h2 className="text-3xl text-gray-900 mb-1">{title}</h2>
				{subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
			</div>
			{action && <div>{action}</div>}
		</div>
	);
}
