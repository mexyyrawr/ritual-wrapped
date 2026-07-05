'use client'

import { useRef, useState } from 'react'
import { RitualLogo } from './RitualLogo'
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
    <div className="w-full max-w-md mx-auto">
      {/* Screenshot card - Spotify Wrapped style */}
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-3xl"
        style={{ isolation: 'isolate', aspectRatio: '9/16' }}
      >
        {/* Background gradient - vibrant like Spotify */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0533] via-[#0d1117] to-[#000000]" />

        {/* Mesh gradient orbs */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-purple-600/30 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-1/3 right-0 w-60 h-60 bg-ritual-green/20 rounded-full blur-[80px] translate-x-1/3" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-ritual-lime/10 rounded-full blur-[120px] translate-y-1/2" />
        <div className="absolute bottom-1/4 right-0 w-40 h-40 bg-ritual-pink/15 rounded-full blur-[60px]" />

        {/* Noise texture */}
        <div className="absolute inset-0 noise-overlay" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-8">
          {/* Top - Logo & Branding */}
          <div className="flex items-center justify-between mb-auto">
            <div className="flex items-center gap-2.5">
              <RitualLogo className="w-8 h-8" />
              <div>
                <div className="text-white font-display text-sm tracking-wide">RITUAL</div>
                <div className="text-ritual-green text-[10px] font-mono uppercase tracking-widest">Wrapped</div>
              </div>
            </div>
            <div className="text-gray-600 font-mono text-xs">{new Date().getFullYear()}</div>
          </div>

          {/* Center - Main Title (Spotify style: BIG bold text) */}
          <div className="my-auto text-center py-8">
            {/* Year badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-ritual-green animate-pulse" />
              <span className="text-white/60 text-xs font-medium uppercase tracking-wider">
                Your {new Date().getFullYear()} Wrapped
              </span>
            </div>

            {/* Title - HUGE like Spotify */}
            <h2
              className="font-display text-5xl md:text-6xl leading-[0.95] mb-4"
              style={{
                background: 'linear-gradient(135deg, #BFFF00 0%, #19D184 50%, #9b51e0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {data.title}
            </h2>

            {/* Subtitle */}
            <p className="text-white/50 text-base font-light max-w-[250px] mx-auto">
              {data.subtitle}
            </p>
          </div>

          {/* Stats - Spotify style: big numbers, minimal labels */}
          <div className="space-y-4 mb-auto">
            {data.stats.slice(0, 3).map((stat, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-3 px-4 rounded-2xl bg-white/[0.03] border border-white/[0.05]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{stat.icon}</span>
                  <span className="text-white/40 text-xs uppercase tracking-wider font-medium">
                    {stat.label}
                  </span>
                </div>
                <span
                  className="font-mono text-lg font-bold"
                  style={{
                    background: index === 0
                      ? 'linear-gradient(135deg, #BFFF00, #19D184)'
                      : index === 1
                      ? 'linear-gradient(135deg, #19D184, #9b51e0)'
                      : 'linear-gradient(135deg, #FF1DCE, #FACC15)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {stat.value}
                </span>
              </div>
            ))}
          </div>

          {/* Fun Fact */}
          <div className="my-6 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-ritual-pink/10 via-transparent to-ritual-gold/10 p-[1px] rounded-2xl">
              <div className="bg-black/80 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-lg">💡</span>
                  <div>
                    <div className="text-ritual-pink text-[10px] font-semibold uppercase tracking-widest mb-1">
                      Fun Fact
                    </div>
                    <p className="text-white/60 text-xs leading-relaxed">
                      {data.funFact}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom - Address & CTA */}
          <div className="mt-auto text-center space-y-4">
            <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-ritual-green flex items-center justify-center text-black text-[10px] font-bold">
                {data.address.slice(2, 4).toUpperCase()}
              </div>
              <span className="font-mono text-white/40 text-xs">
                {truncateAddress(data.address)}
              </span>
            </div>

            <div className="pt-3">
              <p className="text-white/20 text-[10px] font-mono">
                ritual-wrapped.vercel.app
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons - outside card (not in screenshot) */}
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
              Download
            </>
          )}
        </button>

        <button
          onClick={() => {
            const text = `My Ritual Wrapped ${new Date().getFullYear()} 🎭\n\nI'm a ${data.title}!\n${data.subtitle}\n\n${data.funFact}\n\nCheck yours → ritual-wrapped.vercel.app`
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
