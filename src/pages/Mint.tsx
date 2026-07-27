import { useState } from "react";
import { Sparkles, Coins, Info, CheckCircle2 } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { mintToken } from "@/services/stellar";
import toast from "react-hot-toast";

export function Mint() {
  const { address } = useWallet();
  const [tokenCode, setTokenCode] = useState("");
  const [totalSupply, setTotalSupply] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ code: string, supply: string, hash: string, issuerPk: string } | null>(null);

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    if (tokenCode.length < 1 || tokenCode.length > 12) {
      toast.error("Token Code must be 1-12 characters");
      return;
    }

    if (!totalSupply || parseFloat(totalSupply) <= 0) {
      toast.error("Total supply must be greater than 0");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Minting Token... This may take a minute.");

    try {
      const { hash, issuerPk } = await mintToken(address, tokenCode.toUpperCase(), totalSupply);
      toast.success(`${tokenCode.toUpperCase()} minted successfully!`, { id: loadingToast });
      setSuccessInfo({ code: tokenCode.toUpperCase(), supply: totalSupply, hash, issuerPk });
      setTokenCode("");
      setTotalSupply("");
    } catch (error: any) {
      toast.error(error.message || "Minting failed", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successInfo) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-surface border border-border rounded-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Token Minted!</h2>
        <p className="text-text-secondary mb-6">
          You successfully issued {successInfo.supply} {successInfo.code}.
        </p>
        
        <div className="bg-surface rounded-xl p-4 mb-4 text-sm text-left">
          <div className="text-text-secondary mb-1 font-medium">Issuer Public Key</div>
          <div className="break-all font-mono text-text-primary/80 select-all">{successInfo.issuerPk}</div>
        </div>

        <div className="flex gap-4 mt-8">
          <button 
            onClick={() => setSuccessInfo(null)}
            className="flex-1 bg-surface hover:bg-white/10 text-text-primary px-4 py-2 rounded-lg font-medium transition-colors border border-border"
          >
            Mint Another
          </button>
          <a 
            href={`https://stellar.expert/explorer/testnet/tx/${successInfo.hash}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm inline-flex items-center justify-center"
          >
            View in Explorer
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-primary" />
          Token Minter
        </h1>
        <p className="text-text-secondary">Easily issue your own custom token on the Stellar network.</p>
      </div>

      <div className="relative">
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm relative z-10">
        <form onSubmit={handleMint} className="space-y-6">
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Token Code</label>
            <div className="relative">
              <input
                type="text"
                value={tokenCode}
                onChange={(e) => setTokenCode(e.target.value)}
                placeholder="e.g. MYCOIN"
                maxLength={12}
                className="w-full bg-surface border border-border rounded-lg pl-12 pr-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-white/20 transition-colors font-mono"
                required
              />
              <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
            </div>
            <p className="text-xs text-text-secondary pl-1">1-12 alphanumeric characters.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Total Supply</label>
            <input
              type="number"
              step="1"
              value={totalSupply}
              onChange={(e) => setTotalSupply(e.target.value)}
              placeholder="1000000"
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-white/20 transition-colors font-mono text-xl"
              required
            />
          </div>

          <div className="flex items-start gap-3 p-4 bg-surface border border-border/50 rounded-lg mt-4">
            <Info className="w-5 h-5 text-text-secondary shrink-0 mt-0.5" />
            <div className="text-sm text-text-secondary leading-relaxed">
              We will automatically create an ephemeral Issuer account, fund it, establish a trustline, and send the full supply to your connected wallet.
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting || !tokenCode || !totalSupply || !address}
            className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 flex justify-center mt-6"
          >
            {isSubmitting ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : !address ? (
              "Connect Wallet"
            ) : (
              "Mint Token"
            )}
          </button>

        </form>
        </div>
      </div>
    </div>
  );
}
