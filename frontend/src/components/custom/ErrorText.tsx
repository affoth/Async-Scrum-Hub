interface ErrorTextProps {
	children: React.ReactNode;
	className?: string;
}

export function ErrorText({ children, className = "" }: ErrorTextProps) {
	return <p className={`text-red-500 text-sm text-center mb-4 ${className}`}>{children}</p>;
}
