import { useState } from "react";
import { Search, Compass, Activity, Code, User, FileText } from "lucide-react";
import { 
  isValidAddress, 
  isValidTransactionHash,
  getAccountDetails, 
  getAccountOperations,
  getTransactionDetails,
  getTransactionOperations
} from "../services/stellar";
import { useAddressBook } from "../contexts/AddressBookContext";
import toast from "react-hot-toast";

export function Explorer() {
  const { contacts } = useAddressBook();
  const [searchInput, setSearchInput] = useState("");
  
  const [searchType, setSearchType] = useState<'account' | 'transaction' | null>(null);
  const [resultData, setResultData] = useState<any>(null);
  const [operations, setOperations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'ui' | 'json'>('ui');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const input = searchInput.trim();
    if (!input) return;
    
    const isAddr = isValidAddress(input);
    const isTx = isValidTransactionHash(input);

    if (!isAddr && !isTx) {
      toast.error("Invalid Stellar address or transaction hash");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setResultData(null);
    setOperations([]);
    setViewMode('ui');
    setSearchType(isAddr ? 'account' : 'transaction');
    
    try {
      if (isAddr) {
        const [acc, ops] = await Promise.all([
          getAccountDetails(input),
          getAccountOperations(input, 50)
        ]);
        setResultData(acc);
        setOperations(ops);
      } else {
        const [tx, ops] = await Promise.all([
          getTransactionDetails(input),
          getTransactionOperations(input)
        ]);
        setResultData(tx);
        setOperations(ops);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val) {
      setSearchInput(val);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <Compass className="w-8 h-8 text-primary" />
            Network Explorer
          </h1>
          <p className="text-text-secondary mt-1">Look up any Stellar address or transaction hash on the Testnet</p>
        </div>
      </div>

      <div className="bg-surface border border-border p-4 rounded-xl">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter Stellar address (G...) or transaction hash"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full font-mono bg-background border border-border rounded-lg pl-10 pr-4 py-3 text-text-primary focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
          {contacts.length > 0 && (
            <div className="sm:w-48">
              <select
                onChange={handleContactSelect}
                value=""
                className="w-full h-full bg-background border border-border rounded-lg px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-white/20 appearance-none cursor-pointer"
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%237C8797%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7em top 50%', backgroundSize: '.65em auto' }}
              >
                <option value="" disabled>Address Book</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.address}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <button
            type="submit"
            disabled={!searchInput || isLoading}
            className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg text-red-400 font-mono text-sm">
          {error}
        </div>
      )}

      {resultData && !isLoading && (
        <div className="space-y-6">
          <div className="flex gap-4 border-b border-border/50">
            <button
              onClick={() => setViewMode('ui')}
              className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${viewMode === 'ui' ? 'border-primary text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode('json')}
              className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${viewMode === 'json' ? 'border-primary text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
            >
              <Code className="w-4 h-4" />
              Raw JSON
            </button>
          </div>

          {viewMode === 'ui' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                
                {searchType === 'account' ? (
                  <>
                    <div className="bg-surface border border-border rounded-xl p-5">
                      <h3 className="text-sm font-medium text-text-secondary mb-4 flex items-center gap-2">
                        <User className="w-4 h-4" /> Account Details
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <div className="text-xs text-text-secondary mb-1">Address</div>
                          <div className="font-mono text-sm text-text-primary break-all bg-background border border-border/50 p-2 rounded">{resultData.account_id}</div>
                        </div>
                        <div className="flex justify-between">
                          <div className="text-xs text-text-secondary">Sequence Number</div>
                          <div className="font-mono text-sm text-text-primary">{resultData.sequence}</div>
                        </div>
                        <div className="flex justify-between">
                          <div className="text-xs text-text-secondary">Subentry Count</div>
                          <div className="font-mono text-sm text-text-primary">{resultData.subentry_count}</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-surface border border-border rounded-xl p-5">
                      <h3 className="text-sm font-medium text-text-secondary mb-4">Balances</h3>
                      <div className="space-y-3">
                        {resultData.balances.map((b: any, i: number) => (
                          <div key={i} className="flex justify-between items-center bg-background border border-border/50 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${b.asset_type === 'native' ? 'bg-primary' : 'bg-teal-400'}`} />
                              <span className="font-medium text-text-primary text-sm">
                                {b.asset_type === 'native' ? 'XLM' : b.asset_code}
                              </span>
                            </div>
                            <span className="font-mono text-text-primary">{parseFloat(b.balance).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 7})}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-surface border border-border rounded-xl p-5">
                    <h3 className="text-sm font-medium text-text-secondary mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Transaction Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs text-text-secondary mb-1">Hash</div>
                        <div className="font-mono text-sm text-text-primary break-all bg-background border border-border/50 p-2 rounded">{resultData.hash}</div>
                      </div>
                      <div>
                        <div className="text-xs text-text-secondary mb-1">Source Account</div>
                        <div className="font-mono text-sm text-text-primary break-all bg-background border border-border/50 p-2 rounded">{resultData.source_account}</div>
                      </div>
                      <div className="flex justify-between">
                        <div className="text-xs text-text-secondary">Ledger</div>
                        <div className="font-mono text-sm text-text-primary">{resultData.ledger}</div>
                      </div>
                      <div className="flex justify-between">
                        <div className="text-xs text-text-secondary">Fee Paid</div>
                        <div className="font-mono text-sm text-text-primary">{resultData.fee_charged} stroops</div>
                      </div>
                      <div className="flex justify-between">
                        <div className="text-xs text-text-secondary">Status</div>
                        <div className="font-mono text-sm text-text-primary">
                          {resultData.successful ? (
                            <span className="text-teal-400">Success</span>
                          ) : (
                            <span className="text-red-400">Failed</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-2">
                <div className="bg-surface border border-border rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-border bg-background/50 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      {searchType === 'account' ? 'Recent Operations' : 'Included Operations'}
                    </h3>
                  </div>
                  
                  {operations.length === 0 ? (
                    <div className="p-8 text-center text-text-secondary text-sm">No operations found.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                          <tr className="bg-surface text-text-secondary border-b border-border/50 text-xs tracking-wider uppercase">
                            <th className="px-5 py-3 font-medium">Type</th>
                            <th className="px-5 py-3 font-medium">Created At</th>
                            <th className="px-5 py-3 font-medium text-right">Details</th>
                          </tr>
                        </thead>
                        <tbody className="font-mono divide-y divide-border/50">
                          {operations.map((op) => (
                            <tr key={op.id} className="hover:bg-background/50 transition-colors">
                              <td className="px-5 py-3 text-text-primary">
                                <span className="px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded text-xs uppercase">
                                  {op.type.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-text-secondary text-xs">
                                {new Date(op.created_at).toLocaleString()}
                              </td>
                              <td className="px-5 py-3 text-right text-text-secondary text-xs truncate max-w-xs">
                                {op.type === 'payment' && `${parseFloat(op.amount).toFixed(2)} ${op.asset_type === 'native' ? 'XLM' : op.asset_code}`}
                                {op.type === 'create_account' && `Funded ${parseFloat(op.starting_balance).toFixed(2)} XLM`}
                                {op.type === 'change_trust' && `Trusted ${op.asset_code || 'LP Share'}`}
                                {op.type === 'path_payment_strict_send' && `Swapped ${parseFloat(op.amount).toFixed(2)} to ${parseFloat(op.dest_amount).toFixed(2)}`}
                                {op.type === 'manage_sell_offer' && `Offered ${parseFloat(op.amount).toFixed(2)}`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#0B1220] border border-border rounded-xl p-5 overflow-x-auto shadow-inner">
              <pre className="text-xs font-mono text-[#E8EAED] whitespace-pre-wrap break-all">
                {JSON.stringify(resultData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
