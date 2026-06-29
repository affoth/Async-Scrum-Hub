import type { ReactNode } from "react";
import { IconBox } from "./IconBox";

interface StatCardProps {
	icon: ReactNode;
	label: string;
	value: string | number;
	subtitle: string;
	bgColor?: string;
	className?: string;
}

export function StatCard({
	icon,
	label,
	value,
	subtitle,
	bgColor = "bg-cyan-100",
	className = "",
}: StatCardProps) {
	return (
		<div className={`bg-white rounded-2xl p-6 border border-gray-100 ${className}`}>
			<div className="flex items-center gap-3 mb-4">
				<IconBox icon={icon} bgColor={bgColor} />
				<span className="text-sm text-gray-500">{label}</span>
			</div>
			<p className="text-3xl text-gray-900">{value}</p>
			<p className="text-xs text-gray-400 mt-1">{subtitle}</p>
		</div>
	);
}
