'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect, useSwitchChain } from 'wagmi'
import { Header } from '@/components/Header'
import { WrappedCard } from '@/components/WrappedCard'
import { ritualChain } from '@/lib/chain'
import type { WrappedData } from '@/lib/types'

export default function Home() {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors } = useConnect()
  const { switchChain } = useSwitchChain()
  const [wrappedData, setWrappedData] = useState<WrappedData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [switching, setSwitching] = useState(false)

  const isCorrectChain = chain?.id === ritualChain.id

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const handleSwitchChain = async () => {
    setSwitching(true)
    try {
      await switchChain({ chainId: ritualChain.id })
    } catch (err: any) {
      // Chain not added to MetaMask — add it first
      if (err?.message?.includes('Unrecognized chain') || err?.code === 4902) {
        try {
          await window.ethereum?.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x7B3', // 1979
              chainName: 'Ritual Testnet',
              nativeCurrency: { name: 'RITUAL', symbol: 'RITUAL', decimals: 18 },
              rpcUrls: ['https://rpc.ritualfoundation.org'],
              blockExplorerUrls: ['https://explorer.ritualfoundation.org'],
            }],
          })
        } catch (addErr) {
          console.error('Failed to add chain:', addErr)
        }
      }
    } finally {
      setSwitching(false)
    }
  }

  // Auto-switch when connected and on wrong chain
  useEffect(() => {
    if (isConnected && !isCorrectChain) {
      handleSwitchChain()
    }
  }, [isConnected, isCorrectChain])

  const handleConnect = () => {
    const injectedConnector = connectors.find((c) => c.id === 'injected')
    if (injectedConnector) {
      connect({ connector: injectedConnector })
    }
  }

  const handleGenerate = async () => {
    if (!address) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/wrapped?address=${address}`)
      const data = await res.json()

      if (data.error) throw new Error(data.error)

      setWrappedData(data)
    } catch (err: any) {
      setError(err.message || 'Failed to generate wrapped')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {!isConnected ? (
          <div className="text-center space-y-6">
            <h1 className="font-display text-5xl md:text-7xl">
              <span className="text-white">RITUAL </span>
              <span className="text-ritual-green">WRAPPED</span>
            </h1>
            <p className="text-gray-400 text-lg">
              Your on-chain story on Ritual Chain
            </p>
            <button
              onClick={handleConnect}
              className="btn-green px-8 py-3 rounded-xl text-lg font-semibold transition-all hover:scale-105"
            >
              Connect Wallet
            </button>
            <p className="text-gray-600 text-sm">
              Connect your Ritual wallet to see your Wrapped
            </p>
          </div>
        ) : !isCorrectChain ? (
          <div className="text-center space-y-6">
            <h1 className="font-display text-4xl md:text-5xl">
              <span className="text-white">RITUAL </span>
              <span className="text-orange-500">WRAPPED</span>
            </h1>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6 max-w-md">
              <p className="text-orange-400 text-lg font-semibold mb-2">⚠️ Wrong Network</p>
              <p className="text-white/60 text-sm mb-2">
                Connected to: <span className="text-white font-mono">{chain?.name || 'Unknown'} (Chain {chain?.id})</span>
              </p>
              <p className="text-white/60 text-sm mb-4">
                Please switch to <span className="text-ritual-green font-semibold">Ritual Testnet</span> (Chain 1979)
              </p>
              <button
                onClick={handleSwitchChain}
                disabled={switching}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-50"
              >
                {switching ? 'Switching...' : 'Switch to Ritual Testnet'}
              </button>
            </div>
          </div>
        ) : !wrappedData ? (
          <div className="text-center space-y-6">
            <h1 className="font-display text-5xl md:text-7xl">
              <span className="text-white">RITUAL </span>
              <span className="text-ritual-green">WRAPPED</span>
            </h1>
            <p className="text-gray-400 text-lg">
              Your on-chain story on Ritual Chain
            </p>
            <div className="space-y-2">
              <p className="text-white/40 text-sm font-mono">
                {truncateAddress(address!)}
              </p>
              <p className="text-ritual-green text-xs">✓ Connected to Ritual Testnet</p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="btn-green px-8 py-3 rounded-xl text-lg font-semibold transition-all hover:scale-105 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Generate Wrapped'}
            </button>
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
          </div>
        ) : (
          <WrappedCard data={wrappedData} />
        )}
      </div>

      <footer className="text-center p-4 text-gray-700 text-sm">
        Built on Ritual Chain
      </footer>
    </main>
  )
}
