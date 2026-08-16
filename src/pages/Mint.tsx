import { useState } from "react";
import { Sparkles, Coins, Info, CheckCircle2, Key, Lock, Shield, Check, Copy, AlertTriangle } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { issueAsset, mintAdditionalSupply, lockAssetSupply, setAuthFlags, getAccountDetails } from "@/services/stellar";
import toast from "react-hot-toast";

export function Mint() {
  const { address } = useWallet();
  const [activeTab, setActiveTab] = useState<'issue' | 'manage'>('issue');
  
  // Issue state
  const [tokenCode, setTokenCode] = useState("");
  const [totalSupply, setTotalSupply] = useState("");
  const [isIssuing, setIsIssuing] = useState(false);
  const [issueSuccessInfo, setIssueSuccessInfo] = useState<{ code: string, supply: string, hash: string, issuerPk: string, issuerSecret: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Manage state
  const [issuerSecret, setIssuerSecret] = useState("");
  const [manageTokenCode, setManageTokenCode] = useState("");
  const [manageAmount, setManageAmount] = useState("");
  const [isManaging, setIsManaging] = useState(false);
  
  const [accountDetails, setAccountDetails] = useState<any>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);

  const handleIssue = async (e: React.FormEvent) => {
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

    setIsIssuing(true);
    const loadingToast = toast.loading("Issuing Token... This may take a minute.");

    try {
      const { hash, issuerPk, issuerSecret } = await issueAsset(address, tokenCode.toUpperCase(), totalSupply);
      toast.success(`${tokenCode.toUpperCase()} issued successfully!`, { id: loadingToast });
      setIssueSuccessInfo({ code: tokenCode.toUpperCase(), supply: totalSupply, hash, issuerPk, issuerSecret });
      setTokenCode("");
      setTotalSupply("");
      setCopiedKey(false);
    } catch (error: any) {
      toast.error(error.message || "Issuing failed", { id: loadingToast });
    } finally {
      setIsIssuing(false);
    }
  };

  const copySecret = () => {
    if (issueSuccessInfo) {
      navigator.clipboard.writeText(issueSuccessInfo.issuerSecret);
      setCopiedKey(true);
      toast.success("Secret key copied to clipboard");
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const loadAccountDetails = async (secret: string) => {
    setIssuerSecret(secret);
    if (secret.length === 56 && secret.startsWith('S')) {
      setIsLoadingAccount(true);
      try {
        const { Keypair } = await import('@stellar/stellar-sdk');
        const keypair = Keypair.fromSecret(secret);
        const details = await getAccountDetails(keypair.publicKey());
        setAccountDetails(details);
        // Check if locked
        const masterWeight = details.thresholds.master_weight;
        setIsLocked(masterWeight === 0);
      } catch (e: any) {
        setAccountDetails(null);
        toast.error("Could not load account details. Ensure this is a valid funded issuer account.");
      } finally {
        setIsLoadingAccount(false);
      }
    } else {
      setAccountDetails(null);
    }
  };

  const handleMintMore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    
    setIsManaging(true);
    const loadingToast = toast.loading("Minting additional supply...");
    try {
      await mintAdditionalSupply(issuerSecret, manageTokenCode.toUpperCase(), manageAmount, address);
      toast.success("Successfully minted more tokens!", { id: loadingToast });
      setManageAmount("");
      loadAccountDetails(issuerSecret);
    } catch (e: any) {
      toast.error(e.message || "Failed to mint", { id: loadingToast });
    } finally {
      setIsManaging(false);
    }
  };

  const handleLockSupply = async () => {
    if (!confirm("WARNING: This will permanently lock the supply of your asset. You will never be able to mint more. Are you sure?")) {
      return;
    }
    
    setIsManaging(true);
    const loadingToast = toast.loading("Locking supply...");
    try {
      await lockAssetSupply(issuerSecret);
      toast.success("Supply locked permanently!", { id: loadingToast });
      loadAccountDetails(issuerSecret);
    } catch (e: any) {
      toast.error(e.message || "Failed to lock supply", { id: loadingToast });
    } finally {
      setIsManaging(false);
    }
  };

  const handleToggleAuthFlags = async (flagName: 'authRequired' | 'authRevocable' | 'authClawbackEnabled', currentValue: boolean) => {
    setIsManaging(true);
    const loadingToast = toast.loading("Updating flags...");
    try {
      await setAuthFlags(issuerSecret, { [flagName]: !currentValue });
      toast.success("Flags updated!", { id: loadingToast });
      loadAccountDetails(issuerSecret);
    } catch (e: any) {
      toast.error(e.message || "Failed to update flags", { id: loadingToast });
    } finally {
      setIsManaging(false);
    }
  };

  if (issueSuccessInfo && activeTab === 'issue') {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-surface border border-border rounded-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Asset Issued!</h2>
        <p className="text-text-secondary mb-6">
          You successfully issued {issueSuccessInfo.supply} {issueSuccessInfo.code}.
        </p>
        
        <div className="bg-surface rounded-xl p-4 mb-4 text-sm text-left border border-border">
          <div className="text-text-secondary mb-1 font-medium">Issuer Public Key</div>
          <div className="break-all font-mono text-text-primary/80 select-all mb-4">{issueSuccessInfo.issuerPk}</div>
          
          <div className="flex items-center justify-between mb-1">
            <div className="text-amber-500 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Issuer Secret Key
            </div>
            <button 
              onClick={copySecret}
              className="text-text-secondary hover:text-white transition-colors flex items-center gap-1 text-xs bg-white/5 px-2 py-1 rounded"
            >
              {copiedKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copiedKey ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="break-all font-mono text-amber-500/90 select-all p-2 bg-amber-500/10 rounded">{issueSuccessInfo.issuerSecret}</div>
          <p className="mt-2 text-xs text-text-secondary/70">
            Copy and save this secret key. You need it to mint more supply, lock the token, or manage flags. We do not store this key.
          </p>
        </div>

        <div className="flex gap-4 mt-8">
          <button 
            onClick={() => setIssueSuccessInfo(null)}
            className="flex-1 bg-surface hover:bg-white/10 text-text-primary px-4 py-2 rounded-lg font-medium transition-colors border border-border"
          >
            Issue Another
          </button>
          <a 
            href={`https://stellar.expert/explorer/testnet/tx/${issueSuccessInfo.hash}`}
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
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-primary" />
          Asset Issuer
        </h1>
        <p className="text-text-secondary">Issue custom assets, manage the issuer/distributor pattern, and control supply.</p>
      </div>

      <div className="flex bg-surface border border-border rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveTab('issue')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'issue' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}
        >
          Issue New Asset
        </button>
        <button
          onClick={() => setActiveTab('manage')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'manage' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}
        >
          Manage Existing Asset
        </button>
      </div>

      <div className="relative">
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm relative z-10">
          
          {activeTab === 'issue' && (
            <form onSubmit={handleIssue} className="space-y-6">
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
                <label className="text-sm font-medium text-text-secondary">Initial Supply</label>
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
                  We will automatically create a new Issuer account, fund it, establish a trustline, and send the full supply to your connected wallet (the Distributor). You will receive the Issuer secret key to manage it later.
                </div>
              </div>

              <button 
                type="submit"
                disabled={isIssuing || !tokenCode || !totalSupply || !address}
                className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 flex justify-center mt-6"
              >
                {isIssuing ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : !address ? (
                  "Connect Wallet"
                ) : (
                  "Issue Asset"
                )}
              </button>
            </form>
          )}

          {activeTab === 'manage' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Issuer Secret Key
                </label>
                <input
                  type="password"
                  value={issuerSecret}
                  onChange={(e) => loadAccountDetails(e.target.value)}
                  placeholder="S..."
                  className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-white/20 transition-colors font-mono"
                />
              </div>

              {isLoadingAccount && (
                <div className="text-center text-text-secondary py-4">Loading account details...</div>
              )}

              {accountDetails && (
                <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                  
                  {/* Status Banner */}
                  {isLocked ? (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3 text-red-500">
                      <Lock className="w-5 h-5 shrink-0" />
                      <div>
                        <div className="font-bold">Supply is permanently locked</div>
                        <div className="text-sm opacity-80">Master weight is 0. You cannot mint more supply or modify flags.</div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3 text-green-500">
                      <Shield className="w-5 h-5 shrink-0" />
                      <div>
                        <div className="font-bold">Issuer is active</div>
                        <div className="text-sm opacity-80">You can mint more supply and manage authorization flags.</div>
                      </div>
                    </div>
                  )}

                  {/* Mint More Supply */}
                  {!isLocked && (
                    <div className="pt-6 border-t border-border">
                      <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                        <Coins className="w-5 h-5 text-primary" />
                        Mint Additional Supply
                      </h3>
                      <form onSubmit={handleMintMore} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Token Code</label>
                            <input
                              type="text"
                              value={manageTokenCode}
                              onChange={(e) => setManageTokenCode(e.target.value)}
                              placeholder="e.g. MYCOIN"
                              className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-text-primary font-mono text-sm"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Amount</label>
                            <input
                              type="number"
                              step="1"
                              value={manageAmount}
                              onChange={(e) => setManageAmount(e.target.value)}
                              placeholder="1000"
                              className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-text-primary font-mono text-sm"
                              required
                            />
                          </div>
                        </div>
                        <button 
                          type="submit"
                          disabled={isManaging || !manageTokenCode || !manageAmount || !address}
                          className="w-full bg-surface hover:bg-white/10 text-text-primary py-2 rounded-lg font-medium transition-colors border border-border flex justify-center disabled:opacity-50"
                        >
                          Mint to my Wallet
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Auth Flags */}
                  {!isLocked && (
                    <div className="pt-6 border-t border-border">
                      <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        Authorization Flags
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg">
                          <div>
                            <div className="font-medium text-text-primary">Auth Required</div>
                            <div className="text-xs text-text-secondary">Requires issuer approval before anyone can hold this token</div>
                          </div>
                          <button 
                            onClick={() => handleToggleAuthFlags('authRequired', accountDetails.flags.auth_required)}
                            disabled={isManaging}
                            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${accountDetails.flags.auth_required ? 'bg-green-500/20 text-green-500' : 'bg-surface border border-border text-text-secondary hover:text-white'}`}
                          >
                            {accountDetails.flags.auth_required ? 'ENABLED' : 'DISABLED'}
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg">
                          <div>
                            <div className="font-medium text-text-primary">Auth Revocable</div>
                            <div className="text-xs text-text-secondary">Allows issuer to freeze trustlines or revoke balances</div>
                          </div>
                          <button 
                            onClick={() => handleToggleAuthFlags('authRevocable', accountDetails.flags.auth_revocable)}
                            disabled={isManaging || accountDetails.flags.auth_immutable}
                            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${accountDetails.flags.auth_revocable ? 'bg-green-500/20 text-green-500' : 'bg-surface border border-border text-text-secondary hover:text-white'}`}
                          >
                            {accountDetails.flags.auth_revocable ? 'ENABLED' : 'DISABLED'}
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg">
                          <div>
                            <div className="font-medium text-text-primary">Auth Clawback Enabled</div>
                            <div className="text-xs text-text-secondary">Allows issuer to claw back tokens from holders</div>
                          </div>
                          <button 
                            onClick={() => handleToggleAuthFlags('authClawbackEnabled', accountDetails.flags.auth_clawback_enabled)}
                            disabled={isManaging || accountDetails.flags.auth_immutable}
                            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${accountDetails.flags.auth_clawback_enabled ? 'bg-green-500/20 text-green-500' : 'bg-surface border border-border text-text-secondary hover:text-white'}`}
                          >
                            {accountDetails.flags.auth_clawback_enabled ? 'ENABLED' : 'DISABLED'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lock Supply */}
                  {!isLocked && (
                    <div className="pt-6 border-t border-border">
                      <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                        <h3 className="text-lg font-bold text-red-500 mb-2 flex items-center gap-2">
                          <Lock className="w-5 h-5" />
                          Lock Supply Permanently
                        </h3>
                        <p className="text-sm text-text-secondary mb-4">
                          By setting the Master Weight to 0, you permanently burn the ability to sign any future transactions for this issuer account. You will never be able to mint more supply or modify flags.
                        </p>
                        <button 
                          onClick={handleLockSupply}
                          disabled={isManaging}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                        >
                          Lock Supply
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
