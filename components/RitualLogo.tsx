'use client'

export function RitualLogo({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ritual Endless Knot logo - green */}
      <g fill="none" stroke="#19D184" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Outer diamond frame */}
        <path d="M50 8 L92 50 L50 92 L8 50 Z" />

        {/* Inner rotated square */}
        <path d="M50 25 L75 50 L50 75 L25 50 Z" />

        {/* Center small diamond */}
        <path d="M50 38 L62 50 L50 62 L38 50 Z" />

        {/* Top connector - vertical */}
        <path d="M50 8 L50 25" />

        {/* Bottom connector - vertical */}
        <path d="M50 75 L50 92" />

        {/* Left connector - horizontal */}
        <path d="M8 50 L25 50" />

        {/* Right connector - horizontal */}
        <path d="M75 50 L92 50" />

        {/* Diagonal connectors from outer to inner */}
        <path d="M50 25 L38 38" />
        <path d="M50 25 L62 38" />
        <path d="M75 50 L62 38" />
        <path d="M75 50 L62 62" />
        <path d="M50 75 L62 62" />
        <path d="M50 75 L38 62" />
        <path d="M25 50 L38 62" />
        <path d="M25 50 L38 38" />

        {/* Corner loop details - top */}
        <path d="M35 18 L50 8 L65 18" />

        {/* Corner loop details - bottom */}
        <path d="M35 82 L50 92 L65 82" />

        {/* Corner loop details - left */}
        <path d="M18 35 L8 50 L18 65" />

        {/* Corner loop details - right */}
        <path d="M82 35 L92 50 L82 65" />
      </g>
    </svg>
  )
}
