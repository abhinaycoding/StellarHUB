import { useState, useEffect } from "react";
import { Droplets, Wallet, Plus, Minus } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { getBalances, depositLiquidity, withdrawLiquidity } from "@/services/stellar";
import toast from "react-hot-toast";

const USDC_ISSUER = "GDXN5T3HR4CYUXP4LVGIFJKX5AUZCHUHQLTGEYNYZL73JSZTD3ASWTAB";

export function Pools() {
  const { address } = useWallet();
  const [balances, setBalances] = useState({ xlm: 0, usdc: 0 });
  
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [amountXLM, setAmountXLM] = useState("");
  const [amountUSDC, setAmountUSDC] = useState("");
  const [sharesToWithdraw, setSharesToWithdraw] = useState("");
  
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

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!amountXLM || !amountUSDC) return;

    setIsSubmitting(true);
    const loadingToast = toast.loading("Executing Liquidity Deposit...");

    try {
      await depositLiquidity(address, amountXLM, amountUSDC, USDC_ISSUER);
      toast.success("Liquidity deposited successfully!", { id: loadingToast });
      setAmountXLM("");
      setAmountUSDC("");
      fetchBalances();
    } catch (error: any) {
      toast.error(error.message || "Deposit failed", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!sharesToWithdraw) return;

    setIsSubmitting(true);
    const loadingToast = toast.loading("Executing Liquidity Withdrawal...");

    try {
      await withdrawLiquidity(address, sharesToWithdraw, USDC_ISSUER);
      toast.success("Liquidity withdrawn successfully!", { id: loadingToast });
      setSharesToWithdraw("");
      fetchBalances();
    } catch (error: any) {
      toast.error(error.message || "Withdrawal failed", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-2">
          <Droplets className="w-8 h-8 text-primary" />
          Liquidity Pools
        </h1>
        <p className="text-text-secondary">Provide liquidity to the XLM/USDC AMM and earn yield.</p>
      </div>

      <div className="flex gap-2 mb-6 p-1 bg-surface border border-border rounded-lg">
        <button
          onClick={() => setActiveTab('deposit')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'deposit' ? 'bg-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Deposit
        </button>
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'withdraw' ? 'bg-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Withdraw
        </button>
      </div>

      <div className="relative">
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm relative z-10">
        {activeTab === 'deposit' ? (
          <form onSubmit={handleDeposit} className="space-y-6">
            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="flex justify-between text-sm text-text-secondary mb-2">
                <span>Asset 1 (XLM)</span>
                <span className="flex items-center gap-1 cursor-pointer hover:text-text-primary" onClick={() => setAmountXLM(balances.xlm.toString())}>
                  <Wallet className="w-3 h-3" />
                  Balance: {balances.xlm.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <input 
                  type="number"
                  value={amountXLM}
                  onChange={(e) => setAmountXLM(e.target.value)}
                  placeholder="0.00"
                  className="bg-transparent text-3xl font-bold text-text-primary outline-none w-full"
                  step="0.0000001"
                />
                <div className="bg-card border border-border px-3 py-1.5 rounded-lg font-medium text-text-primary">XLM</div>
              </div>
            </div>

            <div className="flex justify-center -my-3 relative z-10">
              <div className="bg-card border border-border p-2 rounded-full text-text-secondary">
                <Plus className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="flex justify-between text-sm text-text-secondary mb-2">
                <span>Asset 2 (USDC)</span>
                <span className="flex items-center gap-1 cursor-pointer hover:text-text-primary" onClick={() => setAmountUSDC(balances.usdc.toString())}>
                  <Wallet className="w-3 h-3" />
                  Balance: {balances.usdc.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <input 
                  type="number"
                  value={amountUSDC}
                  onChange={(e) => setAmountUSDC(e.target.value)}
                  placeholder="0.00"
                  className="bg-transparent text-3xl font-bold text-text-primary outline-none w-full"
                  step="0.0000001"
                />
                <div className="bg-card border border-border px-3 py-1.5 rounded-lg font-medium text-text-primary">USDC</div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting || !amountXLM || !amountUSDC || !address}
              className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 flex justify-center"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : !address ? (
                "Connect Wallet"
              ) : (
                "Add Liquidity"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleWithdraw} className="space-y-6">
            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="flex justify-between text-sm text-text-secondary mb-2">
                <span>Pool Shares</span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <input 
                  type="number"
                  value={sharesToWithdraw}
                  onChange={(e) => setSharesToWithdraw(e.target.value)}
                  placeholder="0.00"
                  className="bg-transparent text-3xl font-bold text-text-primary outline-none w-full"
                  step="0.0000001"
                />
              </div>
            </div>
            
            <p className="text-sm text-text-secondary">
              Check your Stellar Expert account to see your total pool shares.
            </p>

            <button 
              type="submit"
              disabled={isSubmitting || !sharesToWithdraw || !address}
              className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : !address ? (
                "Connect Wallet"
              ) : (
                <>
                  <Minus className="w-5 h-5" />
                  Remove Liquidity
                </>
              )}
            </button>
          </form>
        )}
        </div>
      </div>
    </div>
  );
}
