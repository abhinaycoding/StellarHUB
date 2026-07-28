export const ErrorCode = {
  WALLET_NOT_CONNECTED: 'WALLET_NOT_CONNECTED',
  INVALID_CONTRACT: 'INVALID_CONTRACT',
  CONTRACT_CALL_FAILED: 'CONTRACT_CALL_FAILED',
  USER_REJECTED: 'USER_REJECTED',
  INSUFFICIENT_FEE: 'INSUFFICIENT_FEE',
  RPC_UNAVAILABLE: 'RPC_UNAVAILABLE',
  EVENT_STREAM_DISCONNECTED: 'EVENT_STREAM_DISCONNECTED',
  TX_TIMEOUT: 'TX_TIMEOUT',
  DATA_UNAVAILABLE: 'DATA_UNAVAILABLE',
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];

export class StellarError extends Error {
  public code: ErrorCode;
  public details?: string;

  constructor(code: ErrorCode, message: string, details?: string) {
    super(message);
    this.name = 'StellarError';
    this.code = code;
    this.details = details;
  }
}

export const parseStellarError = (error: any): StellarError => {
  if (error instanceof StellarError) {
    return error;
  }

  const errorString = error?.toString() || '';
  const errorMessage = error?.message || '';
  
  if (errorString.includes('User declined') || errorString.includes('rejected')) {
    return new StellarError(
      ErrorCode.USER_REJECTED,
      'Transaction was rejected by the wallet.',
      errorString
    );
  }
  
  if (errorString.includes('freighter') && errorString.includes('not installed')) {
    return new StellarError(
      ErrorCode.WALLET_NOT_CONNECTED,
      'Connect Freighter before calling the contract.',
      errorString
    );
  }
  
  if (errorString.includes('op_underfunded') || errorString.includes('tx_insufficient_fee')) {
    return new StellarError(
      ErrorCode.INSUFFICIENT_FEE,
      'Insufficient XLM for transaction fees.',
      errorString
    );
  }

  if (errorMessage.includes('timeout') || errorString.includes('timeout')) {
    return new StellarError(
      ErrorCode.TX_TIMEOUT,
      'The transaction timed out while confirming.',
      errorString
    );
  }

  if (errorString.includes('fetch') || errorString.includes('Failed to fetch')) {
    return new StellarError(
      ErrorCode.RPC_UNAVAILABLE,
      'Could not connect to the Soroban RPC network.',
      errorString
    );
  }

  return new StellarError(
    ErrorCode.UNKNOWN_ERROR,
    'An unexpected error occurred.',
    errorString
  );
};
