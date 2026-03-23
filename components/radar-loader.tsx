interface RadarLoaderProps {
	className?: string;
	title?: string;
}

export function RadarLoader({
	className = "h-full w-full text-primary",
	title = "Loading",
}: RadarLoaderProps) {
	return (
		<svg className={className} viewBox="0 0 100 100">
			<title>{title}</title>
			{/* Radar circles */}
			<circle
				cx="50"
				cy="50"
				r="45"
				fill="none"
				stroke="currentColor"
				strokeWidth="0.5"
				opacity="0.3"
			/>
			<circle
				cx="50"
				cy="50"
				r="35"
				fill="none"
				stroke="currentColor"
				strokeWidth="0.5"
				opacity="0.3"
			/>
			<circle
				cx="50"
				cy="50"
				r="25"
				fill="none"
				stroke="currentColor"
				strokeWidth="0.5"
				opacity="0.3"
			/>
			<circle
				cx="50"
				cy="50"
				r="15"
				fill="none"
				stroke="currentColor"
				strokeWidth="0.5"
				opacity="0.3"
			/>
			<circle
				cx="50"
				cy="50"
				r="5"
				fill="none"
				stroke="currentColor"
				strokeWidth="0.5"
				opacity="0.3"
			/>
			{/* Cross hairs */}
			<line
				x1="50"
				y1="5"
				x2="50"
				y2="95"
				stroke="currentColor"
				strokeWidth="0.3"
				opacity="0.3"
			/>
			<line
				x1="5"
				y1="50"
				x2="95"
				y2="50"
				stroke="currentColor"
				strokeWidth="0.3"
				opacity="0.3"
			/>
			{/* Radar sweep */}
			<path
				d="M50,50 L50,5 A45,45 0 0,1 95,50 Z"
				fill="url(#radar-loader-sweep)"
				className="radar-sweep"
			/>
			{/* Center dot */}
			<circle
				cx="50"
				cy="50"
				r="2"
				fill="currentColor"
				className="glow-pulse"
			/>
			<defs>
				<linearGradient
					id="radar-loader-sweep"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="100%"
				>
					<stop offset="0%" stopColor="currentColor" stopOpacity="0.4" />
					<stop offset="100%" stopColor="currentColor" stopOpacity="0" />
				</linearGradient>
			</defs>
		</svg>
	);
}
