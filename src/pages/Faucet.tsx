import { useState } from "react";
import { Droplets, ShieldAlert, KeyRound, Coins, CheckCircle2 } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { useSettings } from "@/contexts/SettingsContext";
import { dripCustomAsset } from "@/services/stellar";
import toast from "react-hot-toast";

export function Faucet() {
  const { address } = useWallet();
  const { settings } = useSettings();
  const [assetCode, setAssetCode] = useState("");
  const [dripAmount, setDripAmount] = useState("");
  const [issuerSecret, setIssuerSecret] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ code: string, amount: string, hash: string, network: string } | null>(null);

  const handleDrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    if (assetCode.length < 1 || assetCode.length > 12) {
      toast.error("Asset Code must be 1-12 characters");
      return;
    }

    if (!dripAmount || parseFloat(dripAmount) <= 0) {
      toast.error("Drip amount must be greater than 0");
      return;
    }

    if (!issuerSecret || !issuerSecret.startsWith("S") || issuerSecret.length !== 56) {
      toast.error("Invalid Issuer Secret Key");
      return;
    }

    // Faucet shouldn't work on Mainnet typically, restrict to Testnet/Futurenet
    if (settings.network === 'mainnet') {
      toast.error("The faucet is only available on Testnet and Futurenet");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading(`Processing faucet drip on ${settings.network}... Please sign trustline in Freighter if prompted.`);

    try {
      const { hash } = await dripCustomAsset(address, assetCode.toUpperCase(), dripAmount, issuerSecret, settings.network as 'testnet' | 'futurenet');
      toast.success(`${dripAmount} ${assetCode.toUpperCase()} sent successfully!`, { id: loadingToast });
      setSuccessInfo({ code: assetCode.toUpperCase(), amount: dripAmount, hash, network: settings.network });
      setAssetCode("");
      setDripAmount("");
    } catch (error: any) {
      toast.error(error.message || "Faucet drip failed", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successInfo) {
    const explorerBaseUrl = successInfo.network === 'futurenet' 
      ? 'https://stellar.expert/explorer/futurenet/tx'
      : 'https://stellar.expert/explorer/testnet/tx';
      
    return (
      <div className="max-w-md mx-auto mt-12 bg-surface border border-border rounded-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Tokens Dripped!</h2>
        <p className="text-text-secondary mb-6">
          You successfully received {successInfo.amount} {successInfo.code} to your wallet on {successInfo.network}.
        </p>
        
        <div className="flex gap-4 mt-8">
          <button 
            onClick={() => setSuccessInfo(null)}
            className="flex-1 bg-surface hover:bg-white/10 text-text-primary px-4 py-2 rounded-lg font-medium transition-colors border border-border"
          >
            Drip More
          </button>
          <a 
            href={`${explorerBaseUrl}/${successInfo.hash}`}
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
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-2">
            <Droplets className="w-8 h-8 text-primary" />
            Asset Faucet
          </h1>
          <p className="text-text-secondary">Drip custom tokens directly to your connected wallet.</p>
        </div>
        <div className="bg-surface-light border border-border px-3 py-1 rounded-full text-xs font-medium text-text-secondary uppercase">
          {settings.network}
        </div>
      </div>

      <div className="relative">
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm relative z-10">
          <form onSubmit={handleDrip} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Asset Code</label>
              <div className="relative">
                <input
                  type="text"
                  value={assetCode}
                  onChange={(e) => setAssetCode(e.target.value)}
                  placeholder="e.g. USDC"
                  maxLength={12}
                  className="w-full bg-surface border border-border rounded-lg pl-12 pr-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-white/20 transition-colors font-mono"
                  required
                />
                <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Drip Amount</label>
              <input
                type="number"
                step="0.0000001"
                value={dripAmount}
                onChange={(e) => setDripAmount(e.target.value)}
                placeholder="100"
                className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-white/20 transition-colors font-mono text-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Issuer Secret Key</label>
              <div className="relative">
                <input
                  type="password"
                  value={issuerSecret}
                  onChange={(e) => setIssuerSecret(e.target.value)}
                  placeholder="S..."
                  className="w-full bg-surface border border-border rounded-lg pl-12 pr-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-white/20 transition-colors font-mono"
                  required
                />
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
              </div>
              <div className="flex items-start gap-2 mt-2">
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-text-secondary leading-relaxed">
                  Provide the secret key for the asset issuer. This key is used locally to sign the payment transaction and is never sent to any server.
                </p>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting || !assetCode || !dripAmount || !issuerSecret || !address}
              className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 flex justify-center mt-6"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : !address ? (
                "Connect Wallet"
              ) : settings.network === 'mainnet' ? (
                "Not Available on Mainnet"
              ) : (
                `Drip on ${settings.network}`
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
