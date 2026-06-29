import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Columns, Flag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button, IconBox } from "../../components/custom/index";

type Particle = {
	start: { x: number; y: number };
	end: { x: number; y: number };
	size: number;
	delay: number;
	opacity: number;
	color: string;
};

function rand(min: number, max: number) {
	return Math.random() * (max - min) + min;
}

function pickBlueHue(opacity: number) {
	const r = Math.random();

	if (r < 0.25) return `rgba(34, 211, 238, ${opacity})`; // cyan-400
	if (r < 0.55) return `rgba(56, 189, 248, ${opacity})`; // sky-400
	if (r < 0.85) return `rgba(59, 130, 246, ${opacity})`; // blue-500
	return `rgba(37, 99, 235, ${opacity})`; // blue-600
}

function pickEdgeSpawn(): { x: number; y: number } {
	// spawn just outside the viewport-ish box the animation container
	const edge = Math.floor(rand(0, 4)); // 0 top, 1 right, 2 bottom, 3 left
	const margin = 1500;

	if (edge === 0) return { x: rand(-margin, margin), y: -margin };
	if (edge === 1) return { x: margin, y: rand(-margin, margin) };
	if (edge === 2) return { x: rand(-margin, margin), y: margin };
	return { x: -margin, y: rand(-margin, margin) };
}

export function WelcomeAnimation() {
	const navigate = useNavigate();

	const [animationStage, setAnimationStage] = useState<
		"initial" | "emergence" | "convergence" | "identity" | "transformation" | "complete"
	>("initial");
	const [showContent, setShowContent] = useState(false);
	const [isExiting, setIsExiting] = useState(false);
	const [exitDestination, setExitDestination] = useState("");

	useEffect(() => {
		const timeline = async () => {
			// Initial state - reduced delay for faster particle appearance
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Convergence - particles move to center
			setAnimationStage("convergence");
			await new Promise((resolve) => setTimeout(resolve, 3600)); // Increased to allow particles to settle

			// Transformation - particles expand outward
			setAnimationStage("transformation");
			await new Promise((resolve) => setTimeout(resolve, 3000));

			// Complete - show final content
			setAnimationStage("complete");
			setShowContent(true);
		};

		timeline();
	}, []);

	const particles = useMemo<Particle[]>(() => {
		const count = 1000;
		const out: Particle[] = [];

		for (let i = 0; i < count; i++) {
			const start = pickEdgeSpawn();

			// end positions: subtle "halo" around center, not a blob
			const angle = rand(0, Math.PI * 2);
			const radius = rand(105, 122); // tweak the logo "density"
			const end = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };

			out.push({
				start,
				end,
				size: rand(1.5, 3.0), // tiny
				delay: rand(0, 0.2), // stagger
				opacity: rand(0.25, 0.75),
				color: pickBlueHue(1),
			});
		}
		return out;
	}, []);

	const handleNavigate = (destination: string) => {
		setExitDestination(destination); // Step 1: Remember where we're going
		setIsExiting(true); // Step 2: Trigger the fade-out animation

		// Navigation happens later, in the animation callback
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
		<div className="min-h-screen bg-white flex items-center justify-center p-8 overflow-hidden">
			<div className="max-w-md w-full text-center relative">
				{/* Animation Layer */}
				{!showContent && (
					<div className="absolute inset-0 flex items-center justify-center">
						<div className="relative w-80 h-80">
							{particles.map((p, i) => (
								<motion.div
									key={i}
									className="absolute rounded-full"
									style={{
										left: "50%",
										top: "50%",
										width: p.size,
										height: p.size,
										background: p.color,
										boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
										filter: "blur(0.2px)",
									}}
									initial={{
										x: p.start.x,
										y: p.start.y,
										opacity: 0,
									}}
									animate={
										animationStage === "convergence"
											? {
												x: p.end.x,
												y: p.end.y,
												opacity: p.opacity,
												}
											: animationStage === "transformation"
												? {
													x: p.end.x * 6.5,
													y: p.end.y * 6.5,
													opacity: 0,
													}
												: { opacity: 0 }
									}
									transition={
										animationStage === "convergence" // IF convergence stage
											? {
												// THEN use these settings:
												duration: 3.0, // ← Duration for convergence (particles moving TO center)
												ease: [0.42, 1, 0.36, 1],
												delay:
													animationStage === "convergence"
														? p.delay
														: 0,
												}
											: {
												// ELSE (transformation stage)
												duration: 3.6, // ← Duration for transformation (particles expanding OUT)
												}
									}
								/>
							))}
						</div>
					</div>
				)}

				{/* Animated Title - appears with particles, fades out with them */}
				{!showContent && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{
							opacity:
								animationStage === "convergence"
									? 1
									: animationStage === "transformation"
										? 0
										: 0,
						}}
						transition={{
							opacity: {
								duration: animationStage === "transformation" ? 2.0 : 3.5, // Slower fade-in
								ease: "easeOut",
							},
						}}
						className="absolute inset-0 flex items-center justify-center pointer-events-none"
					>
						<h1 className="text-5xl font-bold text-gray-900">ScrumHub</h1>
					</motion.div>
				)}
				
				{/* Final Content - Welcome page */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: isExiting ? 0 : showContent ? 1 : 0 }}
					transition={{ duration: 0.6, ease: "easeOut" }}
					onAnimationComplete={() => {
						if (isExiting && exitDestination) {
							navigate(exitDestination);
						}
					}}
				>
					<div className="mb-8">
						<h1 className="text-3xl text-gray-900 mb-2">ScrumHub</h1>
						<p className="text-xl text-gray-600 mb-2">
							Async Scrum for distributed teams
						</p>
						<p className="text-sm text-gray-400">
							Reduce meetings. Increase visibility. Keep teams aligned.
						</p>
					</div>

					<div className="mb-10 space-y-4">
						{features.map((feature, index) => {
							const Icon = feature.icon;
							return (
								<motion.div
									key={index}
									className="flex items-center gap-3 justify-center"
									initial={{ opacity: 0, x: -20 }}
									animate={{
										opacity: showContent ? 1 : 0,
										x: showContent ? 0 : -20,
									}}
									transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
								>
									<IconBox
										icon={<Icon className="w-4 h-4 text-cyan-600" />}
										bgColor="bg-cyan-50"
									/>
									<span className="text-sm text-gray-600">{feature.text}</span>
								</motion.div>
							);
						})}
					</div>

					<motion.div
						className="space-y-3"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
						transition={{ duration: 0.5, delay: 0.6 }}
					>
						<Button
							variant="primary"
							size="lg"
							onClick={() => handleNavigate("/login")}
							className="w-full"
						>
							Log in
						</Button>
						<Button
							variant="secondary"
							size="lg"
							onClick={() => handleNavigate("/signup")}
							className="w-full"
						>
							Sign up
						</Button>
					</motion.div>
				</motion.div>
			</div>
		</div>
	);
}
