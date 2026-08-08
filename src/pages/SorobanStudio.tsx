import { useState } from "react";
import { TerminalSquare, Play, RefreshCw, AlertTriangle } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import * as StellarSdk from "@stellar/stellar-sdk";
import toast from "react-hot-toast";
import { signTransaction } from "@stellar/freighter-api";

type ArgType = "Address" | "u32" | "i128" | "Symbol" | "String";

interface ContractArg {
  id: string;
  type: ArgType;
  value: string;
}

export function SorobanStudio() {
  const { address } = useWallet();
  const [contractId, setContractId] = useState("");
  const [functionName, setFunctionName] = useState("");
  const [args, setArgs] = useState<ContractArg[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const addArg = () => {
    setArgs([...args, { id: crypto.randomUUID(), type: "u32", value: "" }]);
  };

  const updateArg = (id: string, field: keyof ContractArg, value: string) => {
    setArgs(args.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const removeArg = (id: string) => {
    setArgs(args.filter(a => a.id !== id));
  };

  const getScVal = (type: ArgType, value: string) => {
    switch (type) {
      case "Address": return StellarSdk.nativeToScVal(value, { type: "address" });
      case "u32": return StellarSdk.nativeToScVal(parseInt(value), { type: "u32" });
      case "i128": return StellarSdk.nativeToScVal(BigInt(value), { type: "i128" });
      case "Symbol": return StellarSdk.nativeToScVal(value, { type: "symbol" });
      case "String": return StellarSdk.nativeToScVal(value, { type: "string" });
      default: throw new Error("Unsupported type");
    }
  };

  const buildInvokeTx = async () => {
    const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");
    const account = await server.loadAccount(address!);
    const fee = await server.fetchBaseFee();

    const scArgs = args.map(a => getScVal(a.type, a.value));

    const txBuilder = new StellarSdk.TransactionBuilder(account, {
      fee: fee.toString(),
      networkPassphrase: StellarSdk.Networks.TESTNET,
    });

    txBuilder.addOperation(
      StellarSdk.Operation.invokeHostFunction({
        func: StellarSdk.xdr.HostFunction.hostFunctionTypeInvokeContract(
          new StellarSdk.xdr.InvokeContractArgs({
            contractAddress: new StellarSdk.Address(contractId).toScAddress(),
            functionName: functionName,
            args: scArgs,
          })
        ),
        auth: [],
      })
    );

    txBuilder.setTimeout(300);
    return txBuilder.build();
  };

  const handleSimulate = async () => {
    if (!contractId || !functionName || !address) {
      toast.error("Please fill contract ID, function name, and connect wallet.");
      return;
    }
    
    setIsSimulating(true);
    setSimulationResult(null);
    try {
      const tx = await buildInvokeTx();
      const rpc = new StellarSdk.rpc.Server("https://soroban-testnet.stellar.org");
      const sim = await rpc.simulateTransaction(tx);
      setSimulationResult(sim);
      toast.success("Simulation successful");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Simulation failed");
      setSimulationResult({ error: error.message });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleExecute = async () => {
    if (!simulationResult || StellarSdk.rpc.Api.isSimulationError(simulationResult)) {
      toast.error("Must have a successful simulation to execute.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const tx = await buildInvokeTx();
      
      // Assemble transaction with Soroban data from simulation
      const rpc = new StellarSdk.rpc.Server("https://soroban-testnet.stellar.org");
      const preparedTx = await rpc.prepareTransaction(tx);

      const xdr = preparedTx.toXDR();
      const signedTxRes = await signTransaction(xdr, {
        network: "TESTNET",
        networkPassphrase: StellarSdk.Networks.TESTNET,
        address: address,
      } as any);

      if (signedTxRes.error || !signedTxRes.signedTxXdr) {
        throw new Error(signedTxRes.error?.toString() || "Signing failed");
      }

      const signedTx = StellarSdk.TransactionBuilder.fromXDR(
        signedTxRes.signedTxXdr,
        StellarSdk.Networks.TESTNET
      ) as StellarSdk.Transaction;
      
      const response = await rpc.sendTransaction(signedTx);
      
      if (response.status === "ERROR") {
        throw new Error(`Transaction failed: ${(response as any).errorResult || response.hash}`);
      }

      toast.success("Transaction submitted to Soroban RPC!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Execution failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
          <TerminalSquare className="w-8 h-8 text-primary" />
          Soroban Contract Studio
        </h1>
        <p className="text-text-secondary mt-1">
          Simulate and execute Soroban smart contract invocations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-text-primary mb-4">Invocation Setup</h2>
            
            <div className="space-y-1">
              <label className="text-xs text-text-secondary font-medium">Contract ID</label>
              <input 
                type="text" 
                value={contractId} 
                onChange={(e) => setContractId(e.target.value)} 
                className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono text-text-primary outline-none focus:border-primary" 
                placeholder="C..." 
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs text-text-secondary font-medium">Function Name</label>
              <input 
                type="text" 
                value={functionName} 
                onChange={(e) => setFunctionName(e.target.value)} 
                className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-text-primary outline-none focus:border-primary" 
                placeholder="e.g. transfer" 
              />
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs text-text-secondary font-medium uppercase tracking-widest">Arguments</label>
                <button onClick={addArg} className="text-xs text-primary hover:text-primary/80 font-medium">
                  + Add Argument
                </button>
              </div>
              
              <div className="space-y-3">
                {args.length === 0 ? (
                  <div className="text-xs text-text-secondary/50 text-center py-4 border border-dashed border-border rounded">No arguments</div>
                ) : (
                  args.map((arg) => (
                    <div key={arg.id} className="flex gap-2 items-start">
                      <div className="w-24 shrink-0">
                        <select 
                          value={arg.type} 
                          onChange={(e) => updateArg(arg.id, "type", e.target.value)}
                          className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs font-mono text-text-primary outline-none focus:border-primary appearance-none"
                        >
                          <option value="Address">Address</option>
                          <option value="u32">u32</option>
                          <option value="i128">i128</option>
                          <option value="Symbol">Symbol</option>
                          <option value="String">String</option>
                        </select>
                      </div>
                      <div className="flex-1 relative">
                        <input 
                          type="text" 
                          value={arg.value} 
                          onChange={(e) => updateArg(arg.id, "value", e.target.value)}
                          className="w-full bg-background border border-border rounded px-3 py-1.5 text-sm font-mono text-text-primary outline-none focus:border-primary pr-8" 
                          placeholder="Value" 
                        />
                        <button onClick={() => removeArg(arg.id)} className="absolute right-2 top-1.5 text-text-secondary hover:text-red-400">
                          &times;
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-6 flex gap-3">
              <button 
                onClick={handleSimulate}
                disabled={isSimulating || !address}
                className="flex-1 py-2.5 bg-background border border-primary text-primary hover:bg-primary/10 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSimulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Simulate
              </button>
              <button 
                onClick={handleExecute}
                disabled={isSubmitting || !simulationResult || StellarSdk.rpc.Api.isSimulationError(simulationResult)}
                className="flex-1 py-2.5 bg-primary text-white hover:bg-primary/90 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-surface disabled:text-text-secondary"
              >
                {isSubmitting ? "Executing..." : "Execute"}
              </button>
            </div>
            {!address && <p className="text-xs text-center text-primary mt-2">Connect wallet to interact.</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-xl p-6 h-full flex flex-col">
            <h2 className="text-lg font-bold text-text-primary mb-4">Simulation Output</h2>
            
            <div className="flex-1 bg-background border border-border rounded-lg p-4 overflow-y-auto font-mono text-xs">
              {!simulationResult ? (
                <div className="h-full flex flex-col items-center justify-center text-text-secondary/50 space-y-2">
                  <TerminalSquare className="w-8 h-8 opacity-50" />
                  <span>Run a simulation to see the results</span>
                </div>
              ) : StellarSdk.rpc.Api.isSimulationError(simulationResult) ? (
                <div className="text-red-400 space-y-2">
                  <div className="flex items-center gap-2 font-bold"><AlertTriangle className="w-4 h-4" /> Simulation Failed</div>
                  <pre className="whitespace-pre-wrap">{simulationResult.error}</pre>
                </div>
              ) : (
                <div className="space-y-4 text-text-secondary break-words">
                  <div>
                    <span className="text-primary font-bold">Cost:</span> 
                    <div>CPU Instructions: {simulationResult.cost?.cpuInsns}</div>
                    <div>Memory Bytes: {simulationResult.cost?.memBytes}</div>
                  </div>
                  <div>
                    <span className="text-primary font-bold">Results:</span>
                    <pre className="mt-1 p-2 bg-black/20 rounded border border-border/50">
                      {JSON.stringify(simulationResult.results, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
