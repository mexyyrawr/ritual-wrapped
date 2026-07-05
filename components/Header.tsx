'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'

export function Header() {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const handleConnect = () => {
    const injectedConnector = connectors.find((c) => c.id === 'injected')
    if (injectedConnector) {
      connect({ connector: injectedConnector })
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-ritual-black/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="font-display text-xl text-white">
              RITUAL
            </span>
            <span className="text-ritual-green font-bold">WRAPPED</span>
          </div>

          {/* Chain Indicator & Connect Button */}
          <div className="flex items-center gap-4">
            {isConnected && chain && (
              <div className="flex items-center gap-2 bg-ritual-surface rounded-full px-3 py-1.5">
                <div className="w-2 h-2 rounded-full bg-ritual-green animate-pulse" />
                <span className="text-sm text-gray-300">Ritual</span>
              </div>
            )}

            {isConnected && address ? (
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-gray-300">
                  {truncateAddress(address)}
                </span>
                <button
                  onClick={() => disconnect()}
                  className="btn-green px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                className="btn-green px-4 py-2 rounded-lg text-sm font-medium"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
