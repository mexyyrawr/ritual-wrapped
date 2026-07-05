# Ritual Wrapped

Your on-chain story on Ritual Chain (Chain ID 1979). Generate beautiful "Wrapped" style cards showcasing your wallet activity.

## Features

- 🎭 **Wallet Analysis** - View your transaction history, gas spent, and activity metrics
- 📊 **Stats Dashboard** - Beautiful cards with key on-chain statistics
- 🎨 **Ritual Design** - Premium dark theme with green/lime accents
- 🔗 **Share on X** - Share your Ritual Wrapped on social media

## Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom Ritual design tokens
- **Web3**: Wagmi + Viem for wallet connection
- **Chain**: Ritual Chain (ID 1979)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ritual-wrapped.git
cd ritual-wrapped

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Vercel will auto-detect Next.js and configure build settings
4. Deploy!

### Environment Variables

- `NEXT_PUBLIC_RPC_URL` - Ritual Chain RPC endpoint (default: https://rpc.ritualfoundation.org)

## Project Structure

```
ritual-wrapped/
├── app/
│   ├── api/
│   │   ├── rpc/          # RPC proxy to avoid CORS
│   │   └── wrapped/      # Wallet analysis endpoint
│   ├── globals.css       # Global styles & Ritual design tokens
│   ├── layout.tsx        # Root layout with fonts
│   ├── page.tsx          # Main page component
│   └── providers.tsx     # Wagmi & Query providers
├── components/
│   ├── Header.tsx        # Navigation with wallet connect
│   └── WrappedCard.tsx   # Shareable card component
├── lib/
│   ├── chain.ts          # Ritual chain definition
│   ├── types.ts          # TypeScript interfaces
│   └── wagmi.ts          # Wagmi configuration
└── public/               # Static assets
```

## Design System

- **Colors**: Black (#000), Elevated (#111827), Surface (#1F2937), Green (#19D184), Lime (#BFFF00), Pink (#FF1DCE)
- **Fonts**: Archivo Black (display), Barlow (body), JetBrains Mono (data)
- **Style**: Dark mode only, green glow effects, premium crypto-native aesthetic

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see LICENSE for details
