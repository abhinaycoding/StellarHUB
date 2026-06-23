// src/App.jsx
import { useEffect, useState, useCallback } from 'react'
import WalletPanel from './components/WalletPanel'
import RecipientRow from './components/RecipientRow'
import SplitBeam from './components/SplitBeam'
import TxResult from './components/TxResult'
import {
  connectWallet,
  disconnectWallet,
  fetchXlmBalance,
  fundWithFriendbot,
  sendSplitPayment,
  isValidStellarAddress,
} from './lib/stellar'

const emptyRecipient = () => ({ address: '', amount: '' })

export default function App() {
  const [publicKey, setPublicKey] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState('')

  const [balance, setBalance] = useState('0')
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [funding, setFunding] = useState(false)

  const [recipients, setRecipients] = useState([emptyRecipient()])
  const [sending, setSending] = useState(false)
  const [txResult, setTxResult] = useState(null)

  const refreshBalance = useCallback(async (key) => {
    if (!key) return
    setBalanceLoading(true)
    try {
      const bal = await fetchXlmBalance(key)
      setBalance(bal)
    } catch (err) {
      console.error('Balance fetch failed:', err)
    } finally {
      setBalanceLoading(false)
    }
  }, [])

  useEffect(() => {
    if (publicKey) refreshBalance(publicKey)
  }, [publicKey, refreshBalance])

  const handleConnect = async () => {
    setConnecting(true)
    setConnectError('')
    try {
      const address = await connectWallet()
      setPublicKey(address)
    } catch (err) {
      setConnectError(err.message || 'Failed to connect wallet.')
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = () => {
    disconnectWallet()
    setPublicKey(null)
    setBalance('0')
    setTxResult(null)
  }

  const handleFund = async () => {
    setFunding(true)
    try {
      await fundWithFriendbot(publicKey)
      await refreshBalance(publicKey)
    } catch (err) {
      setConnectError(err.message || 'Friendbot funding failed.')
    } finally {
      setFunding(false)
    }
  }

  const updateRecipient = (index, updated) => {
    setRecipients((prev) => prev.map((r, i) => (i === index ? updated : r)))
  }

  const removeRecipient = (index) => {
    setRecipients((prev) => prev.filter((_, i) => i !== index))
  }

  const addRecipient = () => {
    setRecipients((prev) => [...prev, emptyRecipient()])
  }

  const totalAmount = recipients.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)

  const recipientsValid =
    recipients.length > 0 &&
    recipients.every(
      (r) => isValidStellarAddress(r.address) && parseFloat(r.amount) > 0
    )

  const canSend =
    publicKey && recipientsValid && totalAmount > 0 && totalAmount <= Number(balance) && !sending

  const handleSend = async () => {
    setTxResult({ status: 'pending' })
    setSending(true)
    try {
      const { hash } = await sendSplitPayment(publicKey, recipients)
      setTxResult({ status: 'success', hash })
      await refreshBalance(publicKey)
    } catch (err) {
      const message =
        err?.response?.data?.extras?.result_codes?.operations?.join(', ') ||
        err.message ||
        'Unknown error while sending transaction.'
      setTxResult({ status: 'error', message })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-space-900 text-white">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:py-16">
        {/* Header */}
        <header className="mb-8">
          <p className="font-mono text-xs uppercase tracking-widest text-stellarblue-400">
            Stellar · Testnet
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Tip Splitter
          </h1>
          <p className="mt-2 max-w-md text-sm text-mist">
            One payment, forked into many. Connect a wallet, list your recipients, and
            settle the whole split in a single Stellar transaction.
          </p>
        </header>

        {/* Wallet */}
        <section className="mb-6">
          <WalletPanel
            publicKey={publicKey}
            balance={balance}
            balanceLoading={balanceLoading}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onFund={handleFund}
            funding={funding}
            connecting={connecting}
          />
          {connectError && (
            <p className="mt-2 font-mono text-xs text-red-400">{connectError}</p>
          )}
        </section>

        {/* Split console */}
        <section className="rounded-2xl border border-space-600 bg-space-800 p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-4">
            <SplitBeam count={recipients.length} />
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-mist">
                Recipients
              </h2>
              <p className="font-mono text-xs text-mist">
                {recipients.length} {recipients.length === 1 ? 'destination' : 'destinations'} · total{' '}
                <span className="text-flare-400">{totalAmount.toFixed(7)} XLM</span>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {recipients.map((r, i) => (
              <RecipientRow
                key={i}
                index={i}
                recipient={r}
                onChange={(updated) => updateRecipient(i, updated)}
                onRemove={() => removeRecipient(i)}
                removable={recipients.length > 1}
              />
            ))}
          </div>

          <button
            onClick={addRecipient}
            className="mt-4 w-full rounded-lg border border-dashed border-space-600 py-2 text-xs font-semibold text-mist transition hover:border-stellarblue-500 hover:text-stellarblue-400"
          >
            + Add recipient
          </button>

          <button
            onClick={handleSend}
            disabled={!canSend}
            className="mt-5 w-full rounded-lg bg-flare-500 py-3 text-sm font-bold text-space-950 shadow-flareglow transition hover:bg-flare-400 disabled:cursor-not-allowed disabled:bg-space-600 disabled:text-mist disabled:shadow-none"
          >
            {sending
              ? 'Sending…'
              : !publicKey
              ? 'Connect wallet to send'
              : `Send split payment · ${totalAmount.toFixed(2)} XLM`}
          </button>

          {totalAmount > Number(balance) && publicKey && (
            <p className="mt-2 text-center font-mono text-xs text-red-400">
              Total exceeds your available balance.
            </p>
          )}
        </section>

        {/* Transaction feedback */}
        {txResult && (
          <section className="mt-6">
            <TxResult result={txResult} />
          </section>
        )}

        <footer className="mt-12 text-center font-mono text-xs text-mist/60">
          Built on Stellar Testnet · Requires the Freighter wallet extension
        </footer>
      </div>
    </div>
  )
}
