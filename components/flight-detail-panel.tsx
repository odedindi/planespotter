"use client";

import { Button } from "@/components/ui/button";
import type { FlightData } from "@/lib/types";
import {
	calculateDistance,
	formatDistance,
	formatSpeed,
	getAirlineName,
	getHeadingDirection,
	metersToFeet,
	msToKnots,
	OVERHEAD_THRESHOLD,
} from "@/lib/types";

interface FlightDetailPanelProps {
	flight: FlightData;
	userLat: number;
	userLon: number;
	radiusKm: number;
	units?: "metric" | "imperial";
	route?: { origin: string; destination: string };
	onClose: () => void;
}

export function FlightDetailPanel({
	flight,
	userLat,
	userLon,
	radiusKm,
	units = "metric",
	route,
	onClose,
}: FlightDetailPanelProps) {
	const distance = calculateDistance(
		userLat,
		userLon,
		flight.latitude,
		flight.longitude,
	);
	const isOverhead = distance < radiusKm * OVERHEAD_THRESHOLD;
	const callsign = flight.callsign?.trim() || flight.icao24;
	const airline = getAirlineName(callsign);
	const altitudeFt = metersToFeet(flight.altitude);
	const speedKts = msToKnots(flight.velocity);
	const verticalFpm = Math.round(flight.verticalRate * 196.85); // m/s to ft/min

	return (
		<div className="selected-plane space-y-4 border-2 border-primary bg-card p-4">
			{/* Header */}
			<div className="flex items-start justify-between">
				<div>
					<div className="flex items-center gap-2">
						<h3 className="font-bold text-2xl text-glow text-primary">
							{callsign}
						</h3>
						{isOverhead && (
							<span className="blink bg-primary px-2 py-1 text-primary-foreground text-xs">
								OVERHEAD
							</span>
						)}
					</div>
					<p className="text-muted-foreground">{airline}</p>
					<p className="mt-1 text-muted-foreground text-xs">
						{flight.originCountry}
					</p>
				</div>
				<Button
					variant="ghost"
					size="sm"
					onClick={onClose}
					className="text-muted-foreground hover:text-foreground"
				>
					<svg
						className="h-5 w-5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
					>
						<title>Close</title>
						<path d="M18 6L6 18M6 6l12 12" />
					</svg>
				</Button>
			</div>

			{/* Route */}
			{route && (
				<div className="flex items-center gap-3 border-border border-y py-2">
					<div className="text-center">
						<p className="font-bold text-lg text-primary">{route.origin}</p>
						<p className="text-muted-foreground text-xs">Origin</p>
					</div>
					<div className="flex flex-1 items-center justify-center">
						<svg
							className="h-8 w-8 text-primary"
							viewBox="0 0 24 24"
							style={{ transform: `rotate(${flight.heading}deg)` }}
						>
							<title>Flight Route</title>
							<path d="M12 2L16 20L12 16L8 20L12 2Z" fill="currentColor" />
						</svg>
					</div>
					<div className="text-center">
						<p className="font-bold text-lg text-primary">
							{route.destination}
						</p>
						<p className="text-muted-foreground text-xs">Destination</p>
					</div>
				</div>
			)}

			{/* Flight Data Grid */}
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-1">
					<p className="text-muted-foreground text-xs uppercase">Altitude</p>
					<p className="font-bold text-foreground text-lg">
						{altitudeFt.toLocaleString()} ft
					</p>
					<p className="text-muted-foreground text-xs">
						({Math.round(flight.altitude).toLocaleString()} m)
					</p>
				</div>
				<div className="space-y-1">
					<p className="text-muted-foreground text-xs uppercase">
						Ground Speed
					</p>
					<p className="font-bold text-foreground text-lg">{speedKts} kts</p>
					<p className="text-muted-foreground text-xs">
						({formatSpeed(flight.velocity, units)})
					</p>
				</div>
				<div className="space-y-1">
					<p className="text-muted-foreground text-xs uppercase">Heading</p>
					<p className="font-bold text-foreground text-lg">
						{Math.round(flight.heading)}°
					</p>
					<p className="text-muted-foreground text-xs">
						{getHeadingDirection(flight.heading)}
					</p>
				</div>
				<div className="space-y-1">
					<p className="text-muted-foreground text-xs uppercase">Distance</p>
					<p className="font-bold text-foreground text-lg">
						{formatDistance(distance, units)}
					</p>
					<p className="text-muted-foreground text-xs">
						({(distance * 0.539957).toFixed(1)} nm)
					</p>
				</div>
				<div className="space-y-1">
					<p className="text-muted-foreground text-xs uppercase">
						Vertical Rate
					</p>
					<p
						className={`font-bold text-lg ${verticalFpm > 0 ? "text-green-500" : verticalFpm < 0 ? "text-orange-500" : "text-foreground"}`}
					>
						{verticalFpm > 0 ? "+" : ""}
						{verticalFpm} ft/min
					</p>
					<p className="text-muted-foreground text-xs">
						{verticalFpm > 100
							? "Climbing"
							: verticalFpm < -100
								? "Descending"
								: "Level"}
					</p>
				</div>
				<div className="space-y-1">
					<p className="text-muted-foreground text-xs uppercase">Status</p>
					<p className="font-bold text-foreground text-lg">
						{flight.onGround ? "On Ground" : "Airborne"}
					</p>
					{flight.squawk && (
						<p className="text-muted-foreground text-xs">
							Squawk: {flight.squawk}
						</p>
					)}
				</div>
			</div>

			{/* Position */}
			<div className="border-border border-t pt-2">
				<p className="mb-2 text-muted-foreground text-xs uppercase">Position</p>
				<div className="flex items-center justify-between">
					<p className="text-foreground text-sm">
						{flight.latitude.toFixed(4)}°, {flight.longitude.toFixed(4)}°
					</p>
					<p className="text-muted-foreground text-xs">
						ICAO: {flight.icao24.toUpperCase()}
					</p>
				</div>
			</div>

			{/* Compass */}
			<div className="flex justify-center pt-2">
				<div className="relative h-24 w-24">
					<svg className="h-full w-full text-primary" viewBox="0 0 100 100">
						<title>Compass</title>
						<circle
							cx="50"
							cy="50"
							r="45"
							fill="none"
							stroke="currentColor"
							strokeWidth="1"
							opacity="0.3"
						/>
						<text
							x="50"
							y="12"
							textAnchor="middle"
							fill="currentColor"
							fontSize="8"
						>
							N
						</text>
						<text
							x="50"
							y="95"
							textAnchor="middle"
							fill="currentColor"
							fontSize="8"
						>
							S
						</text>
						<text
							x="8"
							y="53"
							textAnchor="middle"
							fill="currentColor"
							fontSize="8"
						>
							W
						</text>
						<text
							x="92"
							y="53"
							textAnchor="middle"
							fill="currentColor"
							fontSize="8"
						>
							E
						</text>
						<g transform={`rotate(${flight.heading}, 50, 50)`}>
							<path d="M50,15 L55,50 L50,45 L45,50 Z" fill="currentColor" />
							<circle cx="50" cy="50" r="3" fill="currentColor" />
						</g>
					</svg>
				</div>
			</div>
		</div>
	);
}
