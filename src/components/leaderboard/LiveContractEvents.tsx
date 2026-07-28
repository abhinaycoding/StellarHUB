import { Activity, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import type { ContractEvent } from '../../types/leaderboard';

interface LiveContractEventsProps {
  events: ContractEvent[];
  status: 'CONNECTED' | 'RECONNECTING' | 'OFFLINE' | 'CONNECTING';
}

export function LiveContractEvents({ events, status }: LiveContractEventsProps) {
  const getStatusDisplay = () => {
    switch (status) {
      case 'CONNECTED':
        return <div className="flex items-center gap-1 text-success"><Wifi className="w-3 h-3" /> CONNECTED</div>;
      case 'RECONNECTING':
      case 'CONNECTING':
        return <div className="flex items-center gap-1 text-primary"><RefreshCw className="w-3 h-3 animate-spin" /> {status}</div>;
      case 'OFFLINE':
      default:
        return <div className="flex items-center gap-1 text-error"><WifiOff className="w-3 h-3" /> OFFLINE</div>;
    }
  };

  return (
    <div className="bg-surface border border-border flex flex-col h-[300px]">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold tracking-widest uppercase">Live Contract Events</h2>
        </div>
        <div className="text-[10px] font-mono font-bold">
          {getStatusDisplay()}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
        {events.length === 0 ? (
          <div className="text-text-secondary h-full flex items-center justify-center">
            {status === 'CONNECTED' ? 'WAITING FOR EVENTS...' : 'NOT CONNECTED'}
          </div>
        ) : (
          events.map(event => (
            <div key={event.id} className="flex flex-col gap-1 pb-3 border-b border-border/30 animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between text-[10px] text-text-secondary">
                <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                <span className="uppercase">{event.type.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-primary truncate w-32" title={event.address}>
                  {event.address}
                </span>
                <span className={`font-bold ${event.amountChange > 0 ? 'text-success' : 'text-error'}`}>
                  {event.amountChange > 0 ? '+' : ''}{event.amountChange.toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
