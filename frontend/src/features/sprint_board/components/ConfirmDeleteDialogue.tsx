import { ModalConfirmation } from "../../../components/custom/index";

interface Props {
	confirmDelete: { type: "ticket" | "task"; id: string } | null;
	onCancel: () => void;
	onDeleteTicket: () => void;
	onDeleteTask: () => void;
	isDeleting?: boolean;
}

export function ConfirmDeleteDialogue({
	confirmDelete,
	onCancel,
	onDeleteTicket,
	onDeleteTask,
	isDeleting = false,
}: Props) {
	if (!confirmDelete) return null;

	const isTicket = confirmDelete.type === "ticket";
	const description = isTicket
		? "This action cannot be undone. All tasks and blockers associated with this ticket will also be deleted."
		: "This action cannot be undone.";

	return (
		<ModalConfirmation
			isOpen={!!confirmDelete}
			onClose={onCancel}
			title={`Delete ${isTicket ? "Ticket" : "Task"}?`}
			description={description}
			confirmLabel="Delete"
			confirmVariant="danger"
			onConfirm={isTicket ? onDeleteTicket : onDeleteTask}
			isConfirming={isDeleting}
			confirmingLabel="Deleting..."
		/>
	);
}
