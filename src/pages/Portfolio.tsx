import { useState, useMemo } from "react";
import { PieChart as PieChartIcon, Download, TrendingUp, Activity, DollarSign, Calendar } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from "framer-motion";
import toast from "react-hot-toast";

// Mock Data
const MOCK_PORTFOLIO_HISTORY = Array.from({ length: 30 }).map((_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: 10000 + Math.random() * 5000 + (i * 200),
  };
});

const ASSET_ALLOCATION = [
  { name: 'XLM', value: 8500, color: '#00E676' },
  { name: 'USDC', value: 4200, color: '#2979FF' },
  { name: 'AQUA', value: 1500, color: '#00B0FF' },
  { name: 'yXLM', value: 800, color: '#FFC400' },
];

const MOCK_TRANSACTIONS = [
  { id: 'tx_1', date: '2023-10-24', type: 'Buy', asset: 'XLM', amount: 5000, priceAtExecution: 0.11, currentPrice: 0.12, fee: 0.00001 },
  { id: 'tx_2', date: '2023-10-20', type: 'Sell', asset: 'AQUA', amount: 10000, priceAtExecution: 0.0015, currentPrice: 0.0012, fee: 0.00001 },
  { id: 'tx_3', date: '2023-10-15', type: 'Buy', asset: 'USDC', amount: 1000, priceAtExecution: 1.00, currentPrice: 1.00, fee: 0.00001 },
  { id: 'tx_4', date: '2023-10-10', type: 'Swap', asset: 'XLM -> yXLM', amount: 2000, priceAtExecution: 0.10, currentPrice: 0.12, fee: 0.00001 },
  { id: 'tx_5', date: '2023-10-01', type: 'Buy', asset: 'XLM', amount: 10000, priceAtExecution: 0.09, currentPrice: 0.12, fee: 0.00001 },
];

export function Portfolio() {
  const [timeframe, setTimeframe] = useState<'1W' | '1M' | '1Y' | 'ALL'>('1M');

  const chartData = useMemo(() => {
    let days = 30;
    if (timeframe === '1W') days = 7;
    if (timeframe === '1M') days = 30;
    if (timeframe === '1Y') days = 365; // Mock logic, array only has 30 items
    
    return MOCK_PORTFOLIO_HISTORY.slice(-days);
  }, [timeframe]);

  const totalValue = ASSET_ALLOCATION.reduce((acc, curr) => acc + curr.value, 0);
  const pnl24h = +452.50; // Mocked
  const pnlTotal = +2800.00; // Mocked

  const handleExportCSV = () => {
    // Generate CSV string
    const headers = ['Date', 'Type', 'Asset', 'Amount', 'Price At Execution (USD)', 'Current Price (USD)', 'Fee (XLM)', 'Estimated P&L (USD)'];
    const rows = MOCK_TRANSACTIONS.map(tx => {
      const pnl = tx.type === 'Buy' 
        ? (tx.currentPrice - tx.priceAtExecution) * tx.amount 
        : (tx.priceAtExecution - tx.currentPrice) * tx.amount; // simplified for sell
      return [
        tx.date,
        tx.type,
        tx.asset,
        tx.amount,
        tx.priceAtExecution,
        tx.currentPrice,
        tx.fee,
        pnl.toFixed(2)
      ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `stellar_tax_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Tax report exported successfully");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3 tracking-tight">
            <PieChartIcon className="w-8 h-8 text-primary" />
            Portfolio Analytics
          </h1>
          <p className="text-text-secondary mt-1">Deep dive into your assets, performance, and transaction history.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleExportCSV}
          className="bg-surface hover:bg-surface-light border border-border text-text-primary px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
        >
          <Download className="w-4 h-4" />
          Export Tax Report (CSV)
        </motion.button>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start mb-4">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Total Value (USD)</p>
            <div className="p-2 bg-primary/10 rounded-lg"><DollarSign className="w-4 h-4 text-primary" /></div>
          </div>
          <h2 className="text-3xl font-bold text-text-primary font-mono">${totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
        </div>
        
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">24h Change</p>
            <div className="p-2 bg-success/10 rounded-lg"><Activity className="w-4 h-4 text-success" /></div>
          </div>
          <div className="flex items-end gap-3">
            <h2 className="text-3xl font-bold text-success font-mono">+${pnl24h.toFixed(2)}</h2>
            <span className="text-success font-medium flex items-center mb-1"><TrendingUp className="w-4 h-4 mr-1" /> +3.2%</span>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Total P&L</p>
            <div className="p-2 bg-success/10 rounded-lg"><TrendingUp className="w-4 h-4 text-success" /></div>
          </div>
          <div className="flex items-end gap-3">
            <h2 className="text-3xl font-bold text-success font-mono">+${pnlTotal.toFixed(2)}</h2>
            <span className="text-success font-medium flex items-center mb-1"><TrendingUp className="w-4 h-4 mr-1" /> +24.5%</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-text-primary">Portfolio Performance</h3>
            <div className="flex gap-2 bg-[#121214] p-1 rounded-md border border-border">
               {['1W', '1M', '1Y', 'ALL'].map(tf => (
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
          <div className="flex-1 w-full font-mono text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="#7C8797" tick={{ fill: '#7C8797', fontSize: 10 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke="#7C8797" tick={{ fill: '#7C8797', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1C1C1E', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--color-primary)', fontWeight: 'bold' }}
                  formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Value']}
                />
                <Area type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Allocation */}
        <div className="lg:col-span-1 bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col h-[400px]">
           <h3 className="font-bold text-text-primary mb-6">Asset Allocation</h3>
           <div className="flex-1 w-full relative flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={ASSET_ALLOCATION}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={90}
                   paddingAngle={5}
                   dataKey="value"
                   stroke="none"
                 >
                   {ASSET_ALLOCATION.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip 
                    contentStyle={{ backgroundColor: '#1C1C1E', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px' }}
                    formatter={(value: any, name: any) => [`$${value}`, name]}
                 />
               </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-text-secondary text-xs">Total Assets</span>
               <span className="text-text-primary text-xl font-bold font-mono">{ASSET_ALLOCATION.length}</span>
             </div>
           </div>
           <div className="grid grid-cols-2 gap-3 mt-4">
             {ASSET_ALLOCATION.map((asset) => (
               <div key={asset.name} className="flex items-center justify-between bg-background p-2 rounded-lg border border-border">
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full" style={{ backgroundColor: asset.color }} />
                   <span className="text-xs font-bold text-text-primary">{asset.name}</span>
                 </div>
                 <span className="text-xs font-mono text-text-secondary">{((asset.value / totalValue) * 100).toFixed(1)}%</span>
               </div>
             ))}
           </div>
        </div>
      </div>

      {/* Transaction History & P&L Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h3 className="font-bold text-text-primary">Transaction History & Estimated P&L</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-secondary uppercase bg-background border-b border-border">
              <tr>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold">Type</th>
                <th className="px-6 py-4 font-bold">Asset</th>
                <th className="px-6 py-4 font-bold text-right">Amount</th>
                <th className="px-6 py-4 font-bold text-right">Exec Price</th>
                <th className="px-6 py-4 font-bold text-right">Est. P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {MOCK_TRANSACTIONS.map((tx) => {
                let pnl = 0;
                if (tx.type === 'Buy') pnl = (tx.currentPrice - tx.priceAtExecution) * tx.amount;
                if (tx.type === 'Sell') pnl = (tx.priceAtExecution - tx.currentPrice) * tx.amount;
                if (tx.type === 'Swap') pnl = (tx.currentPrice - tx.priceAtExecution) * tx.amount;
                
                const isProfit = pnl >= 0;

                return (
                  <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 text-text-secondary font-mono flex items-center gap-2">
                      <Calendar className="w-3 h-3 opacity-50" />
                      {tx.date}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        tx.type === 'Buy' ? 'bg-success/20 text-success' :
                        tx.type === 'Sell' ? 'bg-error/20 text-error' :
                        'bg-primary/20 text-primary'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-text-primary">{tx.asset}</td>
                    <td className="px-6 py-4 text-right font-mono text-text-primary">{tx.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-mono text-text-secondary">${tx.priceAtExecution.toFixed(4)}</td>
                    <td className="px-6 py-4 text-right font-mono">
                      {tx.type === 'Buy' || tx.type === 'Sell' || tx.type === 'Swap' ? (
                        <span className={isProfit ? 'text-success' : 'text-error'}>
                          {isProfit ? '+' : ''}${pnl.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-text-secondary">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
