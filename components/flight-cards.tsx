"use client";

import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { FlightData } from "@/lib/types";
import {
	calculateDistance,
	formatDistance,
	getAirlineName,
	getHeadingDirection,
	metersToFeet,
	msToKnots,
	OVERHEAD_THRESHOLD,
} from "@/lib/types";

interface FlightCardsProps {
	flights: FlightData[];
	userLat: number;
	userLon: number;
	radiusKm: number;
	units?: "metric" | "imperial";
	routes: Record<string, { origin: string; destination: string }>;
	isLoading: boolean;
	selectedFlight: string | null;
	onSelectFlight: (icao24: string | null) => void;
}

export function FlightCards({
	flights,
	userLat,
	userLon,
	radiusKm,
	units = "metric",
	routes,
	isLoading,
	selectedFlight,
	onSelectFlight,
}: FlightCardsProps) {
	// Sort by distance once, pre-compute per-flight values — memoized to avoid recalc on every render
	const sortedFlights = useMemo(() => {
		return [...flights]
			.map((flight) => {
				const distance = calculateDistance(
					userLat,
					userLon,
					flight.latitude,
					flight.longitude,
				);
				const isOverhead = distance < radiusKm * OVERHEAD_THRESHOLD;
				const callsign = flight.callsign?.trim() || flight.icao24;
				return { ...flight, distance, isOverhead, callsign };
			})
			.sort((a, b) => a.distance - b.distance);
	}, [flights, userLat, userLon, radiusKm]);

	if (isLoading) {
		return (
			<div className="space-y-3 p-4">
				{[1, 2, 3, 4].map((i) => (
					<div key={i} className="space-y-3 border border-border bg-card p-4">
						<div className="flex justify-between">
							<Skeleton className="h-5 w-24 bg-muted" />
							<Skeleton className="h-5 w-20 bg-muted" />
						</div>
						<Skeleton className="h-4 w-32 bg-muted" />
						<div className="grid grid-cols-3 gap-2">
							<Skeleton className="h-4 w-full bg-muted" />
							<Skeleton className="h-4 w-full bg-muted" />
							<Skeleton className="h-4 w-full bg-muted" />
						</div>
					</div>
				))}
			</div>
		);
	}

	if (!flights.length) {
		return (
			<div className="flex h-64 items-center justify-center p-4">
				<div className="space-y-2 text-center">
					<p className="text-muted-foreground">No aircraft detected</p>
					<p className="text-muted-foreground text-xs">Scanning airspace...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-0">
			{sortedFlights.map((flight) => {
				const { distance, isOverhead, callsign } = flight;
				const isSelected = selectedFlight === flight.icao24;
				const airline = getAirlineName(callsign);
				const route = routes[callsign];

				return (
					<button
						key={flight.icao24}
						type="button"
						onClick={() => onSelectFlight(isSelected ? null : flight.icao24)}
						className={`w-full cursor-pointer space-y-3 border p-4 text-left transition-all ${
							isSelected
								? "selected-plane border-primary bg-primary/20"
								: isOverhead
									? "glow border-primary bg-primary/10 hover:bg-primary/15"
									: "border-border bg-card hover:border-primary/50 hover:bg-card/80"
						}`}
					>
						{/* Header */}
						<div className="flex items-start justify-between">
							<div>
								<div className="flex items-center gap-2">
									<span
										className={`font-bold text-lg ${isOverhead || isSelected ? "text-glow text-primary" : "text-foreground"}`}
									>
										{callsign}
									</span>
									{isOverhead && (
										<span className="blink bg-primary px-1.5 py-0.5 text-primary-foreground text-xs">
											OVERHEAD
										</span>
									)}
									{isSelected && (
										<span className="bg-secondary px-1.5 py-0.5 text-secondary-foreground text-xs">
											SELECTED
										</span>
									)}
								</div>
								<p className="text-muted-foreground text-sm">{airline}</p>
							</div>
							<div className="text-right text-muted-foreground text-xs">
								<p>{formatDistance(distance, units)}</p>
							</div>
						</div>

						{/* Route */}
						{route && (
							<div className="flex items-center gap-2 text-sm">
								<span className="text-primary">{route.origin}</span>
								<span className="text-muted-foreground">-</span>
								<span className="text-primary">{route.destination}</span>
							</div>
						)}

						{/* Flight data grid */}
						<div className="grid grid-cols-3 gap-3 text-xs">
							<div>
								<p className="text-muted-foreground">ALT</p>
								<p className="text-foreground">
									{metersToFeet(flight.altitude).toLocaleString()} ft
								</p>
							</div>
							<div>
								<p className="text-muted-foreground">SPD</p>
								<p className="text-foreground">
									{msToKnots(flight.velocity)} kts
								</p>
							</div>
							<div>
								<p className="text-muted-foreground">HDG</p>
								<p className="text-foreground">
									{Math.round(flight.heading)}°{" "}
									{getHeadingDirection(flight.heading)}
								</p>
							</div>
						</div>

						{/* Heading indicator */}
						<div className="flex items-center gap-2">
							<svg
								className="h-4 w-4 text-primary"
								viewBox="0 0 24 24"
								style={{ transform: `rotate(${flight.heading}deg)` }}
							>
								<title>Heading: {Math.round(flight.heading)}°</title>
								<path d="M12 2L16 20L12 16L8 20L12 2Z" fill="currentColor" />
							</svg>
							<div className="h-px flex-1 bg-border" />
							<span className="text-muted-foreground text-xs">
								{flight.onGround ? "ON GROUND" : "AIRBORNE"}
							</span>
						</div>
					</button>
				);
			})}
		</div>
	);
}
