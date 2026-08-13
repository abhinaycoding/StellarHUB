import { useState, useEffect } from "react";
import { Wrench, Plus, Trash2, Code, ArrowRight, Search, FileJson } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import * as StellarSdk from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";
import toast from "react-hot-toast";

type OperationType = "payment" | "changeTrust" | "manageSellOffer" | "createAccount";

interface OpData {
  id: string;
  type: OperationType;
  [key: string]: any;
}

export function TransactionBuilder() {
  const { address } = useWallet();
  const [activeTab, setActiveTab] = useState<'build' | 'decode'>('build');
  
  // Builder State
  const [operations, setOperations] = useState<OpData[]>([]);
  const [baseFee, setBaseFee] = useState("100");
  const [xdr, setXdr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Decoder State
  const [decoderInput, setDecoderInput] = useState("");
  const [decodedTx, setDecodedTx] = useState<StellarSdk.Transaction | StellarSdk.FeeBumpTransaction | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);

  // --- BUILDER LOGIC ---
  const addOperation = (type: OperationType) => {
    setOperations([...operations, { id: crypto.randomUUID(), type }]);
  };

  const removeOperation = (id: string) => {
    setOperations(operations.filter((op) => op.id !== id));
  };

  const updateOperation = (id: string, key: string, value: any) => {
    setOperations(
      operations.map((op) => (op.id === id ? { ...op, [key]: value } : op))
    );
  };

  useEffect(() => {
    generateXdr();
  }, [operations, baseFee, address]);

  const generateXdr = async () => {
    if (!address || operations.length === 0) {
      setXdr("");
      return;
    }

    try {
      const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");
      let account;
      try {
        account = await server.loadAccount(address);
      } catch (e) {
        account = new StellarSdk.Account(address, "1");
      }

      const txBuilder = new StellarSdk.TransactionBuilder(account, {
        fee: baseFee.toString(),
        networkPassphrase: StellarSdk.Networks.TESTNET,
      });

      operations.forEach((op) => {
        if (op.type === "payment") {
          txBuilder.addOperation(
            StellarSdk.Operation.payment({
              destination: op.destination || address,
              asset: op.assetCode && op.assetIssuer ? new StellarSdk.Asset(op.assetCode, op.assetIssuer) : StellarSdk.Asset.native(),
              amount: op.amount || "0",
            })
          );
        } else if (op.type === "changeTrust") {
          txBuilder.addOperation(
            StellarSdk.Operation.changeTrust({
              asset: new StellarSdk.Asset(op.assetCode || "USDC", op.assetIssuer || address),
              limit: op.limit || undefined,
            })
          );
        } else if (op.type === "createAccount") {
          txBuilder.addOperation(
             StellarSdk.Operation.createAccount({
               destination: op.destination || address,
               startingBalance: op.startingBalance || "1"
             })
          )
        }
      });

      txBuilder.setTimeout(300);
      const tx = txBuilder.build();
      setXdr(tx.toXDR());
    } catch (e) {
      setXdr("");
    }
  };

  const handleSignAndSubmit = async () => {
    if (!xdr) return;
    setIsSubmitting(true);
    try {
      const signedTxRes = await signTransaction(xdr, {
        network: "TESTNET",
        networkPassphrase: StellarSdk.Networks.TESTNET,
        address: address || undefined,
      } as any);

      if (signedTxRes.error || !signedTxRes.signedTxXdr) {
        throw new Error(signedTxRes.error?.toString() || "Signing failed");
      }

      const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
        signedTxRes.signedTxXdr,
        StellarSdk.Networks.TESTNET
      ) as StellarSdk.Transaction;

      const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");
      const response = await server.submitTransaction(signedTransaction);
      toast.success("Transaction submitted successfully");
      console.log("Success:", response);
    } catch (error: any) {
      toast.error(error.message || "Submission failed");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- DECODER LOGIC ---
  useEffect(() => {
    if (!decoderInput.trim()) {
      setDecodedTx(null);
      setDecodeError(null);
      return;
    }

    try {
      const tx = StellarSdk.TransactionBuilder.fromXDR(decoderInput.trim(), StellarSdk.Networks.TESTNET);
      setDecodedTx(tx);
      setDecodeError(null);
    } catch (e: any) {
      setDecodedTx(null);
      setDecodeError("Invalid XDR string provided. Ensure it is a valid Base64 encoded Stellar transaction.");
    }
  }, [decoderInput]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
          <Wrench className="w-8 h-8 text-primary" />
          Transaction Toolkit
        </h1>
        <p className="text-text-secondary mt-1">
          Compose advanced operations, preview XDR, or decode raw transaction payloads.
        </p>
      </div>

      <div className="flex gap-4 border-b border-border/50">
        <button
          onClick={() => setActiveTab('build')}
          className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === 'build' ? 'border-primary text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
        >
          Raw Transaction Builder
        </button>
        <button
          onClick={() => setActiveTab('decode')}
          className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'decode' ? 'border-primary text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
        >
          <FileJson className="w-4 h-4" />
          XDR Decoder
        </button>
      </div>

      {activeTab === 'build' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-surface border border-border rounded-xl p-6">
              <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center justify-between">
                Operations
                <div className="flex gap-2">
                  <button onClick={() => addOperation("payment")} className="px-3 py-1.5 bg-background border border-border hover:border-primary text-xs font-medium rounded text-text-secondary hover:text-primary transition-colors flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Payment
                  </button>
                  <button onClick={() => addOperation("changeTrust")} className="px-3 py-1.5 bg-background border border-border hover:border-primary text-xs font-medium rounded text-text-secondary hover:text-primary transition-colors flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Trustline
                  </button>
                  <button onClick={() => addOperation("createAccount")} className="px-3 py-1.5 bg-background border border-border hover:border-primary text-xs font-medium rounded text-text-secondary hover:text-primary transition-colors flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Create Account
                  </button>
                </div>
              </h2>

              <div className="space-y-4">
                {operations.length === 0 ? (
                  <div className="p-8 text-center text-text-secondary border border-dashed border-border rounded-lg">
                    No operations added. Select an operation type above to start building.
                  </div>
                ) : (
                  operations.map((op, index) => (
                    <div key={op.id} className="p-4 border border-border rounded-lg bg-background/50 space-y-3 relative group">
                      <button
                        onClick={() => removeOperation(op.id)}
                        className="absolute right-3 top-3 p-1.5 text-text-secondary hover:text-red-400 hover:bg-red-400/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="font-mono text-xs text-primary font-bold uppercase tracking-wider">
                        OP {index + 1} — {op.type}
                      </div>

                      {op.type === "payment" && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1 col-span-2">
                            <label className="text-xs text-text-secondary font-medium">Destination</label>
                            <input type="text" value={op.destination || ""} onChange={(e) => updateOperation(op.id, "destination", e.target.value)} className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm focus:border-primary outline-none" placeholder="G..." />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-text-secondary font-medium">Asset Code (blank = XLM)</label>
                            <input type="text" value={op.assetCode || ""} onChange={(e) => updateOperation(op.id, "assetCode", e.target.value)} className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm focus:border-primary outline-none" placeholder="e.g. USDC" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-text-secondary font-medium">Asset Issuer</label>
                            <input type="text" value={op.assetIssuer || ""} onChange={(e) => updateOperation(op.id, "assetIssuer", e.target.value)} className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm focus:border-primary outline-none" placeholder="G..." />
                          </div>
                          <div className="space-y-1 col-span-2">
                            <label className="text-xs text-text-secondary font-medium">Amount</label>
                            <input type="text" value={op.amount || ""} onChange={(e) => updateOperation(op.id, "amount", e.target.value)} className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm font-mono focus:border-primary outline-none" placeholder="10.5" />
                          </div>
                        </div>
                      )}

                      {op.type === "changeTrust" && (
                         <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs text-text-secondary font-medium">Asset Code</label>
                            <input type="text" value={op.assetCode || ""} onChange={(e) => updateOperation(op.id, "assetCode", e.target.value)} className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm focus:border-primary outline-none" placeholder="USDC" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-text-secondary font-medium">Limit (Optional)</label>
                            <input type="text" value={op.limit || ""} onChange={(e) => updateOperation(op.id, "limit", e.target.value)} className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm focus:border-primary outline-none" placeholder="Max" />
                          </div>
                          <div className="space-y-1 col-span-2">
                            <label className="text-xs text-text-secondary font-medium">Asset Issuer</label>
                            <input type="text" value={op.assetIssuer || ""} onChange={(e) => updateOperation(op.id, "assetIssuer", e.target.value)} className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm focus:border-primary outline-none" placeholder="G..." />
                          </div>
                        </div>
                      )}
                      
                      {op.type === "createAccount" && (
                         <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1 col-span-2">
                            <label className="text-xs text-text-secondary font-medium">Destination</label>
                            <input type="text" value={op.destination || ""} onChange={(e) => updateOperation(op.id, "destination", e.target.value)} className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm focus:border-primary outline-none" placeholder="G..." />
                          </div>
                          <div className="space-y-1 col-span-2">
                            <label className="text-xs text-text-secondary font-medium">Starting Balance (XLM)</label>
                            <input type="text" value={op.startingBalance || ""} onChange={(e) => updateOperation(op.id, "startingBalance", e.target.value)} className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm font-mono focus:border-primary outline-none" placeholder="1.0" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                  <Code className="w-4 h-4 text-primary" /> XDR Preview
                </h3>
                <div className="bg-background border border-border rounded-lg p-3 h-48 overflow-y-auto">
                  {xdr ? (
                    <div className="font-mono text-xs text-text-secondary break-all">
                      {xdr}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs text-text-secondary/50 font-mono">
                      Incomplete Transaction
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-medium text-text-secondary">Base Fee (stroops)</label>
                 <input 
                   type="number" 
                   value={baseFee} 
                   onChange={(e) => setBaseFee(e.target.value)}
                   className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono text-text-primary outline-none focus:border-primary"
                 />
              </div>

              <button
                onClick={handleSignAndSubmit}
                disabled={!xdr || !address || isSubmitting}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Sign & Submit"}
                <ArrowRight className="w-4 h-4" />
              </button>
              {!address && (
                <p className="text-xs text-center text-primary">Connect wallet to sign.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'decode' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-surface border border-border rounded-xl p-6">
            <label className="block text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" /> Paste XDR String
            </label>
            <textarea
              value={decoderInput}
              onChange={(e) => setDecoderInput(e.target.value)}
              placeholder="AAAAAgAAAAA..."
              className="w-full h-32 bg-background border border-border rounded-lg p-4 font-mono text-sm text-text-primary focus:border-primary outline-none resize-none break-all"
            />
            {decodeError && (
              <p className="mt-3 text-red-400 text-sm font-mono">{decodeError}</p>
            )}
          </div>

          {decodedTx && (
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-background/50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <Code className="w-5 h-5 text-primary" /> Decoded Payload
                </h3>
                <span className="text-xs font-mono px-2 py-1 bg-background border border-border rounded text-text-secondary">
                  {decodedTx instanceof StellarSdk.FeeBumpTransaction ? "FEE_BUMP_TRANSACTION" : "TRANSACTION"}
                </span>
              </div>
              <div className="p-6 space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <div className="text-xs text-text-secondary font-medium">Source Account</div>
                    <div className="font-mono text-sm text-text-primary break-all">
                      {decodedTx instanceof StellarSdk.FeeBumpTransaction ? decodedTx.feeSource : decodedTx.source}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-text-secondary font-medium">Network Passphrase</div>
                    <div className="font-mono text-sm text-text-primary">
                      {decodedTx.networkPassphrase || "Unknown / Not set in XDR"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-text-secondary font-medium">Fee</div>
                    <div className="font-mono text-sm text-text-primary">
                      {decodedTx.fee} stroops
                    </div>
                  </div>
                  {decodedTx instanceof StellarSdk.Transaction && (
                    <div className="space-y-1">
                      <div className="text-xs text-text-secondary font-medium">Sequence Number</div>
                      <div className="font-mono text-sm text-text-primary break-all">
                        {decodedTx.sequence}
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className="text-xs text-text-secondary font-medium">Signatures</div>
                    <div className="font-mono text-sm text-text-primary">
                      {decodedTx.signatures.length} signature(s) attached
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <h4 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Wrench className="w-4 h-4" /> Operations ({(decodedTx instanceof StellarSdk.Transaction) ? decodedTx.operations.length : (decodedTx as StellarSdk.FeeBumpTransaction).innerTransaction.operations.length})
                  </h4>
                  <div className="space-y-3">
                    {((decodedTx instanceof StellarSdk.Transaction) ? decodedTx.operations : (decodedTx as StellarSdk.FeeBumpTransaction).innerTransaction.operations).map((op, i) => (
                      <div key={i} className="bg-background border border-border/50 rounded-lg p-4 font-mono text-sm space-y-2">
                        <div className="text-primary font-bold tracking-wider mb-2">
                          OP {i + 1} — {op.type.toUpperCase()}
                        </div>
                        {Object.entries(op).map(([k, v]) => {
                          if (k === "type") return null;
                          let displayValue = "";
                          if (typeof v === "object" && v !== null) {
                            if (v instanceof StellarSdk.Asset) {
                              displayValue = v.isNative() ? "XLM" : `${v.code}:${v.issuer}`;
                            } else {
                              displayValue = JSON.stringify(v);
                            }
                          } else {
                            displayValue = String(v);
                          }
                          
                          return (
                            <div key={k} className="grid grid-cols-12 gap-4">
                              <div className="col-span-3 text-text-secondary break-all">{k}</div>
                              <div className="col-span-9 text-text-primary break-all">{displayValue}</div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
