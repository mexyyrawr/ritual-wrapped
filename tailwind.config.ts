import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ritual-black': '#000000',
        'ritual-elevated': '#111827',
        'ritual-surface': '#1F2937',
        'ritual-green': '#19D184',
        'ritual-lime': '#BFFF00',
        'ritual-pink': '#FF1DCE',
        'ritual-gold': '#FACC15',
      },
      fontFamily: {
        display: ['Archivo Black', 'system-ui', 'sans-serif'],
        body: ['Barlow', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(25, 209, 132, 0.3), 0 0 40px rgba(25, 209, 132, 0.1)',
        'glow-pink': '0 0 20px rgba(255, 29, 206, 0.3), 0 0 40px rgba(255, 29, 206, 0.1)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}

export default config
