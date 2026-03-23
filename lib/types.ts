export type ApiErrorCode =
	| "quota_exceeded"
	| "invalid_credentials"
	| "api_unavailable";

export interface FlightData {
	icao24: string;
	callsign: string;
	originCountry: string;
	longitude: number;
	latitude: number;
	altitude: number; // in meters
	velocity: number; // in m/s
	heading: number;
	verticalRate: number;
	onGround: boolean;
	squawk: string;
	spiFlag: boolean;
	positionSource: number;
}

export interface VoiceSettings {
	enabled: boolean;
	voiceId: string;
	language: string;
	rate: number;
	pitch: number;
	volume: number;
}

export interface UserSettings {
	latitude: number;
	longitude: number;
	radiusKm: number;
	apiClientId?: string;
	apiClientSecret?: string;
	voiceEnabled: boolean;
	voiceSettings?: VoiceSettings;
	onboardingComplete: boolean;
	theme?: "light" | "dark" | "system";
	units?: "metric" | "imperial";
	pollIntervalSecs?: number; // default 60
}

export interface Stats {
	todayCount: number;
	busiestHour: string;
	overheadCount: number;
	lastFlight: string;
}

// Supported languages for voice announcements
export const SUPPORTED_LANGUAGES = [
	{ code: "en-US", name: "English (US)", flag: "🇺🇸" },
	{ code: "en-GB", name: "English (UK)", flag: "🇬🇧" },
	{ code: "en-AU", name: "English (Australia)", flag: "🇦🇺" },
	{ code: "es-ES", name: "Spanish (Spain)", flag: "🇪🇸" },
	{ code: "es-MX", name: "Spanish (Mexico)", flag: "🇲🇽" },
	{ code: "fr-FR", name: "French", flag: "🇫🇷" },
	{ code: "de-DE", name: "German", flag: "🇩🇪" },
	{ code: "it-IT", name: "Italian", flag: "🇮🇹" },
	{ code: "pt-BR", name: "Portuguese (Brazil)", flag: "🇧🇷" },
	{ code: "pt-PT", name: "Portuguese (Portugal)", flag: "🇵🇹" },
	{ code: "nl-NL", name: "Dutch", flag: "🇳🇱" },
	{ code: "pl-PL", name: "Polish", flag: "🇵🇱" },
	{ code: "ru-RU", name: "Russian", flag: "🇷🇺" },
	{ code: "ja-JP", name: "Japanese", flag: "🇯🇵" },
	{ code: "ko-KR", name: "Korean", flag: "🇰🇷" },
	{ code: "zh-CN", name: "Chinese (Simplified)", flag: "🇨🇳" },
	{ code: "zh-TW", name: "Chinese (Traditional)", flag: "🇹🇼" },
	{ code: "ar-SA", name: "Arabic", flag: "🇸🇦" },
	{ code: "he-IL", name: "Hebrew", flag: "🇮🇱" },
	{ code: "hi-IN", name: "Hindi", flag: "🇮🇳" },
	{ code: "tr-TR", name: "Turkish", flag: "🇹🇷" },
	{ code: "sv-SE", name: "Swedish", flag: "🇸🇪" },
	{ code: "da-DK", name: "Danish", flag: "🇩🇰" },
	{ code: "nb-NO", name: "Norwegian", flag: "🇳🇴" },
	{ code: "fi-FI", name: "Finnish", flag: "🇫🇮" },
];

// Voice announcement translations
export const VOICE_TRANSLATIONS: Record<
	string,
	{
		attention: string;
		flight: string;
		overhead: string;
		feet: string;
		heading: string;
	}
> = {
	"en-US": {
		attention: "Attention",
		flight: "flight",
		overhead: "passing overhead at",
		feet: "feet",
		heading: "heading",
	},
	"en-GB": {
		attention: "Attention",
		flight: "flight",
		overhead: "passing overhead at",
		feet: "feet",
		heading: "heading",
	},
	"en-AU": {
		attention: "Attention",
		flight: "flight",
		overhead: "passing overhead at",
		feet: "feet",
		heading: "heading",
	},
	"es-ES": {
		attention: "Atención",
		flight: "vuelo",
		overhead: "pasando por encima a",
		feet: "pies",
		heading: "rumbo",
	},
	"es-MX": {
		attention: "Atención",
		flight: "vuelo",
		overhead: "pasando por encima a",
		feet: "pies",
		heading: "rumbo",
	},
	"fr-FR": {
		attention: "Attention",
		flight: "vol",
		overhead: "passant au-dessus à",
		feet: "pieds",
		heading: "cap",
	},
	"de-DE": {
		attention: "Achtung",
		flight: "Flug",
		overhead: "überfliegend bei",
		feet: "Fuß",
		heading: "Kurs",
	},
	"it-IT": {
		attention: "Attenzione",
		flight: "volo",
		overhead: "in sorvolo a",
		feet: "piedi",
		heading: "direzione",
	},
	"pt-BR": {
		attention: "Atenção",
		flight: "voo",
		overhead: "passando acima a",
		feet: "pés",
		heading: "rumo",
	},
	"pt-PT": {
		attention: "Atenção",
		flight: "voo",
		overhead: "a passar em cima a",
		feet: "pés",
		heading: "rumo",
	},
	"nl-NL": {
		attention: "Attentie",
		flight: "vlucht",
		overhead: "overvliegend op",
		feet: "voet",
		heading: "koers",
	},
	"pl-PL": {
		attention: "Uwaga",
		flight: "lot",
		overhead: "przelatuje na wysokości",
		feet: "stóp",
		heading: "kurs",
	},
	"ru-RU": {
		attention: "Внимание",
		flight: "рейс",
		overhead: "пролетает на высоте",
		feet: "футов",
		heading: "курс",
	},
	"ja-JP": {
		attention: "注意",
		flight: "フライト",
		overhead: "上空を通過中、高度",
		feet: "フィート",
		heading: "方向",
	},
	"ko-KR": {
		attention: "주의",
		flight: "항공편",
		overhead: "상공 통과 중, 고도",
		feet: "피트",
		heading: "방향",
	},
	"zh-CN": {
		attention: "注意",
		flight: "航班",
		overhead: "正在上空经过，高度",
		feet: "英尺",
		heading: "航向",
	},
	"zh-TW": {
		attention: "注意",
		flight: "航班",
		overhead: "正在上空經過，高度",
		feet: "英尺",
		heading: "航向",
	},
	"ar-SA": {
		attention: "انتباه",
		flight: "رحلة",
		overhead: "تحلق فوقك على ارتفاع",
		feet: "قدم",
		heading: "اتجاه",
	},
	"he-IL": {
		attention: "שימו לב",
		flight: "טיסה",
		overhead: "עוברת מעל בגובה",
		feet: "רגל",
		heading: "כיוון",
	},
	"hi-IN": {
		attention: "ध्यान दें",
		flight: "उड़ान",
		overhead: "ऊपर से गुजर रही है, ऊंचाई",
		feet: "फीट",
		heading: "दिशा",
	},
	"tr-TR": {
		attention: "Dikkat",
		flight: "uçuş",
		overhead: "üzerinden geçiyor, yükseklik",
		feet: "fit",
		heading: "yön",
	},
	"sv-SE": {
		attention: "Observera",
		flight: "flyg",
		overhead: "passerar ovanför på",
		feet: "fot",
		heading: "kurs",
	},
	"da-DK": {
		attention: "Bemærk",
		flight: "fly",
		overhead: "passerer over på",
		feet: "fod",
		heading: "kurs",
	},
	"nb-NO": {
		attention: "Merk",
		flight: "fly",
		overhead: "passerer over på",
		feet: "fot",
		heading: "kurs",
	},
	"fi-FI": {
		attention: "Huomio",
		flight: "lento",
		overhead: "ohittaa yläpuolella korkeudessa",
		feet: "jalkaa",
		heading: "suunta",
	},
};

// Major airline ICAO prefixes
export const AIRLINE_MAP: Record<string, string> = {
	// Israeli
	LY: "El Al",
	IZ: "Arkia",
	"6H": "Israir",
	// US
	AA: "American Airlines",
	UA: "United Airlines",
	DL: "Delta Air Lines",
	WN: "Southwest Airlines",
	AS: "Alaska Airlines",
	B6: "JetBlue Airways",
	NK: "Spirit Airlines",
	F9: "Frontier Airlines",
	// European
	BA: "British Airways",
	LH: "Lufthansa",
	AF: "Air France",
	KL: "KLM",
	IB: "Iberia",
	AZ: "ITA Airways",
	SK: "SAS",
	AY: "Finnair",
	TP: "TAP Portugal",
	SN: "Brussels Airlines",
	OS: "Austrian Airlines",
	LX: "Swiss",
	// Low-cost European
	FR: "Ryanair",
	U2: "easyJet",
	W6: "Wizz Air",
	VY: "Vueling",
	NO: "Norwegian",
	// Middle East
	EK: "Emirates",
	QR: "Qatar Airways",
	EY: "Etihad",
	GF: "Gulf Air",
	SV: "Saudia",
	RJ: "Royal Jordanian",
	MS: "EgyptAir",
	// Asian
	SQ: "Singapore Airlines",
	CX: "Cathay Pacific",
	NH: "ANA",
	JL: "Japan Airlines",
	KE: "Korean Air",
	OZ: "Asiana",
	TG: "Thai Airways",
	MH: "Malaysia Airlines",
	CI: "China Airlines",
	BR: "EVA Air",
	CA: "Air China",
	MU: "China Eastern",
	CZ: "China Southern",
	"9C": "Spring Airlines",
	// Oceania
	QF: "Qantas",
	NZ: "Air New Zealand",
	VA: "Virgin Australia",
	// Americas
	AC: "Air Canada",
	AM: "Aeroméxico",
	LA: "LATAM",
	AV: "Avianca",
	CM: "Copa Airlines",
	// Cargo
	FX: "FedEx Express",
	"5X": "UPS Airlines",
	// Turkish
	TK: "Turkish Airlines",
	PC: "Pegasus Airlines",
};

export function getAirlineName(callsign: string): string {
	if (!callsign) return "Unknown Airline";
	const prefix = callsign.substring(0, 2).toUpperCase();
	return AIRLINE_MAP[prefix] || "Unknown Airline";
}

export function getHeadingDirection(heading: number): string {
	const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
	const index = Math.round(heading / 45) % 8;
	return directions[index];
}

export function metersToFeet(meters: number): number {
	return Math.round(meters * 3.28084);
}

export function kmToMiles(km: number): number {
	return km * 0.621371;
}

/** Format a km distance according to the user's unit preference */
export function formatDistance(
	km: number,
	units: "metric" | "imperial" = "metric",
): string {
	if (units === "imperial") {
		return `${kmToMiles(km).toFixed(1)} mi`;
	}
	return `${km.toFixed(1)} km`;
}

/** Format a m/s speed according to the user's unit preference.
 *  Metric → km/h | Imperial → mph */
export function formatSpeed(
	ms: number,
	units: "metric" | "imperial" = "metric",
): string {
	if (units === "imperial") {
		return `${Math.round(ms * 2.23694)} mph`;
	}
	return `${Math.round(ms * 3.6)} km/h`;
}

export function msToKnots(ms: number): number {
	return Math.round(ms * 1.94384);
}

export function calculateDistance(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number,
): number {
	const R = 6371; // Earth's radius in km
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

/** Fraction of radar radius within which a flight is considered "overhead" */
export const OVERHEAD_THRESHOLD = 0.15;
export function getDefaultVoiceSettings(): VoiceSettings {
	return {
		enabled: true,
		voiceId: "",
		language: "en-US",
		rate: 0.9,
		pitch: 1,
		volume: 1,
	};
}
