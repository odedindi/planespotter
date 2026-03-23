import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { UserSettings } from "./types";

// ─── Persisted ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "plane-spotter-settings";

// getOnInit: true reads localStorage synchronously on the very first render,
// so returning users never see a flash of Onboarding before the atom hydrates.
export const settingsAtom = atomWithStorage<UserSettings | null>(
	STORAGE_KEY,
	null,
	undefined, // use default JSON storage
	{ getOnInit: true },
);

// ─── UI state ────────────────────────────────────────────────────────────────

/** ICAO24 of the flight the user clicked on the radar / flight list */
export const selectedFlightAtom = atom<string | null>(null);

/** Bumped on each successful SWR revalidation to restart the CSS progress bar */
export const refreshKeyAtom = atom(0);
