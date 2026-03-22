import type { FlightData } from './types';

const DEMO_CALLSIGNS = [
  'LY318', 'BA156', 'UA789', 'LH442', 'FR8294',
  'EK203', 'AF1234', 'TK1847', 'QR007', 'SQ321',
  'AA100', 'DL456', 'EY77', 'KL605', 'NH204'
];

const DEMO_ORIGINS = [
  'TLV', 'JFK', 'LHR', 'CDG', 'FRA', 'DXB', 'IST', 'SIN', 'AMS', 'FCO'
];

const DEMO_DESTINATIONS = [
  'LHR', 'JFK', 'TLV', 'DXB', 'SIN', 'LAX', 'ORD', 'MUC', 'ZRH', 'BCN'
];

export function generateDemoFlights(
  centerLat: number,
  centerLon: number,
  radiusKm: number
): FlightData[] {
  const numFlights = Math.floor(Math.random() * 8) + 3; // 3-10 flights
  const flights: FlightData[] = [];

  for (let i = 0; i < numFlights; i++) {
    // Generate random position within radius
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusKm;
    
    // Convert km to degrees (approximate)
    const latOffset = (distance * Math.cos(angle)) / 111;
    const lonOffset = (distance * Math.sin(angle)) / (111 * Math.cos(centerLat * Math.PI / 180));

    flights.push({
      icao24: `DEMO${i.toString().padStart(4, '0')}`,
      callsign: DEMO_CALLSIGNS[Math.floor(Math.random() * DEMO_CALLSIGNS.length)],
      originCountry: 'Demo',
      longitude: centerLon + lonOffset,
      latitude: centerLat + latOffset,
      altitude: 8000 + Math.random() * 4000, // 8000-12000m
      velocity: 200 + Math.random() * 100, // 200-300 m/s
      heading: Math.random() * 360,
      verticalRate: (Math.random() - 0.5) * 10,
      onGround: false,
      squawk: '1200',
      spiFlag: false,
      positionSource: 0,
    });
  }

  return flights;
}

export function getDemoRoutes(): Record<string, { origin: string; destination: string }> {
  const routes: Record<string, { origin: string; destination: string }> = {};
  
  DEMO_CALLSIGNS.forEach(callsign => {
    const origin = DEMO_ORIGINS[Math.floor(Math.random() * DEMO_ORIGINS.length)];
    let destination = DEMO_DESTINATIONS[Math.floor(Math.random() * DEMO_DESTINATIONS.length)];
    while (destination === origin) {
      destination = DEMO_DESTINATIONS[Math.floor(Math.random() * DEMO_DESTINATIONS.length)];
    }
    routes[callsign] = { origin, destination };
  });
  
  return routes;
}
