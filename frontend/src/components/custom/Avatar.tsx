import { useState } from "react";
import { assignColorById, generateAvatarInitials, resolveAvatarUrl } from "../../utils/formatters";

interface AvatarProps {
	avatarUrl?: string | null;
	userId?: string;
	color?: string;
	size?: "sm" | "md" | "lg";
	className?: string;
	initialsClassName?: string;
	name?: string;
}

export function Avatar({
	avatarUrl,
	name,
	userId,
	color,
	size = "md",
	className = "",
	initialsClassName,
}: AvatarProps) {
	const [imageError, setImageError] = useState(false);

	const displayInitials = name ? generateAvatarInitials(name) : "";

	const avatarColor = color || (userId ? assignColorById(userId) : "from-gray-100 to-gray-300");

	const sizeStyles = {
		sm: "w-8 h-8 text-xs",
		md: "w-10 h-10 text-sm",
		lg: "w-12 h-12 text-base",
	};

	const resolvedUrl = resolveAvatarUrl(avatarUrl);
	const showImage = resolvedUrl && !imageError;

	return (
		<div
			className={`rounded-full flex items-center justify-center shrink-0 overflow-hidden ${sizeStyles[size]} ${className} ${!showImage ? `bg-linear-to-br ${avatarColor}` : ""}`}
		>
			{showImage ? (
				<img
					src={resolvedUrl}
					alt={name || "User avatar"}
					className="w-full h-full object-cover"
					onError={() => setImageError(true)}
				/>
			) : (
				<span className={initialsClassName || "text-gray-800 font-medium"}>
					{displayInitials}
				</span>
			)}
		</div>
	);
}
