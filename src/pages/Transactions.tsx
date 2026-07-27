import { ArrowDownRight, ArrowUpRight, ExternalLink, RefreshCw, Loader2, Download, Search, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import { getTransactions, type ParsedTransaction } from "@/services/stellar";
import { useWallet } from "@/contexts/WalletContext";

export function Transactions() {
  const { address } = useWallet();
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "send" | "receive">("all");

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
    const interval = setInterval(fetchTxs, 15000);
    return () => clearInterval(interval);
  }, [address]);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesFilter = filterType === "all" || tx.type === filterType;
    const matchesSearch = tx.address?.toLowerCase().includes(searchQuery.toLowerCase()) || tx.hash.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const exportCSV = () => {
    if (filteredTransactions.length === 0) return;
    
    const headers = ["Date", "Type", "Amount", "Address", "Status", "Hash"];
    const csvContent = [
      headers.join(","),
      ...filteredTransactions.map(tx => 
        [tx.date, tx.type, tx.amount, tx.address || "", tx.status, tx.hash].join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "stellarhub_transactions.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Transactions</h1>
          <p className="text-text-secondary">View and export your recent activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportCSV}
            disabled={filteredTransactions.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface/80 border border-border rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button 
            onClick={fetchTxs}
            disabled={isLoading || !address}
            className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface/80 border border-border rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search by address or hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <div className="relative min-w-[150px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="w-full bg-surface border border-border rounded-lg pl-10 pr-8 py-2 text-sm appearance-none focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="send">Sent</option>
            <option value="receive">Received</option>
          </select>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg min-h-[400px]">
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
            {filteredTransactions.map((tx, index) => (
              <div 
                key={tx.id}
                className="p-4 sm:p-6 hover:bg-surface/50 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${tx.type === 'receive' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                    {tx.type === 'receive' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="font-medium mb-1">
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
                  <div className={`font-medium mb-1 ${tx.type === 'receive' ? 'text-success' : ''}`}>
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
                      className="text-text-secondary hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
            {filteredTransactions.length === 0 && (
              <div className="p-8 text-center text-text-secondary">
                No transactions match your search criteria.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
