import { useState } from "react";
import { Send as SendIcon, AlertCircle, CheckCircle2 } from "lucide-react";
import { sendPayment, sendPathPayment, isValidAddress } from "@/services/stellar";
import { useWallet } from "@/contexts/WalletContext";
import toast from "react-hot-toast";

export function Send() {
  const { address: senderAddress } = useWallet();
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [assetToSend, setAssetToSend] = useState<'XLM' | 'USDC'>('XLM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const USDC_ISSUER = "GDXN5T3HR4CYUXP4LVGIFJKX5AUZCHUHQLTGEYNYZL73JSZTD3ASWTAB";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    const cleanDestination = destination.trim();
    if (!cleanDestination || !amount) return;

    if (!isValidAddress(cleanDestination)) {
      toast.error("Cryptographic Checksum Failed: This is not a real Stellar address. Please use a valid address.");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Sign transaction in Freighter...");
    try {
      let hash;
      if (assetToSend === 'USDC') {
        hash = await sendPathPayment(senderAddress, cleanDestination, 'USDC', amount, USDC_ISSUER, memo.trim());
      } else {
        hash = await sendPayment(senderAddress, cleanDestination, amount, memo.trim());
      }
      setTxHash(hash);
      toast.success("Transaction sent successfully!", { id: loadingToast });
    } catch (error: any) {
      toast.error(error.message || "Transaction failed", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (txHash) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-surface border border-border rounded-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="w-12 h-12 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Payment Sent</h2>
        <p className="text-text-secondary mb-8">
          You successfully sent {amount} {assetToSend}.
        </p>
        <div className="bg-surface rounded-xl p-4 mb-8 text-sm break-all font-mono text-text-secondary">
          {txHash}
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => { setTxHash(null); setDestination(""); setAmount(""); setMemo(""); }}
            className="flex-1 bg-surface hover:bg-white/10 text-text-primary px-4 py-2 rounded-lg font-medium transition-colors border border-border"
          >
            Send Another
          </button>
          <a 
            href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
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
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Send XLM</h1>
        <p className="text-text-secondary">Send funds instantly on the Stellar network.</p>
      </div>

      <div className="relative">
        <form onSubmit={handleSubmit} className="space-y-6 bg-surface border border-border rounded-lg p-6 sm:p-8 relative z-10">
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">Recipient Address</label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="G..."
            className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-white/20 transition-colors font-mono"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">Amount (XLM)</label>
          <div className="relative">
            <input
              type="number"
              step="0.0000001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-surface border border-border rounded-lg pl-4 pr-24 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-white/20 transition-colors font-mono text-xl"
              required
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <select
                value={assetToSend}
                onChange={(e) => setAssetToSend(e.target.value as 'XLM'|'USDC')}
                className="bg-card border border-border text-text-primary text-sm font-medium rounded-md px-2 py-1 outline-none"
              >
                <option value="XLM">XLM</option>
                <option value="USDC">USDC</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">Memo (Optional)</label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Reference or message"
            className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>

        <div className="flex items-start gap-3 p-4 bg-surface border border-border/50 rounded-lg">
          <AlertCircle className="w-5 h-5 text-text-secondary shrink-0 mt-0.5" />
          <div className="text-sm text-text-secondary leading-relaxed">
            Please ensure the recipient address is correct. {assetToSend === 'USDC' && "Sending USDC will use Path Payments to automatically convert and deliver XLM if the destination doesn't trust USDC."} Estimated fee: ~0.00001 XLM.
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !destination || !amount || !senderAddress}
          className="w-full bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 group"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : !senderAddress ? (
            "Connect Wallet to Send"
          ) : (
            <>
              Send Payment
              <SendIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
        </form>
      </div>
    </div>
  );
}
