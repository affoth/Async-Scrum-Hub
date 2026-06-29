import { useCallback, useEffect, useState } from "react";
import { getCurrentUser } from "../services/api";
import { AuthContext } from "../routes/useAuth"
import type { User } from "../types/api.types";
import type { ReactNode } from "react";

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const refreshUser = useCallback(async (): Promise<User | null> => {
		const token = localStorage.getItem("token");

		if (!token) {
			setUser(null);
			setIsLoading(false);
			return null;
		}

		try {
			const currentUser = await getCurrentUser();
			setUser(currentUser);
			return currentUser;
		} catch {
			localStorage.removeItem("token");
			setUser(null);
			return null;
		} finally {
			setIsLoading(false);
		}
	}, []);

	const logout = () => {
		localStorage.removeItem("token");
		setUser(null);
	};

	useEffect(() => {
		void refreshUser();
	}, [refreshUser]);

	return (
		<AuthContext.Provider value={{ user, isLoading, refreshUser, logout }}>
			{children}
		</AuthContext.Provider>
	);
}

