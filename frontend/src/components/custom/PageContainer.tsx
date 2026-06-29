import type { ReactNode } from "react";

interface PageContainerProps {
	children: ReactNode;
	className?: string;
}

export function PageContainer({ children, className = "" }: PageContainerProps) {
	return (
		<div className={`min-h-screen bg-white flex items-center justify-center p-8 ${className}`}>
			{children}
		</div>
	);
}
