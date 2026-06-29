import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { login } from "../../services/api";
import { motion } from "framer-motion";
import { useAuth } from "../../routes/useAuth";
import {
	Button,
	Input,
	Label,
	ErrorText,
	HintText,
	PageContainer
} from "../../components/custom/index";
import type { APIError } from "../../utils/shared.types";


export function Login() {
	const navigate = useNavigate();
	const { refreshUser } = useAuth();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
	const [isLoading, setIsLoading] = useState(false);
	const [isExiting, setIsExiting] = useState(false);
	const [redirectTo, setRedirectTo] = useState<string | null>(null);


	const validateForm = (): boolean => {
		const newErrors: { email?: string; password?: string } = {};

		if (!email) {
			newErrors.email = "Email is required";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			newErrors.email = "Email is invalid";
		}

		if (!password) {
			newErrors.password = "Password is required";
		} else if (password.length < 8) {
			newErrors.password = "Password must be at least 8 characters";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validateForm()) return;
		setIsLoading(true);
		setErrors({});

		try {
			const response = await login({ email, password });
			console.log("Login successful!", response);

			const currentUser = await refreshUser();
			if (!currentUser) {
				setErrors({ email: "Unable to load user data after login." });
				return;
			}
			setRedirectTo(currentUser.organization_id ? "/dashboard" : "/team-setup");
			setIsExiting(true);

		} catch (error: unknown) {
			const apiError = error as APIError;
			const errorCode = apiError?.detail?.error?.code ?? apiError?.error?.code;

			console.error("Login failed:", error);
			if (Array.isArray(apiError?.detail) && apiError.detail.length > 0) {
				setErrors({ email: apiError.detail[0]?.msg ?? "Validation error" });
			} else if (errorCode === "INVALID_CREDENTIALS") {
				setErrors({ email: "Email or password is incorrect" });
			} else if (errorCode === "TEAM_SETUP_NOT_DONE") {
				setErrors({ email: "Team setup is not done" });
			} else if (error instanceof TypeError && error.message === "Failed to fetch") {
				setErrors({ email: "Unable to connect to the server. Check that the backend is running." });
			} else if (apiError?.error?.message) {
				setErrors({ email: apiError.error.message });
			} else {
				setErrors({ email: "An unexpected error occurred." });
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<PageContainer>
			<motion.div
				className="w-full max-w-md"
				initial={{ opacity: 0 }}
				animate={{ opacity: isExiting ? 0 : 1 }}
				transition={{ duration: 0.4, ease: "easeOut" }}
				onAnimationComplete={() => {
					if (isExiting && redirectTo) {
						navigate(redirectTo);
					}
				}}
			>
				<div className="text-center mb-8">
					<h1 className="text-3xl text-gray-900 mb-2">ScrumHub</h1>
					<p className="text-sm text-gray-500">Log in to your account</p>
				</div>

				<form onSubmit={handleLogin} className="space-y-5">
					<div>
						<Label htmlFor="email">Email</Label>
						<Input
							type="text"
							id="email"
							placeholder="you@company.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							hasError={!!errors.email}
						/>
						{errors.email && <ErrorText>{errors.email}</ErrorText>}
					</div>

					<div>
						<Label htmlFor="password">Password</Label>
						<Input
							type="password"
							id="password"
							placeholder="Enter your password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							hasError={!!errors.password}
						/>
						{!errors.password && <HintText>At least 8 characters</HintText>}
						{errors.password && <ErrorText>{errors.password}</ErrorText>}
					</div>

					<Button
						type="submit"
						variant="primary"
						isLoading={isLoading}
						className="w-full"
					>
						Log in
					</Button>

					<div className="text-center space-y-2">
						<Button
							type="button"
							variant="text"
							onClick={() => navigate("/welcome")}
							className="w-full text-gray-500 hover:text-gray-700"
						>
							Forgot password?
						</Button>
						<p className="text-sm text-gray-500">
							Don't have an account?{" "}
							<Button
								type="button"
								variant="text"
								onClick={() => navigate("/signup")}
							>
								Sign up
							</Button>
						</p>
					</div>
				</form>
			</motion.div>
		</PageContainer>
	);
}
