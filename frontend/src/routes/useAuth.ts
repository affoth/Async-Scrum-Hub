import { createContext, useContext } from "react";
import type { User } from "../types/api.types";

export type AuthContextValue = {
	user: User | null;
	isLoading: boolean;
	refreshUser: () => Promise<User | null>;
	logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
	const context = useContext(AuthContext);

	if (!context) {
		throw new Error("useAuth must be used inside AuthProvider");
	}

	return context;
}
