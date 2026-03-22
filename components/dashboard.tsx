"use client";

import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState } from "react";
import { useVoice } from "@/hooks/use-voice";
import { generateDemoFlights, getDemoRoutes } from "@/lib/demo-data";
import type {
	FlightData,
	Stats,
	UserSettings,
	VoiceSettings,
} from "@/lib/types";
import {
	calculateDistance,
	getDefaultVoiceSettings,
	OVERHEAD_THRESHOLD,
} from "@/lib/types";
import { FlightCards } from "./flight-cards";
import { FlightDetailPanel } from "./flight-detail-panel";
import { Radar } from "./radar";
import { SettingsModal } from "./settings-modal";
import { StatsBar } from "./stats-bar";

interface DashboardProps {
	initialSettings: UserSettings;
	onSettingsChange: (settings: UserSettings) => void;
}

export function Dashboard({
	initialSettings,
	onSettingsChange,
}: DashboardProps) {
	const [settings, setSettings] = useState(initialSettings);
	const [flights, setFlights] = useState<FlightData[]>([]);
	const [routes, setRoutes] = useState<
		Record<string, { origin: string; destination: string }>
	>({});
	const [isLoading, setIsLoading] = useState(true);
	const [isDemoMode, setIsDemoMode] = useState(false);
	const [refreshKey, setRefreshKey] = useState(0);
	const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
	const [stats, setStats] = useState<Stats>({
		todayCount: 0,
		busiestHour: "12:00",
		overheadCount: 0,
		lastFlight: "",
	});

	const { theme, setTheme } = useTheme();

	const voiceSettings: VoiceSettings =
		settings.voiceSettings || getDefaultVoiceSettings();
	const { announceOverheadFlight, stopSpeaking } = useVoice(voiceSettings);
	const todayFlights = useRef<Set<string>>(new Set());
	const hourlyCount = useRef<Record<number, number>>({});

	// Store the announcement function in a ref to avoid dependency issues
	const announceRef = useRef(announceOverheadFlight);
	announceRef.current = announceOverheadFlight;
	const voiceEnabledRef = useRef(voiceSettings.enabled);
	voiceEnabledRef.current = voiceSettings.enabled;

	// Get the selected flight data
	const selectedFlightData = flights.find((f) => f.icao24 === selectedFlight);

	const fetchFlights = useCallback(async () => {
		try {
			const params = new URLSearchParams({
				lat: settings.latitude.toString(),
				lon: settings.longitude.toString(),
				radius: settings.radiusKm.toString(),
			});

			const headers: HeadersInit = {};
			if (settings.apiClientId && settings.apiClientSecret) {
				headers["x-opensky-client-id"] = settings.apiClientId;
				headers["x-opensky-client-secret"] = settings.apiClientSecret;
			}

			const response = await fetch(`/api/flights?${params}`, { headers });
			const data = await response.json();

			if (data.demoMode || !data.states || !data.states.length) {
				// Use demo data
				setIsDemoMode(true);
				const demoFlights = generateDemoFlights(
					settings.latitude,
					settings.longitude,
					settings.radiusKm,
				);
				setFlights(demoFlights);
				setRoutes(getDemoRoutes());
			} else {
				setIsDemoMode(false);
				// Parse OpenSky response
				const parsedFlights: FlightData[] = data.states
					.map((state: (string | number | boolean | null)[]) => ({
						icao24: state[0] as string,
						callsign: (state[1] as string)?.trim() || "",
						originCountry: state[2] as string,
						longitude: state[5] as number,
						latitude: state[6] as number,
						altitude: (state[7] as number) || (state[13] as number) || 0,
						velocity: (state[9] as number) || 0,
						heading: (state[10] as number) || 0,
						verticalRate: (state[11] as number) || 0,
						onGround: state[8] as boolean,
						squawk: (state[14] as string) || "",
						spiFlag: state[15] as boolean,
						positionSource: state[16] as number,
					}))
					.filter((f: FlightData) => f.latitude && f.longitude);

				setFlights(parsedFlights);
			}

			setIsLoading(false);
		} catch (error) {
			console.error("Error fetching flights:", error);
			// Fallback to demo mode
			setIsDemoMode(true);
			const demoFlights = generateDemoFlights(
				settings.latitude,
				settings.longitude,
				settings.radiusKm,
			);
			setFlights(demoFlights);
			setRoutes(getDemoRoutes());
			setIsLoading(false);
		}
	}, [settings]);

	// Track overhead flights and stats
	useEffect(() => {
		const currentHour = new Date().getHours();
		let overheadCount = 0;

		flights.forEach((flight) => {
			const distance = calculateDistance(
				settings.latitude,
				settings.longitude,
				flight.latitude,
				flight.longitude,
			);
			const isOverhead = distance < settings.radiusKm * OVERHEAD_THRESHOLD;

			// Track for today's count
			todayFlights.current.add(flight.icao24);

			// Track hourly
			hourlyCount.current[currentHour] =
				(hourlyCount.current[currentHour] || 0) + 1;

			if (isOverhead) {
				overheadCount++;

				// Announce new overhead flights
				if (voiceEnabledRef.current) {
					announceRef.current(flight);
				}
			}
		});

		// Calculate busiest hour
		let busiestHour = 12;
		let maxCount = 0;
		Object.entries(hourlyCount.current).forEach(([hour, count]) => {
			if (count > maxCount) {
				maxCount = count;
				busiestHour = parseInt(hour, 10);
			}
		});

		setStats({
			todayCount: todayFlights.current.size,
			busiestHour: `${busiestHour.toString().padStart(2, "0")}:00`,
			overheadCount,
			lastFlight: flights[0]?.callsign?.trim() || "",
		});
	}, [flights, settings]);

	// Initial fetch
	useEffect(() => {
		fetchFlights();
	}, [fetchFlights]);

	// Polling — fetch every 15 s, bump refreshKey to restart the CSS progress bar
	useEffect(() => {
		const interval = setInterval(() => {
			fetchFlights();
			setRefreshKey((k) => k + 1);
		}, 15_000);

		return () => clearInterval(interval);
	}, [fetchFlights]);

	const handleSettingsChange = (newSettings: UserSettings) => {
		setSettings(newSettings);
		onSettingsChange(newSettings);
		setIsLoading(true);
		setRefreshKey((k) => k + 1);
	};

	const handleSelectFlight = (icao24: string | null) => {
		setSelectedFlight(icao24);
	};

	// Cycle through themes
	const cycleTheme = () => {
		if (theme === "system") setTheme("light");
		else if (theme === "light") setTheme("dark");
		else setTheme("system");
	};

	return (
		<div className="scanlines flex h-screen flex-col bg-background">
			{/* Top Bar */}
			<header className="flex items-center justify-between border-border border-b bg-card/50 px-4 py-3">
				<div className="flex items-center gap-3">
					<h1 className="font-bold text-glow text-lg text-primary">
						PLANE SPOTTER
					</h1>
					<div className="hidden items-center gap-2 text-muted-foreground text-xs sm:flex">
						<span>
							{settings.latitude.toFixed(2)}, {settings.longitude.toFixed(2)}
						</span>
					</div>
				</div>

				<div className="flex items-center gap-3">
					{/* Demo Mode Badge */}
					{isDemoMode && (
						<span className="border border-border bg-muted px-2 py-1 text-muted-foreground text-xs">
							DEMO MODE
						</span>
					)}

					{/* Refresh progress bar — pure CSS, restarted via key */}
					<div
						key={refreshKey}
						className="radar-refresh hidden h-0.5 w-12 overflow-hidden bg-muted sm:block"
						title="Refreshing in 15s"
					>
						<div className="radar-refresh-bar h-full bg-primary" />
					</div>

					{/* Live Indicator */}
					<div className="flex items-center gap-1.5">
						<span className="blink glow h-2 w-2 bg-primary" />
						<span className="text-primary text-xs">LIVE</span>
					</div>

					{/* Theme Toggle */}
					<button
						type="button"
						onClick={cycleTheme}
						className="border border-border p-1.5 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
						title={`Theme: ${theme}`}
					>
						{theme === "dark" ? (
							<svg
								className="h-4 w-4"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
							>
								<title>Dark Theme</title>
								<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
							</svg>
						) : theme === "light" ? (
							<svg
								className="h-4 w-4"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
							>
								<title>Light Theme</title>
								<circle cx="12" cy="12" r="4" />
								<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
							</svg>
						) : (
							<svg
								className="h-4 w-4"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
							>
								<title>System Theme</title>

								<rect x="2" y="3" width="20" height="14" rx="2" />
								<path d="M8 21h8M12 17v4" />
							</svg>
						)}
					</button>

					{/* Voice Toggle Quick Button */}
					<button
						type="button"
						onClick={() => {
							const newEnabled = !voiceSettings.enabled;
							// If muting, stop any current speech immediately
							if (!newEnabled) {
								stopSpeaking();
							}
							handleSettingsChange({
								...settings,
								voiceEnabled: newEnabled,
								voiceSettings: { ...voiceSettings, enabled: newEnabled },
							});
						}}
						className={`border p-1.5 ${voiceSettings.enabled ? "border-primary text-primary" : "border-muted-foreground text-muted-foreground"}`}
						title={
							voiceSettings.enabled ? "Voice alerts on" : "Voice alerts off"
						}
					>
						<svg
							className="h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<title>Voice Alerts</title>

							<path d="M11 5L6 9H2v6h4l5 4V5z" />
							{voiceSettings.enabled ? (
								<>
									<path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
									<path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
								</>
							) : (
								<path d="M23 9l-6 6M17 9l6 6" />
							)}
						</svg>
					</button>

					{/* Settings */}
					<SettingsModal settings={settings} onSave={handleSettingsChange} />
				</div>
			</header>

			{/* Main Content - Responsive Layout */}
			<main className="flex flex-1 flex-col overflow-hidden lg:flex-row">
				{/* Radar Panel */}
				<div className="flex items-center justify-center p-4 lg:w-[60%]">
					<Radar
						flights={flights}
						userLat={settings.latitude}
						userLon={settings.longitude}
						radiusKm={settings.radiusKm}
						selectedFlight={selectedFlight}
						onSelectFlight={handleSelectFlight}
						className="aspect-square w-full max-w-125 lg:max-w-none"
					/>
				</div>

				{/* Flight Cards Panel */}
				<div className="flex flex-1 flex-col overflow-y-auto border-border border-t lg:w-[40%] lg:flex-none lg:border-t-0 lg:border-l">
					{/* Selected Flight Detail */}
					{selectedFlightData && (
						<div className="border-border border-b p-4">
							<FlightDetailPanel
								flight={selectedFlightData}
								userLat={settings.latitude}
								userLon={settings.longitude}
								radiusKm={settings.radiusKm}
								units={settings.units ?? "metric"}
								route={routes[selectedFlightData.callsign?.trim() || ""]}
								onClose={() => setSelectedFlight(null)}
							/>
						</div>
					)}

					<div className="sticky top-0 z-10 border-border border-b bg-card/90 px-4 py-2 backdrop-blur">
						<h2 className="text-primary text-sm">
							DETECTED AIRCRAFT ({flights.length})
						</h2>
					</div>
					<FlightCards
						flights={flights}
						userLat={settings.latitude}
						userLon={settings.longitude}
						radiusKm={settings.radiusKm}
						units={settings.units ?? "metric"}
						routes={routes}
						isLoading={isLoading}
						selectedFlight={selectedFlight}
						onSelectFlight={handleSelectFlight}
					/>
				</div>
			</main>

			{/* Stats Bar */}
			<StatsBar stats={stats} />
		</div>
	);
}
