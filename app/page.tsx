'use client'

import { useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Header } from '@/components/Header'
import { WrappedCard } from '@/components/WrappedCard'
import type { WrappedData } from '@/lib/types'

export default function Home() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [wrappedData, setWrappedData] = useState<WrappedData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

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
      const response = await fetch(`/api/wrapped?address=${address}`)
      if (!response.ok) {
        throw new Error('Failed to fetch wrapped data')
      }
      const data = await response.json()
      setWrappedData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = () => {
    if (!wrappedData) return
    const text = `I'm a ${wrappedData.title} on Ritual Chain! 🎭\n\n${wrappedData.subtitle}\n\n${wrappedData.funFact}\n\nCheck your Ritual Wrapped: ritual-wrapped.vercel.app`
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  return (
    <main className="min-h-screen bg-ritual-black">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl gradient-text mb-6">
            RITUAL WRAPPED
          </h1>
          <p className="text-gray-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto">
            Your on-chain story on Ritual Chain
          </p>

          {/* Connect & Generate */}
          {!isConnected ? (
            <button
              onClick={handleConnect}
              className="btn-green px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:scale-105"
            >
              Connect Wallet
            </button>
          ) : (
            <div className="space-y-6">
              <div className="bg-ritual-elevated rounded-xl p-4 inline-block">
                <p className="text-gray-400 text-sm mb-1">Connected Wallet</p>
                <p className="font-mono text-ritual-green">
                  {address && truncateAddress(address)}
                </p>
              </div>

              <div>
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="btn-green px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Generating...' : 'Generate My Wrapped'}
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-6 bg-red-900/20 border border-red-800 rounded-xl p-4 text-red-400">
              {error}
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="mt-12 max-w-2xl mx-auto">
              <div className="rounded-xl bg-ritual-elevated p-8 animate-pulse-green">
                <div className="h-8 bg-ritual-surface rounded w-1/3 mx-auto mb-4" />
                <div className="h-4 bg-ritual-surface rounded w-1/2 mx-auto mb-8" />
                <div className="grid grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-24 bg-ritual-surface rounded" />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {wrappedData && !loading && (
            <div className="mt-12">
              <WrappedCard data={wrappedData} />

              {/* Share Button */}
              <div className="mt-8">
                <button
                  onClick={handleShare}
                  className="bg-black border border-gray-800 hover:border-ritual-green px-6 py-3 rounded-xl text-white font-medium transition-all hover:shadow-glow-green flex items-center gap-2 mx-auto"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Share on X
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
