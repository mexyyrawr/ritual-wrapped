'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import type { WrappedData } from '@/lib/types'
import { useClaimWrapped } from '@/hooks/useClaimWrapped'
import { useAccount, useSwitchChain } from 'wagmi'
import { ritualChain } from '@/lib/chain'

interface WrappedCardProps {
  data: WrappedData
}

// Each card gets its own gradient
const CARD_THEMES = [
  { bg: 'from-purple-900 via-purple-800 to-indigo-900', accent: '#BFFF00' },
  { bg: 'from-emerald-900 via-teal-800 to-cyan-900', accent: '#19D184' },
  { bg: 'from-orange-900 via-red-800 to-pink-900', accent: '#FF6B6B' },
  { bg: 'from-blue-900 via-indigo-800 to-violet-900', accent: '#60A5FA' },
  { bg: 'from-pink-900 via-rose-800 to-red-900', accent: '#F472B6' },
  { bg: 'from-amber-900 via-yellow-800 to-orange-900', accent: '#FCD34D' },
  { bg: 'from-cyan-900 via-blue-800 to-indigo-900', accent: '#22D3EE' },
  { bg: 'from-lime-900 via-green-800 to-emerald-900', accent: '#A3E635' },
]

export function WrappedCard({ data }: WrappedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [currentCard, setCurrentCard] = useState(0)
  const [capturing, setCapturing] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [alreadyClaimed, setAlreadyClaimed] = useState(false)
  const { claim, isLoading: claiming, error: claimError, txHash } = useClaimWrapped()
  const { chain } = useAccount()
  const { switchChain, isPending: switching } = useSwitchChain()
  const isCorrectChain = chain?.id === ritualChain.id
  const touchStartX = useRef(0)

  // Check if user already claimed on-chain
  useEffect(() => {
    const checkClaimed = async () => {
      try {
        const res = await fetch(`/api/wrapped?address=${data.address}`)
        const json = await res.json()
        // Check on-chain via RPC
        const rpcRes = await fetch('/api/rpc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [{
              to: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
              data: '0x73b2e80e' + data.address.slice(2).padStart(64, '0'),
            }, 'latest'],
            id: 1,
          }),
        })
        const rpcJson = await rpcRes.json()
        if (rpcJson.result && parseInt(rpcJson.result, 16) === 1) {
          setAlreadyClaimed(true)
        }
      } catch {}
    }
    checkClaimed()
  }, [data.address])

  // Build cards array
  const cards = [
    // Title card
    {
      type: 'title' as const,
      label: '',
      value: data.title,
      subtitle: data.subtitle,
      icon: '🎭',
      themeIndex: 0,
    },
    // Stat cards
    ...data.stats.map((stat, i) => ({
      type: 'stat' as const,
      label: stat.label,
      value: stat.value,
      icon: stat.icon,
      themeIndex: i + 1,
    })),
    // Fun fact card
    {
      type: 'funfact' as const,
      label: 'Fun Fact',
      value: data.funFact,
      icon: '💡',
      themeIndex: data.stats.length + 1,
    },
    // Claim card
    {
      type: 'claim' as const,
      label: '',
      value: '',
      icon: '',
      themeIndex: 0,
    },
    // Summary card — full recap (appears after claim, this is the downloadable card)
    {
      type: 'summary' as const,
      label: 'Your Wrapped',
      value: '',
      icon: '📊',
      themeIndex: 0,
    },
  ]

  const totalCards = cards.length

  const goNext = useCallback(() => {
    setCurrentCard((prev) => Math.min(prev + 1, totalCards - 1))
  }, [totalCards])

  const goPrev = useCallback(() => {
    setCurrentCard((prev) => Math.max(prev - 1, 0))
  }, [])

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goNext, goPrev])

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (diff > 50) goNext()
    if (diff < -50) goPrev()
  }

  const handleDownload = async () => {
    // Download current card as image
    if (!cardRef.current) return
    setCapturing(true)
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#000000',
      })
      const link = document.createElement('a')
      link.download = `ritual-wrapped-${data.address.slice(0, 8)}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Failed to capture:', err)
    } finally {
      setCapturing(false)
    }
  }

  const handleClaim = async () => {
    if (!isCorrectChain) {
      try {
        await switchChain({ chainId: ritualChain.id })
      } catch (err: any) {
        if (err?.message?.includes('Unrecognized chain') || err?.code === 4902) {
          await window.ethereum?.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x7B3',
              chainName: 'Ritual Testnet',
              nativeCurrency: { name: 'RITUAL', symbol: 'RITUAL', decimals: 18 },
              rpcUrls: ['https://rpc.ritualfoundation.org'],
              blockExplorerUrls: ['https://explorer.ritualfoundation.org'],
            }],
          })
          await switchChain({ chainId: ritualChain.id })
        }
      }
      return
    }

    try {
      await claim({
        totalTransactions: data.totalTransactions,
        totalSent: data.totalValueTransacted || '0',
        totalReceived: '0',
        totalGasSpent: data.totalGasSpent || '0',
        largestTx: data.largestTx || '0',
        walletAgeDays: data.walletAgeDays,
        uniqueContracts: data.uniqueContracts,
        activityScore: data.activityScore,
        activityLevel: data.stats.find(s => s.label === 'Activity')?.value || 'Newcomer',
        funFact: data.funFact,
      })
      setClaimed(true)
      // Navigate to summary card (last slide) after claim
      setCurrentCard(totalCards - 1)
    } catch (err) {
      console.error('Claim failed:', err)
    }
  }

  const current = cards[currentCard]
  const theme = CARD_THEMES[current.themeIndex % CARD_THEMES.length]

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 mb-4 px-4">
        {cards.map((_, i) => (
          <div
            key={i}
            className="h-1 rounded-full transition-all duration-300"
            style={{
              width: i === currentCard ? '24px' : '8px',
              backgroundColor: i <= currentCard ? theme.accent : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>

      {/* Card */}
      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const x = e.clientX - rect.left
          if (x > rect.width * 0.6) goNext()
          else if (x < rect.width * 0.4) goPrev()
        }}
        className="relative overflow-hidden rounded-3xl cursor-pointer select-none"
        style={{ isolation: 'isolate', aspectRatio: '3/2' }}
      >
        {/* Gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-b ${theme.bg}`} />

        {/* Mesh gradient orbs */}
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[120px] opacity-40"
          style={{ backgroundColor: theme.accent }}
        />
        <div
          className="absolute bottom-0 left-0 w-60 h-60 rounded-full blur-[100px] opacity-20"
          style={{ backgroundColor: theme.accent }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-6">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <img src="/ritual-logo.png" alt="Ritual" className="w-6 h-6" />
              <span className="text-white/80 text-sm font-semibold uppercase tracking-wider">Ritual Wrapped</span>
            </div>
            <span className="text-white/40 text-sm font-mono">{new Date().getFullYear()}</span>
          </div>

          {/* Card content */}
          <div className="flex-1 flex flex-col items-center justify-center">
            {current.type === 'title' && (
              <div className="text-center space-y-4">
                <div className="text-7xl">{current.icon}</div>
                <h1
                  className="font-display text-6xl leading-[0.95]"
                  style={{
                    background: `linear-gradient(135deg, ${theme.accent} 0%, #ffffff 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {current.value}
                </h1>
                <p className="text-white/60 text-xl font-light">{current.subtitle}</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.accent }} />
                  <span className="text-white/60 text-xs font-medium uppercase tracking-wider">
                    Your {new Date().getFullYear()} Wrapped
                  </span>
                </div>
              </div>
            )}

            {current.type === 'stat' && (
              <div className="text-center space-y-4">
                <div className="text-8xl">{current.icon}</div>
                <div className="text-white/50 text-lg font-semibold uppercase tracking-[0.2em]">
                  {current.label}
                </div>
                <div
                  className="font-display text-6xl md:text-7xl font-bold leading-none"
                  style={{ color: theme.accent }}
                >
                  {current.value}
                </div>
              </div>
            )}

            {current.type === 'funfact' && (
              <div className="text-center space-y-4 max-w-lg">
                <div className="text-8xl">{current.icon}</div>
                <div className="text-white/50 text-lg font-semibold uppercase tracking-[0.2em]">
                  Fun Fact
                </div>
                <p className="text-white text-2xl font-light leading-relaxed">
                  {current.value}
                </p>
              </div>
            )}

            {current.type === 'claim' && (
              <div className="text-center space-y-5 w-full max-w-sm">
                <div className="text-7xl">🔗</div>
                <div className="text-white/50 text-sm font-semibold uppercase tracking-[0.2em]">
                  Claim Your Wrapped
                </div>

                {/* Address */}
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-white/10 border border-white/10">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-black text-xs font-bold"
                    style={{ backgroundColor: theme.accent }}
                  >
                    {data.address.slice(2, 4).toUpperCase()}
                  </div>
                  <span className="font-mono text-white/60 text-sm">
                    {data.address.slice(0, 6)}...{data.address.slice(-4)}
                  </span>
                </div>

                {/* Claim button */}
                {claimed || txHash || alreadyClaimed ? (
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30">
                      <span className="text-green-400 text-sm font-semibold">
                        {alreadyClaimed ? '✅ Already claimed on-chain!' : '✅ Claimed on-chain!'}
                      </span>
                    </div>
                    {txHash && (
                      <a
                        href={`https://explorer.ritualfoundation.org/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-white/40 text-xs font-mono hover:text-white/60"
                      >
                        View transaction →
                      </a>
                    )}
                  </div>
                ) : !isCorrectChain ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleClaim() }}
                    disabled={switching}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-50"
                  >
                    {switching ? 'Switching...' : '⚠️ Switch to Ritual Testnet'}
                  </button>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleClaim() }}
                    disabled={claiming}
                    className="w-full px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-50 text-black"
                    style={{ backgroundColor: theme.accent }}
                  >
                    {claiming ? 'Claiming...' : '🔗 Claim On-chain'}
                  </button>
                )}

                {claimError && (
                  <p className="text-red-400 text-xs">{claimError}</p>
                )}
              </div>
            )}

            {current.type === 'summary' && (
              <div className="text-center w-full max-w-lg mx-auto">
                {/* Title */}
                <div className="mb-3">
                  <h2
                    className="font-display text-3xl leading-tight"
                    style={{
                      background: `linear-gradient(135deg, ${theme.accent} 0%, #ffffff 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {data.title}
                  </h2>
                  <p className="text-white/50 text-base mt-1">{data.subtitle}</p>
                </div>

                {/* Stats grid - 4 cols wide */}
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {data.stats.map((stat, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center py-3 px-2 rounded-xl bg-white/[0.08] border border-white/[0.1]"
                    >
                      <span className="text-lg mb-1">{stat.icon}</span>
                      <div className="text-white/40 text-[9px] uppercase tracking-wider leading-none">{stat.label}</div>
                      <div className="font-mono text-xs font-bold text-white leading-tight mt-1">
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Fun fact */}
                <div className="bg-white/[0.06] rounded-xl px-4 py-2 border border-white/[0.08]">
                  <p className="text-white/50 text-xs leading-snug">
                    💡 {data.funFact}
                  </p>
                </div>

                {/* Branding */}
                <div className="flex items-center justify-center gap-2 mt-2">
                  <img src="/ritual-logo.png" alt="Ritual" className="w-4 h-4" />
                  <span className="text-white/20 text-[9px] font-mono uppercase tracking-wider">
                    ritual-wrapped.vercel.app
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom - tap hint */}
          <div className="text-center">
            <p className="text-white/20 text-xs">
              {currentCard < totalCards - 1 ? 'Tap right to continue →' : '← Tap left to go back'}
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons — show on summary card after claim */}
      {(claimed || txHash || alreadyClaimed) && current.type === 'summary' && (
        <div className="flex justify-center gap-3 mt-4">
          <button
            onClick={handleDownload}
            disabled={capturing}
            className="btn-green px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50 flex items-center gap-2"
          >
            {capturing ? 'Capturing...' : '📸 Download'}
          </button>

          <button
            onClick={() => {
              const text = `My Ritual Wrapped ${new Date().getFullYear()} 🎭\n\n${data.title} — ${data.subtitle}\n\n${data.funFact}\n\nCheck yours → ritual-wrapped.vercel.app`
              window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
            }}
            className="bg-black border border-gray-800 hover:border-ritual-green px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:shadow-glow-green flex items-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Share on X
          </button>
        </div>
      )}
    </div>
  )
}
