import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useTokenEvents } from '../hooks/useTokenEvents';
import { useWalletWatchlist } from '../hooks/useWalletWatchlist';

import { TokenSelector } from '../components/leaderboard/TokenSelector';
import { LeaderboardMetrics } from '../components/leaderboard/LeaderboardMetrics';
import { TopHolders } from '../components/leaderboard/TopHolders';
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable';
import { LiveContractEvents } from '../components/leaderboard/LiveContractEvents';
import { WalletWatchlist } from '../components/leaderboard/WalletWatchlist';
import { LeaderboardSkeleton } from '../components/leaderboard/LeaderboardSkeleton';

const DEFAULT_CONTRACT = import.meta.env.VITE_TOKEN_CONTRACT_ID || 'CABC1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEF';

export function TokenLeaderboard() {
  const { address } = useWallet();
  const [contractId, setContractId] = useState(DEFAULT_CONTRACT);
  
  const { holders, metrics, setMetrics, setHolders, isLoading, error } = useLeaderboard(contractId);
  const { events } = useTokenEvents(contractId, setHolders, setMetrics);
  const { watchlist, addWallet, removeWallet } = useWalletWatchlist(address || undefined);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">TOKEN LEADERBOARD</h1>
          <p className="text-text-secondary text-sm">Live holder rankings powered by Stellar Testnet.</p>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1.5 border border-primary/30 bg-primary/5 text-primary text-xs font-bold tracking-widest">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          TESTNET
        </div>
      </div>

      <TokenSelector contractId={contractId} setContractId={setContractId} />

      {error ? (
        <div className="bg-error/10 border border-error p-6 text-center">
          <div className="text-error font-bold mb-2">ERROR LOADING LEADERBOARD</div>
          <div className="text-error/80 text-sm mb-4">{error.message}</div>
          {error.details && <div className="text-xs font-mono text-error/60 bg-background/50 p-2 inline-block">{error.details}</div>}
        </div>
      ) : isLoading ? (
        <LeaderboardSkeleton />
      ) : (
        <>
          <LeaderboardMetrics metrics={metrics} />
          
          <TopHolders holders={holders} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <LeaderboardTable holders={holders} isLoading={isLoading} />
            </div>
            
            <div className="space-y-6">
              <LiveContractEvents events={events} status={metrics.liveEventsStatus} />
              <WalletWatchlist 
                watchlist={watchlist} 
                addWallet={addWallet} 
                removeWallet={removeWallet} 
                holders={holders}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
