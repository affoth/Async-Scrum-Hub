import { useNavigate } from "react-router-dom";
import { AlertCircle, Edit2, Trash2, X } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { ModalConfirmation, PageHeader, Avatar, ErrorText } from "../../components/custom/index";
import { useAuth } from "../../routes/useAuth";
import { useOrgWebSocket } from "../../hooks/useOrgWebSocket";
import { createStandup, listStandups, editStandup, deleteStandup } from "../../services/api";
import type { APIError } from "../../utils/shared.types";
import type { StandupListItem } from "../../types/api.types";

export function AsyncStandup() {
	//View/UI states
	const [isCreateStandupOpen, setIsCreateStandupOpen] = useState(false);
	const [isEditStandupOpen, setIsEditStandupOpen] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
	const [hoveredStandup, setHoveredStandup] = useState<string | null>(null);
	//Form states
	const [standupForm, setStandupForm] = useState({
		today: "",
	});
	//Auth states
	const { user: authUser, refreshUser } = useAuth();
	const orgId = authUser?.organization_id ?? null;
	const [errors, setErrors] = useState<{
		fetchStandups?: string;
		createStandup?: string;
		editStandup?: string;
		deleteStandup?: string;
	}>({});
	//Data states
	const [standups, setStandups] = useState<StandupListItem[]>([]);
	const [editingStandup, setEditingStandup] = useState<StandupListItem | null>(null);
	// Routing states
	const navigate = useNavigate();
	//Communication states
	const [isLoading, setIsLoading] = useState(false);
	const [isPosting, setIsPosting] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	//Time helpers
	const now = new Date();
	const today = now.toLocaleDateString("en-CA");
	const yesterdayDateObj = new Date(now);
	yesterdayDateObj.setDate(now.getDate() - 1);
	const yesterday = yesterdayDateObj.toLocaleDateString("en-CA");
	//Permissions helpers
	const canEditStandup = (standup: StandupListItem) => {
		return standup.created_by.id === authUser?.id && standup.standup_date === today;
	};
	const hasCreatedStandupToday = standups.some(
		(currentStandup) =>
			currentStandup.created_by.id === authUser?.id && currentStandup.standup_date === today
	);

	//Latest recent standup per user
	const recentStandups = standups.filter(
		(s) => s.standup_date === today || s.standup_date === yesterday
	);
	const latestStandupPerUser = recentStandups.reduce((acc, standup) => {
		const userId = standup.created_by.id;
		const existing = acc[userId];

		// If no entry exists for this user, or this standup is newer, update the map
		if (!existing || standup.standup_date > existing.standup_date) {
			acc[userId] = standup;
		}
		return acc;
	}, {} as Record<string, StandupListItem>);
	const visibleStandups = Object.values(latestStandupPerUser).sort((a, b) => {
		// Sort primarily by the date (Today first)
		const dateOrder = b.standup_date.localeCompare(a.standup_date);

		// If dates are identical, sort by actual creation timestamp
		return dateOrder || b.created_at.localeCompare(a.created_at);
	});


	const fetchStandups = useCallback(async () => {
		if (!orgId) return;
		setIsLoading(true);

		try {
			const standupsData = await listStandups(orgId);
			setStandups(standupsData);
		} catch (error: unknown) {
			const apiError = error as APIError;

			console.error("API call failed:", error);
			if (apiError.error?.code === "UNAUTHORIZED") {
				setErrors({ fetchStandups: "Authentication required" });
				refreshUser();
			} else if (apiError.error?.code === "FORBIDDEN") {
				setErrors({ fetchStandups: "You do not have permission to perform this action" });
			} else if (apiError.error?.code === "NOT_FOUND") {
				setErrors({ fetchStandups: "Organization not found" });
			} else {
				setErrors({ fetchStandups: "Something went wrong" });
			}
		} finally {
			setIsLoading(false);
		}
	}, [orgId, refreshUser]);

	useEffect(() => {
		fetchStandups();
	}, [fetchStandups]);


	//Handlers
	const handleCreateStandup = async () => {
		if (!orgId) return;
		setIsPosting(true);

		try {
			await createStandup(orgId!, {
				today: standupForm.today,
			});
			await fetchStandups();
			setIsCreateStandupOpen(false);
			setStandupForm({ today: "" });
		} catch (error: unknown) {
			const apiError = error as APIError;

			console.error("API call failed:", error);
			if (Array.isArray(apiError.detail) && apiError.detail.length > 0) {
				setErrors({ createStandup: apiError.detail[0]?.msg ?? "Validation error" });
			} else if (apiError.error?.code === "UNAUTHORIZED") {
				setErrors({ createStandup: "Authentication required" });
				refreshUser();
			} else if (apiError.error?.code === "FORBIDDEN") {
				setErrors({ createStandup: "You do not have permission to perform this action" });
			} else if (apiError.error?.code === "NOT_FOUND") {
				setErrors({ createStandup: "Organization not found" });
			} else {
				setErrors({ createStandup: "Something went wrong" });
			}
		} finally {
			setIsPosting(false);
		}
	};

	const handleEditStandup = async () => {
		setIsSaving(true);
		try {
			if (editingStandup) {
				await editStandup(editingStandup.id, {
					today: standupForm.today,
				});
			}
			await fetchStandups();
			setIsEditStandupOpen(false);
			setEditingStandup(null);
			setStandupForm({ today: "" });
		} catch (error: unknown) {
			const apiError = error as APIError;

			console.error("API call failed:", error);
			if (Array.isArray(apiError.detail) && apiError.detail.length > 0) {
				setErrors({ editStandup: apiError.detail[0]?.msg ?? "Validation error" });
			} else if (apiError.error?.code === "UNAUTHORIZED") {
				setErrors({ editStandup: "Authentication required" });
				refreshUser();
			} else if (apiError.error?.code === "FORBIDDEN") {
				setErrors({ editStandup: "You do not have permission to perform this action" });
			} else if (apiError.error?.code === "EDIT_WINDOW_EXPIRED") {
				setErrors({
					editStandup: "Standups can only be edited on the day they are created",
				});
			} else {
				setErrors({ editStandup: "Something went wrong" });
			}
		} finally {
			setIsSaving(false);
		}
	};

	const handleDeleteStandup = async () => {
		if (!confirmDelete) return;
		setIsDeleting(true);

		try {
			await deleteStandup(confirmDelete);
			await fetchStandups();
			setConfirmDelete(null);
		} catch (error: unknown) {
			const apiError = error as APIError;

			console.error("API call failed:", error);
			if (apiError.error?.code === "UNAUTHORIZED") {
				setErrors({ deleteStandup: "Authentication required" });
				refreshUser();
			} else if (apiError.error?.code === "FORBIDDEN") {
				setErrors({ deleteStandup: "You do not have permission to perform this action" });
			} else if (apiError.error?.code === "NOT_FOUND") {
				setErrors({ deleteStandup: "Standup not found" });
			} else {
				setErrors({ deleteStandup: "Something went wrong" });
			}
		} finally {
			setIsDeleting(false);
		}
	};

	const openEditModal = (standup: StandupListItem) => {
		setEditingStandup(standup);
		setStandupForm({ today: standup.today });
		setIsEditStandupOpen(true);
	};

	useOrgWebSocket(orgId, (msg) => {
		const reFetchEvents = ["standup.created", "standup.updated"];
		if (reFetchEvents.includes(msg.event)) {
			fetchStandups();
		}
	});

	return (
		<div className="p-8">
			<PageHeader title="Async Standup" subtitle="Team updates - Updated today" />

			<div className="max-w-3xl space-y-5 mb-6">
				{/* Add Standup Button */}
				{hasCreatedStandupToday ? (
					<div className="relative group">
						<button
							disabled
							className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-400 cursor-not-allowed"
						>
							+ Add your standup update
						</button>
						<div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
							You've already created a standup today
						</div>
					</div>
				) : (
					<button
						onClick={() => setIsCreateStandupOpen(true)}
						className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-500 hover:border-cyan-200 hover:text-cyan-600 transition-colors"
					>
						+ Add your standup update
					</button>
				)}

				{isLoading && (
					<div className="flex items-center justify-center py-16 text-gray-400 text-sm">
						Loading standups...
					</div>
				)}

				{!isLoading && visibleStandups.length === 0 && (
					<div className="flex flex-col items-center justify-center py-16 text-center">
						<p className="text-sm text-gray-400">No standups yet.</p>
						<p className="text-xs text-gray-300 mt-1">
							Be the first to post an update.
						</p>
					</div>
				)}

				{errors.fetchStandups && <ErrorText>{errors.fetchStandups}</ErrorText>}

				{!isLoading &&
					visibleStandups.map((s) => {
						if (!s.today) return null;
						const canEdit = canEditStandup(s);

						return (
							<div
								key={s.id}
								className="bg-white rounded-2xl p-6 border border-gray-100"
							>
								<div className="flex items-center gap-4 mb-6">
									<Avatar
										avatarUrl={s.created_by.avatar_url}
										name={s.created_by.name}
										userId={s.created_by.id}
										size="md"
									/>
									<div>
										<h3 className="text-base text-gray-900">
											{s.created_by.name}
										</h3>
										<p className="text-xs text-gray-400">
											{new Date(s.created_at).toLocaleDateString("en-GB")}
										</p>
									</div>
								</div>

								<div className="space-y-4">
									{/* Today Section */}
									<div
										className="pb-4 relative"
										onMouseEnter={() => setHoveredStandup(s.id)}
										onMouseLeave={() => setHoveredStandup(null)}
									>
										<div className="flex items-start justify-between gap-3">
											<div className="flex-1">
												<h4 className="text-xs uppercase tracking-wide text-gray-500 mb-2">
													{s.standup_date === today
														? "Today"
														: "Yesterday"}
												</h4>
												<p className="text-sm text-gray-600">{s.today}</p>
											</div>

											{canEdit && hoveredStandup === s.id && (
												<div className="flex items-center gap-2">
													<button
														onClick={() => openEditModal(s)}
														className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
														title="Edit standup"
													>
														<Edit2 className="w-3.5 h-3.5 text-gray-500" />
													</button>
													<button
														onClick={() => setConfirmDelete(s.id)}
														className="p-1.5 hover:bg-rose-50 rounded-lg transition-colors"
														title="Delete standup"
													>
														<Trash2 className="w-3.5 h-3.5 text-rose-500" />
													</button>
												</div>
											)}
										</div>
									</div>

									{/* Yesterday Section */}
									{s.yesterday && (
										<div className="pb-4">
											<h4 className="text-xs uppercase tracking-wide text-gray-500 mb-2">
												Yesterday
											</h4>
											<p className="text-sm text-gray-600">{s.yesterday}</p>
										</div>
									)}

									{/* Blockers Section */}
									{s.blockers.length > 0 && (
										<div>
											<h4 className="text-xs uppercase tracking-wide text-gray-500 mb-2">
												Blockers
											</h4>
											<div className="space-y-2">
												<div className="flex items-center gap-2 mb-2">
													<AlertCircle className="w-4 h-4 text-rose-500" />
													<span className="text-sm text-rose-600 font-medium">
														{s.blockers.length} active blocker
														{s.blockers.length > 1 ? "s" : ""}
													</span>
												</div>
												{s.blockers.map((blocker) => (
													<div
														key={blocker.id}
														className="bg-rose-50 rounded-lg p-3 border border-rose-100"
													>
														<p className="text-sm text-gray-700 mb-1">
															{blocker.title}
														</p>
														<div className="flex items-center justify-between">
															<span className="text-xs text-gray-500">
																Ticket: {blocker.ticket.title}
															</span>
															<button
																onClick={() =>
																	navigate("/blockers", {
																		state: {
																			blockerId: blocker.id,
																		},
																	})
																}
																className="text-xs text-cyan-600 hover:text-cyan-700 transition-colors flex items-center gap-1"
															>
																View details →
															</button>
														</div>
													</div>
												))}
											</div>
										</div>
									)}
								</div>
							</div>
						);
					})}
			</div>

			{/* Create Standup Modal */}
			{isCreateStandupOpen && (
				<>
					<div
						className="fixed inset-0 bg-black/20 z-40"
						onClick={() => setIsCreateStandupOpen(false)}
					/>
					<div className="fixed inset-0 flex items-center justify-center z-50 p-4">
						<div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
							<div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
								<div>
									<h3 className="text-lg text-gray-900">Add Standup Update</h3>
									<p className="text-xs text-gray-500 mt-0.5">
										Share what you're working on today
									</p>
								</div>
								<button
									onClick={() => setIsCreateStandupOpen(false)}
									className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
								>
									<X className="w-5 h-5 text-gray-400" />
								</button>
							</div>

							<div className="px-6 py-5">
								<div>
									<label className="block text-sm text-gray-700 mb-1.5">
										Today <span className="text-rose-500">*</span>
									</label>
									<textarea
										value={standupForm.today}
										onChange={(e) =>
											setStandupForm({
												...standupForm,
												today: e.target.value,
											})
										}
										placeholder="What are you working on today?"
										rows={4}
										className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-300 transition-colors resize-none"
									/>
								</div>
							</div>
							{errors.createStandup && <ErrorText>{errors.createStandup}</ErrorText>}
							<div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
								<button
									onClick={() => setIsCreateStandupOpen(false)}
									className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
								>
									Cancel
								</button>
								<button
									onClick={handleCreateStandup}
									disabled={isPosting || !standupForm.today.trim()}
									className="px-4 py-2 text-sm text-white bg-cyan-500 hover:bg-cyan-600 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isPosting ? "Posting..." : "Post update"}
								</button>
							</div>
						</div>
					</div>
				</>
			)}

			{/* Edit Standup Modal */}
			{isEditStandupOpen && editingStandup && (
				<>
					<div
						className="fixed inset-0 bg-black/20 z-40"
						onClick={() => setIsEditStandupOpen(false)}
					/>
					<div className="fixed inset-0 flex items-center justify-center z-50 p-4">
						<div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
							<div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
								<div>
									<h3 className="text-lg text-gray-900">Edit Standup Update</h3>
									<p className="text-xs text-gray-500 mt-0.5">
										Update what you're working on today
									</p>
								</div>
								<button
									onClick={() => setIsEditStandupOpen(false)}
									className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
								>
									<X className="w-5 h-5 text-gray-400" />
								</button>
							</div>

							<div className="px-6 py-5">
								<div>
									<label className="block text-sm text-gray-700 mb-1.5">
										Today <span className="text-rose-500">*</span>
									</label>
									<textarea
										value={standupForm.today}
										onChange={(e) =>
											setStandupForm({
												...standupForm,
												today: e.target.value,
											})
										}
										placeholder="What are you working on today?"
										rows={4}
										className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-300 transition-colors resize-none"
									/>
								</div>
							</div>
							{errors.editStandup && <ErrorText>{errors.editStandup}</ErrorText>}
							<div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
								<button
									onClick={() => setIsEditStandupOpen(false)}
									className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
								>
									Cancel
								</button>
								<button
									onClick={handleEditStandup}
									disabled={isSaving || !standupForm.today.trim()}
									className="px-4 py-2 text-sm text-white bg-cyan-500 hover:bg-cyan-600 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isSaving ? "Saving..." : "Save changes"}
								</button>
							</div>
						</div>
					</div>
				</>
			)}

			{/* Delete Confirmation Modal */}
			{errors.deleteStandup && <ErrorText>{errors.deleteStandup}</ErrorText>}
			<ModalConfirmation
				isOpen={!!confirmDelete}
				onClose={() => setConfirmDelete(null)}
				title="Delete Standup?"
				description="This action cannot be undone. Your standup update will be permanently deleted."
				confirmLabel="Delete"
				confirmVariant="danger"
				onConfirm={handleDeleteStandup}
				isConfirming={isDeleting}
				confirmingLabel="Deleting..."
			/>
		</div>
	);
}
