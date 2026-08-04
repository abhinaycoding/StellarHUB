import { useState, useEffect, useCallback } from "react";
import { Droplets, Wallet, Plus, Minus, Layers, ArrowRight } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { getBalances, depositLiquidity, withdrawLiquidity, getUserLpPositions } from "@/services/stellar";
import type { LPPosition } from "@/services/stellar";
import toast from "react-hot-toast";

const USDC_ISSUER = "GDXN5T3HR4CYUXP4LVGIFJKX5AUZCHUHQLTGEYNYZL73JSZTD3ASWTAB";

export function Pools() {
  const { address } = useWallet();
  const [balances, setBalances] = useState({ xlm: 0, usdc: 0 });
  const [lpPositions, setLpPositions] = useState<LPPosition[]>([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'deposit' | 'withdraw'>('dashboard');
  const [amountXLM, setAmountXLM] = useState("");
  const [amountUSDC, setAmountUSDC] = useState("");
  const [sharesToWithdraw, setSharesToWithdraw] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (address) {
      try {
        setIsLoadingPositions(true);
        const [bals, positions] = await Promise.all([
          getBalances(address),
          getUserLpPositions(address)
        ]);
        setBalances(bals);
        setLpPositions(positions);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingPositions(false);
      }
    }
  }, [address]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      fetchData();
      setActiveTab('dashboard');
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
      fetchData();
      setActiveTab('dashboard');
    } catch (error: any) {
      toast.error(error.message || "Withdrawal failed", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatHash = (hash: string) => {
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
          <Droplets className="w-8 h-8 text-primary" />
          Yield & Pools
        </h1>
        <p className="text-text-secondary">Provide liquidity to AMMs, earn fees, and manage your DeFi positions.</p>
      </div>

      <div className="flex gap-2 mb-6 p-1 bg-surface border border-border rounded-lg max-w-lg mx-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'dashboard' ? 'bg-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Dashboard
        </button>
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

      <div className="relative max-w-lg mx-auto">
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm relative z-10">
        
        {activeTab === 'dashboard' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                Active Positions
              </h2>
              <button onClick={fetchData} className="text-xs text-primary hover:text-primary/80 transition-colors font-medium">
                REFRESH
              </button>
            </div>

            {!address ? (
              <div className="text-center py-8">
                <p className="text-text-secondary mb-4">Connect your wallet to view your active liquidity positions.</p>
              </div>
            ) : isLoadingPositions ? (
              <div className="text-center py-8 text-text-secondary flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="text-sm">Loading positions...</span>
              </div>
            ) : lpPositions.length === 0 ? (
              <div className="text-center py-10 bg-background/50 rounded-lg border border-border/50">
                <Droplets className="w-12 h-12 text-text-secondary/30 mx-auto mb-3" />
                <p className="text-text-secondary font-medium mb-1">No Active Positions</p>
                <p className="text-sm text-text-secondary/70 mb-4">You don't have any liquidity in AMM pools.</p>
                <button 
                  onClick={() => setActiveTab('deposit')}
                  className="bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                >
                  START EARNING
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {lpPositions.map((pos) => (
                  <div key={pos.poolId} className="bg-card border border-border rounded-lg p-5 hover:border-primary/50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-text-primary">{pos.assetA} / {pos.assetB}</h3>
                          <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">AMM</span>
                        </div>
                        <p className="text-xs text-text-secondary font-mono mt-1" title={pos.poolId}>
                          Pool ID: {formatHash(pos.poolId)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-text-secondary uppercase mb-1">Your Pool Shares</p>
                        <p className="font-mono text-sm font-medium text-text-primary">{pos.userShares}</p>
                      </div>
                    </div>
                    
                    <div className="bg-background/80 rounded border border-border/50 p-3 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-secondary flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-blue-400" />
                          Underlying {pos.assetA}
                        </span>
                        <span className="font-mono font-medium">{pos.userAmountA.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-secondary flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-400" />
                          Underlying {pos.assetB}
                        </span>
                        <span className="font-mono font-medium">{pos.userAmountB.toFixed(4)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <button 
                        onClick={() => {
                          setSharesToWithdraw(pos.userShares);
                          setActiveTab('withdraw');
                        }}
                        className="flex-1 border border-border hover:bg-white/5 text-text-primary py-1.5 rounded text-xs font-bold transition-colors text-center"
                      >
                        WITHDRAW
                      </button>
                      <button 
                        onClick={() => setActiveTab('deposit')}
                        className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary py-1.5 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1"
                      >
                        ADD MORE <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'deposit' ? (
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
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h2 className="text-lg font-bold text-text-primary">Withdraw Liquidity</h2>
              <button 
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="text-xs text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1"
              >
                VIEW POSITIONS <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            
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
