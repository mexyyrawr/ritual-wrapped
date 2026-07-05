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
    <div className="w-full max-w-md mx-auto">
      {/* Screenshot card */}
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-3xl"
        style={{ isolation: 'isolate', aspectRatio: '9/16' }}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0533] via-[#0d1117] to-[#000000]" />

        {/* Mesh gradient orbs */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-purple-600/30 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-1/3 right-0 w-60 h-60 bg-ritual-green/20 rounded-full blur-[80px] translate-x-1/3" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-ritual-lime/10 rounded-full blur-[120px] translate-y-1/2" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-6">
          {/* Top - Logo & Branding */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <img src="/ritual-logo.png" alt="Ritual" className="w-7 h-7" />
              <div>
                <div className="text-white font-display text-sm tracking-wide">RITUAL</div>
                <div className="text-ritual-green text-[10px] font-mono uppercase tracking-widest">Recap</div>
              </div>
            </div>
            <div className="text-gray-600 font-mono text-xs">{new Date().getFullYear()}</div>
          </div>

          {/* Title Section */}
          <div className="text-center my-auto py-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-ritual-green animate-pulse" />
              <span className="text-white/60 text-[10px] font-medium uppercase tracking-wider">
                Your {new Date().getFullYear()} Wrapped
              </span>
            </div>

            <h2
              className="font-display text-5xl leading-[0.95] mb-3"
              style={{
                background: 'linear-gradient(135deg, #BFFF00 0%, #19D184 50%, #9b51e0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {data.title}
            </h2>
            <p className="text-white/50 text-base font-light">{data.subtitle}</p>
          </div>

          {/* Stats - 2x2 grid, clean */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {data.stats.map((stat, index) => (
              <div
                key={index}
                className="flex flex-col items-center py-4 px-3 rounded-2xl bg-white/[0.03] border border-white/[0.05]"
              >
                <span className="text-2xl mb-2">{stat.icon}</span>
                <div className="text-white/40 text-[9px] uppercase tracking-wider mb-1">{stat.label}</div>
                <div className="font-mono text-sm font-bold text-white text-center">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Fun Fact */}
          <div className="rounded-xl overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-ritual-pink/10 via-transparent to-ritual-gold/10 p-[1px] rounded-xl">
              <div className="bg-black/80 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-lg">💡</span>
                  <div>
                    <div className="text-ritual-pink text-[9px] font-semibold uppercase tracking-widest mb-1">
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

          {/* Bottom - Address */}
          <div className="mt-auto text-center space-y-3">
            <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-ritual-green flex items-center justify-center text-black text-[10px] font-bold">
                {data.address.slice(2, 4).toUpperCase()}
              </div>
              <span className="font-mono text-white/40 text-xs">
                {truncateAddress(data.address)}
              </span>
            </div>
            <p className="text-white/20 text-[9px] font-mono">
              ritual-wrapped.vercel.app
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
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
    </div>
  )
}
