import { ErrorText } from "../../components/custom/index";
import { BOARD_COLUMNS } from "./constants/sprint.constants";
import { useSprintBoard } from "./hooks/useSprintBoard";
import { BoardHeader } from "./components/BoardHeader"
import { KanbanColumn } from "./components/KanbanColumn"
import { ConfirmDeleteDialogue } from "./components/ConfirmDeleteDialogue";
import { CreateBlockerModal } from "./components/modals/CreateBlockerModal"
import { TaskDetailModal } from "./components/modals/TaskDetailModal";
import { CreateTaskModal } from "./components/modals/CreateTaskModal";
import { EditTicketModal } from "./components/modals/EditTicketModal"
import { TicketDetailModal } from "./components/modals/TicketDetailModal";
import { CreateTicketModal } from "./components/modals/CreateTicketModal";


export function SprintBoard() {
	const {
		// States
		teamMembers,
		isCreateTicketOpen,
		ticketForm,
		isEditTicketOpen,
		isCreateTaskOpen,
		isCreateBlockerOpen,
		selectedTicket,
		selectedTask,
		blockerForm,
		confirmDelete,
		taskForm,
		selectedTicketDetail,
		errors,
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
		isLeadRole,
		canEditTicketPriority,
		canDragTask,
		canEditTask,
	} = useSprintBoard();

	if (isLoading) {
		return (
			<div className="p-8 flex items-center justify-center min-h-[400px]">
				<p className="text-sm text-gray-400">Loading board...</p>
			</div>
		);
	}

	if (errors.ticketBoard) {
		return ( <ErrorText>{errors.ticketBoard}</ErrorText>
		);
	}

	return (
		<div className="p-8">

			{/* Board Header */}
			<BoardHeader
				onCreateTicket={() => {
					setTicketForm({ title: "", description: "", priority: "medium", assignee: "" });
					setIsCreateTicketOpen(true)
				}}
				canCreateTicket={isLeadRole}
			/>

			{/* Kanban Column */}
			{errors.ticketDrop && <ErrorText>{errors.ticketDrop}</ErrorText>}
			<div className="grid grid-cols-3 gap-6 mt-4">
				{BOARD_COLUMNS.map((columns) => (
						<KanbanColumn
							key={columns.id}
							column={columns}
							tickets={getTicketsByStatus(columns.id)}
							teamMembers={teamMembers}
							onSelectTicket={handleSelectTicket}
							onTicketDrag={handleTicketDrag}
							onTicketDrop={handleTicketDrop}
							canDragTicket={isLeadRole}
						/>
					))}
			</div>

			{/* Create Ticket Modal */}
			{isCreateTicketOpen && (
				<CreateTicketModal
					onClose={() => setIsCreateTicketOpen(false)}
					form={ticketForm}
					setForm={setTicketForm}
					teamMembers={teamMembers}
					onSubmit={handleCreateTicket}
					isSaving={isSaving}
					error={errors.ticketCreate}
				/>
			)}

			{/* Ticket Detail Modal */}
				{selectedTicketDetail && !isEditTicketOpen && !isCreateTaskOpen && !isCreateBlockerOpen && (
				<TicketDetailModal
					ticket={selectedTicketDetail}
					tasks={getTasksForTicket()}
					blockers={getActiveBlockers()}

					onClose={() => {
						setSelectedTicketId(null);
						setSelectedTicketDetail(null);
					}}
					onOpenCreateTask={() => setIsCreateTaskOpen(true)}
					onOpenCreateBlocker={() => setIsCreateBlockerOpen(true)}
					onOpenEdit={() => {
						setTicketForm({
							...ticketForm,
							description: selectedTicketDetail.description ?? "",
							priority: selectedTicketDetail.priority,
							assignee: selectedTicketDetail.assignee_id ?? "",
						});
						setIsEditTicketOpen(true);
					}}
					onDeleteTicket={() =>
						setConfirmDelete({
							type: "ticket",
							id: selectedTicketDetail.id,
					})}

					onSelectTask={handleSelectTask}
					onTaskDragStart={(task) => handleTaskDragStart(task, selectedTicketDetail.id)}
					onTaskDrop={handleTaskDrop}
					canDragTask={canDragTask}

					completed={isCompleted}
					canEdit={isLeadRole}
					canDelete={isLeadRole}
					error={errors.ticketDelete}
					errorTaskDrop={errors.taskDrop}
				/>
			)}

			{/* Edit Ticket Priority Modal */}
			{isEditTicketOpen && selectedTicket && (
				<EditTicketModal
					onClose={() => setIsEditTicketOpen(false)}
					teamMembers={teamMembers}
					canEditPriority={canEditTicketPriority}
					canEditDescription={isLeadRole}
					form={ticketForm}
					setForm={setTicketForm}
					onSubmit={handleEditTicket}
					isSaving={isSaving}
					error={errors.ticketEdit}
				/>
			)}

			{/* Create Task Modal */}
			{isCreateTaskOpen && selectedTicket && (
				<CreateTaskModal
					onClose={() => setIsCreateTaskOpen(false)}
					form={taskForm}
					setForm={setTaskForm}
					teamMembers={teamMembers}
					onSubmit={handleCreateTask}
					isSaving={isSaving}
					error={errors.taskCreate}
				/>
			)}

			{/* Task Detail Modal */}
			{selectedTask && selectedTicket && (
				<TaskDetailModal
					onClose={() => setSelectedTask(null)}
					onDelete={() => setConfirmDelete({ type: "task", id: selectedTask.id })}
					task={selectedTask}
					teamMembers={teamMembers}
					canDelete={canEditTask(selectedTask)}
					error={errors.taskDelete}
					completed={isCompleted}
				/>
			)}

			{/* Create Blocker Modal */}
			{isCreateBlockerOpen && selectedTicketDetail && (
				<CreateBlockerModal
					onClose={() => setIsCreateBlockerOpen(false)}
					ticket={selectedTicketDetail}
					form={blockerForm}
					teamMembers={developerMembers}
					setForm={setBlockerForm}
					onSubmit={handleCreateBlocker}
					isSaving={isSaving}
					error={errors.blockerCreate}
				/>
			)}

			{/* Confirmation Dialog */}
			<ConfirmDeleteDialogue
				confirmDelete={confirmDelete}
				onCancel={() => setConfirmDelete(null)}
				onDeleteTicket={handleDeleteTicket}
				onDeleteTask={handleDeleteTask}
				isDeleting={isDeleting}
			/>
		</div>
	);
}
