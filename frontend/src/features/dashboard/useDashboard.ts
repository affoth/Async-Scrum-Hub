import { useState, useEffect } from "react";
import { getDashboardData } from "../../services/api";
import type { DashboardData } from "../../types/api.types";
import { useAuth } from "../../routes/useAuth";
import type { APIError } from "../../utils/shared.types";

export function useDashboard() {
	const { user: authUser, refreshUser } = useAuth();
	const orgId = authUser?.organization_id ?? null;
	const [data, setData] = useState<DashboardData | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<{dashboard?: string}>({});

	useEffect(() => {
		if (!orgId) return;

		const fetchData = async () => {
			setIsLoading(true);

			try {
				const result = await getDashboardData(orgId);
				setData(result);

			} catch (error: unknown) {
				const apiError = error as APIError;
				
				console.error("API call failed:", error);
				if (apiError.error?.code === "UNAUTHORIZED") {
					setErrors({ dashboard: "Authentication required" });
					refreshUser();
				} else if (apiError.error?.code === "NO_ORGANIZATION") {
					setErrors({ dashboard: "User is not part of any organization." });
				} else if (apiError.error?.code === "NOT_FOUND") {
					setErrors({ dashboard: "Organization not found" });
				} else {
					setErrors({ dashboard: "Something went wrong" });
				}
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, [orgId, refreshUser]);

	return {
		authUser,
		data,
		isLoading,
		errors };
}
