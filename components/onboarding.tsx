"use client";

import { useMemo, useState } from "react";
import { RadarLoader } from "@/components/radar-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useVoice } from "@/hooks/use-voice";
import type { UserSettings, VoiceSettings } from "@/lib/types";
import { getDefaultVoiceSettings, SUPPORTED_LANGUAGES } from "@/lib/types";

interface OnboardingProps {
	onComplete: (settings: UserSettings) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
	const [step, setStep] = useState(1);
	const [latitude, setLatitude] = useState<number | null>(null);
	const [longitude, setLongitude] = useState<number | null>(null);
	const [manualLat, setManualLat] = useState("");
	const [manualLon, setManualLon] = useState("");
	const [radiusKm, setRadiusKm] = useState(20);
	const [apiClientId, setApiClientId] = useState("");
	const [apiClientSecret, setApiClientSecret] = useState("");
	const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(
		getDefaultVoiceSettings(),
	);
	const [locationError, setLocationError] = useState<string | null>(null);
	const [isAcquiring, setIsAcquiring] = useState(false);
	const [booting, setBooting] = useState(false);

	const {
		// availableVoices,
		getVoicesForLanguage,
		previewAnnouncement,
	} = useVoice(voiceSettings);
	const voicesForLang = useMemo(
		() => getVoicesForLanguage(voiceSettings.language),
		[voiceSettings.language, getVoicesForLanguage],
	);

	const acquireLocation = () => {
		setIsAcquiring(true);
		setLocationError(null);

		if (!navigator.geolocation) {
			setLocationError("Geolocation not supported");
			setIsAcquiring(false);
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				setLatitude(position.coords.latitude);
				setLongitude(position.coords.longitude);
				setIsAcquiring(false);
				setStep(3);
			},
			() => {
				setLocationError("Location access denied. Enter coordinates manually.");
				setIsAcquiring(false);
			},
			{ enableHighAccuracy: true, timeout: 10000 },
		);
	};

	const useManualLocation = () => {
		const lat = parseFloat(manualLat);
		const lon = parseFloat(manualLon);
		if (
			!Number.isNaN(lat) &&
			!Number.isNaN(lon) &&
			lat >= -90 &&
			lat <= 90 &&
			lon >= -180 &&
			lon <= 180
		) {
			setLatitude(lat);
			setLongitude(lon);
			setStep(3);
		} else {
			setLocationError("Invalid coordinates");
		}
	};

	const handleVoiceSettingChange = (
		key: keyof VoiceSettings,
		value: string | number | boolean,
	) => {
		setVoiceSettings((prev) => ({ ...prev, [key]: value }));
	};

	const launchApp = () => {
		setBooting(true);
		if (latitude === null || longitude === null) {
			setLocationError("Invalid location data");
			setBooting(false);
			return;
		}
		setTimeout(() => {
			onComplete({
				latitude,
				longitude,
				radiusKm,
				apiClientId: apiClientId || undefined,
				apiClientSecret: apiClientSecret || undefined,
				voiceEnabled: voiceSettings.enabled,
				voiceSettings,
				onboardingComplete: true,
				units: "metric",
				pollIntervalSecs: 60,
			});
		}, 2500);
	};

	return (
		<div className="scanlines fixed inset-0 flex items-center justify-center bg-background p-4">
			<div className="w-full max-w-lg">
				{/* Progress Indicator */}
				<div className="mb-8 flex justify-center gap-2">
					{[1, 2, 3, 4, 5, 6].map((s) => (
						<div
							key={s}
							className={`h-3 w-3 border border-primary ${
								s <= step ? "glow bg-primary" : "bg-transparent"
							}`}
						/>
					))}
				</div>

				{/* Step 1: Welcome */}
				{step === 1 && (
					<div className="space-y-6 text-center">
						<div className="glow-pulse inline-block">
							<svg
								className="mx-auto h-24 w-24 text-primary"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.5"
							>
								<title>Welcome</title>
								<circle cx="12" cy="12" r="10" strokeDasharray="4 2" />
								<circle cx="12" cy="12" r="6" strokeDasharray="2 2" />
								<circle cx="12" cy="12" r="2" fill="currentColor" />
								<path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
							</svg>
						</div>
						<h1 className="font-bold text-3xl text-glow text-primary">
							PLANE SPOTTER
						</h1>
						<p className="text-lg text-muted-foreground">
							Your personal air traffic controller
						</p>
						<p className="text-muted-foreground text-sm">
							See every plane flying above you in real time.
							<br />
							Powered by OpenSky Network.
						</p>
						<Button
							onClick={() => setStep(2)}
							className="glow mt-8 bg-primary text-primary-foreground hover:bg-primary/90"
						>
							{">"} INITIALIZE SYSTEM {"<"}
						</Button>
					</div>
				)}

				{/* Step 2: Location */}
				{step === 2 && (
					<div className="space-y-6">
						<h2 className="text-center font-bold text-2xl text-glow text-primary">
							ACQUIRE POSITION
						</h2>

						<div className="flex justify-center">
							<div className="relative h-48 w-48">
								<svg
									className="h-full w-full text-primary"
									viewBox="0 0 100 100"
								>
									<title>Location Acquisition</title>
									<circle
										cx="50"
										cy="50"
										r="45"
										fill="none"
										stroke="currentColor"
										strokeWidth="1"
										opacity="0.3"
									/>
									<circle
										cx="50"
										cy="50"
										r="30"
										fill="none"
										stroke="currentColor"
										strokeWidth="1"
										opacity="0.3"
									/>
									<circle
										cx="50"
										cy="50"
										r="15"
										fill="none"
										stroke="currentColor"
										strokeWidth="1"
										opacity="0.3"
									/>
									<circle
										cx="50"
										cy="50"
										r="3"
										fill="currentColor"
										className="glow-pulse"
									/>
									<line
										x1="50"
										y1="5"
										x2="50"
										y2="20"
										stroke="currentColor"
										strokeWidth="1"
									/>
									<line
										x1="50"
										y1="80"
										x2="50"
										y2="95"
										stroke="currentColor"
										strokeWidth="1"
									/>
									<line
										x1="5"
										y1="50"
										x2="20"
										y2="50"
										stroke="currentColor"
										strokeWidth="1"
									/>
									<line
										x1="80"
										y1="50"
										x2="95"
										y2="50"
										stroke="currentColor"
										strokeWidth="1"
									/>
								</svg>
							</div>
						</div>

						<div className="space-y-4">
							<Button
								onClick={acquireLocation}
								disabled={isAcquiring}
								className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
							>
								{isAcquiring ? "[ ACQUIRING SIGNAL... ]" : "[ ACQUIRE SIGNAL ]"}
							</Button>

							{locationError && (
								<p className="text-center text-destructive text-sm">
									{locationError}
								</p>
							)}

							<div className="relative">
								<div className="absolute inset-0 flex items-center">
									<span className="w-full border-border border-t" />
								</div>
								<div className="relative flex justify-center text-xs">
									<span className="bg-background px-2 text-muted-foreground">
										OR ENTER MANUALLY
									</span>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label className="text-muted-foreground text-xs">
										LATITUDE
									</Label>
									<Input
										type="number"
										step="0.0001"
										placeholder="32.0853"
										value={manualLat}
										onChange={(e) => setManualLat(e.target.value)}
										className="border-border bg-input text-foreground placeholder:text-muted-foreground"
									/>
								</div>
								<div className="space-y-2">
									<Label className="text-muted-foreground text-xs">
										LONGITUDE
									</Label>
									<Input
										type="number"
										step="0.0001"
										placeholder="34.7818"
										value={manualLon}
										onChange={(e) => setManualLon(e.target.value)}
										className="border-border bg-input text-foreground placeholder:text-muted-foreground"
									/>
								</div>
							</div>

							<Button
								onClick={useManualLocation}
								variant="outline"
								className="w-full border-primary text-primary hover:bg-primary/10"
								disabled={!manualLat || !manualLon}
							>
								USE COORDINATES
							</Button>
						</div>
					</div>
				)}

				{/* Step 3: Radar Range */}
				{step === 3 && (
					<div className="space-y-6">
						<h2 className="text-center font-bold text-2xl text-glow text-primary">
							SET RADAR RANGE
						</h2>

						<div className="flex justify-center">
							<div className="relative h-48 w-48">
								<svg
									className="h-full w-full text-primary"
									viewBox="0 0 100 100"
								>
									<title>Radar Range</title>
									<circle
										cx="50"
										cy="50"
										r={10 + (radiusKm / 50) * 35}
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										className="glow"
										opacity="0.7"
									/>
									<circle cx="50" cy="50" r="3" fill="currentColor" />
									<text
										x="50"
										y="75"
										textAnchor="middle"
										fill="currentColor"
										className="text-xs"
									>
										{radiusKm} km
									</text>
								</svg>
							</div>
						</div>

						<div className="space-y-4">
							<div className="flex justify-between text-muted-foreground text-sm">
								<span>5 km</span>
								<span>50 km</span>
							</div>
							<Slider
								value={[radiusKm]}
								onValueChange={(value) => setRadiusKm(value[0])}
								min={5}
								max={50}
								step={1}
								className="w-full"
							/>
							<p className="text-center text-muted-foreground text-sm">
								Detection radius:{" "}
								<span className="text-primary">{radiusKm} km</span>
							</p>
						</div>

						<div className="flex gap-4">
							<Button
								onClick={() => setStep(2)}
								variant="outline"
								className="flex-1 border-primary text-primary hover:bg-primary/10"
							>
								{"<"} BACK
							</Button>
							<Button
								onClick={() => setStep(4)}
								className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
							>
								NEXT {">"}
							</Button>
						</div>
					</div>
				)}

				{/* Step 4: API Key */}
				{step === 4 && (
					<div className="space-y-6">
						<h2 className="text-center font-bold text-2xl text-glow text-primary">
							API CREDENTIALS
						</h2>
						<p className="text-center text-muted-foreground text-sm">
							Optional: Add OpenSky Network credentials for unlimited tracking
						</p>

						<div className="space-y-3 border border-border bg-card p-4 text-sm">
							<p className="text-primary">Setup Instructions:</p>
							<ol className="list-inside list-decimal space-y-1 text-muted-foreground">
								<li>Go to opensky-network.org</li>
								<li>Create a free account</li>
								<li>Navigate to Profile - API Credentials</li>
								<li>Copy your Client ID and Client Secret</li>
							</ol>
						</div>

						<div className="space-y-4">
							<div className="space-y-2">
								<Label className="text-muted-foreground text-xs">
									CLIENT ID
								</Label>
								<Input
									type="text"
									placeholder="your-client-id"
									value={apiClientId}
									onChange={(e) => setApiClientId(e.target.value)}
									className="border-border bg-input text-foreground placeholder:text-muted-foreground"
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-muted-foreground text-xs">
									CLIENT SECRET
								</Label>
								<Input
									type="password"
									placeholder="your-client-secret"
									value={apiClientSecret}
									onChange={(e) => setApiClientSecret(e.target.value)}
									className="border-border bg-input text-foreground placeholder:text-muted-foreground"
								/>
							</div>
						</div>

						<p className="text-center text-muted-foreground text-xs">
							Without credentials: 100 requests/day limit
						</p>
						<p className="text-center text-muted-foreground text-xs">
							Credentials are stored locally in your browser only.
						</p>

						<div className="flex gap-4">
							<Button
								onClick={() => setStep(3)}
								variant="outline"
								className="flex-1 border-primary text-primary hover:bg-primary/10"
							>
								{"<"} BACK
							</Button>
							<Button
								onClick={() => setStep(5)}
								variant="outline"
								className="flex-1 border-muted-foreground text-muted-foreground hover:bg-muted/10"
							>
								SKIP
							</Button>
							<Button
								onClick={() => setStep(5)}
								className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
							>
								SAVE {">"}
							</Button>
						</div>
					</div>
				)}

				{/* Step 5: Voice Announcements */}
				{step === 5 && (
					<div className="space-y-6">
						<h2 className="text-center font-bold text-2xl text-glow text-primary">
							VOICE ALERTS
						</h2>

						<div className="flex justify-center">
							<svg
								className={`h-20 w-20 text-primary ${voiceSettings.enabled ? "glow-pulse" : "opacity-30"}`}
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.5"
							>
								<title>Voice Alerts</title>
								<path d="M11 5L6 9H2v6h4l5 4V5z" />
								{voiceSettings.enabled && (
									<>
										<path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
										<path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
									</>
								)}
							</svg>
						</div>

						<p className="text-center text-muted-foreground text-sm">
							{"Get voice alerts when planes enter your radar range."}
						</p>

						<div className="flex items-center justify-center gap-4">
							<span className="text-muted-foreground">OFF</span>
							<Switch
								checked={voiceSettings.enabled}
								onCheckedChange={(checked) =>
									handleVoiceSettingChange("enabled", checked)
								}
							/>
							<span
								className={
									voiceSettings.enabled
										? "text-primary"
										: "text-muted-foreground"
								}
							>
								ON
							</span>
						</div>

						{voiceSettings.enabled && (
							<div className="space-y-4 border-border border-t pt-4">
								{/* Language Selection */}
								<div className="space-y-2">
									<Label className="text-muted-foreground text-xs">
										LANGUAGE
									</Label>
									<Select
										value={voiceSettings.language}
										onValueChange={(value) => {
											handleVoiceSettingChange("language", value);
											handleVoiceSettingChange("voiceId", "");
										}}
									>
										<SelectTrigger className="border-border bg-input">
											<SelectValue />
										</SelectTrigger>
										<SelectContent className="max-h-48 border-border bg-card">
											{SUPPORTED_LANGUAGES.map((lang) => (
												<SelectItem key={lang.code} value={lang.code}>
													<span className="mr-2">{lang.flag}</span>
													{lang.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								{/* Voice Selection */}
								{voicesForLang.length > 0 && (
									<div className="space-y-2">
										<Label className="text-muted-foreground text-xs">
											VOICE
										</Label>
										<Select
											value={voiceSettings.voiceId || "auto"}
											onValueChange={(value) =>
												handleVoiceSettingChange(
													"voiceId",
													value === "auto" ? "" : value,
												)
											}
										>
											<SelectTrigger className="border-border bg-input">
												<SelectValue placeholder="Auto-select" />
											</SelectTrigger>
											<SelectContent className="max-h-48 border-border bg-card">
												<SelectItem value="auto">Auto-select</SelectItem>
												{voicesForLang.map((voice) => (
													<SelectItem key={voice.id} value={voice.id}>
														{voice.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								)}

								<Button
									onClick={previewAnnouncement}
									variant="outline"
									className="w-full border-primary text-primary hover:bg-primary/10"
								>
									[ PREVIEW ANNOUNCEMENT ]
								</Button>
							</div>
						)}

						<div className="flex gap-4">
							<Button
								onClick={() => setStep(4)}
								variant="outline"
								className="flex-1 border-primary text-primary hover:bg-primary/10"
							>
								{"<"} BACK
							</Button>
							<Button
								onClick={() => setStep(6)}
								className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
							>
								NEXT {">"}
							</Button>
						</div>
					</div>
				)}

				{/* Step 6: Launch */}
				{step === 6 && (
					<div className="space-y-6 text-center">
						<h2 className="font-bold text-2xl text-glow text-primary">
							ALL SYSTEMS GO
						</h2>

						<div className="flex justify-center">
							<div className="relative h-64 w-64">
								<RadarLoader title="Radar Screen" />
							</div>
						</div>

						{booting && (
							<p className="flash font-bold text-glow text-primary text-xl">
								SIGNAL ACQUIRED
							</p>
						)}

						{!booting && (
							<>
								<div className="space-y-2 text-muted-foreground text-sm">
									<p>
										Position: {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
									</p>
									<p>Range: {radiusKm} km</p>
									<p>
										Voice:{" "}
										{voiceSettings.enabled
											? `Enabled (${SUPPORTED_LANGUAGES.find((l) => l.code === voiceSettings.language)?.name})`
											: "Disabled"}
									</p>
									<p>
										API: {apiClientId ? "Authenticated" : "Anonymous (Limited)"}
									</p>
								</div>

								<Button
									onClick={launchApp}
									className="glow bg-primary px-8 py-6 text-lg text-primary-foreground hover:bg-primary/90"
								>
									{">>>"} LAUNCH PLANE SPOTTER {"<<<"}
								</Button>
							</>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
