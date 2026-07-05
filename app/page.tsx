'use client'

import { useState } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { Header } from '@/components/Header'
import { WrappedCard } from '@/components/WrappedCard'
import type { WrappedData } from '@/lib/types'

export default function Home() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
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

  return (
    <main className="min-h-screen bg-ritual-black">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Decorative line */}
          <div className="w-12 h-px bg-gradient-to-r from-transparent via-ritual-green to-transparent mx-auto mb-8" />

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl gradient-text mb-6 leading-none">
            RITUAL
            <br />
            WRAPPED
          </h1>
          <p className="text-gray-400 text-lg md:text-xl mb-12 max-w-xl mx-auto font-light">
            Your on-chain story on Ritual Chain
          </p>

          {/* Connect & Generate */}
          {!isConnected ? (
            <div className="space-y-4">
              <button
                onClick={handleConnect}
                className="btn-green px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:scale-105 animate-glow-pulse"
              >
                Connect Wallet
              </button>
              <p className="text-gray-600 text-sm">
                Connect your Ritual wallet to see your Wrapped
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 px-5 py-3 bg-ritual-elevated rounded-xl border border-gray-800">
                <div className="w-3 h-3 rounded-full bg-ritual-green animate-pulse" />
                <span className="font-mono text-ritual-green text-sm">
                  {address && truncateAddress(address)}
                </span>
                <span className="text-gray-600 text-xs">•</span>
                <span className="text-gray-500 text-xs">Ritual</span>
              </div>

              {!wrappedData && (
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="btn-green px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-3">
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Analyzing your on-chain data...
                    </span>
                  ) : (
                    'Generate My Wrapped'
                  )}
                </button>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-6 max-w-md mx-auto bg-red-900/20 border border-red-800/50 rounded-xl p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="mt-12 max-w-2xl mx-auto">
              <div className="rounded-2xl overflow-hidden">
                <div className="mesh-gradient p-8 animate-pulse-green">
                  <div className="h-6 bg-ritual-surface/50 rounded-full w-32 mx-auto mb-6" />
                  <div className="h-10 bg-ritual-surface/50 rounded-lg w-2/3 mx-auto mb-3" />
                  <div className="h-5 bg-ritual-surface/30 rounded w-1/2 mx-auto mb-10" />
                  <div className="grid grid-cols-3 gap-3">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-24 bg-ritual-surface/30 rounded-xl animate-shimmer" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {wrappedData && !loading && (
            <div className="mt-12">
              <WrappedCard data={wrappedData} />
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="pb-8 text-center">
        <p className="text-gray-700 text-xs">
          Built on <span className="text-ritual-green">Ritual Chain</span>
        </p>
      </footer>
    </main>
  )
}
