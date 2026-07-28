import { useState, useEffect } from 'react';
import type { WatchlistWallet } from '../types/leaderboard';

const WATCHLIST_KEY = 'stellarhub_watchlist';

export const useWalletWatchlist = (connectedAddress?: string) => {
  const [watchlist, setWatchlist] = useState<WatchlistWallet[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(WATCHLIST_KEY);
      if (stored) {
        setWatchlist(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to parse watchlist from local storage", e);
    }
  }, []);

  // Ensure connected wallet is always in watchlist
  useEffect(() => {
    if (connectedAddress) {
      setWatchlist(prev => {
        if (!prev.some(w => w.address === connectedAddress)) {
          const newList = [{ address: connectedAddress, label: 'Main Wallet' }, ...prev];
          localStorage.setItem(WATCHLIST_KEY, JSON.stringify(newList));
          return newList;
        }
        return prev;
      });
    }
  }, [connectedAddress]);

  const addWallet = (address: string, label: string) => {
    setWatchlist(prev => {
      if (prev.some(w => w.address === address)) return prev;
      const newList = [...prev, { address, label }];
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(newList));
      return newList;
    });
  };

  const removeWallet = (address: string) => {
    setWatchlist(prev => {
      const newList = prev.filter(w => w.address !== address);
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(newList));
      return newList;
    });
  };

  return { watchlist, addWallet, removeWallet };
};
