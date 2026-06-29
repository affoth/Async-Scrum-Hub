import { MessageSquare, Columns, Flag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";

export function Welcome() {
	const navigate = useNavigate();

	const [isExiting, setIsExiting] = useState(false);
	const [exitDestination, setExitDestination] = useState("");

	const handleNavigate = (destination: string) => {
		setExitDestination(destination);
		setIsExiting(true);
	};

	const features = [
		{
			icon: MessageSquare,
			text: "Async standups",
		},
		{
			icon: Columns,
			text: "Sprint visibility",
		},
		{
			icon: Flag,
			text: "Blocker tracking",
		},
	];

	return (
		<motion.div
			className="min-h-screen bg-white flex items-center justify-center p-8"
			initial={{ opacity: 0 }} // Start invisible
			animate={{ opacity: isExiting ? 0 : 1 }}
			transition={{ duration: 0.4, ease: "easeOut" }}
			onAnimationComplete={() => {
				if (isExiting && exitDestination) {
					navigate(exitDestination);
				}
			}}
		>
			<div className="max-w-md w-full text-center">
				<div className="mb-8">
					<h1 className="text-3xl text-gray-900 mb-2">ScrumHub</h1>
					<p className="text-xl text-gray-600 mb-2">Async Scrum for distributed teams</p>
					<p className="text-sm text-gray-400">
						Reduce meetings. Increase visibility. Keep teams aligned.
					</p>
				</div>

				<div className="mb-10 space-y-4">
					{features.map((feature, index) => {
						const Icon = feature.icon;
						return (
							<div key={index} className="flex items-center gap-3 justify-center">
								<div className="p-2 bg-cyan-50 rounded-lg">
									<Icon className="w-4 h-4 text-cyan-600" />
								</div>
								<span className="text-sm text-gray-600">{feature.text}</span>
							</div>
						);
					})}
				</div>

				<div className="space-y-3">
					<button
						onClick={() => handleNavigate("/login")}
						className="w-full px-6 py-3 text-sm text-white bg-cyan-600 rounded-xl hover:bg-cyan-700 transition-colors"
					>
						Log in
					</button>
					<button
						onClick={() => handleNavigate("/signup")}
						className="w-full px-6 py-3 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
					>
						Sign up
					</button>
				</div>
			</div>
		</motion.div>
	);
}
