'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from 'next-themes';
import type { FlightData, UserSettings, Stats, VoiceSettings } from '@/lib/types';
import { calculateDistance, getDefaultVoiceSettings } from '@/lib/types';
import { generateDemoFlights, getDemoRoutes } from '@/lib/demo-data';
import { Radar } from './radar';
import { FlightCards } from './flight-cards';
import { FlightDetailPanel } from './flight-detail-panel';
import { StatsBar } from './stats-bar';
import { SettingsModal } from './settings-modal';
import { useVoice } from '@/hooks/use-voice';

interface DashboardProps {
  initialSettings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
}

export function Dashboard({ initialSettings, onSettingsChange }: DashboardProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [routes, setRoutes] = useState<Record<string, { origin: string; destination: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    todayCount: 0,
    busiestHour: '12:00',
    overheadCount: 0,
    lastFlight: '',
  });
  
  const { theme, setTheme } = useTheme();
  
  const voiceSettings: VoiceSettings = settings.voiceSettings || getDefaultVoiceSettings();
  const { announceOverheadFlight, stopSpeaking } = useVoice(voiceSettings);
  const seenFlights = useRef<Set<string>>(new Set());
  const todayFlights = useRef<Set<string>>(new Set());
  const hourlyCount = useRef<Record<number, number>>({});
  
  // Store the announcement function in a ref to avoid dependency issues
  const announceRef = useRef(announceOverheadFlight);
  announceRef.current = announceOverheadFlight;
  const voiceEnabledRef = useRef(voiceSettings.enabled);
  voiceEnabledRef.current = voiceSettings.enabled;

  // Get the selected flight data
  const selectedFlightData = flights.find(f => f.icao24 === selectedFlight);

  const fetchFlights = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        lat: settings.latitude.toString(),
        lon: settings.longitude.toString(),
        radius: settings.radiusKm.toString(),
      });
      
      if (settings.apiClientId && settings.apiClientSecret) {
        params.set('clientId', settings.apiClientId);
        params.set('clientSecret', settings.apiClientSecret);
      }

      const response = await fetch(`/api/flights?${params}`);
      const data = await response.json();

      if (data.demoMode || !data.states || data.states.length === 0) {
        // Use demo data
        setIsDemoMode(true);
        const demoFlights = generateDemoFlights(settings.latitude, settings.longitude, settings.radiusKm);
        setFlights(demoFlights);
        setRoutes(getDemoRoutes());
      } else {
        setIsDemoMode(false);
        // Parse OpenSky response
        const parsedFlights: FlightData[] = data.states.map((state: (string | number | boolean | null)[]) => ({
          icao24: state[0] as string,
          callsign: (state[1] as string)?.trim() || '',
          originCountry: state[2] as string,
          longitude: state[5] as number,
          latitude: state[6] as number,
          altitude: state[7] as number || state[13] as number || 0,
          velocity: state[9] as number || 0,
          heading: state[10] as number || 0,
          verticalRate: state[11] as number || 0,
          onGround: state[8] as boolean,
          squawk: state[14] as string || '',
          spiFlag: state[15] as boolean,
          positionSource: state[16] as number,
        })).filter((f: FlightData) => f.latitude && f.longitude);
        
        setFlights(parsedFlights);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching flights:', error);
      // Fallback to demo mode
      setIsDemoMode(true);
      const demoFlights = generateDemoFlights(settings.latitude, settings.longitude, settings.radiusKm);
      setFlights(demoFlights);
      setRoutes(getDemoRoutes());
      setIsLoading(false);
    }
  }, [settings]);

  // Track overhead flights and stats
  useEffect(() => {
    const currentHour = new Date().getHours();
    let overheadCount = 0;

    flights.forEach((flight) => {
      const distance = calculateDistance(
        settings.latitude,
        settings.longitude,
        flight.latitude,
        flight.longitude
      );
      const isOverhead = distance < settings.radiusKm * 0.15;

      // Track for today's count
      todayFlights.current.add(flight.icao24);

      // Track hourly
      hourlyCount.current[currentHour] = (hourlyCount.current[currentHour] || 0) + 1;

      if (isOverhead) {
        overheadCount++;
        
        // Announce new overhead flights
        if (!seenFlights.current.has(flight.icao24) && voiceSettings.enabled) {
          seenFlights.current.add(flight.icao24);
          announceOverheadFlight(flight);
        }
      }
    });

    // Calculate busiest hour
    let busiestHour = 12;
    let maxCount = 0;
    Object.entries(hourlyCount.current).forEach(([hour, count]) => {
      if (count > maxCount) {
        maxCount = count;
        busiestHour = parseInt(hour);
      }
    });

    setStats({
      todayCount: todayFlights.current.size,
      busiestHour: `${busiestHour.toString().padStart(2, '0')}:00`,
      overheadCount,
      lastFlight: flights[0]?.callsign?.trim() || '',
    });
  }, [flights, settings, announceOverheadFlight, voiceSettings.enabled]);

  // Initial fetch
  useEffect(() => {
    fetchFlights();
  }, [fetchFlights]);

  // Polling with countdown
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchFlights();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [fetchFlights]);

  const handleSettingsChange = (newSettings: UserSettings) => {
    setSettings(newSettings);
    onSettingsChange(newSettings);
    setIsLoading(true);
    setCountdown(15);
  };

  const handleSelectFlight = (icao24: string | null) => {
    setSelectedFlight(icao24);
  };

  // Cycle through themes
  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  return (
    <div className="h-screen flex flex-col bg-background scanlines">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-primary text-glow">PLANE SPOTTER</h1>
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <span>{settings.latitude.toFixed(2)}, {settings.longitude.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Demo Mode Badge */}
          {isDemoMode && (
            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 border border-border">
              DEMO MODE
            </span>
          )}
          
          {/* Refresh Countdown */}
          <div className="text-xs text-muted-foreground hidden sm:block">
            REFRESH: <span className="text-primary">{countdown}s</span>
          </div>
          
          {/* Live Indicator */}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-primary blink glow" />
            <span className="text-xs text-primary">LIVE</span>
          </div>
          
          {/* Theme Toggle */}
          <button
            onClick={cycleTheme}
            className="p-1.5 border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
            title={`Theme: ${theme}`}
          >
            {theme === 'dark' ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : theme === 'light' ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
            )}
          </button>
          
          {/* Voice Toggle Quick Button */}
          <button
            onClick={() => {
              const newEnabled = !voiceSettings.enabled;
              // If muting, stop any current speech immediately
              if (!newEnabled) {
                stopSpeaking();
              }
              handleSettingsChange({ 
                ...settings, 
                voiceEnabled: newEnabled,
                voiceSettings: { ...voiceSettings, enabled: newEnabled }
              });
            }}
            className={`p-1.5 border ${voiceSettings.enabled ? 'border-primary text-primary' : 'border-muted-foreground text-muted-foreground'}`}
            title={voiceSettings.enabled ? 'Voice alerts on' : 'Voice alerts off'}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              {voiceSettings.enabled ? (
                <>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </>
              ) : (
                <path d="M23 9l-6 6M17 9l6 6" />
              )}
            </svg>
          </button>
          
          {/* Settings */}
          <SettingsModal settings={settings} onSave={handleSettingsChange} />
        </div>
      </header>

      {/* Main Content - Responsive Layout */}
      <main className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Radar Panel */}
        <div className="lg:w-[60%] p-4 flex items-center justify-center">
          <Radar
            flights={flights}
            userLat={settings.latitude}
            userLon={settings.longitude}
            radiusKm={settings.radiusKm}
            selectedFlight={selectedFlight}
            onSelectFlight={handleSelectFlight}
            className="w-full max-w-[500px] lg:max-w-none aspect-square"
          />
        </div>

        {/* Flight Cards Panel */}
        <div className="lg:w-[40%] border-t lg:border-t-0 lg:border-l border-border overflow-y-auto flex-1 lg:flex-none flex flex-col">
          {/* Selected Flight Detail */}
          {selectedFlightData && (
            <div className="p-4 border-b border-border">
              <FlightDetailPanel
                flight={selectedFlightData}
                userLat={settings.latitude}
                userLon={settings.longitude}
                radiusKm={settings.radiusKm}
                route={routes[selectedFlightData.callsign?.trim() || '']}
                onClose={() => setSelectedFlight(null)}
              />
            </div>
          )}
          
          <div className="sticky top-0 bg-card/90 backdrop-blur border-b border-border px-4 py-2 z-10">
            <h2 className="text-sm text-primary">
              DETECTED AIRCRAFT ({flights.length})
            </h2>
          </div>
          <FlightCards
            flights={flights}
            userLat={settings.latitude}
            userLon={settings.longitude}
            radiusKm={settings.radiusKm}
            routes={routes}
            isLoading={isLoading}
            selectedFlight={selectedFlight}
            onSelectFlight={handleSelectFlight}
          />
        </div>
      </main>

      {/* Stats Bar */}
      <StatsBar stats={stats} />
    </div>
  );
}
