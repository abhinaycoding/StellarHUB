import { useState } from 'react';
import { Copy, ExternalLink, CheckCircle2 } from 'lucide-react';
import { isValidContractAddress } from '../../services/tokenLeaderboard';

interface TokenSelectorProps {
  contractId: string;
  setContractId: (id: string) => void;
}

const PREDEFINED_TOKENS = [
  { id: import.meta.env.VITE_TOKEN_CONTRACT_ID || 'CABC1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEF', symbol: 'SHUB', name: 'STELLARHUB TOKEN' },
  { id: 'CDEF1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEF', symbol: 'DEMO', name: 'DEMO TOKEN' }
];

export function TokenSelector({ contractId, setContractId }: TokenSelectorProps) {
  const [customAddress, setCustomAddress] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidContractAddress(customAddress)) {
      setContractId(customAddress);
      setError('');
    } else {
      setError('Invalid Soroban contract ID (must start with C and be 56 chars)');
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(contractId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentToken = PREDEFINED_TOKENS.find(t => t.id === contractId);

  return (
    <div className="bg-surface border border-border p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="flex-1">
          <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">Selected Token</div>
          
          {isCustomMode ? (
            <form onSubmit={handleCustomSubmit} className="flex gap-2">
              <input 
                type="text" 
                value={customAddress}
                onChange={e => setCustomAddress(e.target.value)}
                placeholder="Enter custom contract address starting with C..."
                className="flex-1 bg-background border border-border px-3 py-1.5 text-sm font-mono text-text-primary focus:border-primary outline-none"
              />
              <button type="submit" className="bg-primary text-background px-4 py-1.5 text-sm font-bold hover:bg-primary/90 transition-colors">
                LOAD
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-xl font-bold text-text-primary">
                {currentToken?.name || 'CUSTOM TOKEN'}
              </div>
              <div className="bg-background border border-border px-2 py-0.5 text-xs font-mono text-primary font-bold">
                {currentToken?.symbol || 'CUST'}
              </div>
            </div>
          )}
          {error && <div className="text-error text-xs mt-1">{error}</div>}
        </div>

        <div className="flex flex-col items-start md:items-end gap-2">
          <div className="flex gap-2">
            <button 
              onClick={() => setIsCustomMode(false)} 
              className={`text-xs font-bold px-3 py-1 border transition-colors ${!isCustomMode ? 'border-primary text-primary bg-primary/10' : 'border-border text-text-secondary hover:text-text-primary'}`}
            >
              PREDEFINED
            </button>
            <button 
              onClick={() => setIsCustomMode(true)} 
              className={`text-xs font-bold px-3 py-1 border transition-colors ${isCustomMode ? 'border-primary text-primary bg-primary/10' : 'border-border text-text-secondary hover:text-text-primary'}`}
            >
              CUSTOM
            </button>
          </div>
          
          {!isCustomMode && (
            <div className="flex gap-2 mt-2">
              {PREDEFINED_TOKENS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setContractId(t.id)}
                  className={`text-xs px-2 py-1 font-mono transition-colors border ${contractId === t.id ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:bg-background'}`}
                >
                  {t.symbol}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs font-mono text-text-secondary">
        <div className="flex items-center gap-2">
          <span>Contract:</span>
          <span className="text-text-primary">{contractId.substring(0, 4)}...{contractId.substring(contractId.length - 4)}</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={copyAddress} className="flex items-center gap-1 hover:text-text-primary transition-colors">
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'COPIED' : 'COPY'}
          </button>
          <a 
            href={`https://stellar.expert/explorer/testnet/contract/${contractId}`} 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-1 hover:text-text-primary transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            EXPLORER
          </a>
        </div>
      </div>
    </div>
  );
}
