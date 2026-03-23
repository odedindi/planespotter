import dynamic from "next/dynamic";
import { RadarLoader } from "@/components/radar-loader";

const PlaneSpotterClient = dynamic(() => import("./plane-spotter-client"), {
	ssr: false,
	loading: () => (
		<div className="scanlines flex h-screen items-center justify-center bg-background">
			<div className="space-y-4 text-center">
				<div className="mx-auto h-16 w-16">
					<RadarLoader
						className="glow-pulse h-full w-full text-primary"
						title="Loading"
					/>
				</div>
				<p className="text-primary text-sm">INITIALIZING...</p>
			</div>
		</div>
	),
});

export default function Page() {
	return <PlaneSpotterClient />;
}
