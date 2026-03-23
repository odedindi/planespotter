"use client";

import { Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { memo, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
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
import {
	getDefaultVoiceSettings,
	kmToMiles,
	SUPPORTED_LANGUAGES,
} from "@/lib/types";

interface SettingsModalProps {
	settings: UserSettings;
	onSave: (settings: UserSettings) => void;
}

export const SettingsModal = memo(function SettingsModal({
	settings,
	onSave,
}: SettingsModalProps) {
	const [open, setOpen] = useState(false);
	const [radiusKm, setRadiusKm] = useState(settings.radiusKm);
	const [pollIntervalSecs, setPollIntervalSecs] = useState(
		settings.pollIntervalSecs ?? 60,
	);
	const [units, setUnits] = useState<"metric" | "imperial">(
		settings.units ?? "metric",
	);
	const [apiClientId, setApiClientId] = useState(settings.apiClientId || "");
	const [apiClientSecret, setApiClientSecret] = useState(
		settings.apiClientSecret || "",
	);
	const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(
		settings.voiceSettings || getDefaultVoiceSettings(),
	);

	const { theme, setTheme } = useTheme();
	const {
		// availableVoices,
		getVoicesForLanguage,
		previewAnnouncement,
		stopSpeaking,
	} = useVoice(voiceSettings);

	const voicesForLang = useMemo(
		() => getVoicesForLanguage(voiceSettings.language),
		[voiceSettings.language, getVoicesForLanguage],
	);

	const handleSave = () => {
		onSave({
			...settings,
			radiusKm,
			units,
			apiClientId: apiClientId || undefined,
			apiClientSecret: apiClientSecret || undefined,
			voiceEnabled: voiceSettings.enabled,
			voiceSettings,
			pollIntervalSecs,
		});
		setOpen(false);
	};

	const handleVoiceSettingChange = (
		key: keyof VoiceSettings,
		value: string | number | boolean,
	) => {
		// If disabling voice, stop any current speech immediately
		if (key === "enabled" && value === false) {
			stopSpeaking();
		}
		setVoiceSettings((prev) => ({ ...prev, [key]: value }));
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="text-primary hover:bg-primary/10 hover:text-primary"
				>
					<Settings className="h-5 w-5" />
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-border bg-card text-foreground">
				<DialogHeader>
					<DialogTitle className="text-glow text-primary">SETTINGS</DialogTitle>
					<DialogDescription className="text-muted-foreground text-xs">
						Configure radar range, voice alerts, and API credentials
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{/* Theme */}
					<div className="space-y-3">
						<Label className="text-muted-foreground text-sm">THEME</Label>
						<div className="flex gap-2">
							<Button
								variant={theme === "system" ? "default" : "outline"}
								size="sm"
								onClick={() => setTheme("system")}
								className={
									theme === "system"
										? "bg-primary text-primary-foreground"
										: "border-border"
								}
							>
								<svg
									className="mr-2 h-4 w-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<title>System Theme</title>
									<rect x="2" y="3" width="20" height="14" rx="2" />
									<path d="M8 21h8M12 17v4" />
								</svg>
								System
							</Button>
							<Button
								variant={theme === "light" ? "default" : "outline"}
								size="sm"
								onClick={() => setTheme("light")}
								className={
									theme === "light"
										? "bg-primary text-primary-foreground"
										: "border-border"
								}
							>
								<svg
									className="mr-2 h-4 w-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<title>Light Theme</title>
									<circle cx="12" cy="12" r="4" />
									<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
								</svg>
								Light
							</Button>
							<Button
								variant={theme === "dark" ? "default" : "outline"}
								size="sm"
								onClick={() => setTheme("dark")}
								className={
									theme === "dark"
										? "bg-primary text-primary-foreground"
										: "border-border"
								}
							>
								<svg
									className="mr-2 h-4 w-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<title>Dark Theme</title>
									<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
								</svg>
								Dark
							</Button>
						</div>
					</div>

					{/* Poll Interval */}
					<div className="space-y-3">
						<Label className="text-muted-foreground text-sm">
							POLL INTERVAL
						</Label>
						<div className="flex gap-2">
							{([30, 60, 120] as const).map((secs) => (
								<Button
									key={secs}
									variant={pollIntervalSecs === secs ? "default" : "outline"}
									size="sm"
									onClick={() => setPollIntervalSecs(secs)}
									className={
										pollIntervalSecs === secs
											? "bg-primary text-primary-foreground"
											: "border-border"
									}
								>
									{secs}s
								</Button>
							))}
						</div>
						<p className="text-muted-foreground text-xs">
							At 60s: ~1,440 req/day · 30s: ~2,880 · 120s: ~720
						</p>
					</div>

					{/* Units */}
					<div className="space-y-3">
						<Label className="text-muted-foreground text-sm">UNITS</Label>
						<div className="flex gap-2">
							<Button
								variant={units === "metric" ? "default" : "outline"}
								size="sm"
								onClick={() => setUnits("metric")}
								className={
									units === "metric"
										? "bg-primary text-primary-foreground"
										: "border-border"
								}
							>
								Metric (km)
							</Button>
							<Button
								variant={units === "imperial" ? "default" : "outline"}
								size="sm"
								onClick={() => setUnits("imperial")}
								className={
									units === "imperial"
										? "bg-primary text-primary-foreground"
										: "border-border"
								}
							>
								Imperial (mi)
							</Button>
						</div>
					</div>

					{/* Radar Range */}
					<div className="space-y-3">
						<Label className="text-muted-foreground text-sm">RADAR RANGE</Label>
						<div className="flex justify-between text-muted-foreground text-xs">
							<span>
								{units === "imperial"
									? `${kmToMiles(5).toFixed(0)} mi`
									: "5 km"}
							</span>
							<span className="text-primary">
								{units === "imperial"
									? `${kmToMiles(radiusKm).toFixed(1)} mi`
									: `${radiusKm} km`}
							</span>
							<span>
								{units === "imperial"
									? `${kmToMiles(50).toFixed(0)} mi`
									: "50 km"}
							</span>
						</div>

						<Slider
							value={[radiusKm]}
							onValueChange={(value) => setRadiusKm(value[0])}
							min={5}
							max={50}
							step={1}
						/>
					</div>

					{/* Voice Settings */}
					<div className="space-y-4 border-border border-t pt-4">
						<div className="flex items-center justify-between">
							<Label className="text-muted-foreground text-sm">
								VOICE ALERTS
							</Label>
							<Switch
								checked={voiceSettings.enabled}
								onCheckedChange={(checked) =>
									handleVoiceSettingChange("enabled", checked)
								}
							/>
						</div>

						{voiceSettings.enabled && (
							<>
								{/* Language */}
								<div className="space-y-2">
									<Label className="text-muted-foreground text-xs">
										LANGUAGE
									</Label>
									<Select
										value={voiceSettings.language}
										onValueChange={(value) => {
											handleVoiceSettingChange("language", value);
											handleVoiceSettingChange("voiceId", ""); // Reset voice when language changes
										}}
									>
										<SelectTrigger className="border-border bg-input">
											<SelectValue />
										</SelectTrigger>
										<SelectContent className="max-h-64 border-border bg-card">
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
								<div className="space-y-2">
									<Label className="text-muted-foreground text-xs">VOICE</Label>
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
											<SelectValue placeholder="Auto-select best voice" />
										</SelectTrigger>
										<SelectContent className="max-h-64 border-border bg-card">
											<SelectItem value="auto">
												Auto-select best voice
											</SelectItem>
											{voicesForLang.map((voice) => (
												<SelectItem key={voice.id} value={voice.id}>
													{voice.name}
													{voice.localService && (
														<span className="ml-2 text-muted-foreground text-xs">
															(local)
														</span>
													)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{!voicesForLang.length && (
										<p className="text-muted-foreground text-xs">
											No voices found for this language. Using system default.
										</p>
									)}
								</div>

								{/* Speed */}
								<div className="space-y-2">
									<div className="flex justify-between">
										<Label className="text-muted-foreground text-xs">
											SPEED
										</Label>
										<span className="text-primary text-xs">
											{voiceSettings.rate.toFixed(1)}x
										</span>
									</div>
									<Slider
										value={[voiceSettings.rate]}
										onValueChange={(value) =>
											handleVoiceSettingChange("rate", value[0])
										}
										min={0.5}
										max={2}
										step={0.1}
									/>
								</div>

								{/* Pitch */}
								<div className="space-y-2">
									<div className="flex justify-between">
										<Label className="text-muted-foreground text-xs">
											PITCH
										</Label>
										<span className="text-primary text-xs">
											{voiceSettings.pitch.toFixed(1)}
										</span>
									</div>
									<Slider
										value={[voiceSettings.pitch]}
										onValueChange={(value) =>
											handleVoiceSettingChange("pitch", value[0])
										}
										min={0.5}
										max={2}
										step={0.1}
									/>
								</div>

								{/* Volume */}
								<div className="space-y-2">
									<div className="flex justify-between">
										<Label className="text-muted-foreground text-xs">
											VOLUME
										</Label>
										<span className="text-primary text-xs">
											{Math.round(voiceSettings.volume * 100)}%
										</span>
									</div>
									<Slider
										value={[voiceSettings.volume]}
										onValueChange={(value) =>
											handleVoiceSettingChange("volume", value[0])
										}
										min={0}
										max={1}
										step={0.1}
									/>
								</div>

								{/* Preview Button */}
								<Button
									variant="outline"
									size="sm"
									onClick={previewAnnouncement}
									className="w-full border-primary text-primary hover:bg-primary/10"
								>
									<svg
										className="mr-2 h-4 w-4"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
									>
										<title>Preview Announcement</title>
										<path d="M11 5L6 9H2v6h4l5 4V5z" />
										<path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
										<path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
									</svg>
									Preview Announcement
								</Button>
							</>
						)}
					</div>

					{/* API Credentials */}
					<div className="space-y-3 border-border border-t pt-4">
						<Label className="text-muted-foreground text-sm">
							API CREDENTIALS
						</Label>
						<Input
							type="text"
							placeholder="Client ID"
							value={apiClientId}
							onChange={(e) => setApiClientId(e.target.value)}
							className="border-border bg-input text-foreground placeholder:text-muted-foreground"
						/>
						<Input
							type="password"
							placeholder="Client Secret"
							value={apiClientSecret}
							onChange={(e) => setApiClientSecret(e.target.value)}
							className="border-border bg-input text-foreground placeholder:text-muted-foreground"
						/>
						<p className="text-muted-foreground text-xs">
							Get free credentials at opensky-network.org
						</p>
						<p className="text-muted-foreground text-xs">
							Credentials are stored locally in your browser only.
						</p>
					</div>

					{/* Location Info */}
					<div className="space-y-2 border-border border-t pt-4">
						<Label className="text-muted-foreground text-sm">POSITION</Label>
						<p className="text-foreground text-xs">
							{settings.latitude.toFixed(4)}, {settings.longitude.toFixed(4)}
						</p>
						<p className="text-muted-foreground text-xs">
							Reload app to change location
						</p>
					</div>
				</div>

				<div className="flex gap-4">
					<Button
						onClick={() => setOpen(false)}
						variant="outline"
						className="flex-1 border-muted-foreground text-muted-foreground hover:bg-muted/10"
					>
						CANCEL
					</Button>
					<Button
						onClick={handleSave}
						className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
					>
						SAVE
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
});
