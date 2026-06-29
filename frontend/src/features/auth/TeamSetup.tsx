import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Check, Users, Target, Code } from "lucide-react";
import { useAuth } from "../../routes/useAuth";
import { Button, Input, Label, ErrorText } from "../../components/custom/index";
import {
	createOrganization,
	setUserRole,
	joinOrganization,
} from "../../services/api";
import type { APIError } from "../../utils/shared.types";
type TeamMode = "join" | "create";
type Role = "scrum_master" | "product_owner" | "developer" | null;

export function TeamSetup() {
	const navigate = useNavigate();
	const { refreshUser } = useAuth();
	const [teamMode, setTeamMode] = useState<TeamMode>("join");
	const [teamCode, setTeamCode] = useState("");
	const [teamName, setTeamName] = useState("");
	const [teamConfirmed, setTeamConfirmed] = useState(false);
	const [joinCode, setJoinCode] = useState<string | null>(null);
	const [orgId, setOrgId] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedRole, setSelectedRole] = useState<Role>(null);
	const [showLoginPrompt, setShowLoginPrompt] = useState(false);
	const [errors, setErrors] = useState<{
		join?: string;
		create?: string;
		continue?: string;
	}>({});
	const [availableRoles, setAvailableRoles] = useState<{
		role: "scrum_master" | "product_owner" | "developer";
	}[]>([]);

	//Handlers
	const handleCheckCode = async (e: React.FormEvent) => {
		e.preventDefault();
		setErrors({});

		if (!teamCode.trim()) {
			setErrors({ join: "Team code is required" });
			return;
		}

		setIsLoading(true);

		try {
			const orgSummary = await joinOrganization({ join_code: teamCode });
			setAvailableRoles(orgSummary.available_scrum_role);
			setOrgId(orgSummary.organization_id);
			setTeamConfirmed(true);

		} catch (error: unknown) {
			const apiError = error as APIError;

			console.error("API call failed:", error);
			if (apiError.error?.code === "INVALID_CODE") {
				setErrors({ join: "Invalid code." });
			} else if (apiError.error?.code === "ALREADY_MEMBER") {
				setErrors({ join: "User is already a member of this organization" });
			} else {
				setErrors({ join: "Something went wrong." });
			}
		} finally {
				setIsLoading(false);
		}
	};

	const handleCreateTeam = async (e: React.FormEvent) => {
		e.preventDefault();
		setErrors({});

		if (!teamName.trim()) {
			setErrors({ create: "Team name is required" });
			return;
		} if (teamName.trim().length < 3) {
			setErrors({ create: "Team name must be at least 3 characters" });
			return;
		} if (teamName.trim().length > 50) {
			setErrors({ create: "Team name must have less than 50 characters" });
			return;
		}

		setIsLoading(true);

		try {
			const response = await createOrganization({ name: teamName });
			setOrgId(response.id);
			setJoinCode(response.join_code);
			setTeamConfirmed(true);

		} catch (error: unknown) {
			const apiError = error as APIError;

			if (Array.isArray(apiError?.detail) && apiError.detail.length > 0) {
				setErrors({ create: apiError.detail[0]?.msg ?? "Validation error message" });
			} else if (apiError?.error?.code === "UNAUTHORIZED") {
				setErrors({ create: "Authentication required" });
				refreshUser();
			} else if (apiError?.error?.code === "ORG_EXISTS") {
				setErrors({ create: "An organization with this name already exists." });
			} else if (apiError?.error?.message) {
				setErrors({ create: apiError.error.message });
			} else {
				setErrors({ create: "Something went wrong." });
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleCopyCode = () => {
		if (joinCode) {
			navigator.clipboard.writeText(joinCode);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const handleContinue = async () => {
		if (! orgId || !teamConfirmed || !selectedRole) return;
		setErrors({});
		setIsLoading(true);

		try {
			await setUserRole({
				org_id: orgId,
				scrum_role: selectedRole as "scrum_master" | "product_owner" | "developer",
			});
			await refreshUser();
			navigate("/dashboard");

		} catch (error: unknown) {
			const apiError = error as APIError;

			if (apiError?.error?.code === "UNAUTHORIZED") {
				setErrors({ continue: "Authentication required" });
				setTeamConfirmed(false);
				refreshUser();
			} else if (apiError?.error?.code === "NOT_FOUND") {
				setErrors({ continue: "Organization not found" });
				setShowLoginPrompt(true);
				setTeamConfirmed(false);
			} else {
				setErrors({ continue: "Something went wrong" });
			}
		} finally {
			setIsLoading(false);
		}
	};

	const roles = [
		{
			id: "scrum_master",
			title: "Scrum Master",
			icon: Target,
			description: "Facilitate tickets and remove blockers",
		},
		{
			id: "product_owner",
			title: "Product Owner",
			icon: Users,
			description: "Prioritize backlog and define vision",
		},
		{
			id: "developer",
			title: "Developer",
			icon: Code,
			description: "Build features and ship code",
		},
	];


	const isRoleDisabled = (roleId: string) => {
		if (teamMode === "create") {
			return roleId  === "developer";
		}
		return !availableRoles.some((r) => r.role === roleId);
	}

	return (
		<div className="min-h-screen bg-white flex items-center justify-center p-8">
			<div className="max-w-2xl w-full">
				<div className="text-center mb-10">
					<h1 className="text-3xl text-gray-900 mb-2">Team Setup</h1>
					<p className="text-sm text-gray-500">
						Join your team and choose how you'll contribute.
					</p>
				</div>

				<div className="space-y-10">
					{/* Step 1 — Team */}
					<div>
						<div className="flex items-center gap-2 mb-5">
							<span className="text-xs uppercase tracking-wide text-gray-400">Step 1</span>
							<span className="text-xs text-gray-300">·</span>
							<span className="text-sm text-gray-700">Team</span>
						</div>

						{!teamConfirmed ? (
							<div className="space-y-5">
								<div className="flex gap-3">
									<Button
										variant="outlined"
										isActive={teamMode === "join"}
										onClick={() => {
											setTeamMode("join");
											setErrors({});
											setShowLoginPrompt(false);
										}}
										className={`flex-1 px-4 ${teamMode === "join" ? "border-cyan-500!" : ""}`}
									>
										I have a team code
									</Button>
									<Button
										variant="outlined"
										isActive={teamMode === "create"}
										onClick={() => {
											setTeamMode("create");
											setErrors({});
										}}
										className={`flex-1 px-4 ${teamMode === "create" ? "border-cyan-500!" : ""}`}
									>
										Create a new team
									</Button>
								</div>

								{teamMode === "join" && (
									<div className="space-y-3">
										<div>
											<Label htmlFor="teamCode">Team code</Label>
											<Input
												type="text"
												id="teamCode"
												value={teamCode}
												onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
												hasError={!!errors.join}
												className="text-center tracking-wider"
												placeholder="Enter your code"
											/>
										</div>
										<Button
											onClick={handleCheckCode}
											disabled={!teamCode.trim() || isLoading}
											variant="primary"
											className="w-full"
										>
											Check code
										</Button>

										{errors.join && <ErrorText>{errors.join}</ErrorText>}
										{showLoginPrompt && (
											<Button
												onClick={() => navigate("/login")}
												variant="outlined"
												className="w-full mt-2"
											>
												Go to Login
											</Button>
										)}
									</div>
								)}

								{teamMode === "create" && (
									<div className="space-y-3">
										<div>
											<Label htmlFor="teamName">Team name</Label>
											<Input
												type="text"
												id="teamName"
												value={teamName}
												onChange={(e) => setTeamName(e.target.value)}
												hasError={!!errors.create}
												placeholder="e.g. Product Development"
											/>
										</div>
										<Button
											variant="primary"
											onClick={handleCreateTeam}
											disabled={!teamName.trim() || isLoading}
											className="w-full"
										>
											{isLoading ? "Creating..." : "Create team"}
										</Button>
										{errors.create && <ErrorText>{errors.create}</ErrorText>}
									</div>
								)}
							</div>
						) : (
							<div className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-200">
								<div className="flex items-center justify-between mb-2 w-full">
									<div>
										<p className="text-base text-gray-500 text-center">
											Pick your role to join the team
										</p>
									</div>
									<Check className="w-5 h-5 text-emerald-600" />
								</div>

								{joinCode && (
									<div className="mt-4 pt-4 border-t border-emerald-200">
										<div className="flex items-center gap-3">
											<div className="flex-1 px-3 py-2 bg-white rounded-lg border border-emerald-200">
												<span className="text-sm text-gray-900 tracking-wider">
													{joinCode}
												</span>
											</div>
											<Button
												onClick={handleCopyCode}
												variant="secondary"
												size="sm"
												className="p-2 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
											>
												{copied ? (
													<Check className="w-4 h-4 text-emerald-600" />
												) : (
													<Copy className="w-4 h-4 text-emerald-600" />
												)}
											</Button>
										</div>
										<p className="text-xs text-emerald-700 mt-2">
											Share this code with your team members
										</p>
									</div>
								)}
							</div>
						)}
					</div>

					{/* Step 2 — Role */}
					<div>
						<div className="flex items-center gap-2 mb-5">
							<span className="text-xs uppercase tracking-wide text-gray-400">Step 2</span>
							<span className="text-xs text-gray-300">·</span>
							<span className={`text-sm ${teamConfirmed ? "text-gray-700" : "text-gray-400"}`}>
								Role
							</span>
						</div>

						{!teamConfirmed ? (
							<div className="bg-gray-50 rounded-xl p-8 border-2 border-dashed border-gray-200">
								<p className="text-sm text-gray-400 text-center">
									Choose a team first to see available roles
								</p>
							</div>
						) : (
							<div className="grid grid-cols-3 gap-4">
								{roles.map((role) => {
									const isDisabled = isRoleDisabled(role.id);
									const isSelected = selectedRole === role.id;
									const Icon = role.icon;

									return (
										<button
											key={role.id}
											type="button"
											onClick={() => !isDisabled && setSelectedRole(role.id as Role)}
											disabled={isDisabled}
											className={`p-5 rounded-xl border-2 text-left transition-all ${
												isDisabled
													? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
													: isSelected
														? "border-cyan-500 bg-cyan-50"
														: "border-gray-200 hover:border-cyan-300 hover:bg-gray-50"
											}`}
										>
											<div
												className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
													isDisabled ? "bg-gray-200" : isSelected ? "bg-cyan-100" : "bg-gray-100"
												}`}
											>
												<Icon
													className={`w-5 h-5 ${
														isDisabled
															? "text-gray-400"
															: isSelected
																? "text-cyan-600"
																: "text-gray-600"
													}`}
												/>
											</div>
											<h3
												className={`text-sm mb-1 ${
													isDisabled
														? "text-gray-400"
														: isSelected
															? "text-cyan-900"
															: "text-gray-900"
												}`}
											>
												{role.title}
											</h3>
											<p className="text-xs text-gray-500">{role.description}</p>
										</button>
									);
								})}
							</div>
						)}
					</div>
				</div>

				{/* Continue to Dashboard */}
				<div className="mt-10">
					<Button
						onClick={handleContinue}
						variant="primary"
						disabled={!teamConfirmed || !selectedRole || isLoading}
						className="w-full"
					>
						{isLoading ? "Loading..." : "Continue to dashboard"}
					</Button>
					{errors.continue && <ErrorText>{errors.continue}</ErrorText>}
				</div>
			</div>
		</div>
	);
}
