'use client';

import { useMemo } from 'react';
import type { FlightData } from '@/lib/types';
import { calculateDistance } from '@/lib/types';

interface RadarProps {
  flights: FlightData[];
  userLat: number;
  userLon: number;
  radiusKm: number;
  selectedFlight: string | null;
  onSelectFlight: (icao24: string | null) => void;
  className?: string;
}

export function Radar({ 
  flights, 
  userLat, 
  userLon, 
  radiusKm, 
  selectedFlight,
  onSelectFlight,
  className = '' 
}: RadarProps) {
  const planePositions = useMemo(() => {
    return flights.map((flight) => {
      const distance = calculateDistance(userLat, userLon, flight.latitude, flight.longitude);
      const isOverhead = distance < radiusKm * 0.15;
      const isSelected = selectedFlight === flight.icao24;
      
      // Calculate relative position (normalized -1 to 1)
      const latDiff = flight.latitude - userLat;
      const lonDiff = flight.longitude - userLon;
      
      // Convert to km then normalize
      const xKm = lonDiff * 111 * Math.cos(userLat * Math.PI / 180);
      const yKm = latDiff * 111;
      
      // Normalize to radar display (-45 to 45 in SVG coordinates)
      const x = (xKm / radiusKm) * 42 + 50;
      const y = 50 - (yKm / radiusKm) * 42; // Invert Y for SVG
      
      // Clamp to radar bounds
      const clampedX = Math.max(8, Math.min(92, x));
      const clampedY = Math.max(8, Math.min(92, y));
      
      return {
        ...flight,
        x: clampedX,
        y: clampedY,
        isOverhead,
        isSelected,
        distance,
      };
    });
  }, [flights, userLat, userLon, radiusKm, selectedFlight]);

  return (
    <div className={`relative ${className}`}>
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full text-primary"
        style={{ filter: 'var(--radar-glow)' }}
      >
        {/* Background */}
        <circle cx="50" cy="50" r="48" fill="currentColor" fillOpacity="0.02" />
        
        {/* Radar circles */}
        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.3" opacity="0.4" />
        <circle cx="50" cy="50" r="36" fill="none" stroke="currentColor" strokeWidth="0.2" opacity="0.3" />
        <circle cx="50" cy="50" r="27" fill="none" stroke="currentColor" strokeWidth="0.2" opacity="0.3" />
        <circle cx="50" cy="50" r="18" fill="none" stroke="currentColor" strokeWidth="0.2" opacity="0.3" />
        <circle cx="50" cy="50" r="9" fill="none" stroke="currentColor" strokeWidth="0.2" opacity="0.3" />
        
        {/* Cross hairs */}
        <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="0.2" opacity="0.3" />
        <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="0.2" opacity="0.3" />
        
        {/* Diagonal lines */}
        <line x1="14.6" y1="14.6" x2="85.4" y2="85.4" stroke="currentColor" strokeWidth="0.2" opacity="0.2" />
        <line x1="85.4" y1="14.6" x2="14.6" y2="85.4" stroke="currentColor" strokeWidth="0.2" opacity="0.2" />
        
        {/* Cardinal directions */}
        <text x="50" y="4" textAnchor="middle" fill="currentColor" fontSize="3" opacity="0.6">N</text>
        <text x="50" y="99" textAnchor="middle" fill="currentColor" fontSize="3" opacity="0.6">S</text>
        <text x="3" y="51" textAnchor="middle" fill="currentColor" fontSize="3" opacity="0.6">W</text>
        <text x="97" y="51" textAnchor="middle" fill="currentColor" fontSize="3" opacity="0.6">E</text>
        
        {/* Distance markers */}
        <text x="50" y="16" textAnchor="middle" fill="currentColor" fontSize="2" opacity="0.4">
          {Math.round(radiusKm * 0.8)}km
        </text>
        <text x="50" y="25" textAnchor="middle" fill="currentColor" fontSize="2" opacity="0.4">
          {Math.round(radiusKm * 0.6)}km
        </text>
        <text x="50" y="34" textAnchor="middle" fill="currentColor" fontSize="2" opacity="0.4">
          {Math.round(radiusKm * 0.4)}km
        </text>
        <text x="50" y="43" textAnchor="middle" fill="currentColor" fontSize="2" opacity="0.4">
          {Math.round(radiusKm * 0.2)}km
        </text>
        
        {/* Radar sweep */}
        <path
          d="M50,50 L50,5 A45,45 0 0,1 95,50 Z"
          fill="url(#sweep-gradient-main)"
          className="radar-sweep"
        />
        
        {/* Planes */}
        {planePositions.map((plane) => (
          <g 
            key={plane.icao24} 
            transform={`translate(${plane.x}, ${plane.y})`}
            className={`cursor-pointer ${plane.isSelected ? 'glow-pulse' : plane.isOverhead ? 'glow-pulse' : ''}`}
            onClick={() => onSelectFlight(plane.isSelected ? null : plane.icao24)}
            style={{ pointerEvents: 'all' }}
          >
            {/* Selection ring */}
            {plane.isSelected && (
              <circle 
                r="5" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="0.5"
                opacity="0.8"
              />
            )}
            {/* Plane icon - rotated based on heading */}
            <g transform={`rotate(${plane.heading}, 0, 0)`}>
              <path
                d="M0,-2 L1,2 L0,1 L-1,2 Z"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth={plane.isSelected ? "0.5" : "0.2"}
                className={plane.isOverhead || plane.isSelected ? 'glow-pulse' : ''}
              />
            </g>
            {/* Callsign label */}
            <text 
              x="3" 
              y="0" 
              fontSize={plane.isSelected ? "2.5" : "2"} 
              fill="currentColor" 
              opacity={plane.isSelected ? "1" : "0.8"}
              fontWeight={plane.isSelected ? "bold" : "normal"}
              style={{ textShadow: '0 0 2px currentColor' }}
            >
              {plane.callsign?.trim() || plane.icao24}
            </text>
          </g>
        ))}
        
        {/* Center point (user location) */}
        <circle cx="50" cy="50" r="1.5" fill="currentColor" className="glow-pulse" />
        <circle cx="50" cy="50" r="3" fill="none" stroke="currentColor" strokeWidth="0.3" opacity="0.6" />
        
        <defs>
          <linearGradient id="sweep-gradient-main" x1="50%" y1="0%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Overlay info */}
      <div className="absolute bottom-2 left-2 text-xs text-muted-foreground">
        <span className="text-primary">{flights.length}</span> aircraft in range
      </div>
      <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
        {radiusKm}km radius
      </div>
    </div>
  );
}
