import { useState, useEffect } from "react";
import { ArrowDownUp, Settings2, Wallet, ArrowRight } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { getBalances, addTrustline, swapAssets, getOptimalPath, type OptimalPath } from "@/services/stellar";
import toast from "react-hot-toast";

// The issuer we generated using our seed script
const USDC_ISSUER = "GDXN5T3HR4CYUXP4LVGIFJKX5AUZCHUHQLTGEYNYZL73JSZTD3ASWTAB";

function PathVisualizer({ optimalPath, sendingAsset, receivingAsset }: { optimalPath: OptimalPath | null, sendingAsset: string, receivingAsset: string }) {
  if (!optimalPath) return null;

  return (
    <div className="border border-border p-4 mb-6 bg-background/50">
      <div className="text-[11px] font-bold text-text-secondary uppercase tracking-widest mb-4">
        Strict Send Routing Path
      </div>
      <div className="flex flex-wrap items-center gap-2 font-mono text-sm">
        <div className="px-2 py-1 border border-border text-primary">{sendingAsset}</div>
        {optimalPath.intermediateAssets.map((asset, i) => (
          <div key={i} className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-text-secondary" />
            <div className="px-2 py-1 border border-border text-text-primary">{asset}</div>
          </div>
        ))}
        <ArrowRight className="w-4 h-4 text-text-secondary" />
        <div className="px-2 py-1 border border-border text-success">{receivingAsset}</div>
      </div>
    </div>
  );
}

export function Swap() {
  const { address } = useWallet();
  const [balances, setBalances] = useState({ xlm: 0, usdc: 0 });
  const [isXlmToUsdc, setIsXlmToUsdc] = useState(true);
  const [amountIn, setAmountIn] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optimalPath, setOptimalPath] = useState<OptimalPath | null>(null);
  const [isPathLoading, setIsPathLoading] = useState(false);

  const fetchBalances = async () => {
    if (address) {
      try {
        const bals = await getBalances(address);
        setBalances(bals);
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [address]);

  useEffect(() => {
    const fetchPath = async () => {
      if (!amountIn || parseFloat(amountIn) <= 0) {
        setOptimalPath(null);
        setIsPathLoading(false);
        return;
      }
      setIsPathLoading(true);
      const sellingAssetStr = isXlmToUsdc ? 'XLM' : 'USDC';
      const buyingAssetStr = isXlmToUsdc ? 'USDC' : 'XLM';
      const path = await getOptimalPath(sellingAssetStr, buyingAssetStr, amountIn, USDC_ISSUER);
      setOptimalPath(path);
      setIsPathLoading(false);
    };

    const timer = setTimeout(() => {
      fetchPath();
    }, 500);

    return () => clearTimeout(timer);
  }, [amountIn, isXlmToUsdc]);

  const amountOut = optimalPath ? optimalPath.destinationAmount : "";

  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!amountIn || parseFloat(amountIn) <= 0 || !optimalPath) return;

    const sendingAsset = isXlmToUsdc ? 'XLM' : 'USDC';
    const receivingAsset = isXlmToUsdc ? 'USDC' : 'XLM';
    const balCheck = isXlmToUsdc ? balances.xlm : balances.usdc;
    
    if (parseFloat(amountIn) > balCheck) {
      toast.error(`Insufficient ${sendingAsset} balance`);
      return;
    }

    setIsSubmitting(true);
    const swapToast = toast.loading("Preparing transaction...");

    try {
      if (balances.usdc === 0 && isXlmToUsdc) {
        toast.loading("Establishing USDC Trustline...", { id: swapToast });
        try {
          await addTrustline(address, "USDC", USDC_ISSUER);
          toast.success("Trustline established!", { id: swapToast });
        } catch (error: any) {
          // Ignore
        }
      }

      toast.loading("Executing PathPaymentStrictSend...", { id: swapToast });
      await swapAssets(address, sendingAsset, receivingAsset, amountIn, USDC_ISSUER, optimalPath.path);
      toast.success(`Swapped ${amountIn} ${sendingAsset} for ${amountOut} ${receivingAsset}`, { id: swapToast });
      
      setAmountIn("");
      fetchBalances();

    } catch (error: any) {
      toast.error(error.message || "Swap failed", { id: swapToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendingAsset = isXlmToUsdc ? "XLM" : "USDC";
  const receivingAsset = isXlmToUsdc ? "USDC" : "XLM";

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="mb-6 flex justify-between items-end border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary mb-1 uppercase tracking-widest">Asset Swap</h1>
          <p className="text-text-secondary text-sm">Exchange assets via strict send operations</p>
        </div>
        <button className="p-2 text-text-secondary hover:text-text-primary transition-colors border border-transparent hover:border-border">
          <Settings2 className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-surface border border-border p-6 shadow-sm">
        <form onSubmit={handleSwap}>
          {/* You Pay Section */}
          <div className="border border-border p-4 mb-4">
            <div className="flex justify-between text-[11px] font-bold text-text-secondary uppercase tracking-widest mb-4">
              <span>Sending Asset</span>
              <span className="cursor-pointer hover:text-text-primary flex items-center gap-1" onClick={() => setAmountIn(isXlmToUsdc ? balances.xlm.toString() : balances.usdc.toString())}>
                <Wallet className="w-3 h-3 text-primary" />
                AVAILABLE: <span className="font-mono text-text-primary">{isXlmToUsdc ? balances.xlm.toFixed(7) : balances.usdc.toFixed(2)}</span>
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <input 
                type="number"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                placeholder="0.00"
                className="bg-transparent text-2xl font-mono text-text-primary outline-none w-full placeholder:text-text-secondary/30"
                step="0.0000001"
              />
              <div className="bg-background border border-border px-3 py-1 font-mono text-sm font-bold text-primary flex items-center gap-2 shrink-0">
                {sendingAsset}
              </div>
            </div>
          </div>

          {/* Toggle Button */}
          <div className="flex justify-center -my-6 relative z-10">
            <button
              type="button"
              onClick={() => {
                setIsXlmToUsdc(!isXlmToUsdc);
                setAmountIn("");
              }}
              className="bg-background border border-border p-2 text-text-secondary hover:text-primary hover:border-primary transition-colors"
            >
              <ArrowDownUp className="w-4 h-4" />
            </button>
          </div>

          {/* You Receive Section */}
          <div className="border border-border p-4 mb-6">
            <div className="flex justify-between text-[11px] font-bold text-text-secondary uppercase tracking-widest mb-4">
              <span>Receiving Asset {isPathLoading && "(Calculating...)"}</span>
              <span className="flex items-center gap-1">
                AVAILABLE: <span className="font-mono text-text-primary">{!isXlmToUsdc ? balances.xlm.toFixed(7) : balances.usdc.toFixed(2)}</span>
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <input 
                type="text"
                value={amountOut}
                disabled
                placeholder="0.00"
                className={`bg-transparent text-2xl font-mono text-text-secondary outline-none w-full placeholder:text-text-secondary/30 ${isPathLoading ? 'animate-pulse' : ''}`}
              />
              <div className="bg-background border border-border px-3 py-1 font-mono text-sm font-bold text-success flex items-center gap-2 shrink-0">
                {receivingAsset}
              </div>
            </div>
          </div>

          {/* Path Visualizer */}
          <PathVisualizer optimalPath={optimalPath} sendingAsset={sendingAsset} receivingAsset={receivingAsset} />

          {/* Rate Info */}
          {optimalPath && parseFloat(amountIn) > 0 && (
            <div className="flex justify-between items-center text-[11px] font-bold text-text-secondary uppercase tracking-widest mb-6 px-2">
              <span>Effective Exchange Rate</span>
              <span className="font-mono text-text-primary">
                1 {sendingAsset} = {(parseFloat(amountOut) / parseFloat(amountIn)).toFixed(6)} {receivingAsset}
              </span>
            </div>
          )}

          <button 
            type="submit"
            disabled={isSubmitting || !amountIn || parseFloat(amountIn) <= 0 || !address || !optimalPath || isPathLoading}
            className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 py-3 font-medium transition-colors disabled:opacity-50 flex justify-center uppercase tracking-widest text-sm"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : !address ? (
              "Connect Wallet to Swap"
            ) : isPathLoading ? (
              "Finding Path..."
            ) : !optimalPath && amountIn ? (
              "No Path Found"
            ) : (
              "Submit PathPaymentStrictSend"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
