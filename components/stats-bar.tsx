'use client';

import type { Stats } from '@/lib/types';

interface StatsBarProps {
  stats: Stats;
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="border-t border-border bg-card/50 px-4 py-2">
      <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center text-xs text-muted-foreground">
        <span>
          <span className="text-primary">TODAY:</span> {stats.todayCount}
        </span>
        <span className="hidden sm:inline">|</span>
        <span>
          <span className="text-primary">BUSIEST:</span> {stats.busiestHour}
        </span>
        <span className="hidden sm:inline">|</span>
        <span>
          <span className="text-primary">OVERHEAD:</span> {stats.overheadCount}
        </span>
        <span className="hidden sm:inline">|</span>
        <span>
          <span className="text-primary">LAST:</span> {stats.lastFlight || 'N/A'}
        </span>
      </div>
    </div>
  );
}
