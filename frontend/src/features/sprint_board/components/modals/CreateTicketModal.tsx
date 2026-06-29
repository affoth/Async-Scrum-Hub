import {
	Button,
	Modal,
	Label,
	Input,
	Select,
	ErrorText
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
	form: TicketFormData;
	setForm: (from: TicketFormData) => void;
	teamMembers: OrgMember[];
	onSubmit: () => void;
	isSaving?: boolean;
	error?: string;
}

export function CreateTicketModal({
	onClose,
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
			title="Create Ticket"
			size="md"
			subtitle="New tickets will appear in To Do"
		>
			<div>
				<Label>
					Title <span className="text-rose-500">*</span>
				</Label>
				<Input
					type="text"
					value={form.title}
					onChange={(e) => setForm({ ...form, title: e.target.value })}
					placeholder="Enter ticket title"
					className="px-3 py-2 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-300 transition-colors"
				/>
			</div>
			<div>
				<Label>
					Description
				</Label>
				<textarea
					value={form.description}
					onChange={(e) => setForm({ ...form, description: e.target.value, })}
					placeholder="Add details (optional)"
					rows={4}
					className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-300 transition-colors resize-none"
				/>
			</div>
			<div>
				<Label>
					Priority <span className="text-rose-500">*</span>
				</Label>
				<div className="grid grid-cols-3 gap-3">
					{(["high", "medium", "low"] as Priority[]).map((p) => (
						<button
							key={p}
							type="button"
							onClick={() => setForm({ ...form, priority: p })}
							className={`font-medium rounded-xl transition-all text-xs px-4 py-2 border-2 ${
								form.priority === p
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
			{error && <ErrorText>{error}</ErrorText>}
			<div className="flex items-center justify-end gap-3 py-4 border-t border-gray-100">
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
					disabled={!form.title.trim() || !form.assignee || isSaving}
					isLoading={isSaving}
				>
					Create ticket
				</Button>
			</div>
		</Modal>
	);
}
