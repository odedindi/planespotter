"use client";

import { useEffect, useState } from "react";
import { Dashboard } from "@/components/dashboard";
import { Onboarding } from "@/components/onboarding";
import type { UserSettings } from "@/lib/types";
import { RadarLoader } from "@/components/radar-loader";

const STORAGE_KEY = "plane-spotter-settings";

function getStoredSettings(): UserSettings | null {
	if (typeof window === "undefined") return null;

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const settings = JSON.parse(stored);
			if (settings.onboardingComplete) {
				return settings;
			}
		}
	} catch (e) {
		console.error("Error reading settings:", e);
	}
	return null;
}

function saveSettings(settings: UserSettings): void {
	if (typeof window === "undefined") return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	} catch (e) {
		console.error("Error saving settings:", e);
	}
}

export default function PlaneSpotter() {
	const [settings, setSettings] = useState<UserSettings | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const stored = getStoredSettings();
		setSettings(stored);
		setIsLoading(false);
	}, []);

	const handleOnboardingComplete = (newSettings: UserSettings) => {
		saveSettings(newSettings);
		setSettings(newSettings);
	};

	const handleSettingsChange = (newSettings: UserSettings) => {
		saveSettings(newSettings);
		setSettings(newSettings);
	};

	// Loading state
	if (isLoading) {
		return (
			<div className="scanlines flex h-screen items-center justify-center bg-background">
				<div className="space-y-4 text-center">
					<div className="mx-auto h-16 w-16">
					<RadarLoader className="glow-pulse h-full w-full text-primary" title="Loading" />
					</div>
					<p className="text-primary text-sm">INITIALIZING...</p>
				</div>
			</div>
		);
	}

	// Show onboarding if not completed
	if (!settings?.onboardingComplete) {
		return <Onboarding onComplete={handleOnboardingComplete} />;
	}

	// Show dashboard
	return (
		<Dashboard
			initialSettings={settings}
			onSettingsChange={handleSettingsChange}
		/>
	);
}
