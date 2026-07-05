'use client'

export function RitualLogo({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="ritualGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9b51e0" />
          <stop offset="100%" stopColor="#19D184" />
        </linearGradient>
      </defs>
      <g transform="rotate(45, 50, 50)">
        {/* Outer diamond */}
        <path
          d="M50 5 L95 50 L50 95 L5 50 Z"
          fill="none"
          stroke="url(#ritualGrad)"
          strokeWidth="3"
        />
        {/* Inner knot pattern - interlaced ribbons */}
        <path
          d="M50 20 L80 50 L50 80 L20 50 Z"
          fill="none"
          stroke="url(#ritualGrad)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Cross ribbons */}
        <path
          d="M35 35 L65 35 L65 65 L35 65 Z"
          fill="none"
          stroke="url(#ritualGrad)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Diagonal connectors */}
        <path
          d="M50 20 L35 35 M50 20 L65 35 M80 50 L65 35 M80 50 L65 65 M50 80 L65 65 M50 80 L35 65 M20 50 L35 65 M20 50 L35 35"
          fill="none"
          stroke="url(#ritualGrad)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Center diamond */}
        <path
          d="M50 35 L65 50 L50 65 L35 50 Z"
          fill="url(#ritualGrad)"
          opacity="0.3"
        />
      </g>
    </svg>
  )
}
