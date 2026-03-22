'use client';

import type { FlightData } from '@/lib/types';
import { getAirlineName, getHeadingDirection, metersToFeet, msToKnots, calculateDistance } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

interface FlightCardsProps {
  flights: FlightData[];
  userLat: number;
  userLon: number;
  radiusKm: number;
  routes: Record<string, { origin: string; destination: string }>;
  isLoading: boolean;
  selectedFlight: string | null;
  onSelectFlight: (icao24: string | null) => void;
}

export function FlightCards({ 
  flights, 
  userLat, 
  userLon, 
  radiusKm, 
  routes, 
  isLoading,
  selectedFlight,
  onSelectFlight,
}: FlightCardsProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border border-border bg-card p-4 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-24 bg-muted" />
              <Skeleton className="h-5 w-20 bg-muted" />
            </div>
            <Skeleton className="h-4 w-32 bg-muted" />
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-4 w-full bg-muted" />
              <Skeleton className="h-4 w-full bg-muted" />
              <Skeleton className="h-4 w-full bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (flights.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 p-4">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">No aircraft detected</p>
          <p className="text-xs text-muted-foreground">Scanning airspace...</p>
        </div>
      </div>
    );
  }

  // Sort by distance (closest first)
  const sortedFlights = [...flights].sort((a, b) => {
    const distA = calculateDistance(userLat, userLon, a.latitude, a.longitude);
    const distB = calculateDistance(userLat, userLon, b.latitude, b.longitude);
    return distA - distB;
  });

  return (
    <div className="space-y-3 p-4 overflow-y-auto">
      {sortedFlights.map((flight) => {
        const distance = calculateDistance(userLat, userLon, flight.latitude, flight.longitude);
        const isOverhead = distance < radiusKm * 0.15;
        const isSelected = selectedFlight === flight.icao24;
        const callsign = flight.callsign?.trim() || flight.icao24;
        const airline = getAirlineName(callsign);
        const route = routes[callsign];
        
        return (
          <button
            key={flight.icao24}
            onClick={() => onSelectFlight(isSelected ? null : flight.icao24)}
            className={`w-full text-left border p-4 space-y-3 transition-all cursor-pointer ${
              isSelected 
                ? 'border-primary bg-primary/20 selected-plane' 
                : isOverhead 
                  ? 'border-primary bg-primary/10 glow hover:bg-primary/15' 
                  : 'border-border bg-card hover:border-primary/50 hover:bg-card/80'
            }`}
          >
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${isOverhead || isSelected ? 'text-primary text-glow' : 'text-foreground'}`}>
                    {callsign}
                  </span>
                  {isOverhead && (
                    <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 blink">
                      OVERHEAD
                    </span>
                  )}
                  {isSelected && (
                    <span className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5">
                      SELECTED
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{airline}</p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>{distance.toFixed(1)} km</p>
              </div>
            </div>

            {/* Route */}
            {route && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-primary">{route.origin}</span>
                <span className="text-muted-foreground">-</span>
                <span className="text-primary">{route.destination}</span>
              </div>
            )}

            {/* Flight data grid */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">ALT</p>
                <p className="text-foreground">{metersToFeet(flight.altitude).toLocaleString()} ft</p>
              </div>
              <div>
                <p className="text-muted-foreground">SPD</p>
                <p className="text-foreground">{msToKnots(flight.velocity)} kts</p>
              </div>
              <div>
                <p className="text-muted-foreground">HDG</p>
                <p className="text-foreground">{Math.round(flight.heading)}° {getHeadingDirection(flight.heading)}</p>
              </div>
            </div>

            {/* Heading indicator */}
            <div className="flex items-center gap-2">
              <svg 
                className="w-4 h-4 text-primary" 
                viewBox="0 0 24 24"
                style={{ transform: `rotate(${flight.heading}deg)` }}
              >
                <path 
                  d="M12 2L16 20L12 16L8 20L12 2Z" 
                  fill="currentColor"
                />
              </svg>
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">
                {flight.onGround ? 'ON GROUND' : 'AIRBORNE'}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
