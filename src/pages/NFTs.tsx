import { useState, useEffect } from "react";
import { Image as ImageIcon, Plus, ExternalLink, RefreshCw } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { getUserNFTs, mintNFT, type NFTData } from "@/services/stellar";
import toast from "react-hot-toast";

export function NFTs() {
  const { address } = useWallet();
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMinting, setIsMinting] = useState(false);
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  
  const [mintForm, setMintForm] = useState({
    assetCode: "",
    imageUrl: ""
  });

  const fetchNFTs = async () => {
    if (!address) {
      setNfts([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const data = await getUserNFTs(address);
      setNfts(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load NFTs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNFTs();
  }, [address]);

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    if (!mintForm.assetCode.trim() || !mintForm.imageUrl.trim()) return;
    
    setIsMinting(true);
    const loadingToast = toast.loading("Minting NFT (this involves 3 operations)...");
    
    try {
      await mintNFT(address, mintForm.assetCode.trim().toUpperCase(), mintForm.imageUrl.trim());
      toast.success("NFT minted successfully!", { id: loadingToast });
      setIsMintModalOpen(false);
      setMintForm({ assetCode: "", imageUrl: "" });
      fetchNFTs(); // Refresh gallery
    } catch (error: any) {
      toast.error(error.message || "Failed to mint NFT", { id: loadingToast });
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <ImageIcon className="w-8 h-8 text-primary" />
            NFT Gallery
          </h1>
          <p className="text-text-secondary mt-1">View and mint your Non-Fungible Tokens on Stellar.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchNFTs}
            className="p-2 bg-surface hover:bg-white/10 text-text-secondary hover:text-text-primary rounded-lg border border-border transition-colors"
            title="Refresh Gallery"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsMintModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Mint NFT
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-xl overflow-hidden animate-pulse">
              <div className="w-full aspect-square bg-white/5" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-white/10 rounded w-1/2" />
                <div className="h-3 bg-white/5 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : nfts.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <ImageIcon className="w-16 h-16 text-text-secondary/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-text-primary mb-2">No NFTs found</h3>
          <p className="text-text-secondary mb-6 max-w-md mx-auto">
            You don't have any NFTs in your connected wallet. Mint your first one to get started!
          </p>
          <button
            onClick={() => setIsMintModalOpen(true)}
            className="bg-surface hover:bg-white/10 border border-border text-text-primary px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Open Minter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {nfts.map((nft) => (
            <div key={nft.issuer} className="bg-surface border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors group">
              <div className="w-full aspect-square relative bg-background overflow-hidden flex items-center justify-center">
                <img 
                  src={nft.imageUrl} 
                  alt={nft.assetCode} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400.png?text=Image+Not+Found';
                  }}
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg text-text-primary mb-1 truncate" title={nft.assetCode}>
                  {nft.assetCode}
                </h3>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-text-secondary font-mono truncate mr-2">
                    Issuer: {nft.issuer.substring(0, 6)}...{nft.issuer.substring(nft.issuer.length - 4)}
                  </span>
                  <a 
                    href={`https://stellar.expert/explorer/testnet/asset/${nft.assetCode}-${nft.issuer}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:text-primary/80"
                    title="View on Stellar Expert"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isMintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Mint New NFT
              </h2>
              
              <form onSubmit={handleMint} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Asset Code (Name)</label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={mintForm.assetCode}
                    onChange={(e) => setMintForm({ ...mintForm, assetCode: e.target.value })}
                    placeholder="e.g. MYART"
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-white/20 transition-colors uppercase"
                  />
                  <p className="text-xs text-text-secondary/70">1-12 alphanumeric characters.</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Image URL</label>
                  <input
                    type="url"
                    required
                    value={mintForm.imageUrl}
                    onChange={(e) => setMintForm({ ...mintForm, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.png"
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-white/20 transition-colors"
                  />
                  <p className="text-xs text-text-secondary/70">Direct link to the image (HTTP or IPFS gateway).</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsMintModalOpen(false)}
                    disabled={isMinting}
                    className="flex-1 px-4 py-2 rounded-lg font-medium bg-background hover:bg-white/5 text-text-primary border border-border transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isMinting || !address}
                    className="flex-1 px-4 py-2 rounded-lg font-medium bg-primary hover:bg-primary/90 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isMinting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Mint NFT"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
