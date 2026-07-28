import { useEffect, useState } from 'react';
import { subscribeToTokenEvents } from '../services/tokenLeaderboard';
import type { ContractEvent, LeaderboardMetrics, Holder } from '../types/leaderboard';

export const useTokenEvents = (
  contractId: string, 
  setHolders: React.Dispatch<React.SetStateAction<Holder[]>>,
  setMetrics: React.Dispatch<React.SetStateAction<LeaderboardMetrics>>
) => {
  const [events, setEvents] = useState<ContractEvent[]>([]);

  useEffect(() => {
    if (!contractId) return;

    setMetrics(prev => ({ ...prev, liveEventsStatus: 'CONNECTING' as any })); // Using type cast since CONNECTING is internal here before CONNECTED
    
    // Simulate connection delay
    const connectTimer = setTimeout(() => {
      setMetrics(prev => ({ ...prev, liveEventsStatus: 'CONNECTED' }));
    }, 1500);

    const unsubscribe = subscribeToTokenEvents(
      contractId,
      (event: ContractEvent) => {
        setEvents(prev => [event, ...prev].slice(0, 50));
        
        setHolders(prevHolders => {
          const newHolders = [...prevHolders];
          const holderIndex = newHolders.findIndex(h => h.address === event.address);
          
          if (holderIndex >= 0) {
            newHolders[holderIndex] = {
              ...newHolders[holderIndex],
              balance: newHolders[holderIndex].balance + event.amountChange,
              lastActivity: event.timestamp
            };
          } else {
            // New holder logic could be added here
          }
          
          // Re-sort
          newHolders.sort((a, b) => b.balance - a.balance);
          // Re-rank
          newHolders.forEach((h, index) => {
            h.rank = index + 1;
          });
          
          return newHolders;
        });
      },
      (error) => {
        console.error("Event stream error:", error);
        setMetrics(prev => ({ ...prev, liveEventsStatus: 'RECONNECTING' }));
        // Exponential backoff logic would go here in a real implementation
      }
    );

    return () => {
      clearTimeout(connectTimer);
      unsubscribe();
      setMetrics(prev => ({ ...prev, liveEventsStatus: 'OFFLINE' }));
    };
  }, [contractId, setHolders, setMetrics]);

  return { events };
};
