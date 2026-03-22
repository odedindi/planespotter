'use client';

import type { FlightData } from '@/lib/types';
import { getAirlineName, getHeadingDirection, metersToFeet, msToKnots, calculateDistance } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface FlightDetailPanelProps {
  flight: FlightData;
  userLat: number;
  userLon: number;
  radiusKm: number;
  route?: { origin: string; destination: string };
  onClose: () => void;
}

export function FlightDetailPanel({ 
  flight, 
  userLat, 
  userLon, 
  radiusKm,
  route,
  onClose 
}: FlightDetailPanelProps) {
  const distance = calculateDistance(userLat, userLon, flight.latitude, flight.longitude);
  const isOverhead = distance < radiusKm * 0.15;
  const callsign = flight.callsign?.trim() || flight.icao24;
  const airline = getAirlineName(callsign);
  const altitudeFt = metersToFeet(flight.altitude);
  const speedKts = msToKnots(flight.velocity);
  const verticalFpm = Math.round(flight.verticalRate * 196.85); // m/s to ft/min

  return (
    <div className="bg-card border-2 border-primary p-4 space-y-4 selected-plane">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold text-primary text-glow">{callsign}</h3>
            {isOverhead && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-1 blink">
                OVERHEAD
              </span>
            )}
          </div>
          <p className="text-muted-foreground">{airline}</p>
          <p className="text-xs text-muted-foreground mt-1">{flight.originCountry}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </Button>
      </div>

      {/* Route */}
      {route && (
        <div className="flex items-center gap-3 py-2 border-y border-border">
          <div className="text-center">
            <p className="text-lg font-bold text-primary">{route.origin}</p>
            <p className="text-xs text-muted-foreground">Origin</p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-primary"
              viewBox="0 0 24 24"
              style={{ transform: `rotate(${flight.heading}deg)` }}
            >
              <path 
                d="M12 2L16 20L12 16L8 20L12 2Z" 
                fill="currentColor"
              />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-primary">{route.destination}</p>
            <p className="text-xs text-muted-foreground">Destination</p>
          </div>
        </div>
      )}

      {/* Flight Data Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase">Altitude</p>
          <p className="text-lg font-bold text-foreground">{altitudeFt.toLocaleString()} ft</p>
          <p className="text-xs text-muted-foreground">({Math.round(flight.altitude).toLocaleString()} m)</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase">Ground Speed</p>
          <p className="text-lg font-bold text-foreground">{speedKts} kts</p>
          <p className="text-xs text-muted-foreground">({Math.round(flight.velocity * 3.6)} km/h)</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase">Heading</p>
          <p className="text-lg font-bold text-foreground">{Math.round(flight.heading)}°</p>
          <p className="text-xs text-muted-foreground">{getHeadingDirection(flight.heading)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase">Distance</p>
          <p className="text-lg font-bold text-foreground">{distance.toFixed(1)} km</p>
          <p className="text-xs text-muted-foreground">({(distance * 0.539957).toFixed(1)} nm)</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase">Vertical Rate</p>
          <p className={`text-lg font-bold ${verticalFpm > 0 ? 'text-green-500' : verticalFpm < 0 ? 'text-orange-500' : 'text-foreground'}`}>
            {verticalFpm > 0 ? '+' : ''}{verticalFpm} ft/min
          </p>
          <p className="text-xs text-muted-foreground">
            {verticalFpm > 100 ? 'Climbing' : verticalFpm < -100 ? 'Descending' : 'Level'}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase">Status</p>
          <p className="text-lg font-bold text-foreground">{flight.onGround ? 'On Ground' : 'Airborne'}</p>
          {flight.squawk && (
            <p className="text-xs text-muted-foreground">Squawk: {flight.squawk}</p>
          )}
        </div>
      </div>

      {/* Position */}
      <div className="pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground uppercase mb-2">Position</p>
        <div className="flex items-center justify-between">
          <p className="text-sm text-foreground">
            {flight.latitude.toFixed(4)}°, {flight.longitude.toFixed(4)}°
          </p>
          <p className="text-xs text-muted-foreground">ICAO: {flight.icao24.toUpperCase()}</p>
        </div>
      </div>

      {/* Compass */}
      <div className="flex justify-center pt-2">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full text-primary" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
            <text x="50" y="12" textAnchor="middle" fill="currentColor" fontSize="8">N</text>
            <text x="50" y="95" textAnchor="middle" fill="currentColor" fontSize="8">S</text>
            <text x="8" y="53" textAnchor="middle" fill="currentColor" fontSize="8">W</text>
            <text x="92" y="53" textAnchor="middle" fill="currentColor" fontSize="8">E</text>
            <g transform={`rotate(${flight.heading}, 50, 50)`}>
              <path d="M50,15 L55,50 L50,45 L45,50 Z" fill="currentColor" />
              <circle cx="50" cy="50" r="3" fill="currentColor" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
