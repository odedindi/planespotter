import { useSetAtom } from "jotai";
import useSWR from "swr";
import { generateDemoFlights, getDemoRoutes } from "@/lib/demo-data";
import { refreshKeyAtom } from "@/lib/store";
import type { ApiErrorCode, FlightData, UserSettings } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlightState {
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

	// SWR key: includes every field the fetcher needs.
	// Stable tuple means theme/voice changes never trigger a refetch.
	type SwrKey = readonly [
		"flights",
		number, // lat
		number, // lon
		number, // radiusKm
		string, // clientId
		string, // clientSecret
		number, // pollIntervalSecs
	];
	const swrKey: SwrKey | null = settings
		? ([
				"flights",
				settings.latitude,
				settings.longitude,
				settings.radiusKm,
				settings.apiClientId ?? "",
				settings.apiClientSecret ?? "",
				settings.pollIntervalSecs ?? 60,
			] as const)
		: null; // null key suspends SWR — fetcher is never called when settings is null

	// Fetcher receives all needed values from the key tuple.
	// No reference to `settings` — no null-checks or casts required.
	const fetcher = async ([
		,
		lat,
		lon,
		radius,
		clientId,
		clientSecret,
	]: SwrKey): Promise<RawApiResponse> => {
		const params = new URLSearchParams({
			lat: lat.toString(),
			lon: lon.toString(),
			radius: radius.toString(),
		});
		const headers: HeadersInit = {};
		if (clientId && clientSecret) {
			headers["x-opensky-client-id"] = clientId;
			headers["x-opensky-client-secret"] = clientSecret;
		}
		const res = await fetch(`/api/flights?${params}`, { headers });
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		return res.json();
	};

	const pollIntervalSecs = settings?.pollIntervalSecs ?? 60;

	const { data, error, isLoading, isValidating } = useSWR<
		RawApiResponse,
		Error
	>(swrKey, fetcher, {
		refreshInterval: pollIntervalSecs * 1000,
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
