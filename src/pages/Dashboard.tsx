import { useEffect, useState, useRef } from "react";
import { getBalances, getTransactions, fundTestnet, streamNetworkOperations } from "@/services/stellar";
import { useWallet } from "@/contexts/WalletContext";
import toast from "react-hot-toast";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { type ParsedTransaction } from "@/services/stellar";

function LiveNetworkLog() {
  const [ops, setOps] = useState<any[]>([]);

  useEffect(() => {
    const closeStream = streamNetworkOperations(
      (op) => {
        setOps(prev => {
          const newOps = [op, ...prev];
          if (newOps.length > 20) return newOps.slice(0, 20);
          return newOps;
        });
      },
      (err) => console.error("Stream error:", err)
    );

    return () => closeStream();
  }, []);

  return (
    <div className="bg-surface border border-border p-6 h-full flex flex-col">
      <div className="mb-4 flex justify-between items-center border-b border-border pb-4">
        <div className="text-[11px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          Live Network Log (Testnet)
        </div>
      </div>
      <div className="flex-1 overflow-y-auto font-mono text-xs space-y-2 max-h-[300px] pr-2">
        {ops.length === 0 ? (
          <div className="text-text-secondary opacity-50">Waiting for network operations...</div>
        ) : (
          ops.map(op => (
            <div key={op.id} className="border-l-2 border-border pl-3 py-1 flex flex-col gap-1">
              <div className="flex justify-between text-text-secondary">
                <span>OP: {op.type}</span>
                <span className="text-[10px]">{new Date(op.created_at).toLocaleTimeString()}</span>
              </div>
              <div className="text-text-primary truncate">
                {op.source_account.slice(0, 8)}...{op.source_account.slice(-8)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function LedgerPulse() {
  const [ledgerSeq, setLedgerSeq] = useState(45291830);
  const [tick, setTick] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setLedgerSeq(prev => prev + 1);
      setTick(true);
      setTimeout(() => setTick(false), 200);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-4 bg-surface border border-border p-3 mb-6 font-mono text-sm text-text-primary">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full bg-primary transition-opacity duration-200 ${tick ? 'opacity-100' : 'opacity-40'}`} />
        <span className="text-text-secondary">LEDGER</span>
        <span className="tabular-nums font-bold text-primary">{ledgerSeq}</span>
      </div>
      <div className="flex-1 h-4 relative overflow-hidden flex items-center">
        <div className="absolute right-0 h-[1px] w-full bg-border" />
        <div 
          className={`absolute h-3 w-[2px] bg-primary transition-all duration-200 right-0`} 
          style={{ 
            transform: tick ? 'scaleY(1)' : 'scaleY(0)',
            opacity: tick ? 1 : 0
          }} 
        />
        <div className="absolute right-2 h-2 w-[1px] bg-border opacity-50" />
        <div className="absolute right-4 h-1 w-[1px] bg-border opacity-30" />
        <div className="absolute right-6 h-2 w-[1px] bg-border opacity-50" />
      </div>
      <div className="text-text-secondary text-xs">
        ~5s CLOSE
      </div>
    </div>
  );
}

export function Dashboard() {
  const { address } = useWallet();
  const [balances, setBalances] = useState({ xlm: 0, usdc: 0 });
  const [txCount, setTxCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<string>("");
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
      setRecentActivity("");
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
        setRecentActivity("No transactions yet — send a payment to see activity here");
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
    const loadingToast = toast.loading("Funding account via Friendbot...");
    try {
      await fundTestnet(address);
      toast.success("Account funded with 10,000 XLM", { id: loadingToast });
      await fetchDashboardData();
    } catch (error) {
      toast.error("Failed to fund account", { id: loadingToast });
    } finally {
      setIsFunding(false);
    }
  };

  return (
    <div className="space-y-6">
      <LedgerPulse />
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1 tracking-tight">Wallet Overview</h1>
          <p className="text-text-secondary text-sm">
            Address: <span className="font-mono text-text-primary ml-1">{address ? `${address.slice(0, 8)}...${address.slice(-8)}` : 'Not connected'}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleFundTestnet}
            disabled={isFunding || !address}
            className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isFunding ? "Funding..." : "Fund test account"}
          </button>
          <a 
            href={`https://stellar.expert/explorer/testnet/account/${address || ''}`}
            target="_blank"
            rel="noreferrer"
            className="bg-surface hover:bg-surface/80 text-text-primary border border-border px-4 py-2 text-sm font-medium transition-colors"
          >
            View on Ledger Explorer
          </a>
        </div>
      </div>

      {/* Ledger Strip */}
      <div className="bg-surface border border-border flex flex-col md:flex-row overflow-x-auto divide-y md:divide-y-0 md:divide-x divide-border">
        <LedgerMetric 
          label="NATIVE (XLM) BALANCE" 
          value={!address ? "---" : isLoading ? "..." : balances.xlm.toFixed(7)}
          color="text-text-primary"
        />
        <LedgerMetric 
          label="USDC BALANCE" 
          value={!address ? "---" : isLoading ? "..." : balances.usdc.toFixed(2)}
          color="text-success"
        />
        <LedgerMetric 
          label="TX SEQUENCE COUNT" 
          value={!address ? "---" : isLoading ? "..." : txCount.toString()}
          color="text-text-primary"
        />
        <LedgerMetric 
          label="LATEST OPERATION" 
          value={!address ? "---" : isLoading ? "..." : recentActivity}
          color="text-text-primary"
          isWide
        />
      </div>

      {/* Grid for Chart and Live Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Portfolio Chart */}
        <div className="lg:col-span-2 bg-surface border border-border p-6 h-full">
          <div className="mb-6 flex justify-between items-center border-b border-border pb-4">
            <div className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">
              Portfolio Performance (7-Day History XLM)
            </div>
          </div>
          <div className="h-[300px] w-full font-mono text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#7C8797" tick={{ fill: '#7C8797' }} axisLine={false} tickLine={false} />
                <YAxis 
                  stroke="#7C8797" 
                  tick={{ fill: '#7C8797' }} 
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
                    backgroundColor: '#121B2E', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#E8EAED',
                    borderRadius: '0px'
                  }} 
                />
                <Area type="step" dataKey="balance" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorBalance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Network Log */}
        <div className="lg:col-span-1 h-full">
          <LiveNetworkLog />
        </div>
      </div>
    </div>
  );
}

function LedgerMetric({ label, value, color, isWide = false }: { label: string, value: string, color: string, isWide?: boolean }) {
  return (
    <div className={`p-4 sm:p-5 flex flex-col justify-center ${isWide ? 'min-w-[300px] flex-1' : 'min-w-[200px]'}`}>
      <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">
        {label}
      </div>
      <div className={`font-mono text-lg tabular-nums tracking-tight truncate ${color}`}>
        {value}
      </div>
    </div>
  );
}
