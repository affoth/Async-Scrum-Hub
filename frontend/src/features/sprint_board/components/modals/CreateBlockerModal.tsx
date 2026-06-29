import {
	Button,
	Modal,
	Label,
	Input,
	Select,
	ErrorText
} from "../../../../components/custom/index"
import type {Ticket, UserRef } from "../../types/sprint.types"

type BlockerFormData = {
	description: string;
	assignee: string
}

interface Props {
	onClose: () => void;
	ticket: Ticket;
	form: BlockerFormData;
	teamMembers: UserRef[];
	setForm: (form: BlockerFormData) => void;
	onSubmit: () => void;
	isSaving?: boolean;
	error?: string;
}

export function CreateBlockerModal({
	onClose,
	ticket,
	form,
	teamMembers,
	setForm,
	onSubmit,
	isSaving = false,
	error,
}: Props) {

	return (
	<Modal
		isOpen={true}
		onClose={onClose}
		title="Create Blocker"
		size="md"
	>
		<div className="space-y-4">
			<div>
				<Label>
					Description <span className="text-rose-500">*</span>
				</Label>
				<textarea
					value={form.description}
					onChange={(e) =>
						setForm({
							...form,
							description: e.target.value,
						})
					}
					placeholder="Describe what's blocking progress"
					rows={3}
					className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-300 transition-colors resize-none"
				/>
			</div>

			<div>
				<Label>
					Associated Ticket <span className="text-rose-500">*</span>
				</Label>
				<Input
					type="text"
					value={ticket.title}
					disabled
					className="px-3 py-2 bg-gray-50 border text-gray-600"
				/>
			</div>
			<div>
				<Select
					label="Related to (optional)"
					className="mb-4.5 bg-gray-50 border text-gray-600"
					value={form.assignee}
					onChange={(e) =>
						setForm({
							...form,
							assignee: e.target.value,
						})
					}
					options={[
						{ value: "", label: "Select related team member" },
						...teamMembers.map((member) => ({
							value: member.id,
							label: member.name,
						})),
					]}
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
				className="px-4 py-2 text-sm text-white bg-cyan-500 hover:bg-cyan-600 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				onClick={onSubmit}
				disabled={!form.description.trim() || isSaving}
				isLoading={isSaving}
			>
				Create blocker
			</Button>
		</div>
	</Modal>
	)
}
