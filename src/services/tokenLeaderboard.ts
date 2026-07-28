import { getNetworkDetails, signTransaction } from '@stellar/freighter-api';
import * as StellarSdk from '@stellar/stellar-sdk';
import type { Holder } from '../types/leaderboard';
import { ErrorCode, StellarError } from '../utils/stellarErrors';

const RPC_URL = import.meta.env.VITE_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = import.meta.env.VITE_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015";
const LEADERBOARD_CONTRACT_ID = import.meta.env.VITE_LEADERBOARD_CONTRACT_ID;

const rpcServer = new StellarSdk.rpc.Server(RPC_URL);

export const isValidContractAddress = (address: string): boolean => {
  return address.startsWith('C') && address.length === 56;
};

// --- Mock Data Generators (for UI development before contract deployment) ---
// If the contract is not configured, we'll return demo data as specified in requirements.
const isDemoMode = !LEADERBOARD_CONTRACT_ID;

const generateDemoHolders = (): Holder[] => {
  return [
    { address: 'GABC...8K2P', balance: 25000, ownershipPercentage: 42.8, rank: 1, lastActivity: new Date(Date.now() - 120000).toISOString() },
    { address: 'GDEF...1M9Q', balance: 18500, ownershipPercentage: 31.6, rank: 2, lastActivity: new Date(Date.now() - 300000).toISOString() },
    { address: 'GHJK...7R4X', balance: 10200, ownershipPercentage: 17.4, rank: 3, lastActivity: new Date(Date.now() - 720000).toISOString() },
    { address: 'GXYZ...4L8M', balance: 1200, ownershipPercentage: 2.1, rank: 4, lastActivity: new Date(Date.now() - 3600000).toISOString() },
  ];
};

export const getLeaderboard = async (contractId: string, _limit: number = 10): Promise<Holder[]> => {
  if (!isValidContractAddress(contractId)) {
    throw new StellarError(ErrorCode.INVALID_CONTRACT, "Enter a valid Stellar Soroban contract ID.");
  }
  
  if (isDemoMode) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return generateDemoHolders();
  }

  try {
    // const contract = new StellarSdk.Contract(contractId);
    
    // In a real application, you would invoke the `get_leaderboard` view function here using rpcServer.simulateTransaction
    // Since get_leaderboard in the contract returns a complex Vec<Holder>, parsing it requires scvalToNative.
    
    // For this demonstration, we'll return the demo data even if a contract ID is provided
    // but in a real scenario we'd do:
    // const tx = new StellarSdk.TransactionBuilder(...)
    //   .addOperation(contract.call("get_leaderboard", StellarSdk.nativeToScVal(limit, {type: 'u32'})))
    //   .build();
    // const response = await rpcServer.simulateTransaction(tx);
    // ... parse response
    
    return generateDemoHolders();
  } catch (error) {
    throw new StellarError(ErrorCode.CONTRACT_CALL_FAILED, "Failed to fetch leaderboard data.", error?.toString());
  }
};

export const getHolderRank = async (_contractId: string, address: string): Promise<number> => {
  if (isDemoMode) {
    const demoHolders = generateDemoHolders();
    const holder = demoHolders.find(h => h.address === address);
    return holder ? holder.rank : 0;
  }
  return 0; // fallback
};

export const getHolderBalance = async (_contractId: string, address: string): Promise<number> => {
  if (isDemoMode) {
    const demoHolders = generateDemoHolders();
    const holder = demoHolders.find(h => h.address === address);
    return holder ? holder.balance : 0;
  }
  return 0; // fallback
};

export const getTokenHoldersCount = async (_contractId: string): Promise<number> => {
  if (isDemoMode) {
    return 1248;
  }
  return 0;
};

export const callLeaderboardContract = async (
  address: string,
  method: string,
  args: any[]
): Promise<string> => {
  if (!LEADERBOARD_CONTRACT_ID) {
    throw new StellarError(ErrorCode.INVALID_CONTRACT, "Leaderboard contract is not deployed yet.");
  }

  const networkRes = await getNetworkDetails();
  if (networkRes.network !== "TESTNET") {
    throw new StellarError(ErrorCode.WALLET_NOT_CONNECTED, "Please switch your Freighter wallet to Testnet.");
  }

  try {
    const account = await rpcServer.getAccount(address);
    const contract = new StellarSdk.Contract(LEADERBOARD_CONTRACT_ID);
    
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: "1000",
      networkPassphrase: NETWORK_PASSPHRASE
    })
    .addOperation(contract.call(method, ...args))
    .setTimeout(300)
    .build();

    const preparedTx = await rpcServer.prepareTransaction(tx);
    
    const signedTxRes = await signTransaction(preparedTx.toXDR(), { network: "TESTNET", address } as any);
    if (signedTxRes.error || !signedTxRes.signedTxXdr) {
      throw new Error("Transaction signing failed");
    }

    const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedTxRes.signedTxXdr, NETWORK_PASSPHRASE) as StellarSdk.Transaction;
    const response = await rpcServer.sendTransaction(signedTx);
    
    if (response.status === "PENDING") {
      let txStatus = await rpcServer.getTransaction(response.hash);
      // Simple polling for demo
      while (txStatus.status === "NOT_FOUND") {
        await new Promise(resolve => setTimeout(resolve, 2000));
        txStatus = await rpcServer.getTransaction(response.hash);
      }
      
      if (txStatus.status === "SUCCESS") {
        return response.hash;
      } else {
        throw new Error("Transaction failed on chain");
      }
    }
    
    throw new Error("Transaction failed to submit");
    
  } catch (error) {
    console.error("Contract call error:", error);
    throw error;
  }
};

export const subscribeToTokenEvents = (
  _contractId: string,
  onEvent: (event: any) => void,
  _onError: (error: any) => void
): (() => void) => {
  // Stellar SDK rpc.Server doesn't have a direct event subscription yet.
  // We'll simulate live events for the UI.
  let isSubscribed = true;
  
  const emitMockEvent = () => {
    if (!isSubscribed) return;
    
    const demoHolders = generateDemoHolders();
    const randomHolder = demoHolders[Math.floor(Math.random() * demoHolders.length)];
    const amountChange = Math.floor(Math.random() * 1000) - 200; // random change
    
    onEvent({
      id: Math.random().toString(36).substring(7),
      type: 'holder_updated',
      address: randomHolder.address,
      amountChange,
      timestamp: new Date().toISOString()
    });
    
    // Schedule next event
    setTimeout(emitMockEvent, Math.random() * 8000 + 4000);
  };
  
  // Start emitting after a delay
  setTimeout(emitMockEvent, 5000);
  
  return () => {
    isSubscribed = false;
  };
};
