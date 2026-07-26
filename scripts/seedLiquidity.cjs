const StellarSdk = require('@stellar/stellar-sdk');

// We can just use standard fetch which is available in Node 18+ globally

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const server = new StellarSdk.Horizon.Server(HORIZON_URL);
const networkPassphrase = StellarSdk.Networks.TESTNET;

async function fundWithFriendbot(publicKey) {
  console.log(`Funding ${publicKey} via Friendbot...`);
  const res = await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(publicKey)}`);
  if (!res.ok) throw new Error("Friendbot failed");
}

async function main() {
  try {
    const issuer = StellarSdk.Keypair.random();
    const seller = StellarSdk.Keypair.random(); // Sells USDC for XLM
    const buyer = StellarSdk.Keypair.random();  // Sells XLM for USDC

    console.log("Issuer:", issuer.publicKey());
    console.log("Seller:", seller.publicKey());
    console.log("Buyer:", buyer.publicKey());

    await fundWithFriendbot(issuer.publicKey());
    await fundWithFriendbot(seller.publicKey());
    await fundWithFriendbot(buyer.publicKey());

    const usdc = new StellarSdk.Asset("USDC", issuer.publicKey());

    // 1. Establish Trustlines
    let tx = new StellarSdk.TransactionBuilder(await server.loadAccount(seller.publicKey()), { fee: await server.fetchBaseFee(), networkPassphrase })
      .addOperation(StellarSdk.Operation.changeTrust({ asset: usdc }))
      .setTimeout(100).build();
    tx.sign(seller);
    await server.submitTransaction(tx);
    
    tx = new StellarSdk.TransactionBuilder(await server.loadAccount(buyer.publicKey()), { fee: await server.fetchBaseFee(), networkPassphrase })
      .addOperation(StellarSdk.Operation.changeTrust({ asset: usdc }))
      .setTimeout(100).build();
    tx.sign(buyer);
    await server.submitTransaction(tx);
    console.log("Trustlines established.");

    // 2. Issuer sends USDC
    tx = new StellarSdk.TransactionBuilder(await server.loadAccount(issuer.publicKey()), { fee: await server.fetchBaseFee(), networkPassphrase })
      .addOperation(StellarSdk.Operation.payment({ destination: seller.publicKey(), asset: usdc, amount: "1000000" }))
      .addOperation(StellarSdk.Operation.payment({ destination: buyer.publicKey(), asset: usdc, amount: "1000000" }))
      .setTimeout(100).build();
    tx.sign(issuer);
    await server.submitTransaction(tx);
    console.log("USDC minted.");

    // 3. Create Liquidity via separate DEX limit orders
    // Seller: Sell USDC for XLM (price 1.0)
    tx = new StellarSdk.TransactionBuilder(await server.loadAccount(seller.publicKey()), { fee: await server.fetchBaseFee(), networkPassphrase })
      .addOperation(StellarSdk.Operation.manageSellOffer({
        selling: usdc, buying: StellarSdk.Asset.native(), amount: "10000", price: "1.0"
      }))
      .setTimeout(100).build();
    tx.sign(seller);
    await server.submitTransaction(tx);

    // Buyer: Sell XLM for USDC (price 1.0)
    tx = new StellarSdk.TransactionBuilder(await server.loadAccount(buyer.publicKey()), { fee: await server.fetchBaseFee(), networkPassphrase })
      .addOperation(StellarSdk.Operation.manageSellOffer({
        selling: StellarSdk.Asset.native(), buying: usdc, amount: "5000", price: "1.0"
      }))
      .setTimeout(100).build();
    tx.sign(buyer);
    await server.submitTransaction(tx);
    
    console.log("DEX liquidity seeded successfully!");
    console.log("====================================");
    console.log("Use this Issuer Public Key in your dApp:");
    console.log(issuer.publicKey());

  } catch (error) {
    console.error("Script failed:", error.response?.data?.extras?.result_codes || error);
  }
}

main();
