import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../routes/useAuth";

type Props = {
	children: ReactNode;
};

export function RequireAuth({ children }: Props) {
	const { user, isLoading } = useAuth();
	const location = useLocation();

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-white">
				<div className="flex flex-col items-center gap-3">
					<div className="w-8 h-8 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin" />
					<p className="text-sm text-gray-500">Loading...</p>
				</div>
			</div>
		);
	}

	// Not logged in → go to login
	if (!user) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	// Logged in but no organization → force team setup
	if (!user.organization_id && location.pathname !== "/team-setup") {
		return <Navigate to="/team-setup" replace />;
	}

	// Logged in + has org → block team-setup page
	if (user.organization_id && location.pathname === "/team-setup") {
		return <Navigate to="/dashboard" replace />;
	}

	return <>{children}</>;
}
