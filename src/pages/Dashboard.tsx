import { ArrowDownRight, Wallet, Activity, Globe } from "lucide-react";
import { useEffect, useState } from "react";
import { getBalances, getTransactions, fundTestnet } from "@/services/stellar";
import { useWallet } from "@/contexts/WalletContext";
import { useTheme } from "@/contexts/ThemeContext";
import toast from "react-hot-toast";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { type ParsedTransaction } from "@/services/stellar";

export function Dashboard() {
  const { address } = useWallet();
  const { theme } = useTheme();
  const [balances, setBalances] = useState({ xlm: 0, usdc: 0 });
  const [txCount, setTxCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<string>("None yet");
  const [isLoading, setIsLoading] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [chartData, setChartData] = useState<{name: string, balance: number}[]>([]);

  const generateChartData = (currentBalance: number, txs: ParsedTransaction[]) => {
    const data = [];
    let runningBalance = currentBalance;
    const today = new Date();
    
    const changesByDate: Record<string, number> = {};
    txs.forEach(tx => {
      const txDate = new Date(tx.date);
      const dateKey = txDate.toLocaleDateString();
      const amount = parseFloat(tx.amount.replace(' XLM', '').replace('+', ''));
      if (!changesByDate[dateKey]) changesByDate[dateKey] = 0;
      changesByDate[dateKey] += amount;
    });

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = d.toLocaleDateString();
      
      data.unshift({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        balance: parseFloat(Math.max(0, runningBalance).toFixed(2))
      });
      
      if (changesByDate[dateKey]) {
        runningBalance -= changesByDate[dateKey];
      }
    }
    return data;
  };

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
      setChartData(generateChartData(bals.xlm, txs));
      
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
      {/* Header Section */}
      <div className="bg-surface border border-border rounded-lg p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">StellarHub Dashboard</h1>
          <p className="text-text-secondary text-sm">
            Manage your Stellar Testnet wallet and assets.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleFundTestnet}
            disabled={isFunding}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors disabled:opacity-50"
          >
            {isFunding ? "Funding..." : "Fund Testnet"}
          </button>
          <a 
            href={`https://stellar.expert/explorer/testnet/account/${address || ''}`}
            target="_blank"
            rel="noreferrer"
            className="bg-card hover:bg-surface text-text-primary px-4 py-2 rounded-md font-medium text-sm transition-colors border border-border"
          >
            View Explorer
          </a>
        </div>
      </div>

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

      {/* Portfolio Chart */}
      <div className="bg-surface border border-border rounded-lg p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold">Portfolio Performance</h2>
          <p className="text-text-secondary text-sm">7-day history (XLM)</p>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} vertical={false} />
              <XAxis dataKey="name" stroke={theme === 'dark' ? '#A1A1AA' : '#64748B'} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis 
                stroke={theme === 'dark' ? '#A1A1AA' : '#64748B'} 
                tick={{ fontSize: 12 }} 
                axisLine={false} 
                tickLine={false} 
                domain={[
                  (dataMin: number) => Math.max(0, Math.floor(dataMin * 0.95)), 
                  (dataMax: number) => Math.max(10, Math.ceil(dataMax * 1.05))
                ]}
                tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: theme === 'dark' ? '#1A2235' : '#FFFFFF', 
                  borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  borderRadius: '12px',
                  color: theme === 'dark' ? '#FFF' : '#000'
                }} 
              />
              <Area type="monotone" dataKey="balance" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, delay }: any) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5 hover:border-border/80 transition-colors flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-sm font-medium text-text-primary">{title}</h3>
      </div>
      <div className="mt-auto">
        <div className="text-2xl font-bold text-text-primary mb-1 tracking-tight truncate">{value}</div>
        <div className="text-xs text-text-secondary truncate">{subtitle}</div>
      </div>
    </div>
  );
}
