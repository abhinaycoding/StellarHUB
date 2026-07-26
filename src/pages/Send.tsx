import { useState } from "react";
import { motion } from "framer-motion";
import { Send as SendIcon, AlertCircle, CheckCircle2 } from "lucide-react";
import { sendPayment, isValidAddress } from "@/services/stellar";
import { useWallet } from "@/contexts/WalletContext";
import toast from "react-hot-toast";

export function Send() {
  const { address: senderAddress } = useWallet();
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

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
      const hash = await sendPayment(senderAddress, cleanDestination, amount, memo.trim());
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
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto mt-12 bg-card border border-border rounded-3xl p-8 text-center"
      >
        <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Payment Sent</h2>
        <p className="text-text-secondary mb-8">
          You successfully sent {amount} XLM.
        </p>
        <div className="bg-surface rounded-xl p-4 mb-8 text-sm break-all font-mono text-text-secondary">
          {txHash}
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => { setTxHash(null); setDestination(""); setAmount(""); setMemo(""); }}
            className="flex-1 bg-surface hover:bg-white/10 text-white px-4 py-3 rounded-full font-medium transition-colors border border-border"
          >
            Send Another
          </button>
          <a 
            href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-full font-medium transition-colors shadow-lg shadow-primary/25 inline-flex items-center justify-center"
          >
            View in Explorer
          </a>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Send XLM</h1>
        <p className="text-text-secondary">Send funds instantly on the Stellar network.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-card border border-border rounded-xl p-6 sm:p-8">
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">Recipient Address</label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="G..."
            className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-white/20 transition-colors font-mono"
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
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-white/20 transition-colors font-mono text-xl"
              required
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary font-medium">
              XLM
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
            className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>

        <div className="flex items-start gap-3 p-4 bg-surface border border-border/50 rounded-lg">
          <AlertCircle className="w-5 h-5 text-text-secondary shrink-0 mt-0.5" />
          <div className="text-sm text-text-secondary leading-relaxed">
            Please ensure the recipient address is correct. Stellar transactions are irreversible. Estimated fee: ~0.00001 XLM.
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !destination || !amount || !senderAddress}
          className="w-full bg-white hover:bg-white/90 text-black px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 group"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
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
    </motion.div>
  );
}
