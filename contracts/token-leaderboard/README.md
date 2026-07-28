# Token Leaderboard Soroban Contract

This is a Soroban smart contract written in Rust for tracking token balances and providing an on-chain leaderboard. It emits events whenever a holder's balance is updated, which allows frontends to subscribe to real-time changes.

## Build

To build the contract, run:

```bash
cargo build --target wasm32-unknown-unknown --release
```

## Deploy to Testnet

To deploy the contract to the Stellar Testnet:

1. Make sure you have the Stellar CLI installed and configured.
2. Deploy the built wasm file:

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/token_leaderboard.wasm \
  --source <your-testnet-account> \
  --network testnet
```

3. Save the returned Contract ID to your frontend `.env` file as `VITE_LEADERBOARD_CONTRACT_ID`.

## Interacting with the Contract

You can invoke the `record_holder` or `update_holder` methods using the Stellar CLI or via the StellarHub frontend.

Example:
```bash
stellar contract invoke \
  --id <contract-id> \
  --source <your-testnet-account> \
  --network testnet \
  -- \
  update_holder \
  --address <holder-address> \
  --balance 1000
```
