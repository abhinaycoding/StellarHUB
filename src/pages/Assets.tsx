import { useState, useEffect } from "react";
import { Plus, Search, ShieldCheck, Check, ArrowRight } from "lucide-react";
import { useWallet } from "../contexts/WalletContext";
import { getAllBalances, addTrustline } from "../services/stellar";
import toast from "react-hot-toast";
import { cn } from "../lib/utils";

const POPULAR_ASSETS = [
  {
    code: "USDC",
    issuer: "GBBD47IF6LWK7P7MDEVSCWTTCJM4N8XQMM5V23X66Z5YYWIFL72X44O2",
    description: "USD Coin by Circle",
    icon: "💵"
  },
  {
    code: "AQUA",
    issuer: "GCQTGZZZ5GNCJU7EQOX8SPW3KAAZ3Z3VFR4E56P7QWAAKV4K32YNYQUA",
    description: "Aquarius Network Token",
    icon: "💧"
  },
  {
    code: "yXLM",
    issuer: "GARS9OEGOSQ53Y27QG674GDEO4G57EAAQKUXL3A3D3VGBF3O2KMB2XQK",
    description: "Yield-bearing XLM",
    icon: "📈"
  }
];

export function Assets() {
  const { address } = useWallet();
  const [balances, setBalances] = useState<{ assetCode: string; issuer?: string; balance: string }[]>([]);

  const [activeTab, setActiveTab] = useState<"popular" | "custom">("popular");
  
  // Custom Trustline Form
  const [customCode, setCustomCode] = useState("");
  const [customIssuer, setCustomIssuer] = useState("");
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  
  // Adding state for individual popular assets
  const [addingAssetCode, setAddingAssetCode] = useState<string | null>(null);

  const fetchBalances = async () => {
    if (!address) {
      setBalances([]);
      return;
    }
    try {
      const userBalances = await getAllBalances(address);
      setBalances(userBalances);
    } catch (error) {
      console.error("Failed to fetch balances", error);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [address]);

  const hasTrustline = (code: string, issuer?: string) => {
    if (code === "XLM") return true;
    return balances.some(b => b.assetCode === code && (!issuer || b.issuer === issuer));
  };

  const getBalance = (code: string, issuer?: string) => {
    const bal = balances.find(b => b.assetCode === code && (!issuer || b.issuer === issuer));
    return bal ? bal.balance : "0.00";
  };

  const handleAddTrustline = async (code: string, issuer: string, isCustom = false) => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    if (isCustom) setIsAddingCustom(true);
    else setAddingAssetCode(code);
    
    try {
      await addTrustline(address, code, issuer);
      toast.success(`Trustline for ${code} added successfully!`);
      await fetchBalances(); // Refresh balances to show new trustline
      if (isCustom) {
        setCustomCode("");
        setCustomIssuer("");
      }
    } catch (error: any) {
      toast.error(error.message || `Failed to add trustline for ${code}`);
    } finally {
      if (isCustom) setIsAddingCustom(false);
      else setAddingAssetCode(null);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 fade-in">
      <div>
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">Assets & Trustlines</h1>
        <p className="text-text-secondary mt-2">Discover popular Stellar assets and manage your account's trustlines.</p>
      </div>

      <div className="flex gap-2 p-1 bg-surface-light border border-border rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("popular")}
          className={cn(
            "px-6 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === "popular"
              ? "bg-primary text-background shadow-md shadow-primary/20"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-light"
          )}
        >
          Popular Assets
        </button>
        <button
          onClick={() => setActiveTab("custom")}
          className={cn(
            "px-6 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === "custom"
              ? "bg-primary text-background shadow-md shadow-primary/20"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-light"
          )}
        >
          Custom Trustline
        </button>
      </div>

      {activeTab === "popular" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {POPULAR_ASSETS.map((asset) => {
            const hasAsset = hasTrustline(asset.code, asset.issuer);
            const isAdding = addingAssetCode === asset.code;
            
            return (
              <div key={`${asset.code}-${asset.issuer}`} className="bg-surface rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-surface-light rounded-xl flex items-center justify-center text-2xl border border-border">
                      {asset.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-text-primary flex items-center gap-2">
                        {asset.code}
                        <ShieldCheck className="w-4 h-4 text-primary" />
                      </h3>
                      <p className="text-xs text-text-secondary">{asset.description}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-background rounded-lg p-3 mb-6 border border-border overflow-hidden">
                  <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Issuer</p>
                  <p className="text-xs font-mono text-text-primary truncate" title={asset.issuer}>{asset.issuer}</p>
                </div>
                
                {hasAsset ? (
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-xl border border-primary/20">
                    <div>
                      <p className="text-[10px] text-primary font-bold uppercase tracking-wider">Your Balance</p>
                      <p className="text-lg font-bold text-primary">{getBalance(asset.code, asset.issuer)} {asset.code}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleAddTrustline(asset.code, asset.issuer)}
                    disabled={isAdding || !address}
                    className="w-full py-3 bg-surface-light hover:bg-surface-lighter text-text-primary font-medium rounded-xl border border-border transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAdding ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-text-secondary border-t-text-primary rounded-full animate-spin" />
                        Adding...
                      </span>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add Trustline
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "custom" && (
        <div className="max-w-2xl bg-surface rounded-2xl border border-border p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">Add Custom Asset</h2>
              <p className="text-sm text-text-secondary">Enter the asset code and issuer to establish a trustline.</p>
            </div>
          </div>
          
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Asset Code</label>
              <input 
                type="text" 
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                placeholder="e.g. USDC"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary transition-colors font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Issuer Address</label>
              <input 
                type="text" 
                value={customIssuer}
                onChange={(e) => setCustomIssuer(e.target.value)}
                placeholder="G..."
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary transition-colors font-mono"
              />
            </div>
            
            <div className="pt-4">
              <button 
                onClick={() => handleAddTrustline(customCode, customIssuer, true)}
                disabled={isAddingCustom || !address || !customCode || !customIssuer || customIssuer.length !== 56}
                className="w-full py-4 bg-primary hover:bg-primary-hover text-background font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingCustom ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                    Confirm in Wallet...
                  </span>
                ) : (
                  <>
                    Add Trustline
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
            {!address && (
               <p className="text-center text-sm text-error mt-4">You must connect your wallet to add trustlines.</p>
            )}
            {address && customIssuer.length > 0 && customIssuer.length !== 56 && (
               <p className="text-center text-sm text-error mt-4">Stellar issuer addresses must be exactly 56 characters long.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
