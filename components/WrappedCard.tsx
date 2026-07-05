'use client'

import { useRef } from 'react'
import type { WrappedData } from '@/lib/types'

interface WrappedCardProps {
  data: WrappedData
}

export function WrappedCard({ data }: WrappedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div ref={cardRef} className="w-full max-w-2xl mx-auto">
      {/* Card with gradient border */}
      <div className="relative rounded-xl p-[1px] bg-gradient-to-br from-ritual-green to-ritual-lime">
        <div className="rounded-xl bg-ritual-elevated p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🎭</div>
            <h2 className="font-display text-3xl md:text-4xl gradient-text mb-2">
              {data.title}
            </h2>
            <p className="text-gray-400 text-lg">{data.subtitle}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {data.stats.map((stat, index) => (
              <div
                key={index}
                className="bg-ritual-surface rounded-lg p-4 text-center"
              >
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="font-mono text-ritual-lime text-xl font-bold mb-1">
                  {stat.value}
                </div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Fun Fact */}
          <div className="bg-ritual-surface rounded-lg p-5 mb-6 border-l-4 border-ritual-pink">
            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div>
                <div className="text-ritual-pink font-semibold text-sm mb-1">
                  Fun Fact
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {data.funFact}
                </p>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="text-center mb-6">
            <p className="text-gray-500 text-sm mb-1">Your Address</p>
            <p className="font-mono text-gray-300 text-sm">
              {truncateAddress(data.address)}
            </p>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-800">
            <p className="text-gray-600 text-xs">
              Powered by{' '}
              <span className="text-ritual-green font-semibold">Ritual</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
