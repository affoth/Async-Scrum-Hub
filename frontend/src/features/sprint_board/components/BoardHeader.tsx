import { Plus } from "lucide-react";
import { Button, PageHeader } from "../../../components/custom/index";

interface Props {
	onCreateTicket: () => void;
	canCreateTicket: boolean;
}

export function BoardHeader({
	onCreateTicket,
	canCreateTicket
}: Props) {
	
	return (
		<PageHeader
			title="Sprint Board"
			subtitle="Visualize your team's workflow"
			action={
				<div className="flex flex-col items-end gap-2">
					{canCreateTicket ? (
						<Button
							variant="outlined"
							size="md"
							onClick={onCreateTicket}
							icon={<Plus className="w-4 h-4" />}
							iconPosition="left"
						>
							Create Ticket
						</Button>
					) : (
						<div className="relative group">
							<Button
								disabled
								variant="ghost"
								size="sm"
								icon={<Plus className="w-4 h-4" />}
								iconPosition="left"
								className="flex text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed"
							>
								Create Ticket
							</Button>
							<div className="absolute right-0 top-full mt-1 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
								Only Product Owner or Scrum Master can create tickets
							</div>
						</div>
					)}
					<span className="text-xs text-gray-400">
						Managed by Product Owner / Scrum Master
					</span>
				</div>
			}
		/>
	);
}
