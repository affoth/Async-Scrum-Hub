import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../../routes/useAuth";
import { useOrgWebSocket } from "../../../hooks/useOrgWebSocket";
import {
	createBlocker,
	createTask,
	createTicket,
	deleteTask,
	deleteTicket,
	getOrganizationMembers,
	getTaskDetails,
	getTicketDetails,
	listTicketsBoard,
	moveTicket,
	updateTask,
	updateTicket
} from "../../../services/api";
import type {
	Ticket,
	ListTicketsBoard,
	Task,
	Priority,
	TicketStatus,
	TaskStatus,
	OrgMember,
	TaskSummary,
} from "../types/sprint.types"
import type { APIError } from "../../../utils/shared.types";


export function useSprintBoard() {

	// View/UI states
	const [draggedTicket, setDraggedTicket] = useState<ListTicketsBoard | null>(null);
	const [draggedTask, setDraggedTask] = useState<{ task: TaskSummary; ticketId: string; } | null>(null);
	const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
	const [selectedTicketDetail, setSelectedTicketDetail] = useState<Ticket | null>(null);
	const [selectedTask, setSelectedTask] = useState<Task | null>(null);
	const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
	const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
	const [isCreateBlockerOpen, setIsCreateBlockerOpen] = useState(false);
	const [isEditTicketOpen, setIsEditTicketOpen] = useState(false);
	const [draggedTicketHasActiveItems, setDraggedTicketHasActiveItems] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState<{
		type: "ticket" | "task";
		id: string;
	} | null>(null);
	// Data states
	const { user: authUser, refreshUser } = useAuth();
	const [teamMembers, setTeamMembers] = useState<OrgMember[]>([]);
	const [ticketsBoard, setTicketsBoard] = useState<ListTicketsBoard[]>([]);
	// Auth states
	const [errors, setErrors] = useState<{
		ticketBoard?: string;
		ticketDrop?: string;
		ticketDetail?: string;
		ticketCreate?: string;
		ticketEdit?: string,
		ticketDelete?: string,
		taskCreate?: string,
		taskDetail?: string;
		taskDelete?: string,
		taskDrop?: string,
		blockerCreate?: string,
		task?: string;
		blocker?: string
	}>({});
	// Form states
	const [ticketForm, setTicketForm] = useState({
		title: "",
		description: "",
		priority: "medium" as Priority,
		assignee: "",
	});
	const [taskForm, setTaskForm] = useState({
		title: "",
		description: "",
		assignee: "",
	});
	const [blockerForm, setBlockerForm] = useState({
		description: "",
		assignee: "",
	});
	// Communication states
	const [isSaving, setIsSaving] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	// Derived state
	const selectedTicket = ticketsBoard.find(t => t.id === selectedTicketId) || null;
	const getTasksForTicket = () => selectedTicketDetail?.tasks ?? [];
	const getActiveBlockers = () => selectedTicketDetail?.blockers
		.filter(b => b.status === "open") ?? [];
	const isCompleted =
		(selectedTicketDetail?.status ?? selectedTicket?.status) === "completed";
	// Derived data
	const orgId = authUser?.organization_id ?? null;
	// Derived UI logic (permissions)
	const isLeadRole =
		authUser?.scrum_role === "product_owner" ||
		authUser?.scrum_role === "scrum_master";
	const canEditTicketPriority =
		authUser?.scrum_role === "product_owner";
	const canDragTask = (task: TaskSummary) => {
		if (isCompleted) return false;

		return (
			authUser?.scrum_role === "product_owner" ||
			authUser?.scrum_role === "scrum_master" ||
			authUser?.id === task.assignee_id
		);
	}
	const canEditTask = (task: Task) =>
		authUser?.scrum_role === "product_owner" ||
		authUser?.scrum_role === "scrum_master" ||
		task.assignee_id === authUser?.id;
	const developerMembers = teamMembers.filter((m) =>
		m.scrum_role === "developer" &&
		m.id !== authUser?.id
	);


	const fetchTicketBoard = useCallback(async () => {
		if (!orgId) return;
		setIsLoading(true);
		setErrors({});

		try {
			const [members, boardTickets] = await Promise.all([
				getOrganizationMembers(orgId),
				listTicketsBoard(orgId),
			]);
			setTeamMembers(members);
			setTicketsBoard(boardTickets);
		} catch (error: unknown) {
			const apiError = error as APIError;

			console.error("API call failed:", error);
			if (apiError.error?.code === "UNAUTHORIZED") {
				setErrors({ ticketBoard: "Authentication required" });
				refreshUser();
			} else if (apiError.error?.code === "FORBIDDEN") {
				setErrors({ ticketBoard: "You do not have permission to perform this action" });
			} else if (apiError.error?.code === "NOT_FOUND") {
				setErrors({ ticketBoard: "Ticket not found" });
			} else {
				setErrors({ ticketBoard: "Something went wrong" });
			}
		} finally {
			setIsLoading(false);
		}
	}, [orgId, refreshUser]);

	useEffect(() => {
		fetchTicketBoard();
	}, [fetchTicketBoard]);


	// Handlers
	const handleSelectTicket = async (ticketId: string) => {
		setErrors({});
		setSelectedTicketId(ticketId);

		try {
			const ticketDetail = await getTicketDetails(ticketId);
			setSelectedTicketDetail(ticketDetail);
		} catch (error: unknown) {
			const apiError = error as APIError;

			console.error("API call failed:", error);
			if (apiError.error?.code === "UNAUTHORIZED") {
				setErrors({ ticketDetail: "Authentication required" });
				refreshUser();
			} else if (apiError.error?.code === "FORBIDDEN") {
				setErrors({ ticketDetail: "You do not have permission to perform this action" });
			} else if (apiError.error?.code === "NOT_FOUND") {
				setErrors({ ticketDetail: "Ticket not found" });
			} else {
				setErrors({ ticketDetail: "Something went wrong" });
			}
		}
	}

	const handleCreateTicket = async () => {
		if (!orgId) return;
		setIsSaving(true);
		setErrors({});

		try {
			await createTicket(
				orgId,
				{
					title: ticketForm.title,
					description: ticketForm.description,
					priority: ticketForm.priority,
					assignee_id: ticketForm.assignee || null,
				}
			);
			setIsCreateTicketOpen(false);
			setTicketForm({ title: "", description: "", priority: "medium", assignee: "" });
			fetchTicketBoard();
		} catch (error: unknown) {
			const apiError = error as APIError;

			console.error("API call failed:", error);
			if (Array.isArray(apiError.detail) && apiError.detail.length > 0) {
				setErrors({ ticketCreate: apiError.detail[0]?.msg ?? "Validation error" });
			} else if (apiError.error?.code === "INVALID_ASSIGNEE") {
				setErrors({ ticketCreate: "Only users with Developer role can be assigned to tickets" });
			} else if (apiError.error?.code === "UNAUTHORIZED") {
				setErrors({ ticketCreate: "Authentication required" });
				refreshUser();
			} else if (apiError.error?.code === "FORBIDDEN") {
				setErrors({ ticketCreate: "You do not have permission to perform this action" });
			} else if (apiError.error?.code === "NOT_FOUND") {
				setErrors({ ticketCreate: "Organization not found" });
			} else {
				setErrors({ ticketCreate: "Something went wrong" });
			}
		} finally {
			setIsSaving(false);
		}
	};

	const handleEditTicket = async () => {
		if (!selectedTicket || !isLeadRole) return;
		setIsSaving(true);
		setErrors({});

		try {
			if (canEditTicketPriority) {
				await updateTicket(
					selectedTicket.id,
					{
						description: ticketForm.description,
						priority: ticketForm.priority,
						assignee_id: ticketForm.assignee,
					}
				);
			} else {
				await updateTicket(
					selectedTicket.id, {
						description: ticketForm.description,
					}
				);
			}
			setIsEditTicketOpen(false);
			fetchTicketBoard();
			if (selectedTicketId) {
				const updated = await getTicketDetails(selectedTicketId);
				setSelectedTicketDetail(updated);
			}

		} catch (error: unknown) {
			const apiError = error as APIError;

			console.error("API call failed:", error);
			if (Array.isArray(apiError.detail) && apiError.detail.length > 0) {
				setErrors({ ticketEdit: apiError.detail[0]?.msg ?? "Validation error" });
			} else if (apiError.error?.code === "INVALID_ASSIGNEE") {
				setErrors({ ticketEdit: "Only users with Developer role can be assigned to tickets" });
			} else if (apiError.error?.code === "UNAUTHORIZED") {
				setErrors({ ticketEdit: "Authentication required" });
				refreshUser();
			} else if (apiError.error?.code === "FORBIDDEN") {
				setErrors({ ticketEdit: "You do not have permission to perform this action" });
			} else if (apiError.error?.code === "NOT_FOUND") {
				setErrors({ ticketEdit: "Organization not found" });
			} else {
				setErrors({ ticketEdit: "Something went wrong" });
			}
		} finally {
			setIsSaving(false);
		};
	}

	const handleDeleteTicket = async () => {
		if (confirmDelete?.type !== "ticket") return;
		setIsDeleting(true);
		setErrors({});

		try {
			await deleteTicket(confirmDelete.id);
			setConfirmDelete(null);
			setSelectedTask(null);
			setSelectedTicketId(null);
			setSelectedTicketDetail(null);
			fetchTicketBoard();

		} catch (error: unknown) {
			const apiError = error as APIError;

			console.error("API call failed:", error);
			if (apiError.error?.code === "UNAUTHORIZED") {
				setErrors({ ticketDelete: "Authentication required" });
				refreshUser();
			} else if (apiError.error?.code === "FORBIDDEN") {
				setErrors({ ticketDelete: "You do not have permission to perform this action" });
			} else if (apiError.error?.code === "NOT_FOUND") {
				setErrors({ ticketDelete: "Organization not found" });
			} else {
				setErrors({ ticketDelete: "Something went wrong" });
			}
		} finally {
			setIsDeleting(false);
		}
	};


	const handleCreateTask = async () => {
		if (!selectedTicket) return
		setIsSaving(true);

		try {
			await createTask(
				selectedTicket.id,
				{
					title: taskForm.title,
					description: taskForm.description || null,
					assignee_id: taskForm.assignee || null,
				}
			)
			setIsCreateTaskOpen(false);
			setTaskForm({ title: "", description: "", assignee: "" });
			fetchTicketBoard();
			if (selectedTicketId) {
				const updated = await getTicketDetails(selectedTicketId);
				setSelectedTicketDetail(updated);
			}

		} catch (error: unknown) {
			const apiError = error as APIError;

			console.error("API call failed:", error);
			if (Array.isArray(apiError.detail) && apiError.detail.length > 0) {
				setErrors({ taskCreate: apiError.detail[0]?.msg ?? "Validation error" });
			} else if (apiError.error?.code === "INVALID_ASSIGNEE") {
				setErrors({ taskCreate: "Only users with Developer role can be assigned to tasks" });
			} else if (apiError.error?.code === "UNAUTHORIZED") {
				setErrors({ taskCreate: "Authentication required" });
				refreshUser();
			} else if (apiError.error?.code === "FORBIDDEN") {
				setErrors({ taskCreate: "You do not have permission to perform this action" });
			} else if (apiError.error?.code === "NOT_FOUND") {
				setErrors({ taskCreate: "Organization not found" });
			} else {
				setErrors({ taskCreate: "Something went wrong" });
			}
		} finally {
			setIsSaving(false);
		}
	};

	const handleSelectTask = async (taskId: string) => {
		if (!taskId) return;

		try {
			const task = await getTaskDetails(taskId);
			setSelectedTask(task);

		} catch (error: unknown) {
			const apiError = error as APIError;

			console.error("API call failed:", error);
			if (apiError.error?.code === "UNAUTHORIZED") {
				setErrors({ taskDetail: "Authentication required" });
				refreshUser();
			} else if (apiError.error?.code === "FORBIDDEN") {
				setErrors({ taskDetail: "You do not have permission to perform this action" });
			} else if (apiError.error?.code === "NOT_FOUND") {
				setErrors({ taskDetail: "Organization not found" });
			} else {
				setErrors({ taskDetail: "Something went wrong" });
			}
		}
	}

	const handleDeleteTask = async () => {
		if (!selectedTask ||
			confirmDelete?.type !== "task" ||
			confirmDelete.id !== selectedTask?.id) return;
		setIsDeleting(true);
		setErrors({});

		try {
			await deleteTask(selectedTask?.id)
			setConfirmDelete(null);
			setSelectedTask(null);
			fetchTicketBoard();
			if (selectedTicketId) {
				const updated = await getTicketDetails(selectedTicketId);
				setSelectedTicketDetail(updated);
			}

		} catch (error: unknown) {
			const apiError = error as APIError;

			console.error("API call failed:", error);
			if (apiError.error?.code === "UNAUTHORIZED") {
				setErrors({ taskDelete: "Authentication required" });
				refreshUser();
			} else if (apiError.error?.code === "FORBIDDEN") {
				setErrors({ taskDelete: "You do not have permission to perform this action" });
			} else if (apiError.error?.code === "NOT_FOUND") {
				setErrors({ taskDelete: "Organization not found" });
			} else {
				setErrors({ taskDelete: "Something went wrong" });
			}
		} finally {
			setIsDeleting(false);
		}
	};

	const handleCreateBlocker = async () => {
		if (!selectedTicket || !orgId) return;
		setIsSaving(true);

		try {
			await createBlocker(
				orgId,
				{
					description: blockerForm.description,
					ticket_id: selectedTicket.id,
					assignee_id: blockerForm.assignee || null,
				}
			)
			setIsCreateBlockerOpen(false);
			setBlockerForm({ description: "", assignee: "" });
			fetchTicketBoard();
			if (selectedTicketId) {
				const updated = await getTicketDetails(selectedTicketId);
				setSelectedTicketDetail(updated);
			}

		} catch (error: unknown) {
			const apiError = error as APIError;

			console.error("API call failed:", error);
			if (Array.isArray(apiError.detail) && apiError.detail.length > 0) {
				setErrors({ blockerCreate: apiError.detail[0]?.msg ?? "Validation error" });
			} else if (apiError.error?.code === "INVALID_ASSIGNEE") {
				setErrors({ blockerCreate: "Only users with Developer role can be assigned to blockers" });
			} else if (apiError.error?.code === "UNAUTHORIZED") {
				setErrors({ blockerCreate: "Authentication required" });
				refreshUser();
			} else if (apiError.error?.code === "FORBIDDEN") {
				setErrors({ blockerCreate: "You do not have permission to perform this action" });
			} else if (apiError.error?.code === "NOT_FOUND") {
				setErrors({ blockerCreate: "Organization not found" });
			} else {
				setErrors({ blockerCreate: "Something went wrong" });
			}
		} finally {
			setIsSaving(false);
		}
	};

	const handleTicketDrag = async (ticket: ListTicketsBoard) => {
		if (!isLeadRole) return;
		setDraggedTicket(ticket);

		try {
			const detail = await getTicketDetails(ticket.id);
			const hasActive =
				detail.tasks.some((t) => t.status === "in_progress") ||
				detail.blockers.some((b) => b.status === "open");
			setDraggedTicketHasActiveItems(hasActive);
		} catch {
			setDraggedTicketHasActiveItems(false);
		}
	};

	const handleTicketDrop = async (newStatus: TicketStatus) => {
		if (!draggedTicket || !isLeadRole) return;
		if (newStatus === "completed" && draggedTicketHasActiveItems) {
			setErrors({ ticketDrop: "This ticket still has active items" });
			setDraggedTicket(null);
			return;
		}

		try {
			await moveTicket(
				draggedTicket.id,
				{
					status: newStatus,
				}
			);
			setDraggedTicket(null);
			fetchTicketBoard();
		} catch (error: unknown) {
			const apiError = error as APIError;

			console.error("API call failed:", error);
			if (Array.isArray(apiError.detail) && apiError.detail.length > 0) {
				setErrors({ ticketDrop: apiError.detail[0]?.msg ?? "Validation error" });
			} else if (apiError.error?.code === "UNAUTHORIZED") {
				setErrors({ ticketDrop: "Authentication required" });
				refreshUser();
			} else if (apiError.error?.code === "FORBIDDEN") {
				setErrors({ ticketDrop: "You do not have permission to perform this action" });
			} else if (apiError.error?.code === "NOT_FOUND") {
				setErrors({ ticketDrop: "Organization not found" });
			} else {
				setErrors({ ticketDrop: "Something went wrong" });
			}
		}
	};

	const handleTaskDragStart = (task: TaskSummary, ticketId: string) => {
		if (!canDragTask(task)) return;
		setDraggedTask({ task, ticketId });
	};

	const handleTaskDrop = async (newStatus: TaskStatus) => {
		if (!draggedTask || !selectedTicketId) return;

		try {
			await updateTask(
				draggedTask.task.id,
				{
					status: newStatus,
				}
			);
			setSelectedTicketDetail(prev => prev ? {
				...prev,
				tasks: prev.tasks.map(t =>
					t.id === draggedTask.task.id
					? {...t, status: newStatus }
					: t
				)
			} : prev);
			setDraggedTask(null);
		} catch (error: unknown ) {
			const apiError = error as APIError;

			console.error("API call failed:", error);
			if (Array.isArray(apiError.detail) && apiError.detail.length > 0) {
				setErrors({ taskDrop: apiError.detail[0]?.msg ?? "Validation error" });
			} else if (apiError.error?.code === "INVALID_ASSIGNEE") {
				setErrors({ taskDrop: "Only users with Developer role can be assigned to tasks" });
			} else if (apiError.error?.code === "UNAUTHORIZED") {
				setErrors({ taskDrop: "Authentication required" });
				refreshUser();
			} else if (apiError.error?.code === "FORBIDDEN") {
				setErrors({ taskDrop: "You do not have permission to perform this action" });
			} else if (apiError.error?.code === "NOT_FOUND") {
				setErrors({ taskDrop: "Organization not found" });
			} else {
				setErrors({ taskDrop: "Something went wrong" });
			}
		}
	};

	//Getters
	const getTicketsByStatus = (status: TicketStatus) => ticketsBoard.filter((t) => t.status === status);


	useOrgWebSocket(orgId, (msg) => {
		switch (msg.event) {
			case "ticket.created":
			case "ticket.updated":
			case "ticket.moved":
			case "ticket.deleted":
				fetchTicketBoard();
				break;

			case "task.created":
			case "task.updated":
			case "task.deleted":
				fetchTicketBoard();
				if (selectedTicketId) {
					getTicketDetails(selectedTicketId).then(setSelectedTicketDetail);
				}
				break;

			case "blocker.created":
			case "blocker.updated":
			case "blocker.resolved":
				if (selectedTicketId) {
					getTicketDetails(selectedTicketId).then(setSelectedTicketDetail);
				}
				break;
		}
	});

	return {
		// States
		isCreateTicketOpen,
		ticketForm,
		isEditTicketOpen,
		isCreateTaskOpen,
		isCreateBlockerOpen,
		selectedTicket,
		authUser,
		teamMembers,
		selectedTask,
		blockerForm,
		confirmDelete,
		taskForm,
		errors,
		selectedTicketDetail,
		isLoading,
		isSaving,
		isDeleting,
		isCompleted,
		developerMembers,

		// Setters
		setIsCreateTicketOpen,
		setSelectedTicketId,
		setTicketForm,
		setIsCreateTaskOpen,
		setSelectedTask,
		setIsCreateBlockerOpen,
		setIsEditTicketOpen,
		setConfirmDelete,
		setTaskForm,
		setBlockerForm,
		setSelectedTicketDetail,

		// Getters
		getTicketsByStatus,
		getTasksForTicket,
		getActiveBlockers,

		// Handlers
		handleTicketDrop,
		handleTicketDrag,
		handleCreateTicket,
		handleTaskDrop,
		handleEditTicket,
		handleCreateTask,
		handleCreateBlocker,
		handleDeleteTicket,
		handleDeleteTask,
		handleTaskDragStart,
		handleSelectTicket,
		handleSelectTask,

		// Permissions
		canEditTask,
		canDragTask,
		isLeadRole,
		canEditTicketPriority,
	}
}
