import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateUser, uploadAvatar, inviteMember } from "../../../services/api";
import { formatScrumRole, resolveAvatarUrl } from "../../../utils/formatters";
import { useAuth } from "../../../routes/useAuth";
import type { APIError } from "../../../utils/shared.types";


export function useTopBar() {
	//View/UI states
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [expandedSection, setExpandedSection] = useState<string | null>(null);
	const [inviteSent, setInviteSent] = useState(false);
	//Auth states
	const { user: authUser, refreshUser } = useAuth();
	const orgId = authUser?.organization_id ?? null;
	const [errors, setErrors] = useState<{ invite?: string; avatar?: string; user?: string }>({});
	//Form states
	const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
	const [isEditingProfile, setIsEditingProfile] = useState(false);
	const [editFormData, setEditFormData] = useState<{ name: string; email: string } | null>(null);
	const [inviteFormData, setInviteFormData] = useState({
		name: "",
		email: "",
	});
	//Communication states
	const [isSaving, setIsSaving] = useState(false);
	const [isInviting, setIsInviting] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	//Routing state
	const navigate = useNavigate();
	//Derived states
	const isAdmin = authUser?.org_role === "admin";
	//Derived data
	const showImageAvatar = previewAvatar || resolveAvatarUrl(authUser?.avatar_url) || "";

	const formattedScrumRole = authUser?.scrum_role
		? formatScrumRole(authUser.scrum_role)
		: "";
	//Derived UI logic
	const showDefaultAvatar = Boolean(previewAvatar || authUser?.avatar_url);
	const canSaveProfile = Boolean(editFormData?.name.trim() && editFormData.email.trim());
	const canSendInvite = Boolean(inviteFormData.name.trim() && inviteFormData.email.trim());


	const toggleSection = (section: string) => {
		if (expandedSection === section) {
			setExpandedSection(null);
			setIsEditingProfile(false);
		} else {
			setExpandedSection(section);
			setIsEditingProfile(false);
		}
	};

	const startEditingProfile = () => {
		if (authUser) {
			setEditFormData({
				name: authUser.name,
				email: authUser.email,
			});
		}
	};

	const handleSaveProfile = async () => {
		if (!editFormData) return;
		setIsSaving(true);
		setErrors({});

		try {
			await updateUser({
				name: editFormData.name,
				email: editFormData.email,
			});
			await refreshUser();
			setIsEditingProfile(false);
			setExpandedSection(null);

		} catch (error) {
			console.error("Failed to save profile", error);

			const apiError = error as APIError;
			if (apiError.error?.code === "INVALID_INPUT") {
				setErrors({ user: "Email is incorrect" });
			} else if (apiError.error?.code === "UNAUTHORIZED") {
				setErrors({ user: "Authentication required" });
				refreshUser();
			} else {
				setErrors({ user: "Something went wrong" });
			}
		} finally {
			setIsSaving(false);
		}
	};

	const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setErrors({});
		setIsUploading(true);

		const reader = new FileReader();
		reader.onload = (event) => {
			setPreviewAvatar(event.target?.result as string);
		};
		reader.readAsDataURL(file);

		try {
			await uploadAvatar({ file });
			await refreshUser();
			setPreviewAvatar(null);

		} catch (error) {
			const apiError = error as APIError;

			console.error("Failed to upload avatar:", error);
			if (apiError.error?.code === "INVALID_TYPE_FILE") {
				setErrors({ avatar: "Only JPEG, PNG, GIF, and WebP images are allowed" });
			} else if (apiError.error?.code === "FILE_TOO_LARGE") {
				setErrors({ avatar: "File size exceeds the maximum limit of 5MB" });
			} else if (apiError.error?.code === "UNAUTHORIZED") {
				setErrors({ avatar: "Authentication required" });
				refreshUser();
			} else {
				setErrors({ avatar: "Something went wrong" });
			}
			setPreviewAvatar(null);
		} finally {
			setIsUploading(false);
		}
	};

	const handleSendInvite = async () => {
		if (!orgId) return;
		setIsInviting(true);
		setErrors({});

		try {
			await inviteMember(orgId, {
				name: inviteFormData.name,
				email: inviteFormData.email,
			});
			setInviteSent(true);
			setTimeout(() => {
				setInviteSent(false);
				setInviteFormData({ name: "", email: "" });
				setExpandedSection(null);
			}, 2000);
		} catch (error: unknown) {
			const apiError = error as APIError;

			console.error("Failed to send invite:", error);
			if (apiError.error?.code === "INVALID_INPUT") {
				setErrors({ invite: "Email is incorrect" });
			} else if (apiError.error?.code === "UNAUTHORIZED") {
				setErrors({ invite: "Authentication required" });
				refreshUser();
			} else if (apiError.error?.code === "FORBIDDEN") {
				setErrors({ invite: "Only admin can perform this action" });
			} else if (apiError.error?.code === "NOT_FOUND") {
				setErrors({ invite: "Organization not found" });
			} else if (apiError.error?.code === "ALREADY_MEMBER") {
				setErrors({ invite: "User is already a member of the team" });
			} else {
				setErrors({ invite: "Something went wrong" });
			}
		} finally {
			setIsInviting(false);
		}
	};

	const handleLogout = () => {
		setIsDropdownOpen(false);
		navigate("/welcome");
	};

	return {
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
		isSaving,
		isInviting,
		isUploading,
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
		handleLogout,
	};
}
