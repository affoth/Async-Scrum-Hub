import { AlertCircle, Clock, CheckCircle2, Plus, Edit2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../routes/useAuth";
import { useOrgWebSocket } from "../../hooks/useOrgWebSocket";
import {
	Button,
	Label,
	Modal,
	PageHeader,
	Avatar,
	ModalConfirmation,
	ErrorText
} from "../../components/custom/index";
import {
	createBlocker,
	listBlockers,
	updateBlocker,
	resolveBlocker,
	listTicketsBoard,
	getOrganizationMembers,
} from "../../services/api";
import type {
	ListTicketsBoardResponse,
	OrganizationMember,
	BlockerListItem
} from "../../types/api.types";
import type { APIError } from "../..//utils/shared.types";


export function Blockers() {
	// Modal states
	const [isCreateBlockerOpen, setIsCreateBlockerOpen] = useState(false);
	const [isEditBlockerOpen, setIsEditBlockerOpen] = useState(false);
	const [selectedBlocker, setSelectedBlocker] = useState<BlockerListItem | null>(null);
	const [confirmResolved, setConfirmResolved] = useState<string | null>(null);
	// Form states
	const [blockerForm, setBlockerForm] = useState({
		description: "",
		ticket_id: "",
		assignee_id: "",
	});
	// Auth states
	const { user: authUser, refreshUser } = useAuth();
	const [errors, setErrors] = useState<{
		fetchBlocker?: string;
		createBlocker?: string;
		editBlocker?: string;
		resolveBlocker?: string;
	}>({});
	// Data states
	const [blockers, setBlockers] = useState<BlockerListItem[]>([]);
	const [ticketList, setTicketList] = useState<ListTicketsBoardResponse[]>([]);
	const [teamMembers, setTeamMembers] = useState<OrganizationMember[]>([]);
	//Routing states
	const location = useLocation();
	const highlightBlockerId = (location.state as { blockerId?: string })?.blockerId;
	//Loading states
	const [isLoading, setIsLoading] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isResolving, setIsResolving] = useState(false);
	//Derived states
	const orgId = authUser?.organization_id ?? null;
	const availableAssignees = teamMembers.filter((member) => {
		const isNotCurrentUser = member.id !== authUser?.id;
		const isDeveloper = member.scrum_role === "developer";
		return (isNotCurrentUser && isDeveloper);
	})

	// Permission helpers
	const canEditBlocker = (blocker: BlockerListItem) =>
		blocker.created_by.id === authUser?.id ||
		authUser?.scrum_role === "scrum_master" ||
		authUser?.scrum_role === "product_owner";

	const canResolveBlocker = (blocker: BlockerListItem) =>
		blocker.created_by.id === authUser?.id ||
		blocker.assignee?.id === authUser?.id ||
		authUser?.scrum_role === "scrum_master" ||
		authUser?.scrum_role === "product_owner";


	const fetchBlockers = useCallback(async () => {
		if (!orgId) return ;
		setIsLoading(true);

		try {
			const blockersData = await listBlockers(orgId);
			const ticketsData = await listTicketsBoard(orgId);
			const membersData = await getOrganizationMembers(orgId);
			setBlockers(blockersData);
			setTicketList(ticketsData);
			setTeamMembers(membersData);

		} catch (error: unknown) {
			const apiError = error as APIError;

			console.error("API call failed:", error);
			if (apiError.error?.code === "UNAUTHORIZED") {
				setErrors({ fetchBlocker: "Authentication required" });
				refreshUser();
			} else if (apiError.error?.code === "FORBIDDEN") {
				setErrors({ fetchBlocker: "You do not have permission to perform this action" });
			} else if (apiError.error?.code === "NOT_FOUND") {
				setErrors({ fetchBlocker: "Organization not found" });
			} else {
				setErrors({ fetchBlocker: "Something went wrong" });
			}
		} finally {
			setIsLoading(false);
		}
	}, [orgId, refreshUser]);

	useEffect(() => {
		fetchBlockers();
	}, [fetchBlockers]);


	//Handlers
	const handleCreateBlocker = async () => {
		if (!orgId) return ;
		setIsCreating(true);

		try {
			await createBlocker(orgId, {
				description: blockerForm.description,
				ticket_id: blockerForm.ticket_id || null,
				assignee_id: blockerForm.assignee_id || null,
			});
			await fetchBlockers();
			setIsCreateBlockerOpen(false);
			setBlockerForm({ description: "", ticket_id: "", assignee_id: "" }); // Reset form values

		} catch (error: unknown) {
			const apiError = error as APIError;

			console.error("API call failed:", error);
			if (Array.isArray(apiError.detail) && apiError.detail.length > 0) {
				setErrors({ createBlocker: apiError.detail[0]?.msg ?? "Validation error message" });
			} else if (apiError.error?.code === "INVALID_ASSIGNEE") {
				setErrors({ createBlocker: "Only users with Developer role can be assigned to blockers" });
			} else if (apiError.error?.code === "UNAUTHORIZED") {
				setErrors({ createBlocker: "Authentication required" });
				refreshUser();
			} else if (apiError.error?.code === "FORBIDDEN") {
				setErrors({ createBlocker: "You do not have permission to perform this action" });
			} else if (apiError.error?.code === "NOT_FOUND") {
				setErrors({ createBlocker: "Organization not found" });
			} else {
				setErrors({ createBlocker: "Something went wrong" });
			}
		} finally {
			setIsCreating(false);
		}
	};

	const handleEditBlocker = async () => {
		setIsSaving(true);
		try {
			await updateBlocker(selectedBlocker!.id, {
				description: blockerForm.description,
				ticket_id: blockerForm.ticket_id,
				assignee_id: blockerForm.assignee_id || null,
			});
			await fetchBlockers();
			setIsEditBlockerOpen(false);
			setSelectedBlocker(null);
			setBlockerForm({ description: "", ticket_id: "", assignee_id: "" });

		} catch (error: unknown) {
			const apiError = error as APIError;

			console.error("API call failed:", error);
			if (Array.isArray(apiError.detail) && apiError.detail.length > 0) {
				setErrors({ editBlocker: apiError.detail[0]?.msg ?? "Validation error message" });
			} else if (apiError.error?.code === "INVALID_ASSIGNEE") {
				setErrors({ editBlocker: "Only users with Developer role can be assigned to blockers" });
			} else if (apiError.error?.code === "UNAUTHORIZED") {
				setErrors({ editBlocker: "Authentication required" });
				refreshUser();
			} else if (apiError.error?.code === "FORBIDDEN") {
				setErrors({ editBlocker: "You do not have permission to perform this action" });
			} else if (apiError.error?.code === "NOT_FOUND") {
				setErrors({ editBlocker: "Blocker not found" });
			} else {
				setErrors({ editBlocker: "Something went wrong" });
			}
		} finally {
			setIsSaving(false);
		}
	};

	const handleResolveBlocker = async () => {
		if (!confirmResolved) return;
		setIsResolving(true);

		try {
			await resolveBlocker(confirmResolved);
			await fetchBlockers();
			setConfirmResolved(null);
			setSelectedBlocker(null);

		} catch (error: unknown) {
			const apiError = error as APIError;

			console.error("API call failed:", error);
			if (apiError.error?.code === "UNAUTHORIZED") {
				setErrors({ resolveBlocker: "Authentication required" });
				refreshUser();
			} else if (apiError.error?.code === "FORBIDDEN") {
				setErrors({ resolveBlocker: "You do not have permission to perform this action" });
			} else if (apiError.error?.code === "NOT_FOUND") {
				setErrors({ resolveBlocker: "Blocker not found" });
			} else if (apiError.error?.code === "BLOCKER_ALREADY_RESOLVED") {
				setErrors({ resolveBlocker: "Blocker already resolved" });
			} else {
				setErrors({ resolveBlocker: "Something went wrong" });
			}
		} finally {
			setIsResolving(false);
		}
	};

	const openCreateModal = () => {
		setBlockerForm({ description: "", ticket_id: "", assignee_id: "" });
		setIsCreateBlockerOpen(true);
	};

	const openEditModal = (blocker: BlockerListItem) => {
		setSelectedBlocker(blocker);
		setBlockerForm({
			description: blocker.description,
			ticket_id: blocker.ticket?.id?.toString() ?? "",
			assignee_id: blocker.assignee?.id || "",
		});
		setIsEditBlockerOpen(true);
	};

	const openBlockers = blockers.filter((b) => b.status === "open").sort((a, b) => b.created_at.localeCompare(a.created_at));
	const resolvedBlockers = blockers.filter((b) => b.status === "resolved").sort((a, b) => b.created_at.localeCompare(a.created_at));


	useOrgWebSocket(orgId, (msg) => {
		const reFetchEvents = [
			"blocker.created",
			"blocker.updated",
			"blocker.resolved",
		]
		if (reFetchEvents.includes(msg.event)) {
			fetchBlockers();
		}
	});

	return (
		<div className="p-8">

			<PageHeader
				title="Blockers"
				subtitle="Issues that need attention"
				action={
					<Button
						variant="outlined"
						icon={<Plus className="w-4 h-4" />}
						onClick={openCreateModal}
					>
						Create Blocker
					</Button>
				}
			/>

			<div className="max-w-3xl space-y-6">
				{errors.fetchBlocker && <ErrorText>{errors.fetchBlocker}</ErrorText>}

				{isLoading && (
					<div className="flex items-center justify-center py-16 text-gray-400 text-sm">
						Loading blockers...
					</div>
				)}

				{/* Open Blockers */}
				{!isLoading && (
					<div>
						<h3 className="text-sm text-gray-700 mb-3">Active ({openBlockers.length})</h3>
						{openBlockers.length === 0 ? (
							<div className="bg-emerald-50/50 rounded-2xl p-8 border border-emerald-100">
								<div className="flex flex-col items-center text-center">
									<div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
										<CheckCircle2 className="w-8 h-8 text-emerald-600" />
									</div>
									<h3 className="text-base text-gray-900 mb-2">No active blockers</h3>
									<p className="text-sm text-gray-600">
										Your team is currently unblocked and moving smoothly.
									</p>
								</div>
							</div>
						) : (
							<div className="space-y-3">
								{openBlockers.map((blocker) => {
									const isHighlighted = blocker.id === highlightBlockerId;
									return (
										<div
											key={blocker.id}
											id={`blocker-${blocker.id}`}
											className={`bg-rose-50/30 rounded-2xl p-6 border-l-4 border-l-rose-400 border border-rose-100 transition-all ${
												isHighlighted
													? "ring-2 ring-rose-400 ring-offset-2"
													: ""
											}`}
										>
											<div className="flex items-start gap-4">
												<div className="p-3 bg-rose-100 rounded-xl mt-1 border border-rose-200">
													<AlertCircle className="w-6 h-6 text-rose-600" />
												</div>

												<div className="flex-1">
													<div className="flex items-start justify-between gap-4 mb-3">
														<p className="text-sm text-gray-900">
															{blocker.description}
														</p>
														<span className="text-xs px-2 py-1 rounded-lg bg-rose-100 text-rose-700">
															Open
														</span>
													</div>

													<div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
														<div className="flex items-center gap-2">
															<Avatar
																avatarUrl={blocker.created_by.avatar_url}
																name={blocker.created_by.name}
																userId={blocker.created_by.id}
																size="sm"
															/>
															<span>
																Created by {blocker.created_by.name}
															</span>
														</div>

														<div className="flex items-center gap-2">
															<Clock className="w-3 h-3" />
															<span>{new Date(blocker.created_at).toLocaleDateString("en-GB")}</span>
														</div>
													</div>

													<div className="flex items-center gap-3 text-xs">
														<span className="text-gray-500">
															Ticket:{" "}
															<span className="text-gray-700">
																{blocker.ticket?.title ?? "Deleted ticket"}
															</span>
														</span>
														{blocker.assignee && ( // check if object "assignee" exists. Optional chaining also ok "blocker.assignee?.id"
															<span className="text-gray-500">
																Related to:{" "}
																<span className="text-gray-700">
																	{blocker.assignee.name}
																</span>
															</span>
														)}
													</div>
												</div>
											</div>

											{(canEditBlocker(blocker) || canResolveBlocker(blocker)) && (
											<div className="mt-4 pt-4 border-t border-rose-100 flex items-center gap-3">
												{canResolveBlocker(blocker) && (
													<Button
														variant="text"
														onClick={() => setConfirmResolved(blocker.id)}
														className="text-emerald-600 hover:text-emerald-700 p-1.5 hover:bg-rose-50 rounded-lg transition-colors"
													>
														Resolve Blocker
													</Button>
												)}
												{canEditBlocker(blocker) && (
													<Button
														variant="text"
														onClick={() => openEditModal(blocker)}
														icon={<Edit2 className="w-3 h-3" />}
													>
														Edit
													</Button>
												)}
											</div>
											)}
										</div>
									);
								})}
							</div>
						)}
					</div>
				)}

				{/* Resolved Blockers */}
				{!isLoading && resolvedBlockers.length > 0 && (
					<div>
						<h3 className="text-sm text-gray-700 mb-3">
							Resolved ({resolvedBlockers.length})
						</h3>
						<div className="space-y-3">
							{resolvedBlockers.map((blocker) => {
								return (
									<div
										key={blocker.id}
										className="bg-gray-50 rounded-2xl p-6 border border-gray-200 opacity-75"
									>
										<div className="flex items-start gap-4">
											<div className="p-3 bg-gray-200 rounded-xl mt-1">
												<CheckCircle2 className="w-6 h-6 text-gray-500" />
											</div>

											<div className="flex-1">
												<div className="flex items-start justify-between gap-4 mb-3">
													<p className="text-sm text-gray-700 line-through">
														{blocker.description}
													</p>
													<span className="text-xs px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700">
														Resolved
													</span>
												</div>

												<div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
													<div className="flex items-center gap-2">
														<Avatar
															avatarUrl={
																blocker.created_by.avatar_url
															}
															name={blocker.created_by.name}
															userId={blocker.created_by.id}
															size="sm"
														/>
														<span>
															Created by {blocker.created_by.name}
														</span>
													</div>

													<div className="flex items-center gap-2">
														<CheckCircle2 className="w-3 h-3" />
														<span>
															Resolved{" "}
															{blocker.resolved_at
																? new Date(blocker.resolved_at).toLocaleDateString("en-GB")
																: ""}
														</span>
													</div>
												</div>

												<div className="flex items-center gap-3 text-xs text-gray-500">
													<span>
														Ticket:{" "}
														<span className="text-gray-600">
															{blocker.ticket?.title ?? "Deleted ticket"}
														</span>
													</span>
													{blocker.assignee && (
														<span>
															Related to:{" "}
															<span className="text-gray-600">
																{blocker.assignee.name}
															</span>
														</span>
													)}
												</div>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				)}
			</div>

			{/* Resolve Blocker Confirmation Modal */}
			{errors.resolveBlocker && <ErrorText>{errors.resolveBlocker}</ErrorText>}
			{confirmResolved && (
				<ModalConfirmation
					isOpen={true}
					onClose={() => setConfirmResolved(null)}
					title="Mark blocker as resolved?"
					description="This will mark the blocker as resolved for your team"
					confirmLabel="Resolve"
					confirmVariant="success"
					onConfirm={handleResolveBlocker}
					isConfirming={isResolving}
					confirmingLabel="Resolving..."
				/>
			)}

			{/* Create Blocker Modal */}
			<Modal
				isOpen={isCreateBlockerOpen}
				onClose={() => setIsCreateBlockerOpen(false)}
				title="Create Blocker"
			>
				{/* Form Fields */}
				<div className="space-y-4">
					<div>
						<Label htmlFor="description">
							Description <span className="text-rose-500">*</span>
						</Label>
						<textarea
							id="description"
							value={blockerForm.description}
							onChange={(e) =>
								setBlockerForm({
									...blockerForm,
									description: e.target.value,
								})
							}
							placeholder="Describe what's blocking progress"
							rows={4}
							className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-300 transition-colors resize-none"
						/>
					</div>

					<div>
						<Label htmlFor="ticket">
							Associated Ticket <span className="text-rose-500">*</span>
						</Label>
						<select
							id="ticket"
							value={blockerForm.ticket_id}
							onChange={(e) =>
								setBlockerForm({
									...blockerForm, // we use spread to keep the information as the user fills in the form
									ticket_id: e.target.value,
								})
							}
							className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-300 transition-colors"
						>
							<option value="">Select a ticket</option>
							{ticketList.filter((t) => t.status !== "completed").map((ticket) => (
								<option key={ticket.id} value={ticket.id}>
									{ticket.title}
								</option>
							))}
						</select>
					</div>

					<div>
						<Label htmlFor="assignee">Related to (optional)</Label>
						<select
							id="assignee"
							value={blockerForm.assignee_id}
							onChange={(e) =>
								setBlockerForm({
									...blockerForm,
									assignee_id: e.target.value,
								})
							}
							className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-300 transition-colors"
						>
							<option value="">Select related team member</option>
							{availableAssignees.map((member: OrganizationMember) => (
								<option key={member.id} value={member.id}>
									{member.name}
								</option>
							))}
						</select>
					</div>
				</div>
				{errors.createBlocker && <ErrorText>{errors.createBlocker}</ErrorText>}

				{/* Actions */}
				<div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
					<Button variant="secondary" onClick={() => setIsCreateBlockerOpen(false)}>
						Cancel
					</Button>
					<Button
						variant="primary"
						onClick={handleCreateBlocker}
						disabled={isCreating || !blockerForm.description.trim() || !blockerForm.ticket_id}
					>
						{isCreating ? "Creating..." : "Create blocker"}
					</Button>
				</div>
			</Modal>

			{/* Edit Blocker Modal */}
			<Modal
				isOpen={isEditBlockerOpen && selectedBlocker !== null}
				onClose={() => setIsEditBlockerOpen(false)}
				title="Edit Blocker"
			>
				{/* Form Fields */}
				<div className="space-y-4">
					<div>
						<Label htmlFor="edit-description">
							Description <span className="text-rose-500">*</span>
						</Label>
						<textarea
							id="edit-description"
							value={blockerForm.description}
							onChange={(e) =>
								setBlockerForm({
									...blockerForm,
									description: e.target.value,
								})
							}
							placeholder="Describe what's blocking progress"
							rows={4}
							className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-300 transition-colors resize-none"
						/>
					</div>

					<div>
						<Label htmlFor="edit-ticket">
							Associated Ticket <span className="text-rose-500">*</span>
						</Label>
						<select
							id="edit-ticket"
							value={blockerForm.ticket_id}
							onChange={(e) =>
								setBlockerForm({
									...blockerForm,
									ticket_id: e.target.value,
								})
							}
							className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-300 transition-colors"
						>
							<option value="">Select a ticket</option>
							{ticketList.filter((t) => t.status !== "completed").map((ticket) => (
								<option key={ticket.id} value={ticket.id}>
									{ticket.title}
								</option>
							))}
						</select>
					</div>

					{(authUser?.scrum_role === "scrum_master" ||
						authUser?.scrum_role === "product_owner" ||
						selectedBlocker?.created_by.id === authUser?.id) && (
						<div>
							<Label htmlFor="edit-assignee">Assignee (optional)</Label>
							<select
								id="edit-assignee"
								value={blockerForm.assignee_id}
								onChange={(e) =>
									setBlockerForm({
										...blockerForm,
										assignee_id: e.target.value,
									})
								}
								className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-300 transition-colors"
							>
								<option value="">Assign to team member</option>
								{availableAssignees.map((member) => (
									<option key={member.id} value={member.id}>
										{member.name}
									</option>
								))}
							</select>
						</div>
					)}
				</div>
				{errors.editBlocker && <ErrorText>{errors.editBlocker}</ErrorText>}

				{/* Actions */}
				<div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
					<Button variant="secondary" onClick={() => setIsEditBlockerOpen(false)}>
						Cancel
					</Button>
					<Button
						variant="primary"
						onClick={handleEditBlocker}
						disabled={isSaving || !blockerForm.description.trim() || !blockerForm.ticket_id}
					>
						{isSaving ? "Saving..." : "Save changes"}
					</Button>
				</div>
			</Modal>
		</div>
	);
}
