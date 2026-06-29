import type { ReactNode } from "react";

interface IconBoxProps {
	icon: ReactNode;
	bgColor?: string;
	className?: string;
}

export function IconBox({ icon, bgColor = "bg-cyan-100", className = "" }: IconBoxProps) {
	return <div className={`p-2 ${bgColor} rounded-xl ${className}`}>{icon}</div>;
}
