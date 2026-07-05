'use client'

import { useRef, useState } from 'react'
import type { WrappedData } from '@/lib/types'

interface WrappedCardProps {
  data: WrappedData
}

export function WrappedCard({ data }: WrappedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [capturing, setCapturing] = useState(false)

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const handleDownload = async () => {
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

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Screenshot-ready card */}
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-2xl"
        style={{ isolation: 'isolate' }}
      >
        {/* Mesh gradient background */}
        <div className="absolute inset-0 mesh-gradient" />

        {/* Grid pattern */}
        <div className="absolute inset-0 grid-pattern opacity-50" />

        {/* Noise texture */}
        <div className="absolute inset-0 noise-overlay" />

        {/* Glow orbs - decorative */}
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-ritual-green/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-ritual-pink/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-ritual-lime/5 rounded-full blur-3xl animate-float" />

        {/* Card content */}
        <div className="relative z-10 p-8 md:p-10">
          {/* Top badge */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-ritual-green animate-pulse" />
              <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                Ritual Wrapped
              </span>
            </div>
            <div className="text-xs font-mono text-gray-600">
              {new Date().getFullYear()}
            </div>
          </div>

          {/* Title Section */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ritual-green/10 border border-ritual-green/20 mb-6">
              <span className="text-ritual-green text-sm font-semibold">
                {data.title}
              </span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl gradient-text mb-3 leading-tight">
              {data.title}
            </h2>
            <p className="text-gray-400 text-lg md:text-xl font-light">
              {data.subtitle}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
            {data.stats.map((stat, index) => (
              <div
                key={index}
                className="stat-card rounded-xl p-4 text-center"
              >
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="font-mono text-ritual-lime text-xl md:text-2xl font-bold mb-1 tracking-tight">
                  {stat.value}
                </div>
                <div className="text-gray-500 text-xs uppercase tracking-wider font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Fun Fact */}
          <div className="relative rounded-xl overflow-hidden mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-ritual-pink/10 via-transparent to-ritual-gold/10" />
            <div className="relative bg-ritual-surface/80 backdrop-blur-sm rounded-xl p-5 border border-gray-800/50">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-ritual-pink/10 border border-ritual-pink/20 flex items-center justify-center">
                  <span className="text-lg">💡</span>
                </div>
                <div>
                  <div className="text-ritual-pink font-semibold text-sm mb-1 uppercase tracking-wider">
                    Fun Fact
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {data.funFact}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Address & Footer */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-ritual-surface/50 border border-gray-800/50">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ritual-green to-ritual-lime flex items-center justify-center text-black text-xs font-bold">
                {data.address.slice(2, 4).toUpperCase()}
              </div>
              <span className="font-mono text-gray-400 text-sm">
                {truncateAddress(data.address)}
              </span>
            </div>

            <div className="pt-4 border-t border-gray-800/50">
              <p className="text-gray-600 text-xs">
                Powered by{' '}
                <span className="text-ritual-green font-semibold">Ritual</span>
                {' '}•{' '}
                <span className="font-mono">ritual-wrapped.vercel.app</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons outside the card (not captured in screenshot) */}
      <div className="flex justify-center gap-3 mt-6">
        <button
          onClick={handleDownload}
          disabled={capturing}
          className="btn-green px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50 flex items-center gap-2"
        >
          {capturing ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Capturing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              Download Image
            </>
          )}
        </button>

        <button
          onClick={() => {
            const text = `I'm a ${data.title} on Ritual Chain! 🎭\n\n${data.subtitle}\n\n${data.funFact}\n\nCheck your Ritual Wrapped → ritual-wrapped.vercel.app`
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
    </div>
  )
}
