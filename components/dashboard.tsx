"use client";

import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFlights } from "@/hooks/use-flights";
import { useVoice } from "@/hooks/use-voice";
import { refreshKeyAtom, selectedFlightAtom, settingsAtom } from "@/lib/store";
import type { Stats, UserSettings, VoiceSettings } from "@/lib/types";
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

export function Dashboard() {
	const [settings, setSettings] = useAtom(settingsAtom);
	const [selectedFlight, setSelectedFlight] = useAtom(selectedFlightAtom);
	const refreshKey = useAtomValue(refreshKeyAtom);

	// settings is guaranteed non-null here (page.tsx guards the onboarding gate)
	const s = settings as UserSettings;

	const voiceSettings: VoiceSettings =
		s.voiceSettings || getDefaultVoiceSettings();

	const { announceOverheadFlight, stopSpeaking } = useVoice(voiceSettings);

	// Stable refs so the flights effect doesn't need these in its dep array
	const announceRef = useRef(announceOverheadFlight);
	announceRef.current = announceOverheadFlight;
	const voiceEnabledRef = useRef(voiceSettings.enabled);
	voiceEnabledRef.current = voiceSettings.enabled;

	// ── Per-session counters (not in atoms — intentionally reset on page load) ──
	const todayFlights = useRef<Set<string>>(new Set());
	const hourlyCount = useRef<Record<number, number>>({});

	// ── Flight data via SWR ───────────────────────────────────────────────────
	const { flights, routes, isDemoMode, apiError, isLoading } = useFlights(s);

	// ── Stats derived from flights ────────────────────────────────────────────
	const stats = useMemo((): Stats => {
		const currentHour = new Date().getHours();
		let overheadCount = 0;

		for (const flight of flights) {
			const distance = calculateDistance(
				s.latitude,
				s.longitude,
				flight.latitude,
				flight.longitude,
			);
			const isOverhead = distance < s.radiusKm * OVERHEAD_THRESHOLD;

			todayFlights.current.add(flight.icao24);
			hourlyCount.current[currentHour] =
				(hourlyCount.current[currentHour] || 0) + 1;

			if (isOverhead) overheadCount++;
		}

		let busiestHour = 12;
		let maxCount = 0;
		for (const [hour, count] of Object.entries(hourlyCount.current)) {
			if (count > maxCount) {
				maxCount = count;
				busiestHour = parseInt(hour, 10);
			}
		}

		return {
			todayCount: todayFlights.current.size,
			busiestHour: `${busiestHour.toString().padStart(2, "0")}:00`,
			overheadCount,
			lastFlight: flights[0]?.callsign?.trim() || "",
		};
	}, [flights, s]);

	// ── Voice announcements ───────────────────────────────────────────────────
	useEffect(() => {
		for (const flight of flights) {
			const distance = calculateDistance(
				s.latitude,
				s.longitude,
				flight.latitude,
				flight.longitude,
			);
			const isOverhead = distance < s.radiusKm * OVERHEAD_THRESHOLD;
			if (isOverhead && voiceEnabledRef.current) {
				announceRef.current(flight);
			}
		}
	}, [flights, s]);

	// ── Handlers ─────────────────────────────────────────────────────────────
	const handleSettingsChange = useCallback(
		(newSettings: UserSettings) => {
			setSettings(newSettings);
		},
		[setSettings],
	);

	const selectedFlightData = useMemo(
		() => flights.find((f) => f.icao24 === selectedFlight),
		[flights, selectedFlight],
	);

	const pollInterval = s.pollIntervalSecs ?? 60;

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
							{s.latitude.toFixed(2)}, {s.longitude.toFixed(2)}
						</span>
					</div>
				</div>

				<div className="flex items-center gap-3">
					{/* Error / Demo Mode Badges */}
					{apiError === "quota_exceeded" && (
						<span className="border border-yellow-500/50 bg-yellow-500/10 px-2 py-1 text-xs text-yellow-500">
							QUOTA EXCEEDED · resets midnight UTC
						</span>
					)}
					{apiError === "invalid_credentials" && (
						<span className="border border-red-500/50 bg-red-500/10 px-2 py-1 text-red-500 text-xs">
							INVALID CREDENTIALS
						</span>
					)}
					{!apiError && isDemoMode && (
						<span className="border border-border bg-muted px-2 py-1 text-muted-foreground text-xs">
							DEMO MODE
						</span>
					)}

					{/* Refresh progress bar — pure CSS, restarted via key */}
					<div
						key={refreshKey}
						className="radar-refresh hidden h-0.5 w-12 overflow-hidden bg-muted sm:block"
						title={`Refreshing in ${pollInterval}s`}
						style={
							{ "--poll-interval": `${pollInterval}s` } as React.CSSProperties
						}
					>
						<div className="radar-refresh-bar h-full bg-primary" />
					</div>

					{/* Live Indicator */}
					<div className="flex items-center gap-1.5">
						<span className="blink glow h-2 w-2 bg-primary" />
						<span className="text-primary text-xs">LIVE</span>
					</div>

					{/* Voice Toggle Quick Button */}
					<button
						type="button"
						onClick={() => {
							const newEnabled = !voiceSettings.enabled;
							if (!newEnabled) stopSpeaking();
							handleSettingsChange({
								...s,
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
					<SettingsModal settings={s} onSave={handleSettingsChange} />
				</div>
			</header>

			{/* Main Content */}
			<main className="flex flex-1 flex-col overflow-hidden lg:flex-row">
				{/* Radar Panel */}
				<div className="flex items-center justify-center p-4 lg:w-[60%]">
					<Radar
						flights={flights}
						userLat={s.latitude}
						userLon={s.longitude}
						radiusKm={s.radiusKm}
						selectedFlight={selectedFlight}
						onSelectFlight={setSelectedFlight}
						className="aspect-square w-full max-w-125 lg:max-w-none"
					/>
				</div>

				{/* Flight Cards Panel */}
				<div className="flex flex-1 flex-col overflow-y-auto border-border border-t lg:w-[40%] lg:flex-none lg:border-t-0 lg:border-l">
					{selectedFlightData && (
						<div className="border-border border-b p-4">
							<FlightDetailPanel
								flight={selectedFlightData}
								userLat={s.latitude}
								userLon={s.longitude}
								radiusKm={s.radiusKm}
								units={s.units ?? "metric"}
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
						userLat={s.latitude}
						userLon={s.longitude}
						radiusKm={s.radiusKm}
						units={s.units ?? "metric"}
						routes={routes}
						isLoading={isLoading}
						selectedFlight={selectedFlight}
						onSelectFlight={setSelectedFlight}
					/>
				</div>
			</main>

			{/* Stats Bar */}
			<StatsBar stats={stats} />
		</div>
	);
}
