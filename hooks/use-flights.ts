import { useSetAtom } from "jotai";
import useSWR from "swr";
import { generateDemoFlights, getDemoRoutes } from "@/lib/demo-data";
import { refreshKeyAtom } from "@/lib/store";
import type { ApiErrorCode, FlightData, UserSettings } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FlightState {
	flights: FlightData[];
	routes: Record<string, { origin: string; destination: string }>;
	isDemoMode: boolean;
	apiError: ApiErrorCode | null;
	isLoading: boolean;
}

interface RawApiResponse {
	states: (string | number | boolean | null)[][] | null;
	time: number;
	demoMode?: boolean;
	errorCode?: ApiErrorCode;
}

// ─── Fetcher ──────────────────────────────────────────────────────────────────

async function fetchFlightsFromApi(
	settings: UserSettings,
): Promise<RawApiResponse> {
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

	const res = await fetch(`/api/flights?${params}`, { headers });
	if (!res.ok) {
		throw new Error(`HTTP ${res.status}`);
	}
	return res.json();
}

function parseFlights(
	raw: (string | number | boolean | null)[][],
): FlightData[] {
	return raw
		.map((state) => ({
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
		.filter((f) => f.latitude && f.longitude);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * SWR-backed flight data hook.
 *
 * - Polls at the user's configured interval (default 60 s).
 * - On quota/credentials errors: keeps the last known real flights visible.
 * - On network/api_unavailable errors: falls back to demo data.
 * - Bumps refreshKeyAtom on each successful fetch to restart the CSS progress bar.
 */
export function useFlights(settings: UserSettings | null): FlightState {
	const setRefreshKey = useSetAtom(refreshKeyAtom);

	// SWR key: changes whenever the fetch-relevant settings change.
	// Using a stable tuple avoids re-fetching when theme/voice settings change.
	const swrKey = settings
		? ([
				"flights",
				settings.latitude,
				settings.longitude,
				settings.radiusKm,
				settings.apiClientId ?? "",
				settings.apiClientSecret ?? "",
			] as const)
		: null; // null suspends SWR until settings are available

	const { data, error, isLoading, isValidating } = useSWR<
		RawApiResponse,
		Error
	>(swrKey, () => fetchFlightsFromApi(settings as UserSettings), {
		refreshInterval: (settings?.pollIntervalSecs ?? 60) * 1000,
		// Keep showing stale data while revalidating — critical for the quota/creds error case
		keepPreviousData: true,
		// Never revalidate on window focus — this is a live radar, not a blog post
		revalidateOnFocus: false,
		// Don't retry on quota/credentials errors — those won't resolve until the user acts
		onErrorRetry: (_err, _key, _config, revalidate, { retryCount }) => {
			// Network/server errors: retry up to 3 times with back-off
			if (retryCount >= 3) return;
			setTimeout(() => revalidate({ retryCount }), 5000 * (retryCount + 1));
		},
		onSuccess: () => {
			setRefreshKey((k) => k + 1);
		},
	});

	// ── Derive FlightState from the raw SWR response ──────────────────────────

	// Hard quota/auth errors come back as 200 with errorCode in the body
	const bodyErrorCode = data?.errorCode ?? null;

	if (
		bodyErrorCode === "quota_exceeded" ||
		bodyErrorCode === "invalid_credentials"
	) {
		// Keep showing whatever flights were visible before — don't clobber with demo data
		return {
			flights: data?.states ? parseFlights(data.states) : [],
			routes: {},
			isDemoMode: false,
			apiError: bodyErrorCode,
			isLoading: isLoading && !data,
		};
	}

	// Network/fetch error (thrown by fetcher) — fall back to demo
	if (error && !data) {
		const demoFlights = settings
			? generateDemoFlights(
					settings.latitude,
					settings.longitude,
					settings.radiusKm,
				)
			: [];
		return {
			flights: demoFlights,
			routes: getDemoRoutes(),
			isDemoMode: true,
			apiError: null,
			isLoading: false,
		};
	}

	// Successful response but no states (area with no flights) or explicit demoMode flag
	if (!data || data.demoMode || !data.states || data.states.length === 0) {
		// Don't show demo data if we're still loading for the first time
		if (isLoading && !data) {
			return {
				flights: [],
				routes: {},
				isDemoMode: false,
				apiError: null,
				isLoading: true,
			};
		}
		const demoFlights = settings
			? generateDemoFlights(
					settings.latitude,
					settings.longitude,
					settings.radiusKm,
				)
			: [];
		return {
			flights: demoFlights,
			routes: getDemoRoutes(),
			isDemoMode: true,
			apiError: null,
			isLoading: isLoading && !data,
		};
	}

	// Happy path
	return {
		flights: parseFlights(data.states),
		routes: {},
		isDemoMode: false,
		apiError: null,
		isLoading: isValidating && !data,
	};
}
