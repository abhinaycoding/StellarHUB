import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, ExternalLink, RefreshCw, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getTransactions, type ParsedTransaction } from "@/services/stellar";
import { useWallet } from "@/contexts/WalletContext";

export function Transactions() {
  const { address } = useWallet();
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTxs = () => {
    if (!address) {
      setTransactions([]);
      return;
    }
    
    setIsLoading(true);
    getTransactions(address)
      .then((txs) => {
        setTransactions(txs);
      })
      .catch((err) => {
        console.error("Failed to fetch transactions:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchTxs();
    
    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchTxs, 15000);
    return () => clearInterval(interval);
  }, [address]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Transactions</h1>
          <p className="text-text-secondary">View your recent activity on the Stellar Testnet.</p>
        </div>
        <button 
          onClick={fetchTxs}
          disabled={isLoading || !address}
          className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface/80 border border-border rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl min-h-[400px]">
        {!address ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-text-secondary">
            <p>Please connect your wallet to view transactions.</p>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-text-secondary">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p className="text-text-secondary">Loading activity...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-text-secondary">
            <p>No transactions found for this account.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {transactions.map((tx, index) => (
              <motion.div 
                key={tx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 sm:p-6 hover:bg-surface/50 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${tx.type === 'receive' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                    {tx.type === 'receive' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="text-white font-medium mb-1">
                      {tx.type === 'receive' ? 'Received XLM' : 'Sent XLM'}
                    </div>
                    <div className="text-sm text-text-secondary flex items-center gap-2">
                      {tx.date}
                      <span className="w-1 h-1 rounded-full bg-text-secondary/50"></span>
                      <span className="font-mono">
                        {tx.address ? `${tx.address.slice(0, 4)}...${tx.address.slice(-4)}` : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-medium mb-1 ${tx.type === 'receive' ? 'text-success' : 'text-white'}`}>
                    {tx.amount}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      tx.status === 'Completed' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                    }`}>
                      {tx.status}
                    </span>
                    <a 
                      href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-text-secondary hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
