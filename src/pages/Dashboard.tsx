import { useEffect, useState } from "react";
import { getBalances, getTransactions, fundTestnet, streamNetworkOperations } from "@/services/stellar";
import { useWallet } from "@/contexts/WalletContext";
import toast from "react-hot-toast";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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
    <div className="bg-surface border border-border p-6 flex flex-col flex-1 min-h-[220px]">
      <div className="mb-4 flex justify-between items-center border-b border-border pb-4">
        <div className="text-[11px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          Live Network Log (Testnet)
        </div>
      </div>
      <div className="flex-1 overflow-y-auto font-mono text-xs space-y-2 pr-2">
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

const COLORS = ['#00E676', '#2979FF', '#FF3D00', '#FFC400'];

export function Dashboard() {
  const { address } = useWallet();
  const [balances, setBalances] = useState({ xlm: 0, usdc: 0 });
  const [txCount, setTxCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [chartData, setChartData] = useState<{name: string, balance: number}[]>([]);
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M'>('1W');
  const [rawTxs, setRawTxs] = useState<ParsedTransaction[]>([]);

  const generateChartData = (currentBalance: number, txs: ParsedTransaction[], tf: '1D' | '1W' | '1M') => {
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

    const days = tf === '1D' ? 1 : tf === '1W' ? 7 : 30;

    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      
      if (tf === '1D') {
        // Mocking hourly data for 1D
        for(let j=0; j<24; j++) {
           d.setHours(d.getHours() - 1);
           data.unshift({
             name: `${d.getHours()}:00`,
             balance: parseFloat(Math.max(0, runningBalance).toFixed(2))
           });
           if (changesByDate[d.toLocaleDateString()]) {
              runningBalance -= (changesByDate[d.toLocaleDateString()] / 24);
           }
        }
        break;
      }

      d.setDate(d.getDate() - i);
      const dateKey = d.toLocaleDateString();
      
      data.unshift({
        name: tf === '1M' ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : d.toLocaleDateString('en-US', { weekday: 'short' }),
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
      setRawTxs(txs);
      
      if (txs.length > 0) {
        const latest = txs[0];
        setRecentActivity(`${latest.amount} (${latest.status})`);
      } else {
        setRecentActivity("No transactions yet");
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

  useEffect(() => {
    if (address) {
       setChartData(generateChartData(balances.xlm, rawTxs, timeframe));
    }
  }, [timeframe, balances.xlm, rawTxs, address]);

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

  const assetAllocation = [
    { name: 'XLM', value: balances.xlm },
    { name: 'USDC', value: balances.usdc }
  ].filter(a => a.value > 0);
  
  if (assetAllocation.length === 0) {
     assetAllocation.push({ name: 'Empty', value: 1 });
  }

  const currentBalance = balances.xlm;
  const startBalance = chartData.length > 0 ? chartData[0].balance : currentBalance;
  const pnlValue = currentBalance - startBalance;
  const pnlPercent = startBalance === 0 ? 0 : (pnlValue / startBalance) * 100;
  const isProfit = pnlValue >= 0;

  return (
    <div className="space-y-6">
      <LedgerPulse />
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight text-text-primary">Portfolio Analytics</h1>
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
            View on Explorer
          </a>
        </div>
      </div>

      {/* Ledger Strip */}
      <div className="bg-surface border border-border flex flex-col md:flex-row overflow-x-auto divide-y md:divide-y-0 md:divide-x divide-border shadow-sm">
        <LedgerMetric 
          label="NATIVE (XLM) BALANCE" 
          value={!address ? "---" : isLoading ? "..." : balances.xlm.toFixed(7)}
          color="text-text-primary"
          subtext={
            address && !isLoading && pnlValue !== 0 ? (
               <span className={isProfit ? 'text-success' : 'text-error'}>
                 {isProfit ? '+' : ''}{pnlValue.toFixed(2)} ({isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%)
               </span>
            ) : undefined
          }
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

      {/* Grid for Chart and Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Portfolio Performance Chart */}
        <div className="lg:col-span-2 bg-surface border border-border p-6 flex flex-col h-[520px] shadow-sm">
          <div className="mb-6 flex justify-between items-center border-b border-border pb-4">
            <div className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">
              Performance History (XLM)
            </div>
            <div className="flex gap-2 bg-[#121214] p-1 rounded-md border border-border">
               {['1D', '1W', '1M'].map(tf => (
                 <button
                   key={tf}
                   onClick={() => setTimeframe(tf as any)}
                   className={`px-3 py-1 text-xs font-bold rounded-sm transition-all ${
                     timeframe === tf 
                       ? 'bg-primary text-[#000000] shadow-md' 
                       : 'bg-transparent text-text-secondary hover:text-text-primary'
                   }`}
                 >
                   {tf}
                 </button>
               ))}
            </div>
          </div>
          <div className="flex-1 w-full font-mono text-xs mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#7C8797" 
                  tick={{ fill: '#7C8797', fontSize: 10 }} 
                  axisLine={false} 
                  tickLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#7C8797" 
                  tick={{ fill: '#7C8797', fontSize: 10 }} 
                  axisLine={false} 
                  tickLine={false} 
                  domain={['auto', 'auto']}
                  tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1C1C1E', 
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#FAFAFA',
                    borderRadius: '8px',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
                  }}
                  itemStyle={{ color: 'var(--color-primary)', fontWeight: 'bold' }}
                  formatter={(value: number) => [`${value.toFixed(2)} XLM`, 'Balance']}
                />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="var(--color-primary)" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorBalance)" 
                  activeDot={{ r: 6, fill: 'var(--color-primary)', stroke: '#1C1C1E', strokeWidth: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sidebar: Asset Allocation & Live Log */}
        <div className="lg:col-span-1 flex flex-col gap-6 h-[520px]">
          
          {/* Asset Allocation */}
          <div className="bg-surface border border-border p-6 flex flex-col shrink-0 shadow-sm">
            <div className="mb-2 flex justify-between items-center border-b border-border pb-4">
              <div className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">
                Asset Allocation
              </div>
            </div>
            <div className="h-[180px] w-full flex justify-center items-center relative">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={assetAllocation}
                     cx="50%"
                     cy="50%"
                     innerRadius={55}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                     stroke="none"
                   >
                     {assetAllocation.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.name === 'Empty' ? '#2A2A2D' : COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1C1C1E', 
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
                      }}
                      formatter={(value: number, name: string) => name === 'Empty' ? ['No Assets', ''] : [value.toFixed(2), name]}
                   />
                 </PieChart>
               </ResponsiveContainer>
               {/* Center text */}
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-text-secondary text-[10px] uppercase font-bold tracking-widest mb-1">Assets</span>
                 <span className="text-text-primary text-xl font-mono font-bold">
                   {assetAllocation.length === 1 && assetAllocation[0].name === 'Empty' ? '0' : assetAllocation.length}
                 </span>
               </div>
            </div>
            {/* Custom Legend */}
            <div className="flex justify-center gap-4 mt-4">
              {assetAllocation.map((entry, index) => entry.name !== 'Empty' && (
                 <div key={entry.name} className="flex items-center gap-2 text-xs font-mono bg-[#121214] border border-border px-3 py-1 rounded-full">
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                   <span className="text-text-primary font-bold">{entry.name}</span>
                 </div>
              ))}
            </div>
          </div>

          {/* Live Network Log */}
          <LiveNetworkLog />
        </div>
      </div>
    </div>
  );
}

function LedgerMetric({ label, value, color, isWide = false, subtext }: { label: string, value: string, color: string, isWide?: boolean, subtext?: React.ReactNode }) {
  return (
    <div className={`p-4 sm:p-5 flex flex-col justify-center ${isWide ? 'min-w-[300px] flex-1' : 'min-w-[200px]'}`}>
      <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2 flex justify-between items-center">
        <span>{label}</span>
      </div>
      <div className={`font-mono text-lg tabular-nums tracking-tight truncate ${color} flex items-center gap-3`}>
        {value}
      </div>
      {subtext && (
        <div className="text-[11px] mt-1.5 font-mono tracking-tight font-bold">
           {subtext}
        </div>
      )}
    </div>
  );
}
