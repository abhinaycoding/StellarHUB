export interface Holder {
  address: string;
  balance: number;
  ownershipPercentage: number;
  lastActivity: string;
  rank: number;
}

export interface WatchlistWallet {
  address: string;
  label: string;
}

export interface LeaderboardMetrics {
  totalHolders: number;
  totalSupply: number;
  top10Ownership: number;
  liveEventsStatus: 'CONNECTED' | 'RECONNECTING' | 'OFFLINE' | 'CONNECTING';
}

export interface ContractEvent {
  id: string;
  type: string;
  address: string;
  amountChange: number;
  timestamp: string;
}

export type TransactionState = 
  | 'READY'
  | 'AWAITING_WALLET_APPROVAL'
  | 'SIGNING'
  | 'SUBMITTED'
  | 'CONFIRMING'
  | 'SUCCESS'
  | 'FAILED';
