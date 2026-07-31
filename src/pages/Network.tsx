import { useState, useEffect } from "react";
import { Activity, Clock, Zap, Server, ShieldAlert, Layers } from "lucide-react";
import { getFeeStats, getLatestLedgers, streamLedgers } from "../services/stellar";
import type { Horizon } from "@stellar/stellar-sdk";

export function Network() {
  const [feeStats, setFeeStats] = useState<any>(null);
  const [ledgers, setLedgers] = useState<Horizon.ServerApi.LedgerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fees, latestLedgers] = await Promise.all([
          getFeeStats(),
          getLatestLedgers(15)
        ]);
        setFeeStats(fees);
        setLedgers(latestLedgers);
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed to load network data");
        setIsLoading(false);
      }
    };

    fetchData();

    // Re-fetch fee stats every 30 seconds
    const feeInterval = setInterval(async () => {
      try {
        const fees = await getFeeStats();
        setFeeStats(fees);
      } catch (e) {
        console.error("Failed to update fees");
      }
    }, 30000);

    return () => clearInterval(feeInterval);
  }, []);

  useEffect(() => {
    // Stream new ledgers
    const closeStream = streamLedgers(
      (ledger) => {
        setLedgers((prev) => {
          // Prevent duplicates
          if (prev.some((l) => l.sequence === ledger.sequence)) return prev;
          const newLedgers = [ledger, ...prev].slice(0, 15);
          return newLedgers;
        });
      },
      (err) => {
        console.error("Ledger stream error:", err);
      }
    );

    return () => closeStream();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4 text-text-secondary">
          <Activity className="w-8 h-8 animate-pulse" />
          <p className="font-mono text-sm">Connecting to Horizon...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-none text-red-400 font-mono text-sm">
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert className="w-4 h-4" />
          <strong>Network Error</strong>
        </div>
        {error}
      </div>
    );
  }

  const formatFee = (fee: string | number) => {
    return parseInt(fee.toString()).toLocaleString();
  };

  const getSurgeMultiplier = () => {
    if (!feeStats) return "1.0";
    const base = parseInt(feeStats.fee_charged.min);
    const p99 = parseInt(feeStats.fee_charged.p99);
    return (p99 / base).toFixed(1);
  };

  const surge = parseFloat(getSurgeMultiplier());
  const surgeColor = surge > 2 ? 'text-red-400' : surge > 1.2 ? 'text-amber-400' : 'text-teal-400';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <Server className="w-6 h-6 text-primary" />
            Network Metrics
          </h1>
          <p className="text-text-secondary mt-1">
            Real-time fee statistics and ledger throughput on the Stellar Testnet.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-none text-xs font-mono">
          <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-text-secondary">Connected to horizon-testnet</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Fee Stats Cards */}
        <div className="bg-surface border border-border p-5 rounded-none flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-text-secondary flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Minimum Base Fee
            </h3>
          </div>
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="text-3xl font-mono text-text-primary">
              {feeStats ? formatFee(feeStats.fee_charged.min) : "---"}
            </span>
            <span className="text-sm text-text-secondary">stroops</span>
          </div>
        </div>

        <div className="bg-surface border border-border p-5 rounded-none flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-text-secondary flex items-center gap-2">
              <Activity className="w-4 h-4" />
              p99 Surge Fee
            </h3>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 bg-background border border-border ${surgeColor}`}>
              {surge}x MULTIPLIER
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="text-3xl font-mono text-text-primary">
              {feeStats ? formatFee(feeStats.fee_charged.p99) : "---"}
            </span>
            <span className="text-sm text-text-secondary">stroops</span>
          </div>
        </div>

        <div className="bg-surface border border-border p-5 rounded-none flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-text-secondary flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Ledger Capacity
            </h3>
          </div>
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="text-3xl font-mono text-text-primary">
              {feeStats ? parseInt(feeStats.ledger_capacity_usage).toFixed(2) : "---"}
            </span>
            <span className="text-sm text-text-secondary">/ {feeStats?.max_fee?.mode || 1000} ops</span>
          </div>
        </div>
      </div>

      {/* Ledgers Table */}
      <div className="bg-surface border border-border rounded-none overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-background/50 flex items-center justify-between">
          <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Recent Ledgers
          </h3>
          <span className="text-xs text-text-secondary font-mono">LIVE UPDATE</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-surface text-text-secondary border-b border-border/50 text-xs tracking-wider uppercase">
                <th className="px-5 py-3 font-medium">Sequence</th>
                <th className="px-5 py-3 font-medium">Closed At</th>
                <th className="px-5 py-3 font-medium text-right">Transactions</th>
                <th className="px-5 py-3 font-medium text-right">Operations</th>
                <th className="px-5 py-3 font-medium">Hash</th>
              </tr>
            </thead>
            <tbody className="font-mono divide-y divide-border/50">
              {ledgers.map((ledger, idx) => {
                const isNew = idx === 0 && ledgers.length > 1; // Basic visual cue for new row
                return (
                  <tr 
                    key={ledger.sequence} 
                    className={`hover:bg-background/50 transition-colors ${isNew ? 'bg-primary/5 animate-pulse-once' : ''}`}
                  >
                    <td className="px-5 py-3 text-primary">
                      <a 
                        href={`https://stellar.expert/explorer/testnet/ledger/${ledger.sequence}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        {ledger.sequence.toLocaleString()}
                      </a>
                    </td>
                    <td className="px-5 py-3 text-text-secondary">
                      {new Date(ledger.closed_at).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                    </td>
                    <td className="px-5 py-3 text-right text-text-primary">
                      {ledger.successful_transaction_count}
                    </td>
                    <td className="px-5 py-3 text-right text-text-primary">
                      {ledger.operation_count}
                    </td>
                    <td className="px-5 py-3 text-text-secondary text-xs truncate max-w-[150px]">
                      {ledger.hash.substring(0, 16)}...
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
