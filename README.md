# StellarHUB

![StellarHUB Banner](https://img.shields.io/badge/Stellar-Network-black?style=for-the-badge&logo=stellar)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)

**StellarHUB** is a premium, decentralized web application (dApp) built on the Stellar Testnet. It provides a sleek, modern, and highly intuitive interface for interacting with the Stellar blockchain, sending assets, managing multi-asset portfolios, and natively swapping tokens via the built-in Decentralized Exchange (DEX).

## ✨ Features

- 💼 **Multi-Asset Dashboard**: A unified portfolio view that tracks both Native XLM and custom assets (like USDC stablecoins) in real-time.
- 💸 **Send & Receive Payments**: Seamlessly transfer funds to any Stellar address. Includes a built-in dynamic QR code generator for easy wallet addressing.
- 🔄 **Decentralized Swap (AMM)**: A Uniswap-inspired, sleek interface to instantly swap between XLM and USDC. It leverages Stellar's native `PathPaymentStrictSend` operations and automatically manages trustlines.
- 📜 **Live Transaction Tracking**: Real-time polling and historical view of your wallet's on-chain activity.
- 🔐 **Freighter Wallet Integration**: Secure, non-custodial login using the official Stellar Freighter browser extension.
- 🎨 **Premium UI/UX**: Designed with TailwindCSS, Framer Motion, and Lucide icons for a buttery-smooth dark-mode aesthetic.

## 🛠 Tech Stack

- **Frontend Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [TailwindCSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Blockchain SDK**: [Stellar JS SDK](https://stellar.github.io/js-stellar-sdk/) & [@stellar/freighter-api](https://docs.freighter.app/)

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- [Freighter Wallet Extension](https://www.freighter.app/) installed in your browser.

### 1. Clone & Install
```bash
git clone https://github.com/abhinaycoding/StellarHUB.git
cd StellarHUB
npm install
```

### 2. Seed Testnet Liquidity (Required for Swaps)
Since this dApp runs on the Stellar Testnet, custom assets like USDC don't naturally have liquidity. We've included a script that generates a mock USDC asset and injects $10,000 of liquidity into the DEX so your swaps will always succeed.

```bash
node scripts/seedLiquidity.cjs
```
*Note: Once the script finishes, it will print an `Issuer Public Key`. If it differs from the one in `src/pages/Swap.tsx`, update the `USDC_ISSUER` constant in that file.*

### 3. Run the Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

## 💡 How to use

1. **Connect**: Click "Connect Wallet" at the top right to link your Freighter extension. Ensure Freighter is set to **Testnet**.
2. **Fund**: If you have a 0 balance, click the "Fund Testnet Wallet" button on the Dashboard to instantly receive 10,000 test XLM via Friendbot.
3. **Swap**: Head over to the Swap tab, enter an amount, and exchange your XLM for USDC!

## 📜 License
MIT License
