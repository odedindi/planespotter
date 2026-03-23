"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
	type FlightData,
	getAirlineName,
	getHeadingDirection,
	metersToFeet,
	VOICE_TRANSLATIONS,
	type VoiceSettings,
} from "@/lib/types";

interface VoiceOption {
	id: string;
	name: string;
	lang: string;
	localService: boolean;
}

export function useVoice(voiceSettings: VoiceSettings) {
	const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
	const announcedFlights = useRef<Set<string>>(new Set());
	const pendingAnnouncements = useRef<FlightData[]>([]);
	const synthRef = useRef<SpeechSynthesis | null>(null);
	const lastMuteState = useRef<boolean>(voiceSettings.enabled);
	const muteTimestamp = useRef<number>(0);

	// Load available voices
	useEffect(() => {
		if (typeof window === "undefined" || !("speechSynthesis" in window)) {
			return;
		}

		synthRef.current = window.speechSynthesis;

		const loadVoices = () => {
			const voices = synthRef.current?.getVoices() || [];
			const voiceOptions: VoiceOption[] = voices.map((voice, index) => ({
				id: `${voice.name}-${index}`,
				name: voice.name,
				lang: voice.lang,
				localService: voice.localService,
			}));
			setAvailableVoices(voiceOptions);
		};

		// Load voices immediately
		loadVoices();

		// Also listen for voiceschanged event (needed for some browsers)
		synthRef.current.addEventListener("voiceschanged", loadVoices);

		return () => {
			synthRef.current?.removeEventListener("voiceschanged", loadVoices);
		};
	}, []);

	// Handle mute/unmute state changes - stop speech immediately when muted
	// biome-ignore lint/correctness/useExhaustiveDependencies: We only want to run this effect when the enabled state changes, not on every render.
	useEffect(() => {
		const wasMuted = !lastMuteState.current;
		const isMuted = !voiceSettings.enabled;

		// Track state change
		lastMuteState.current = voiceSettings.enabled;

		// If we just muted, stop speech immediately
		if (!wasMuted && isMuted) {
			muteTimestamp.current = Date.now();
			synthRef.current?.cancel();
			// Clear pending announcements
			pendingAnnouncements.current = [];
		}

		// If we just unmuted, check if we have recent pending announcements (within 30 seconds)
		if (wasMuted && !isMuted) {
			const now = Date.now();
			const timeSinceMute = now - muteTimestamp.current;

			// Only announce pending flights if unmuted within 30 seconds
			if (timeSinceMute < 30000 && pendingAnnouncements.current.length > 0) {
				// Announce the most recent pending flight
				const recentFlight =
					pendingAnnouncements.current[pendingAnnouncements.current.length - 1];
				pendingAnnouncements.current = [];

				// Small delay before announcing
				setTimeout(() => {
					if (voiceSettings.enabled) {
						announceFlightInternal(recentFlight);
					}
				}, 500);
			} else {
				// Clear old pending announcements
				pendingAnnouncements.current = [];
			}
		}
	}, [voiceSettings.enabled]);

	// Get voice by ID or find best match for language
	const getVoice = useCallback((): SpeechSynthesisVoice | null => {
		if (!synthRef.current) return null;

		const voices = synthRef.current.getVoices();

		// If specific voice ID is set, try to find it
		if (voiceSettings.voiceId) {
			const index = availableVoices.findIndex(
				(v) => v.id === voiceSettings.voiceId,
			);
			if (index >= 0 && voices[index]) {
				return voices[index];
			}
		}

		// Find best match for language
		const exactMatch = voices.find((v) => v.lang === voiceSettings.language);
		if (exactMatch) return exactMatch;

		// Try partial language match (e.g., 'en' for 'en-US')
		const langPrefix = voiceSettings.language.split("-")[0];
		const partialMatch = voices.find((v) => v.lang.startsWith(langPrefix));
		if (partialMatch) return partialMatch;

		// Fallback to first available voice
		return voices[0] || null;
	}, [voiceSettings.voiceId, voiceSettings.language, availableVoices]);

	// Get voices filtered by language
	const getVoicesForLanguage = useCallback(
		(langCode: string): VoiceOption[] => {
			const langPrefix = langCode.split("-")[0];
			return availableVoices.filter(
				(v) => v.lang === langCode || v.lang.startsWith(langPrefix),
			);
		},
		[availableVoices],
	);

	// Build announcement text in the selected language
	const buildAnnouncementText = useCallback(
		(flight: FlightData): string => {
			const callsign = flight.callsign?.trim() || flight.icao24;
			const airline = getAirlineName(callsign);
			const altitude = metersToFeet(flight.altitude);
			const direction = getHeadingDirection(flight.heading);

			const translations =
				VOICE_TRANSLATIONS[voiceSettings.language] ||
				VOICE_TRANSLATIONS["en-US"];

			return `${translations.attention}. ${airline} ${translations.flight} ${callsign}, ${translations.overhead} ${altitude.toLocaleString()} ${translations.feet}, ${translations.heading} ${direction}.`;
		},
		[voiceSettings.language],
	);

	// Internal announce function that bypasses enabled check (used for preview)
	const announceInternal = useCallback(
		(text: string, force: boolean = false) => {
			if (!synthRef.current) return;

			// Don't announce if disabled (unless forced for preview)
			if (!force && !voiceSettings.enabled) return;

			// Cancel any ongoing speech
			synthRef.current.cancel();

			const utterance = new SpeechSynthesisUtterance(text);
			utterance.rate = voiceSettings.rate;
			utterance.pitch = voiceSettings.pitch;
			utterance.volume = voiceSettings.volume;

			const voice = getVoice();
			if (voice) {
				utterance.voice = voice;
				utterance.lang = voice.lang;
			} else {
				utterance.lang = voiceSettings.language;
			}

			synthRef.current.speak(utterance);
		},
		[voiceSettings, getVoice],
	);

	// Announce with current settings
	const announce = useCallback(
		(text: string) => {
			announceInternal(text, false);
		},
		[announceInternal],
	);

	// Internal flight announcement
	const announceFlightInternal = useCallback(
		(flight: FlightData) => {
			const text = buildAnnouncementText(flight);
			announceInternal(text, false);
		},
		[buildAnnouncementText, announceInternal],
	);

	// Announce overhead flight
	const announceOverheadFlight = useCallback(
		(flight: FlightData) => {
			const callsign = flight.callsign?.trim() || flight.icao24;

			// Don't announce the same flight multiple times
			if (announcedFlights.current.has(callsign)) {
				return;
			}

			announcedFlights.current.add(callsign);

			// Remove from set after 5 minutes to allow re-announcement
			setTimeout(
				() => {
					announcedFlights.current.delete(callsign);
				},
				5 * 60 * 1000,
			);

			// If voice is disabled, add to pending announcements
			if (!voiceSettings.enabled) {
				pendingAnnouncements.current.push(flight);
				// Keep only the last 5 pending announcements
				if (pendingAnnouncements.current.length > 5) {
					pendingAnnouncements.current = pendingAnnouncements.current.slice(-5);
				}
				return;
			}

			announceFlightInternal(flight);
		},
		[voiceSettings.enabled, announceFlightInternal],
	);

	// Preview a sample announcement (always plays even if muted)
	const previewAnnouncement = useCallback(() => {
		const sampleFlight: FlightData = {
			icao24: "SAMPLE",
			callsign: "BA156",
			originCountry: "United Kingdom",
			longitude: 0,
			latitude: 0,
			altitude: 10668, // ~35,000 feet
			velocity: 250,
			heading: 315,
			verticalRate: 0,
			onGround: false,
			squawk: "7700",
			spiFlag: false,
			positionSource: 0,
		};

		const text = buildAnnouncementText(sampleFlight);
		announceInternal(text, true); // Force play for preview
	}, [buildAnnouncementText, announceInternal]);

	// Stop any ongoing speech
	const stopSpeaking = useCallback(() => {
		synthRef.current?.cancel();
	}, []);

	// Clear announced flights
	const clearAnnounced = useCallback(() => {
		announcedFlights.current.clear();
	}, []);

	// Clear pending announcements
	const clearPending = useCallback(() => {
		pendingAnnouncements.current = [];
	}, []);

	return {
		availableVoices,
		getVoicesForLanguage,
		announce,
		announceOverheadFlight,
		previewAnnouncement,
		stopSpeaking,
		clearAnnounced,
		clearPending,
	};
}
