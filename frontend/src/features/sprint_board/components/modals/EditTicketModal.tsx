import {
	Button,
	Modal,
	Label,
	ErrorText,
	Select
} from "../../../../components/custom/index";
import type { Priority, OrgMember } from "../../types/sprint.types";

type TicketFormData = {
	title: string;
	description: string;
	priority: Priority;
	assignee: string
};

interface Props {
	onClose: () => void;
	canEditPriority: boolean;
	canEditDescription: boolean;
	form: TicketFormData;
	setForm: (form: TicketFormData) => void;
	teamMembers: OrgMember[];
	onSubmit: () => void;
	isSaving?: boolean;
	error?: string;
}

export function EditTicketModal({
	onClose,
	canEditPriority,
	canEditDescription,
	form,
	setForm,
	teamMembers,
	onSubmit,
	isSaving = false,
	error,
}: Props) {

	return (
		<Modal
			isOpen={true}
			onClose={onClose}
			title="Edit Ticket"
			size="md"
		>
			<div className="space-y-4">
				<div>
					<Label htmlFor="edit-description">
						Description <span className="text-rose-500">*</span>
					</Label>
					{canEditDescription ? (
						<textarea
							id="edit-description"
							value={form.description}
							onChange={(e) =>
								setForm({
									...form,
									description: e.target.value,
								})
							}
							placeholder="Add details (optional)"
							rows={3}
							className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-300 transition-colors resize-none"
						/>
					) : (
						<textarea
							id="edit-description"
							value={form.description}
							disabled
							placeholder="Add details (optional)"
							rows={3}
							className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed resize-none"
						/>
					)}
				</div>

				<div>
					<Label>
						Priority
					</Label>
					{!canEditPriority && (
						<p className="text-xs text-gray-400 mb-2 mt-0.5">
							Managed by Product Owner
						</p>
					)}
					<div className="grid grid-cols-3 gap-3 mb-2">
							{(["high", "medium", "low"] as Priority[]).map((p) => (
								<button
							key={p}
							type="button"
							disabled={!canEditPriority}
							onClick={() => canEditPriority && setForm({ ...form, priority: p })}
							className={`font-medium rounded-xl transition-all text-xs px-4 py-2 border-2 ${
								!canEditPriority
									? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-50"
									: form.priority === p
										? p === "high"
											? "border-rose-400 bg-rose-50 text-rose-700"
											: p === "medium"
												? "border-amber-400 bg-amber-50 text-amber-700"
												: "border-gray-400 bg-gray-100 text-gray-700"
										: "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
							}`}
						>
							{p.charAt(0).toUpperCase() + p.slice(1)}
						</button>
							))}
					</div>
				</div>
				<div>
					<Label>
						Assignee <span className="text-rose-500">*</span>
					</Label>
					<Select
						value={form.assignee}
						onChange={(e) =>
							setForm({
								...form,
								assignee: e.target.value,
							})
						}
						options={[
							{ value: "", label: "Select team member" },
							...teamMembers
								.filter((m) => m.scrum_role === "developer")
								.map((member) => ({
									value: member.id,
									label: member.name,
								})),
						]}
						className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-300 transition-colors"
					/>
				</div>
			</div>
			{error && <ErrorText>{error}</ErrorText>}
			<div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
				<Button
					variant="secondary"
					size="md"
					className="text-sm"
					onClick={onClose}
					disabled={isSaving}
				>
					Cancel
				</Button>
				<Button
					variant="primary"
					size="md"
					className="bg-cyan-500 hover:bg-cyan-600"
					onClick={onSubmit}
					disabled={isSaving || !form.assignee}
					isLoading={isSaving}
				>
					Save
				</Button>
			</div>
		</Modal>
	);
}
