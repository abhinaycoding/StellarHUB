# Stellar Tip Splitter 🪐

A testnet dApp that takes one payment and forks it across multiple Stellar
addresses in a single transaction — like splitting a dinner bill or tipping
a group, settled on-chain in one shot.

Built for **Level 1 — White Belt** of Stellar Journey to Mastery.

![status](https://img.shields.io/badge/network-Stellar%20Testnet-4F9DFF)
![status](https://img.shields.io/badge/wallet-Freighter-FFB100)

---

## ✨ What it does

- Connects to the **Freighter** wallet (Stellar Testnet only)
- Fetches and displays the connected wallet's **XLM balance**
- Lets you add any number of recipients with individual amounts
- Builds **one Stellar transaction with multiple payment operations**
  and submits it after the user signs it in Freighter
- Shows clear **success / failure feedback**, including the **transaction
  hash** and a link to view it on Stellar Expert
- One-click **Friendbot funding** for brand-new, empty testnet accounts

## 🧱 Tech stack

- [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [`@stellar/stellar-sdk`](https://www.npmjs.com/package/@stellar/stellar-sdk) — building & submitting transactions
- [`@stellar/freighter-api`](https://www.npmjs.com/package/@stellar/freighter-api) — talking to the Freighter wallet extension

## 🚀 Setup instructions (run locally)

### 1. Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [Freighter wallet](https://www.freighter.app/) installed as a browser extension
- Freighter set to **Testnet** (open the Freighter extension → network
  switcher in the top right → choose **Testnet**)

### 2. Clone and install

```bash
git clone https://github.com/<your-username>/stellar-tip-splitter.git
cd stellar-tip-splitter
npm install
```

### 3. Run the dev server

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`) in your browser.

### 4. Fund your testnet wallet

If your Freighter testnet account has 0 XLM, click **"Fund via Friendbot"**
in the app after connecting — it requests free testnet XLM automatically.
You can also do this manually at the
[Friendbot endpoint](https://friendbot.stellar.org) or via the
[Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test).

### 5. Try a split payment

1. Click **Connect Freighter** and approve the connection.
2. Enter one or more recipient addresses (testnet `G...` addresses) and
   an XLM amount for each.
3. Click **Send split payment**.
4. Approve the transaction in the Freighter popup.
5. Watch the result panel for the success state and transaction hash.

## 📂 Project structure

```
src/
  lib/stellar.js         # All wallet + Horizon/Stellar SDK logic
  components/
    WalletPanel.jsx      # Connect / disconnect / balance display
    RecipientRow.jsx     # Single recipient input row
    SplitBeam.jsx        # Signature "split" visual
    TxResult.jsx         # Success / failure / pending transaction feedback
  App.jsx                # Wires everything together
```

## 🖼️ Screenshots

> Replace these placeholders with your own screenshots before submitting.

**Wallet connected state**

`screenshots/wallet-connected.png`

**Balance displayed**

`screenshots/balance-displayed.png`

**Successful testnet transaction**

`screenshots/transaction-success.png`

**Transaction result shown to user**

`screenshots/transaction-result.png`

## ⚠️ Notes

- This app runs exclusively on **Stellar Testnet**. It will not work with
  mainnet funds, and Freighter must be switched to Testnet mode.
- Freighter has no programmatic "disconnect" call — disconnecting in this
  app clears local app state. To fully revoke site access, do so from
  inside the Freighter extension's connected-sites settings.

## 📄 License

MIT
