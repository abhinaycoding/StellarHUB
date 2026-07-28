import { Copy, ExternalLink, AlertTriangle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import type { TransactionState } from '../../types/leaderboard';
import { useState } from 'react';

interface TransactionStatusProps {
  state: TransactionState;
  hash?: string;
  error?: string;
  onRetry?: () => void;
}

export function TransactionStatus({ state, hash, error, onRetry }: TransactionStatusProps) {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const copyHash = () => {
    if (hash) {
      navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (state === 'READY') {
    return null;
  }

  return (
    <div className={`p-4 border font-mono text-sm ${
      state === 'FAILED' ? 'border-error bg-error/5 text-error' :
      state === 'SUCCESS' ? 'border-success bg-success/5 text-success' :
      'border-primary bg-primary/5 text-primary'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-xs">
          {state === 'FAILED' ? <AlertTriangle className="w-4 h-4" /> :
           state === 'SUCCESS' ? <CheckCircle2 className="w-4 h-4" /> :
           <Loader2 className="w-4 h-4 animate-spin" />}
          STATUS: {state.replace(/_/g, ' ')}
        </div>
      </div>

      {error && (
        <div className="mt-2 text-text-primary">
          <div className="mb-2">{error.split('\n')[0]}</div>
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs font-bold uppercase tracking-widest text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1"
          >
            {showDetails ? 'Hide Technical Details' : 'View Technical Details'} <ArrowRight className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
          </button>
          
          {showDetails && (
            <div className="mt-2 p-2 bg-background border border-border/50 text-[10px] text-text-secondary overflow-x-auto whitespace-pre">
              {error}
            </div>
          )}
          
          {onRetry && (
            <button 
              onClick={onRetry}
              className="mt-3 bg-error text-background px-4 py-1.5 text-xs font-bold hover:bg-error/90 transition-colors"
            >
              RETRY TRANSACTION
            </button>
          )}
        </div>
      )}

      {hash && (
        <div className="mt-4 pt-4 border-t border-current/20">
          <div className="text-[10px] uppercase tracking-widest mb-1 opacity-80">Transaction Hash</div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="truncate flex-1 text-text-primary">{hash}</span>
            <div className="flex items-center gap-3">
              <button 
                onClick={copyHash}
                className="flex items-center gap-1 hover:opacity-80 transition-opacity"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'COPIED' : 'COPY'}
              </button>
              <a 
                href={`https://stellar.expert/explorer/testnet/tx/${hash}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1 hover:opacity-80 transition-opacity"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                EXPLORER
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
