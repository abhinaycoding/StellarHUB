import { useWallet } from "@/contexts/WalletContext";
import { Copy, Download } from "lucide-react";
import toast from "react-hot-toast";
import QRCode from "react-qr-code";

export function Receive() {
  const { address } = useWallet();
  const displayAddress = address || "Not Connected";

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success("Address copied to clipboard!");
    } else {
      toast.error("No wallet connected!");
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Receive XLM</h1>
        <p className="text-text-secondary">Scan the QR code or copy the address below.</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <div className="w-48 h-48 bg-white rounded-lg mx-auto mb-8 p-3 flex items-center justify-center border border-border">
          {address ? (
            <QRCode 
              value={address} 
              size={168} 
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            />
          ) : (
            <div className="text-sm text-black/50 text-center font-medium">Connect wallet to generate QR</div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-surface rounded-lg p-4 border border-border">
            <div className="text-sm text-text-secondary mb-1">Your Stellar Address</div>
            <div className="font-mono text-text-primary text-sm break-all">
              {displayAddress}
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={handleCopy}
              className="flex-1 bg-surface hover:bg-surface-hover text-text-primary px-4 py-3 rounded-lg font-medium transition-colors border border-border flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
            <button className="flex-1 bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
