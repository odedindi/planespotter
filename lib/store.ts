import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { UserSettings } from "./types";

// ─── Persisted ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "plane-spotter-settings";

export const settingsAtom = atomWithStorage<UserSettings | null>(
	STORAGE_KEY,
	null,
);

// ─── UI state ────────────────────────────────────────────────────────────────

/** ICAO24 of the flight the user clicked on the radar / flight list */
export const selectedFlightAtom = atom<string | null>(null);

/** Bumped on each successful SWR revalidation to restart the CSS progress bar */
export const refreshKeyAtom = atom(0);
