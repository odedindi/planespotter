import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const lat = parseFloat(searchParams.get("lat") || "0");
	const lon = parseFloat(searchParams.get("lon") || "0");
	const radius = parseFloat(searchParams.get("radius") || "20");
	// Read credentials from headers, not query params (prevents leaking in URL logs)
	const clientId = request.headers.get("x-opensky-client-id") || "";
	const clientSecret = request.headers.get("x-opensky-client-secret") || "";

	// Calculate bounding box
	const latDelta = radius / 111; // approx km per degree of latitude
	const lonDelta = radius / (111 * Math.cos((lat * Math.PI) / 180)); // adjust for longitude

	const lamin = lat - latDelta;
	const lamax = lat + latDelta;
	const lomin = lon - lonDelta;
	const lomax = lon + lonDelta;

	const url = `https://opensky-network.org/api/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;

	try {
		const headers: HeadersInit = {
			Accept: "application/json",
		};

		// Add Basic Auth if credentials provided
		if (clientId && clientSecret) {
			const auth = Buffer.from(`${clientId}:${clientSecret}`).toString(
				"base64",
			);
			headers.Authorization = `Basic ${auth}`;
		}

		const response = await fetch(url, {
			headers,
			next: { revalidate: 10 }, // Cache for 10 seconds
		});

		if (!response.ok) {
			// Return demo mode indicator
			return NextResponse.json({
				states: null,
				time: Date.now() / 1000,
				demoMode: true,
				error:
					response.status === 401 ? "Invalid credentials" : "API unavailable",
			});
		}

		const data = await response.json();

		return NextResponse.json({
			...data,
			demoMode: false,
		});
	} catch (error) {
		console.error("OpenSky API error:", error);
		return NextResponse.json({
			states: null,
			time: Date.now() / 1000,
			demoMode: true,
			error: "Failed to fetch flight data",
		});
	}
}
