"use client";

import { useAtom } from "jotai";
import { Dashboard } from "@/components/dashboard";
import { Onboarding } from "@/components/onboarding";
import { settingsAtom } from "@/lib/store";
import type { UserSettings } from "@/lib/types";

export default function PlaneSpotterClient() {
	const [settings, setSettings] = useAtom(settingsAtom);

	const handleOnboardingComplete = (newSettings: UserSettings) => {
		setSettings(newSettings);
	};

	if (!settings?.onboardingComplete) {
		return <Onboarding onComplete={handleOnboardingComplete} />;
	}

	return <Dashboard />;
}
