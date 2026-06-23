// src/lib/stellar.js
//
// All wallet + network logic lives here, separate from UI components.
// Network: Stellar TESTNET only.

import {
  isConnected,
  setAllowed,
  getAddress,
  signTransaction,
} from '@stellar/freighter-api'
import {
  Horizon,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  BASE_FEE,
} from '@stellar/stellar-sdk'

export const HORIZON_TESTNET_URL = 'https://horizon-testnet.stellar.org'
export const FRIENDBOT_URL = 'https://friendbot.stellar.org'

const server = new Horizon.Server(HORIZON_TESTNET_URL)

/**
 * Checks whether the Freighter browser extension is installed at all.
 */
export async function checkFreighterInstalled() {
  const result = await isConnected()
  // freighter-api returns { isConnected: boolean, error? }
  return !result.error && result.isConnected !== undefined
}

/**
 * Connects to Freighter: requests permission if not already granted,
 * then returns the active public key (address).
 */
export async function connectWallet() {
  const installed = await checkFreighterInstalled()
  if (!installed) {
    throw new Error(
      'Freighter wallet not found. Install the Freighter browser extension and refresh the page.'
    )
  }

  const access = await setAllowed()
  if (access.error) throw new Error(access.error)
  if (!access.isAllowed) {
    throw new Error('Permission to connect was denied in Freighter.')
  }

  const addressResult = await getAddress()
  if (addressResult.error) throw new Error(addressResult.error)

  return addressResult.address
}

/**
 * "Disconnect" — Freighter has no app-side disconnect API (the user
 * controls site access from inside the extension), so we just clear
 * local app state. This function exists for symmetry / clarity in the UI.
 */
export function disconnectWallet() {
  return true
}

/**
 * Fetches the XLM balance for a given public key on testnet.
 * Returns "0" (as a string) for unfunded accounts instead of throwing,
 * so the UI can prompt the user to fund via Friendbot.
 */
export async function fetchXlmBalance(publicKey) {
  try {
    const account = await server.loadAccount(publicKey)
    const native = account.balances.find((b) => b.asset_type === 'native')
    return native ? native.balance : '0'
  } catch (err) {
    if (err?.response?.status === 404) {
      // Account exists on no ledger yet = unfunded testnet account.
      return '0'
    }
    throw err
  }
}

/**
 * Funds a brand-new testnet account using Friendbot.
 * Only works on TESTNET and only for accounts that don't exist yet.
 */
export async function fundWithFriendbot(publicKey) {
  const res = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(publicKey)}`)
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Friendbot funding failed: ${body || res.statusText}`)
  }
  return res.json()
}

/**
 * Builds, signs (via Freighter), and submits a transaction that pays out
 * XLM to multiple recipients in a single ledger transaction.
 *
 * @param {string} senderPublicKey
 * @param {Array<{address: string, amount: string}>} recipients
 * @returns {Promise<{hash: string, ledger: number}>}
 */
export async function sendSplitPayment(senderPublicKey, recipients) {
  if (!recipients.length) throw new Error('Add at least one recipient.')

  const sourceAccount = await server.loadAccount(senderPublicKey)

  const txBuilder = new TransactionBuilder(sourceAccount, {
    fee: String(BASE_FEE * recipients.length),
    networkPassphrase: Networks.TESTNET,
  })

  for (const { address, amount } of recipients) {
    txBuilder.addOperation(
      Operation.payment({
        destination: address,
        asset: Asset.native(),
        amount: String(amount),
      })
    )
  }

  const transaction = txBuilder.setTimeout(60).build()
  const xdr = transaction.toXDR()

  const signResult = await signTransaction(xdr, {
    networkPassphrase: Networks.TESTNET,
  })
  if (signResult.error) throw new Error(signResult.error)

  const signedTx = TransactionBuilder.fromXDR(signResult.signedTxXdr, Networks.TESTNET)
  const submitResult = await server.submitTransaction(signedTx)

  return { hash: submitResult.hash, ledger: submitResult.ledger }
}

/**
 * Quick validity check for a Stellar public key (G... address), used for
 * inline form validation before attempting a transaction.
 */
export function isValidStellarAddress(address) {
  return typeof address === 'string' && /^G[A-Z0-9]{55}$/.test(address.trim())
}
