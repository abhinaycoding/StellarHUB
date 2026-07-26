import { motion } from "framer-motion";
import { ArrowDownRight, Wallet, Activity, Globe } from "lucide-react";
import { useEffect, useState } from "react";
import { getBalances, getTransactions, fundTestnet } from "@/services/stellar";
import { useWallet } from "@/contexts/WalletContext";
import toast from "react-hot-toast";

export function Dashboard() {
  const { address } = useWallet();
  const [balances, setBalances] = useState({ xlm: 0, usdc: 0 });
  const [txCount, setTxCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<string>("None yet");
  const [isLoading, setIsLoading] = useState(false);
  const [isFunding, setIsFunding] = useState(false);

  const fetchDashboardData = async () => {
    if (!address) {
      setBalances({ xlm: 0, usdc: 0 });
      setTxCount(0);
      setRecentActivity("None yet");
      return;
    }
    
    setIsLoading(true);
    try {
      const [bals, txs] = await Promise.all([
        getBalances(address),
        getTransactions(address)
      ]);
      setBalances(bals);
      setTxCount(txs.length);
      
      if (txs.length > 0) {
        const latest = txs[0];
        setRecentActivity(`${latest.amount} (${latest.status})`);
      } else {
        setRecentActivity("None yet");
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [address]);

  const handleFundTestnet = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    setIsFunding(true);
    const loadingToast = toast.loading("Funding wallet via Friendbot...");
    try {
      await fundTestnet(address);
      toast.success("Wallet funded with 10,000 XLM!", { id: loadingToast });
      await fetchDashboardData();
    } catch (error) {
      toast.error("Failed to fund wallet", { id: loadingToast });
    } finally {
      setIsFunding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl bg-card border border-border p-8 sm:p-10"
      >
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">Welcome to StellarHub</h1>
          <p className="text-base text-text-secondary mb-8 leading-relaxed">
            Manage your Stellar Testnet wallet effortlessly. Experience the future of decentralized finance with a premium, minimal interface.
          </p>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={handleFundTestnet}
              disabled={isFunding}
              className="bg-white hover:bg-white/90 text-black px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isFunding ? "Funding..." : "Fund Testnet Wallet"}
            </button>
            <a 
              href={`https://stellar.expert/explorer/testnet/account/${address || ''}`}
              target="_blank"
              rel="noreferrer"
              className="bg-surface hover:bg-white/5 text-white px-6 py-2.5 rounded-lg font-medium transition-colors border border-border inline-block"
            >
              View Explorer
            </a>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="XLM Balance" 
          value={!address ? "---" : isLoading ? "..." : `${balances.xlm.toFixed(2)}`}
          subtitle="Testnet Asset"
          icon={<Wallet className="w-4 h-4 text-text-secondary" />}
          delay={0.1}
        />
        <StatCard 
          title="USDC Balance" 
          value={!address ? "---" : isLoading ? "..." : `$${balances.usdc.toFixed(2)}`}
          subtitle="Stablecoin"
          icon={<Globe className="w-4 h-4 text-text-secondary" />}
          delay={0.2}
        />
        <StatCard 
          title="Transactions" 
          value={!address ? "---" : isLoading ? "..." : txCount.toString()}
          subtitle="Total recorded activity"
          icon={<Activity className="w-4 h-4 text-text-secondary" />}
          delay={0.3}
        />
        <StatCard 
          title="Recent Activity" 
          value={!address ? "---" : isLoading ? "..." : recentActivity}
          subtitle="Last transaction"
          icon={<ArrowDownRight className="w-4 h-4 text-text-secondary" />}
          delay={0.4}
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-card rounded-xl p-6 border border-border hover:border-white/10 transition-colors group flex flex-col"
    >
      <div className="flex items-center gap-2 mb-6">
        {icon}
        <h3 className="text-sm font-medium text-white">{title}</h3>
      </div>
      <div className="mt-auto">
        <div className="text-3xl font-bold text-white mb-2 tracking-tight truncate">{value}</div>
        <div className="w-full border-t border-dashed border-border/50 my-4"></div>
        <div className="text-sm text-text-secondary truncate">{subtitle}</div>
      </div>
    </motion.div>
  );
}
