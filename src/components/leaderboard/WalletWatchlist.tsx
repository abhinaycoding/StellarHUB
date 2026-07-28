import { useState } from 'react';
import { Trash2, Plus, Wallet } from 'lucide-react';
import type { WatchlistWallet, Holder } from '../../types/leaderboard';
import { isValidAddress } from '../../services/stellar';

interface WalletWatchlistProps {
  watchlist: WatchlistWallet[];
  addWallet: (address: string, label: string) => void;
  removeWallet: (address: string) => void;
  holders: Holder[];
}

export function WalletWatchlist({ watchlist, addWallet, removeWallet, holders }: WalletWatchlistProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [error, setError] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAddress(newAddress)) {
      setError('Invalid Stellar wallet address');
      return;
    }
    if (!newLabel.trim()) {
      setError('Please provide a label');
      return;
    }
    addWallet(newAddress, newLabel);
    setIsAdding(false);
    setNewAddress('');
    setNewLabel('');
    setError('');
  };

  return (
    <div className="bg-surface border border-border">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold tracking-widest uppercase">Watchlist</h2>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="text-xs font-bold text-text-secondary hover:text-primary flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3" /> ADD WALLET
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="p-4 border-b border-border bg-background/30">
          <div className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="G..."
                value={newAddress}
                onChange={e => setNewAddress(e.target.value)}
                className="w-full bg-background border border-border px-3 py-2 text-sm font-mono text-text-primary focus:border-primary outline-none"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Label (e.g. Trading Wallet)"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                className="flex-1 bg-background border border-border px-3 py-2 text-sm text-text-primary focus:border-primary outline-none"
              />
              <button type="submit" className="bg-primary text-background px-4 py-2 text-sm font-bold hover:bg-primary/90 transition-colors">
                SAVE
              </button>
              <button 
                type="button" 
                onClick={() => { setIsAdding(false); setError(''); }}
                className="bg-transparent border border-border text-text-secondary px-4 py-2 text-sm font-bold hover:text-text-primary transition-colors"
              >
                CANCEL
              </button>
            </div>
            {error && <div className="text-error text-xs">{error}</div>}
          </div>
        </form>
      )}

      {watchlist.length === 0 ? (
        <div className="p-8 text-center">
          <div className="text-text-secondary font-mono mb-2">NO WALLETS WATCHED</div>
          <div className="text-sm text-text-secondary">Add a Stellar address to track its token balance and rank.</div>
        </div>
      ) : (
        <div className="divide-y divide-border/30">
          {watchlist.map(wallet => {
            const holderData = holders.find(h => h.address === wallet.address);
            return (
              <div key={wallet.address} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-background/50 transition-colors">
                <div>
                  <div className="text-xs font-bold text-text-primary uppercase tracking-wider mb-1">
                    {wallet.label}
                  </div>
                  <div className="text-xs font-mono text-text-secondary">
                    {wallet.address.substring(0, 8)}...{wallet.address.substring(wallet.address.length - 8)}
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  {holderData ? (
                    <>
                      <div className="text-right">
                        <div className="text-[10px] text-text-secondary uppercase mb-1 font-mono">Balance</div>
                        <div className="text-sm font-bold font-mono">{holderData.balance.toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-text-secondary uppercase mb-1 font-mono">Rank</div>
                        <div className="text-sm font-bold font-mono text-primary">#{holderData.rank}</div>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs font-mono text-text-secondary">NOT IN TOP HOLDERS</div>
                  )}
                  
                  <button 
                    onClick={() => removeWallet(wallet.address)}
                    className="p-1.5 text-text-secondary hover:text-error hover:bg-error/10 transition-colors"
                    title="Remove from watchlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
