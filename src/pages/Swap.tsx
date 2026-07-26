import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowDownUp, Settings2, Wallet } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { getBalances, addTrustline, swapAssets } from "@/services/stellar";
import toast from "react-hot-toast";

// The issuer we generated using our seed script
const USDC_ISSUER = "GDXN5T3HR4CYUXP4LVGIFJKX5AUZCHUHQLTGEYNYZL73JSZTD3ASWTAB";

export function Swap() {
  const { address } = useWallet();
  const [balances, setBalances] = useState({ xlm: 0, usdc: 0 });
  
  // Directions: true = XLM -> USDC, false = USDC -> XLM
  const [isXlmToUsdc, setIsXlmToUsdc] = useState(true);
  const [amountIn, setAmountIn] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // For our simulated AMM, 1 XLM = 1 USDC
  const amountOut = amountIn ? (parseFloat(amountIn) * 1).toFixed(2) : "";

  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!amountIn || parseFloat(amountIn) <= 0) return;

    // Check balances
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
      // Step 1: Ensure trustline exists for USDC
      if (balances.usdc === 0 && isXlmToUsdc) {
        toast.loading("Establishing USDC Trustline...", { id: swapToast });
        try {
          await addTrustline(address, "USDC", USDC_ISSUER);
          toast.success("Trustline established!", { id: swapToast });
        } catch (error: any) {
          // Ignore
        }
      }

      // Step 2: Swap
      toast.loading("Executing Swap via DEX...", { id: swapToast });
      await swapAssets(address, sendingAsset, receivingAsset, amountIn, USDC_ISSUER);
      toast.success(`Swapped ${amountIn} ${sendingAsset} for ${amountOut} ${receivingAsset}`, { id: swapToast });
      
      setAmountIn("");
      fetchBalances();

    } catch (error: any) {
      toast.error(error.message || "Swap failed", { id: swapToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Swap Assets</h1>
          <p className="text-text-secondary">Trade instantly via Stellar DEX</p>
        </div>
        <button className="p-2 text-text-secondary hover:text-white transition-colors bg-surface rounded-lg border border-border">
          <Settings2 className="w-5 h-5" />
        </button>
      </div>

      <motion.form 
        onSubmit={handleSwap}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-xl p-4 shadow-2xl relative"
      >
        {/* You Pay Section */}
        <div className="bg-surface rounded-xl p-4 border border-border mb-2">
          <div className="flex justify-between text-sm text-text-secondary mb-2">
            <span>You pay</span>
            <span className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors" onClick={() => setAmountIn(isXlmToUsdc ? balances.xlm.toString() : balances.usdc.toString())}>
              <Wallet className="w-3 h-3" />
              Balance: {isXlmToUsdc ? balances.xlm.toFixed(2) : balances.usdc.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <input 
              type="number"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              placeholder="0.00"
              className="bg-transparent text-3xl font-bold text-white outline-none w-full placeholder:text-white/20"
              step="0.0000001"
            />
            <div className="bg-card border border-border px-3 py-1.5 rounded-lg font-medium text-white flex items-center gap-2 shrink-0">
              {isXlmToUsdc ? "XLM" : "USDC"}
            </div>
          </div>
        </div>

        {/* Toggle Button */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <button
            type="button"
            onClick={() => {
              setIsXlmToUsdc(!isXlmToUsdc);
              setAmountIn("");
            }}
            className="bg-card border border-border p-2 rounded-lg text-text-secondary hover:text-white hover:bg-surface transition-all active:scale-95"
          >
            <ArrowDownUp className="w-5 h-5" />
          </button>
        </div>

        {/* You Receive Section */}
        <div className="bg-surface rounded-xl p-4 border border-border mb-6">
          <div className="flex justify-between text-sm text-text-secondary mb-2">
            <span>You receive (estimated)</span>
            <span>Balance: {!isXlmToUsdc ? balances.xlm.toFixed(2) : balances.usdc.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <input 
              type="text"
              value={amountOut}
              disabled
              placeholder="0.00"
              className="bg-transparent text-3xl font-bold text-white outline-none w-full placeholder:text-white/20 opacity-50"
            />
            <div className="bg-card border border-border px-3 py-1.5 rounded-lg font-medium text-white flex items-center gap-2 shrink-0">
              {!isXlmToUsdc ? "XLM" : "USDC"}
            </div>
          </div>
        </div>

        {/* Rate Info */}
        <div className="flex justify-between items-center px-2 text-sm text-text-secondary mb-6">
          <span>Exchange Rate</span>
          <span>1 XLM = 1 USDC</span>
        </div>

        {/* Submit Button */}
        <button 
          type="submit"
          disabled={isSubmitting || !amountIn || parseFloat(amountIn) <= 0 || !address}
          className="w-full bg-white hover:bg-white/90 text-black py-4 rounded-xl font-bold text-lg transition-colors disabled:opacity-50 flex justify-center"
        >
          {isSubmitting ? (
            <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : !address ? (
            "Connect Wallet"
          ) : (
            "Swap"
          )}
        </button>
      </motion.form>
    </div>
  );
}
