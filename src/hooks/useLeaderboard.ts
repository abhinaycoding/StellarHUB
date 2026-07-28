import { useState, useEffect, useCallback } from 'react';
import { getLeaderboard, getTokenHoldersCount } from '../services/tokenLeaderboard';
import type { Holder, LeaderboardMetrics } from '../types/leaderboard';
import { StellarError, ErrorCode } from '../utils/stellarErrors';

export const useLeaderboard = (contractId: string) => {
  const [holders, setHolders] = useState<Holder[]>([]);
  const [metrics, setMetrics] = useState<LeaderboardMetrics>({
    totalHolders: 0,
    totalSupply: 1000000,
    top10Ownership: 0,
    liveEventsStatus: 'OFFLINE'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<StellarError | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    if (!contractId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getLeaderboard(contractId, 50);
      const totalCount = await getTokenHoldersCount(contractId);
      
      const sortedData = [...data].sort((a, b) => b.balance - a.balance);
      
      let top10Supply = 0;
      sortedData.slice(0, 10).forEach(h => { top10Supply += h.balance });
      const ownership = metrics.totalSupply > 0 ? (top10Supply / metrics.totalSupply) * 100 : 0;
      
      setHolders(sortedData);
      setMetrics(prev => ({
        ...prev,
        totalHolders: totalCount,
        top10Ownership: ownership
      }));
    } catch (err: any) {
      if (err instanceof StellarError) {
        setError(err);
      } else {
        setError(new StellarError(ErrorCode.UNKNOWN_ERROR, 'Failed to fetch leaderboard.', err.toString()));
      }
    } finally {
      setIsLoading(false);
    }
  }, [contractId, metrics.totalSupply]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return { holders, metrics, setMetrics, setHolders, isLoading, error, refetch: fetchLeaderboard };
};
