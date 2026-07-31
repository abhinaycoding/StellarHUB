import {
  isConnected,
  setAllowed,
  getAddress,
  getNetworkDetails,
  signTransaction
} from '@stellar/freighter-api';
import * as StellarSdk from '@stellar/stellar-sdk';

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const server = new StellarSdk.Horizon.Server(HORIZON_URL);

export const isValidAddress = (address: string): boolean => {
  return StellarSdk.StrKey.isValidEd25519PublicKey(address);
};

export const connectWallet = async (): Promise<string | null> => {
  try {
    const connectedRes = await isConnected();
    if (!connectedRes.isConnected) {
      throw new Error("Freighter is not installed or locked.");
    }
    
    const allowedRes = await setAllowed();
    if (allowedRes.error || !allowedRes.isAllowed) {
      throw new Error("Access to Freighter denied.");
    }

    const addressRes = await getAddress();
    if (addressRes.error || !addressRes.address) {
      throw new Error("Could not retrieve address from Freighter.");
    }
    
    const networkRes = await getNetworkDetails();
    if (networkRes.network !== "TESTNET") {
      throw new Error("Please switch your Freighter wallet to Testnet.");
    }
    
    return addressRes.address;
  } catch (error) {
    console.error("Wallet connection error:", error);
    throw error;
  }
};

export const disconnectWallet = async (): Promise<void> => {
  // Freighter doesn't have a direct disconnect method that clears permissions
};

export const getBalances = async (address: string): Promise<{ xlm: number, usdc: number }> => {
  try {
    const account = await server.loadAccount(address);
    const native = account.balances.find((b: any) => b.asset_type === 'native');
    const usdc = account.balances.find((b: any) => b.asset_code === 'USDC');
    return {
      xlm: native ? parseFloat(native.balance) : 0,
      usdc: usdc ? parseFloat(usdc.balance) : 0
    };
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return { xlm: 0, usdc: 0 };
    }
    throw error;
  }
};

export const addTrustline = async (address: string, assetCode: string, issuer: string): Promise<string> => {
  const account = await server.loadAccount(address);
  const fee = await server.fetchBaseFee();
  const asset = new StellarSdk.Asset(assetCode, issuer);

  const txBuilder = new StellarSdk.TransactionBuilder(account, { fee: fee.toString(), networkPassphrase: StellarSdk.Networks.TESTNET });
  txBuilder.addOperation(StellarSdk.Operation.changeTrust({ asset }));
  txBuilder.setTimeout(300);
  
  const transaction = txBuilder.build();
  const xdr = transaction.toXDR();
  const signedTxRes = await signTransaction(xdr, { network: "TESTNET", networkPassphrase: StellarSdk.Networks.TESTNET, address } as any);
  if (signedTxRes.error || !signedTxRes.signedTxXdr) throw new Error(signedTxRes.error?.toString() || "Signing failed");

  const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(signedTxRes.signedTxXdr, StellarSdk.Networks.TESTNET) as StellarSdk.Transaction;
  const response = await server.submitTransaction(signedTransaction);
  return response.hash;
};

export interface OptimalPath {
  path: StellarSdk.Asset[];
  destinationAmount: string;
  intermediateAssets: string[];
}

export const getOptimalPath = async (
  sellingAssetStr: 'XLM'|'USDC',
  buyingAssetStr: 'XLM'|'USDC',
  amount: string,
  issuer: string
): Promise<OptimalPath | null> => {
  const sellingAsset = sellingAssetStr === 'XLM' ? StellarSdk.Asset.native() : new StellarSdk.Asset('USDC', issuer);
  const buyingAsset = buyingAssetStr === 'XLM' ? StellarSdk.Asset.native() : new StellarSdk.Asset('USDC', issuer);
  const formattedAmount = parseFloat(amount).toFixed(7).replace(/\.?0+$/, '');

  try {
    const paths = await server.strictSendPaths(sellingAsset, formattedAmount, [buyingAsset]).call();
    
    if (paths.records.length === 0) return null;
    
    const bestRecord = paths.records.reduce((prev, current) => {
      return parseFloat(current.destination_amount) > parseFloat(prev.destination_amount) ? current : prev;
    });

    const pathArray = bestRecord.path.map((a: any) => {
      if (a.asset_type === 'native') return StellarSdk.Asset.native();
      return new StellarSdk.Asset(a.asset_code, a.asset_issuer);
    });

    const intermediateAssets = bestRecord.path.map((a: any) => a.asset_type === 'native' ? 'XLM' : a.asset_code);

    return {
      path: pathArray,
      destinationAmount: bestRecord.destination_amount,
      intermediateAssets
    };
  } catch (error) {
    console.error("Failed to find path:", error);
    return null;
  }
};

export const swapAssets = async (address: string, sellingAssetStr: 'XLM'|'USDC', buyingAssetStr: 'XLM'|'USDC', amount: string, issuer: string, path: StellarSdk.Asset[] = []): Promise<string> => {
  const account = await server.loadAccount(address);
  const fee = await server.fetchBaseFee();
  
  const sellingAsset = sellingAssetStr === 'XLM' ? StellarSdk.Asset.native() : new StellarSdk.Asset('USDC', issuer);
  const buyingAsset = buyingAssetStr === 'XLM' ? StellarSdk.Asset.native() : new StellarSdk.Asset('USDC', issuer);

  const txBuilder = new StellarSdk.TransactionBuilder(account, { fee: fee.toString(), networkPassphrase: StellarSdk.Networks.TESTNET });
  
  // Format amount to max 7 decimals to prevent StellarSdk errors
  const formattedAmount = parseFloat(amount).toFixed(7).replace(/\.?0+$/, '');
  
  // PathPaymentStrictSend: We send a specific amount of sellingAsset, and get back at least '0.0000001' of buyingAsset.
  // destMin must be strictly positive in Stellar SDK
  txBuilder.addOperation(StellarSdk.Operation.pathPaymentStrictSend({
    sendAsset: sellingAsset,
    sendAmount: formattedAmount,
    destination: address,
    destAsset: buyingAsset,
    destMin: "0.0000001", 
    path: path
  }));
  txBuilder.setTimeout(300);

  const transaction = txBuilder.build();
  const xdr = transaction.toXDR();
  const signedTxRes = await signTransaction(xdr, { network: "TESTNET", networkPassphrase: StellarSdk.Networks.TESTNET, address } as any);
  if (signedTxRes.error || !signedTxRes.signedTxXdr) throw new Error(signedTxRes.error?.toString() || "Signing failed");

  const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(signedTxRes.signedTxXdr, StellarSdk.Networks.TESTNET) as StellarSdk.Transaction;
  const response = await server.submitTransaction(signedTransaction);
  return response.hash;
};

export const sendPayment = async (
  senderAddress: string, 
  destination: string, 
  amount: string, 
  memo?: string
): Promise<string> => {
  try {
    const account = await server.loadAccount(senderAddress);
    const fee = await server.fetchBaseFee();

    const txBuilder = new StellarSdk.TransactionBuilder(account, {
      fee: fee.toString(),
      networkPassphrase: StellarSdk.Networks.TESTNET,
    });

    txBuilder.addOperation(
      StellarSdk.Operation.payment({
        destination,
        asset: StellarSdk.Asset.native(),
        amount: amount.toString(),
      })
    );

    if (memo) {
      txBuilder.addMemo(StellarSdk.Memo.text(memo));
    }

    txBuilder.setTimeout(300); // 5 minutes timeout
    const transaction = txBuilder.build();
    const xdr = transaction.toXDR();

    // Pass the raw XDR string to Freighter with explicit address and network
    const signedTxRes = await signTransaction(xdr, { 
      network: "TESTNET",
      networkPassphrase: StellarSdk.Networks.TESTNET,
      address: senderAddress
    } as any);

    if (signedTxRes.error || !signedTxRes.signedTxXdr) {
      throw new Error(signedTxRes.error?.toString() || "Transaction signing failed");
    }

    // Reconstruct and submit
    const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
      signedTxRes.signedTxXdr, 
      StellarSdk.Networks.TESTNET
    ) as StellarSdk.Transaction; // Using Transaction specifically to avoid FeeBumpTransaction issues in submit
    
    const response = await server.submitTransaction(signedTransaction);
    return response.hash;
  } catch (error: any) {
    console.error("Send payment error:", error);
    throw new Error(error?.response?.data?.extras?.result_codes?.transaction || error.message || "Payment failed");
  }
};

export interface ParsedTransaction {
  id: string;
  type: 'send' | 'receive';
  amount: string;
  address: string;
  date: string;
  status: string;
  hash: string;
}

export const getTransactions = async (address: string): Promise<ParsedTransaction[]> => {
  try {
    const response = await server.transactions().forAccount(address).order("desc").limit(20).call();
    const parsedTxs: ParsedTransaction[] = [];

    for (const record of response.records) {
      const ops = await record.operations();
      for (const op of ops.records) {
        if (op.type === 'payment' && op.asset_type === 'native') {
          const isReceive = op.to === address;
          
          parsedTxs.push({
            id: op.id,
            type: isReceive ? 'receive' : 'send',
            amount: `${isReceive ? '+' : '-'}${parseFloat(op.amount).toFixed(2)} XLM`,
            address: isReceive ? op.from : op.to,
            date: new Date(record.created_at).toLocaleString(),
            status: record.successful ? 'Completed' : 'Failed',
            hash: record.hash
          });
        }
      }
    }

    return parsedTxs;
  } catch (error: any) {
    if (error.response && error.response.status === 404) return [];
    console.error("Fetch transactions error:", error);
    throw error;
  }
};

export const fundTestnet = async (address: string): Promise<boolean> => {
  try {
    const res = await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(address)}`);
    if (!res.ok) {
      throw new Error("Friendbot failed to fund the account");
    }
    return true;
  } catch (error) {
    console.error("Fund testnet error:", error);
    throw error;
  }
};

export const depositLiquidity = async (address: string, maxAmountA: string, maxAmountB: string, issuer: string): Promise<string> => {
  const account = await server.loadAccount(address);
  const fee = await server.fetchBaseFee();
  
  const assetA = StellarSdk.Asset.native();
  const assetB = new StellarSdk.Asset('USDC', issuer);

  const txBuilder = new StellarSdk.TransactionBuilder(account, { fee: fee.toString(), networkPassphrase: StellarSdk.Networks.TESTNET });
  
  txBuilder.addOperation(StellarSdk.Operation.liquidityPoolDeposit({
    liquidityPoolId: StellarSdk.getLiquidityPoolId("constant_product", new StellarSdk.LiquidityPoolAsset(assetA, assetB, StellarSdk.LiquidityPoolFeeV18).getLiquidityPoolParameters()).toString("hex"),
    maxAmountA: parseFloat(maxAmountA).toFixed(7).replace(/\.?0+$/, ''),
    maxAmountB: parseFloat(maxAmountB).toFixed(7).replace(/\.?0+$/, ''),
    minPrice: "0",
    maxPrice: "1000",
  }));
  txBuilder.setTimeout(300);

  const transaction = txBuilder.build();
  const xdr = transaction.toXDR();
  const signedTxRes = await signTransaction(xdr, { network: "TESTNET", networkPassphrase: StellarSdk.Networks.TESTNET, address } as any);
  if (signedTxRes.error || !signedTxRes.signedTxXdr) throw new Error(signedTxRes.error?.toString() || "Signing failed");

  const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(signedTxRes.signedTxXdr, StellarSdk.Networks.TESTNET) as StellarSdk.Transaction;
  const response = await server.submitTransaction(signedTransaction);
  return response.hash;
};

export const withdrawLiquidity = async (address: string, amountShares: string, issuer: string): Promise<string> => {
  const account = await server.loadAccount(address);
  const fee = await server.fetchBaseFee();
  
  const assetA = StellarSdk.Asset.native();
  const assetB = new StellarSdk.Asset('USDC', issuer);

  const txBuilder = new StellarSdk.TransactionBuilder(account, { fee: fee.toString(), networkPassphrase: StellarSdk.Networks.TESTNET });
  
  txBuilder.addOperation(StellarSdk.Operation.liquidityPoolWithdraw({
    liquidityPoolId: StellarSdk.getLiquidityPoolId("constant_product", new StellarSdk.LiquidityPoolAsset(assetA, assetB, StellarSdk.LiquidityPoolFeeV18).getLiquidityPoolParameters()).toString("hex"),
    amount: parseFloat(amountShares).toFixed(7).replace(/\.?0+$/, ''),
    minAmountA: "0",
    minAmountB: "0"
  }));
  txBuilder.setTimeout(300);

  const transaction = txBuilder.build();
  const xdr = transaction.toXDR();
  const signedTxRes = await signTransaction(xdr, { network: "TESTNET", networkPassphrase: StellarSdk.Networks.TESTNET, address } as any);
  if (signedTxRes.error || !signedTxRes.signedTxXdr) throw new Error(signedTxRes.error?.toString() || "Signing failed");

  const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(signedTxRes.signedTxXdr, StellarSdk.Networks.TESTNET) as StellarSdk.Transaction;
  const response = await server.submitTransaction(signedTransaction);
  return response.hash;
};

export const sendPathPayment = async (
  senderAddress: string, 
  destination: string, 
  sendingAssetStr: 'XLM'|'USDC', 
  amount: string, 
  issuer: string,
  memo?: string
): Promise<string> => {
  const account = await server.loadAccount(senderAddress);
  const fee = await server.fetchBaseFee();
  
  const sendingAsset = sendingAssetStr === 'XLM' ? StellarSdk.Asset.native() : new StellarSdk.Asset('USDC', issuer);
  const receivingAsset = sendingAssetStr === 'XLM' ? new StellarSdk.Asset('USDC', issuer) : StellarSdk.Asset.native();

  const txBuilder = new StellarSdk.TransactionBuilder(account, { fee: fee.toString(), networkPassphrase: StellarSdk.Networks.TESTNET });
  
  const formattedAmount = parseFloat(amount).toFixed(7).replace(/\.?0+$/, '');
  
  txBuilder.addOperation(StellarSdk.Operation.pathPaymentStrictSend({
    sendAsset: sendingAsset,
    sendAmount: formattedAmount,
    destination: destination,
    destAsset: receivingAsset,
    destMin: "0.0000001", 
    path: []
  }));
  
  if (memo) {
    txBuilder.addMemo(StellarSdk.Memo.text(memo));
  }
  txBuilder.setTimeout(300);

  const transaction = txBuilder.build();
  const xdr = transaction.toXDR();
  const signedTxRes = await signTransaction(xdr, { network: "TESTNET", networkPassphrase: StellarSdk.Networks.TESTNET, address: senderAddress } as any);
  if (signedTxRes.error || !signedTxRes.signedTxXdr) throw new Error(signedTxRes.error?.toString() || "Signing failed");

  const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(signedTxRes.signedTxXdr, StellarSdk.Networks.TESTNET) as StellarSdk.Transaction;
  const response = await server.submitTransaction(signedTransaction);
  return response.hash;
};

export const mintToken = async (
  distributorAddress: string,
  tokenCode: string,
  totalSupply: string
): Promise<{ hash: string, issuerPk: string }> => {
  // Create ephemeral issuer
  const issuerKeypair = StellarSdk.Keypair.random();
  
  // Fund issuer with 1.5 XLM from friendbot (testnet)
  await fundTestnet(issuerKeypair.publicKey());
  
  // Set up trustline from distributor to issuer
  await addTrustline(distributorAddress, tokenCode, issuerKeypair.publicKey());
  
  // Send tokens from issuer to distributor
  const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());
  const fee = await server.fetchBaseFee();
  
  const txBuilder = new StellarSdk.TransactionBuilder(issuerAccount, { fee: fee.toString(), networkPassphrase: StellarSdk.Networks.TESTNET });
  txBuilder.addOperation(StellarSdk.Operation.payment({
    destination: distributorAddress,
    asset: new StellarSdk.Asset(tokenCode, issuerKeypair.publicKey()),
    amount: totalSupply.toString(),
  }));
  txBuilder.setTimeout(300);
  
  const transaction = txBuilder.build();
  transaction.sign(issuerKeypair);
  
  const response = await server.submitTransaction(transaction);
  return { hash: response.hash, issuerPk: issuerKeypair.publicKey() };
};

export const streamNetworkOperations = (
  onMessage: (op: any) => void,
  onError: (err: any) => void
): (() => void) => {
  const closeStream = server.operations()
    .cursor('now')
    .stream({
      onmessage: onMessage,
      onerror: onError
    });
  
  return closeStream;
};

export const getFeeStats = async (): Promise<any> => {
  try {
    const feeStats = await server.feeStats();
    return feeStats;
  } catch (error) {
    console.error("Fetch fee stats error:", error);
    throw error;
  }
};

export const getLatestLedgers = async (limit: number = 10): Promise<StellarSdk.Horizon.ServerApi.LedgerRecord[]> => {
  try {
    const response = await server.ledgers().order("desc").limit(limit).call();
    return response.records;
  } catch (error) {
    console.error("Fetch ledgers error:", error);
    throw error;
  }
};

export const streamLedgers = (
  onMessage: (ledger: StellarSdk.Horizon.ServerApi.LedgerRecord) => void,
  onError: (err: any) => void
): (() => void) => {
  const closeStream = server.ledgers()
    .cursor('now')
    .stream({
      onmessage: onMessage,
      onerror: onError
    });
  
  return closeStream;
};
