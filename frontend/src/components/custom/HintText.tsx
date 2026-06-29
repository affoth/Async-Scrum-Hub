interface HintTextProps {
	children: React.ReactNode;
	className?: string;
}

export function HintText({ children, className = "" }: HintTextProps) {
	return <p className={`text-xs text-gray-400 mt-1.5 ${className}`}>{children}</p>;
}
