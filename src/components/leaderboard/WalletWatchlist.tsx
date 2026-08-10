import { useState } from 'react';
import { Trash2, Plus, Wallet, Eye } from 'lucide-react';
import type { WatchlistWallet, Holder } from '../../types/leaderboard';
import { isValidAddress } from '../../services/stellar';
import { motion, AnimatePresence } from 'framer-motion';

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
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAdding(true)}
            className="text-xs font-bold text-text-secondary hover:text-primary flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3" /> ADD WALLET
          </motion.button>
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

      {watchlist.length === 0 && !isAdding ? (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="p-12 text-center flex flex-col items-center justify-center min-h-[250px]"
        >
          <div className="relative mb-6">
            <motion.div
              animate={{ 
                y: [0, -8, 0],
                rotate: [0, -2, 2, 0]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="bg-primary/10 p-5 rounded-full relative z-10"
            >
              <Eye className="w-10 h-10 text-primary" />
            </motion.div>
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} 
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-2 -right-2 bg-background p-1.5 rounded-full border border-border z-20 shadow-md"
            >
              <Wallet className="w-4 h-4 text-text-secondary" />
            </motion.div>
          </div>
          <div className="text-text-primary font-bold tracking-widest uppercase mb-3">NO WALLETS WATCHED</div>
          <div className="text-sm text-text-secondary max-w-[280px]">
            Add a Stellar address to track its token balance and leaderboard rank in real-time.
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAdding(true)}
            className="mt-6 border border-primary text-primary px-5 py-2 text-xs font-bold hover:bg-primary/10 transition-colors tracking-wider"
          >
            START WATCHING
          </motion.button>
        </motion.div>
      ) : (
        <div className="divide-y divide-border/30">
          <AnimatePresence mode="popLayout">
            {watchlist.map(wallet => {
              const holderData = holders.find(h => h.address === wallet.address);
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={wallet.address} 
                  className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-background/50 transition-colors group"
                >
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
                    
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeWallet(wallet.address)}
                      className="p-1.5 text-text-secondary opacity-0 group-hover:opacity-100 hover:text-error hover:bg-error/10 transition-all rounded-lg"
                      title="Remove from watchlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
