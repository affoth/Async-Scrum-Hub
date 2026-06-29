import { useTopBar } from "./useTopBar"
import { Button, Label, Input, Avatar, ErrorText } from "../../custom/index"
import {
	LogOut,
	User,
	Image,
	UserPlus,
	ChevronRight,
	ChevronDown,
	Upload,
} from "lucide-react";

export function TopBar() {
	const {
		// state
		isDropdownOpen,
		expandedSection,
		isEditingProfile,
		editFormData,
		inviteFormData,
		inviteSent,
		showImageAvatar,
		showDefaultAvatar,
		isAdmin,
		authUser,
		errors,
		isUploading,
		isSaving,
		isInviting,
		formattedScrumRole,
		canSaveProfile,
		canSendInvite,

		// setters
		setIsDropdownOpen,
		setExpandedSection,
		setIsEditingProfile,
		setEditFormData,
		setInviteFormData,

		// handlers
		toggleSection,
		startEditingProfile,
		handleSaveProfile,
		handleAvatarUpload,
		handleSendInvite,
		handleLogout

	} = useTopBar();

	return (
		<header className="h-16 border-b border-gray-100 bg-white grid grid-cols-3 items-center px-6">
			<div />

			<div className="flex flex-col items-center">
				<h1 className="text-3xl tracking-tight text-gray-400">{authUser?.org_name}</h1>
				{errors.user && <ErrorText>{errors.user}</ErrorText>}
			</div>

			<div className="flex items-center gap-4 justify-end">
				<div className="relative pl-4 border-l border-gray-100">
					<button
						onClick={() => setIsDropdownOpen(!isDropdownOpen)}
						className="flex items-center gap-3 hover:opacity-80 transition-opacity"
					>
						<div className="text-right">
							<p className="text-sm text-gray-900">{authUser?.name}</p>
							<p className="text-xs text-gray-500">{formattedScrumRole}</p>
						</div>
						{showDefaultAvatar ? (
							<div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
								<img
									src={showImageAvatar}
									alt={authUser?.name}
									className="w-full h-full object-cover"
								/>
							</div>
						) : (
							<Avatar
								avatarUrl={authUser?.avatar_url}
								name={authUser?.name}
								userId={authUser?.id}
								size="md"
							/>
						)}
					</button>

					{isDropdownOpen && (
						<>
							<div
								className="fixed inset-0 z-10"
								onClick={() => {
									setIsDropdownOpen(false);
									setExpandedSection(null);
									setIsEditingProfile(false);
								}}
							/>
							<div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-gray-100 shadow-lg z-20 overflow-hidden">
								{/* Profile */}
								<div className="border-b border-gray-100">
									<button
										onClick={() => toggleSection("profile")}
										className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
									>
										<div className="flex items-center gap-3">
											<User className="w-4 h-4" />
											<span>Profile</span>
										</div>
										{expandedSection === "profile" ? (
											<ChevronDown className="w-4 h-4 text-gray-400" />
										) : (
											<ChevronRight className="w-4 h-4 text-gray-400" />
										)}
									</button>

									{expandedSection === "profile" && (
										<div className="px-4 pb-4 bg-gray-50 space-y-3">
											{!isEditingProfile ? (
												<>
													<div>
														<p className="text-xs text-gray-500">
															Name
														</p>
														<p className="text-sm text-gray-900">
															{authUser?.name}
														</p>
													</div>
													<div>
														<p className="text-xs text-gray-500">
															Email
														</p>
														<p className="text-sm text-gray-900">
															{authUser?.email}
														</p>
													</div>
													<div>
														<p className="text-xs text-gray-500">
															Team
														</p>
														<p className="text-sm text-gray-900">
															{authUser?.org_name}
														</p>
													</div>

													<Button
														variant="secondary"
														onClick={() => {
															startEditingProfile();
															setIsEditingProfile(true);
														}}
														className="w-full text-xs "
													>
														Edit profile
													</Button>
												</>
											) : editFormData ? (
												<>
													<div>
														<Label className="text-xs text-gray-600 mb-1">
															Name
														</Label>
														<Input
															type="text"
															value={editFormData.name}
															onChange={(e) =>
																setEditFormData({
																	...editFormData,
																	name: e.target.value,
																})
															}
															className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
														/>
													</div>
													<div>
														<Label className="text-xs text-gray-600 mb-1">
															Email
														</Label>
														<Input
															type="email"
															value={editFormData.email}
															onChange={(e) =>
																setEditFormData({
																	...editFormData,
																	email: e.target.value,
																})
															}
															className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
														/>
													</div>
													{errors.user && <ErrorText>{errors.user}</ErrorText>}
													<div className="flex gap-2">
														<button
															onClick={handleSaveProfile}
															disabled={isSaving || !canSaveProfile}
															className="flex-1 px-3 py-2 text-xs bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
														>
															{ isSaving ? "Saving..." : "Save changes" }
														</button>
														<button
															onClick={() =>
																setIsEditingProfile(false)
															}
															className="flex-1 px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
														>
															Cancel
														</button>
													</div>
												</>
											) : null}
										</div>
									)}
								</div>

								{/* Avatar */}
								<div className="border-b border-gray-100">
									<button
										onClick={() => toggleSection("avatar")}
										className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
									>
										<div className="flex items-center gap-3">
											<Image className="w-4 h-4" />
											<span>Avatar</span>
										</div>
										{expandedSection === "avatar" ? (
											<ChevronDown className="w-4 h-4 text-gray-400" />
										) : (
											<ChevronRight className="w-4 h-4 text-gray-400" />
										)}
									</button>

									{expandedSection === "avatar" && (
										<div className="px-4 pb-4 bg-gray-50 space-y-3">
											<div className="flex justify-center overflow-hidden">
												{showDefaultAvatar ? (
													<div className="w-20 h-20 rounded-full overflow-hidden shrink-0">
														<img
															src={showImageAvatar}
															alt={authUser!.name}
															className="w-full h-full object-cover"
														/>
													</div>
												) : (
													<Avatar
														avatarUrl={authUser?.avatar_url}
														name={authUser?.name}
														userId={authUser?.id}
														className="w-20 h-20"
														initialsClassName="text-2xl"
													/>
												)}
											</div>
											<Label className="block">
												<Input
													type="file"
													accept="image/png,image/jpeg"
													onChange={handleAvatarUpload}
													className="hidden"
													disabled={isUploading}
												/>
												<div className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center cursor-pointer flex items-center justify-center gap-2">
													<Upload className="w-3 h-3" />
													{isUploading ? "Uploading..." : "Upload image"}
												</div>
											</Label>

											<div className="text-xs text-gray-500 text-center">
												PNG/JPG up to 5 MB
												{errors.avatar && <ErrorText>{errors.avatar}</ErrorText>}
											</div>
										</div>
									)}
								</div>

								{/* Invite Users (admin only) */}
								{isAdmin && (
									<div className="border-b border-gray-100">
										<button
											onClick={() => toggleSection("invite")}
											className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
										>
											<div className="flex items-center gap-3">
												<UserPlus className="w-4 h-4" />
												<span>Invite Users</span>
											</div>
											{expandedSection === "invite" ? (
												<ChevronDown className="w-4 h-4 text-gray-400" />
											) : (
												<ChevronRight className="w-4 h-4 text-gray-400" />
											)}
										</button>

										{expandedSection === "invite" && (
											<div className="px-4 pb-4 bg-gray-50 space-y-3">
												{!inviteSent ? (
													<>
														<div>
															<label className="block text-xs text-gray-600 mb-1">
																Full name
															</label>
															<input
																type="text"
																value={inviteFormData.name}
																onChange={(e) =>
																	setInviteFormData({
																		...inviteFormData,
																		name: e.target.value,
																	})
																}
																className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
																placeholder="Enter name"
															/>
														</div>
														<div>
															<label className="block text-xs text-gray-600 mb-1">
																Email
															</label>
															<input
																type="email"
																value={inviteFormData.email}
																onChange={(e) =>
																	setInviteFormData({
																		...inviteFormData,
																		email: e.target.value,
																	})
																}
																className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
																placeholder="Enter email"
															/>
														</div>
														{errors.invite && <ErrorText>{errors.invite}</ErrorText>}
														<p className="text-xs text-gray-500">
															Invitation link will be emailed.
														</p>
														<button
															onClick={handleSendInvite}
															disabled={ isInviting || !canSendInvite}
															className={`w-full px-3 py-2 text-xs rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${
																canSendInvite
																	? "bg-cyan-600 text-white hover:bg-cyan-700"
																	: "bg-gray-200 text-gray-400 cursor-not-allowed"
															}`}
														>
															{ isInviting ? "Sending invitation" : "Send invitation" }
														</button>
													</>
												) : (
													<div className="py-2 text-center">
														<p className="text-sm text-emerald-600">
															✓ Invitation sent
														</p>
													</div>
												)}
											</div>
										)}
									</div>
								)}

								{/* Logout */}
								<button
									onClick={handleLogout}
									className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
								>
									<LogOut className="w-4 h-4" />
									<span>Log out</span>
								</button>
							</div>
						</>
					)}
				</div>
			</div>
		</header>
	);
}
