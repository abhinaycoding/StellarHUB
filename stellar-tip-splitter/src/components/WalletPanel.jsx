// src/components/WalletPanel.jsx
import { useState } from 'react'

function truncateAddress(address) {
  if (!address) return ''
  return `${address.slice(0, 4)}…${address.slice(-4)}`
}

export default function WalletPanel({
  publicKey,
  balance,
  balanceLoading,
  onConnect,
  onDisconnect,
  onFund,
  funding,
  connecting,
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!publicKey) return
    await navigator.clipboard.writeText(publicKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (!publicKey) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-xl border border-space-600 bg-space-800 px-5 py-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-mist">Wallet</p>
          <p className="mt-1 text-sm text-mist">Not connected</p>
        </div>
        <button
          onClick={onConnect}
          disabled={connecting}
          className="rounded-lg bg-stellarblue-500 px-4 py-2 text-sm font-semibold text-space-950 shadow-glow transition hover:bg-stellarblue-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {connecting ? 'Connecting…' : 'Connect Freighter'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-space-600 bg-space-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-flare-500 opacity-75 animate-pulseSlow" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-flare-500" />
        </span>
        <div>
          <button
            onClick={handleCopy}
            title="Copy full address"
            className="font-mono text-sm text-white hover:text-stellarblue-400"
          >
            {truncateAddress(publicKey)}
            {copied && <span className="ml-2 text-xs text-flare-400">copied</span>}
          </button>
          <p className="font-mono text-xs text-mist">
            {balanceLoading ? 'fetching balance…' : `${Number(balance).toLocaleString(undefined, { maximumFractionDigits: 7 })} XLM`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {Number(balance) === 0 && !balanceLoading && (
          <button
            onClick={onFund}
            disabled={funding}
            className="rounded-lg border border-flare-500 px-3 py-1.5 text-xs font-semibold text-flare-400 transition hover:bg-flare-500 hover:text-space-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {funding ? 'Funding…' : 'Fund via Friendbot'}
          </button>
        )}
        <button
          onClick={onDisconnect}
          className="rounded-lg border border-space-600 px-3 py-1.5 text-xs font-semibold text-mist transition hover:border-stellarblue-500 hover:text-white"
        >
          Disconnect
        </button>
      </div>
    </div>
  )
}
