import { useState } from "react";
import { Users, Shield, Clock, Plus, Trash2, Key, AlertCircle, Save, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

type Tab = "signers" | "thresholds" | "pending";

interface Signer {
  key: string;
  weight: number;
}

interface Thresholds {
  low: number;
  medium: number;
  high: number;
  masterWeight: number;
}

export function MultiSig() {
  const [activeTab, setActiveTab] = useState<Tab>("signers");
  
  // Mock Data
  const [thresholds, setThresholds] = useState<Thresholds>({
    low: 1,
    medium: 2,
    high: 3,
    masterWeight: 1,
  });

  const [signers, setSigners] = useState<Signer[]>([
    { key: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", weight: 1 },
    { key: "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBZ3O", weight: 1 },
    { key: "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC6R6", weight: 1 },
  ]);

  const [newSignerKey, setNewSignerKey] = useState("");
  const [newSignerWeight, setNewSignerWeight] = useState(1);

  // Handlers
  const handleAddSigner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSignerKey) return;
    
    // Simple validation for demo
    if (!newSignerKey.startsWith("G") || newSignerKey.length !== 56) {
      toast.error("Invalid Stellar Public Key");
      return;
    }

    if (signers.some(s => s.key === newSignerKey)) {
      toast.error("Signer already exists");
      return;
    }

    setSigners([...signers, { key: newSignerKey, weight: newSignerWeight }]);
    setNewSignerKey("");
    setNewSignerWeight(1);
    toast.success("Signer added successfully");
  };

  const handleRemoveSigner = (key: string) => {
    setSigners(signers.filter(s => s.key !== key));
    toast.success("Signer removed");
  };

  const handleThresholdChange = (key: keyof Thresholds, value: number) => {
    setThresholds(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveThresholds = () => {
    toast.success("Thresholds updated on network");
  };

  const handleSignTransaction = (id: string) => {
    toast.success(`Transaction ${id} signed successfully`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Multi-signature Management
          </h1>
          <p className="text-text-secondary mt-1">Configure signers, thresholds, and manage pending transactions</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="flex border-b border-border bg-surface/50 overflow-x-auto">
          <button
            onClick={() => setActiveTab("signers")}
            className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors relative whitespace-nowrap ${
              activeTab === "signers" ? "text-primary" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Key className="w-4 h-4" />
            Signers ({signers.length})
            {activeTab === "signers" && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("thresholds")}
            className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors relative whitespace-nowrap ${
              activeTab === "thresholds" ? "text-primary" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Shield className="w-4 h-4" />
            Thresholds
            {activeTab === "thresholds" && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors relative whitespace-nowrap ${
              activeTab === "pending" ? "text-primary" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Clock className="w-4 h-4" />
            Pending Transactions
            <span className="bg-primary/20 text-primary text-xs py-0.5 px-2 rounded-full">2</span>
            {activeTab === "pending" && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === "signers" && (
              <motion.div
                key="signers"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <form onSubmit={handleAddSigner} className="flex gap-4 items-end bg-background p-4 rounded-xl border border-border">
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Signer Public Key</label>
                    <input
                      type="text"
                      value={newSignerKey}
                      onChange={(e) => setNewSignerKey(e.target.value)}
                      placeholder="G..."
                      className="w-full font-mono bg-surface border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-white/20 transition-colors"
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Weight</label>
                    <input
                      type="number"
                      min="1"
                      max="255"
                      value={newSignerWeight}
                      onChange={(e) => setNewSignerWeight(parseInt(e.target.value) || 1)}
                      className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-white/20 transition-colors"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="h-10 bg-primary hover:bg-primary/90 text-white px-4 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Signer
                  </motion.button>
                </form>

                <div className="space-y-3">
                  {signers.map((signer, idx) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      key={signer.key}
                      className="flex items-center justify-between p-4 bg-background border border-border rounded-xl group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {signer.weight}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-text-primary">
                              {idx === 0 ? "Master Key" : `Additional Signer ${idx}`}
                            </span>
                            {idx === 0 && (
                              <span className="text-xs bg-white/10 text-text-secondary px-2 py-0.5 rounded-full">Owner</span>
                            )}
                          </div>
                          <p className="font-mono text-sm text-text-secondary mt-1">{signer.key}</p>
                        </div>
                      </div>
                      {idx !== 0 && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRemoveSigner(signer.key)}
                          className="p-2 text-text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all bg-surface rounded-lg border border-transparent hover:border-red-400/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "thresholds" && (
              <motion.div
                key="thresholds"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 max-w-2xl"
              >
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex gap-4">
                  <AlertCircle className="w-6 h-6 text-primary shrink-0" />
                  <div className="space-y-1">
                    <h3 className="font-medium text-text-primary">Understanding Thresholds</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      Every operation on Stellar has a required threshold level. A transaction is valid only if the combined weight of the signatures meets or exceeds the required threshold for the operations it contains.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: "low", label: "Low Threshold", desc: "Allow trustlines, bump sequence" },
                    { key: "medium", label: "Medium Threshold", desc: "Payments, manage offers" },
                    { key: "high", label: "High Threshold", desc: "Set options, merge account" },
                    { key: "masterWeight", label: "Master Weight", desc: "Weight of the main account key" },
                  ].map((item) => (
                    <div key={item.key} className="bg-background border border-border rounded-xl p-4 space-y-3">
                      <div>
                        <label className="font-medium text-text-primary block">{item.label}</label>
                        <span className="text-xs text-text-secondary">{item.desc}</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="255"
                        value={thresholds[item.key as keyof Thresholds]}
                        onChange={(e) => handleThresholdChange(item.key as keyof Thresholds, parseInt(e.target.value) || 0)}
                        className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-white/20 transition-colors"
                      />
                    </div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveThresholds}
                  className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 mt-4"
                >
                  <Save className="w-5 h-5" />
                  Save Thresholds to Network
                </motion.button>
              </motion.div>
            )}

            {activeTab === "pending" && (
              <motion.div
                key="pending"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {[
                  { id: "tx_1", type: "Payment", details: "100 USDC to GB4...L9", required: 2, current: 1 },
                  { id: "tx_2", type: "Set Options", details: "Change Master Weight", required: 3, current: 1 },
                ].map((tx) => (
                  <div key={tx.id} className="bg-background border border-border rounded-xl p-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                          {tx.type}
                        </span>
                        <span className="text-sm font-mono text-text-secondary">Tx ID: {tx.id}</span>
                      </div>
                      <p className="font-medium text-text-primary">{tx.details}</p>
                    </div>
                    
                    <div className="flex items-center gap-6 w-full sm:w-auto">
                      <div className="text-right">
                        <p className="text-xs text-text-secondary mb-1">Signatures</p>
                        <p className="font-medium text-text-primary">
                          <span className={tx.current >= tx.required ? "text-green-400" : "text-yellow-400"}>
                            {tx.current}
                          </span>
                          {" "} / {tx.required} Weight
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSignTransaction(tx.id)}
                        className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 flex-1 sm:flex-none justify-center"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Sign
                      </motion.button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
