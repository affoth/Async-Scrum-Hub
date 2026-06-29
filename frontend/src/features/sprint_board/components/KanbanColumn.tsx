import { Avatar } from "../../../components/custom/index";
import { PRIORITY_COLORS } from "../constants/sprint.constants";
import type {
	OrgMember,
	ListTicketsBoard,
	TicketStatus
} from "../types/sprint.types";

interface Column {
	id: TicketStatus;
	title: string;
	borderColor: string;
}

interface Props {
	column: Column;
	tickets: ListTicketsBoard[];
	teamMembers: OrgMember[];

	onSelectTicket: (id: string) => void;
	onTicketDrag: (tickets: ListTicketsBoard) => void;
	onTicketDrop: (status: TicketStatus) => void;
	canDragTicket: boolean;
}

export function KanbanColumn({
	column,
	tickets,
	teamMembers,

	onSelectTicket,
	onTicketDrag,
	onTicketDrop,
	canDragTicket,
}: Props) {

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-base text-gray-900">{column.title}</h3>
				<span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
					{tickets.length}
				</span>
			</div>
			<div
				className="bg-gray-50 rounded-2xl p-4 min-h-[600px] space-y-3"
				onDragOver={(e) => e.preventDefault()}
				onDrop={() => onTicketDrop(column.id)}
			>
				{tickets.length === 0 ? (
					<div className="flex items-center justify-center h-full pt-16">
						<p className="text-sm text-gray-400">No tickets yet</p>
					</div>
				) : (
					tickets.map((ticket) => {
						const member = teamMembers.find(
							(m) => m.id === ticket.assignee?.id
						);
						return (
							<div
								key={ticket.id}
								draggable={canDragTicket}
								onDragStart={() => onTicketDrag(ticket)}
								onClick={() => onSelectTicket(ticket.id)}
								className={`bg-white rounded-xl p-4 border border-gray-100 border-l-4 ${column.borderColor} hover:shadow-sm transition-shadow cursor-pointer ${
									canDragTicket
										? "cursor-grab active:cursor-grabbing"
										: ""
								}`}
							>
								<div className="flex items-start justify-between gap-2 mb-3">
									<span className="text-sm text-gray-900 flex-1">
										{ticket.title}
									</span>
									<span
										className={`text-xs px-2 py-1 rounded-lg shrink-0 ${
											PRIORITY_COLORS[ticket.priority]
										}`}
									>
										{ticket.priority}
									</span>
								</div>
								{member && (
									<div className="flex items-center gap-2">
										<Avatar
											avatarUrl={member.avatar_url}
											name={member.name}
											userId={member.id}
											size="sm"
										/>
										<span className="text-xs text-gray-400">{member.name}</span>
									</div>
								)}
							</div>
						);
					})
				)}
			</div>
		</div>
	);
}
