import type { LeaderboardMetrics as MetricsType } from '../../types/leaderboard';

interface LeaderboardMetricsProps {
  metrics: MetricsType;
}

export function LeaderboardMetrics({ metrics }: LeaderboardMetricsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border mb-6">
      <div className="bg-surface p-4 flex flex-col justify-center">
        <div className="text-[10px] text-text-secondary uppercase tracking-widest mb-1">Total Holders</div>
        <div className="text-xl font-mono font-bold text-text-primary">
          {metrics.totalHolders.toLocaleString()}
        </div>
      </div>
      
      <div className="bg-surface p-4 flex flex-col justify-center">
        <div className="text-[10px] text-text-secondary uppercase tracking-widest mb-1">Total Token Supply</div>
        <div className="text-xl font-mono font-bold text-text-primary">
          {metrics.totalSupply.toLocaleString()} <span className="text-sm font-normal text-text-secondary">SHUB</span>
        </div>
      </div>
      
      <div className="bg-surface p-4 flex flex-col justify-center">
        <div className="text-[10px] text-text-secondary uppercase tracking-widest mb-1">Top 10 Ownership</div>
        <div className="text-xl font-mono font-bold text-text-primary">
          {metrics.top10Ownership.toFixed(1)}%
        </div>
      </div>
      
      <div className="bg-surface p-4 flex flex-col justify-center">
        <div className="text-[10px] text-text-secondary uppercase tracking-widest mb-1">Live Events</div>
        <div className="flex items-center gap-2 mt-1 text-sm font-mono font-bold">
          <div className={`w-2 h-2 rounded-full ${
            metrics.liveEventsStatus === 'CONNECTED' ? 'bg-success ledger-pulse' :
            metrics.liveEventsStatus === 'RECONNECTING' || metrics.liveEventsStatus === 'CONNECTING' ? 'bg-primary' :
            'bg-error'
          }`} />
          <span className={
            metrics.liveEventsStatus === 'CONNECTED' ? 'text-success' :
            metrics.liveEventsStatus === 'RECONNECTING' || metrics.liveEventsStatus === 'CONNECTING' ? 'text-primary' :
            'text-error'
          }>
            {metrics.liveEventsStatus}
          </span>
        </div>
      </div>
    </div>
  );
}
