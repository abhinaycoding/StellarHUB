import type { Holder } from '../../types/leaderboard';

interface TopHoldersProps {
  holders: Holder[];
}

export function TopHolders({ holders }: TopHoldersProps) {
  const top3 = holders.slice(0, 3);
  
  if (top3.length === 0) return null;

  const labels = ['TOP HOLDER', 'SECOND', 'THIRD'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {top3.map((holder, idx) => (
        <div key={holder.address} className="bg-surface border border-border p-4 relative overflow-hidden group hover:border-primary/50 transition-colors">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-border/10 to-transparent pointer-events-none" />
          
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-mono font-bold text-text-secondary bg-background px-2 py-0.5 border border-border">
              0{idx + 1}
            </span>
            <span className="text-xs font-bold text-text-secondary tracking-widest uppercase">
              — {labels[idx]}
            </span>
          </div>
          
          <div className="space-y-3 font-mono">
            <div>
              <div className="text-[10px] text-text-secondary uppercase mb-1">Wallet</div>
              <div className="text-sm text-text-primary truncate" title={holder.address}>
                {holder.address}
              </div>
            </div>
            
            <div>
              <div className="text-[10px] text-text-secondary uppercase mb-1">Balance</div>
              <div className={`text-lg font-bold ${idx === 0 ? 'text-primary' : 'text-text-primary'}`}>
                {holder.balance.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
