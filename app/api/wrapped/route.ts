import { NextRequest, NextResponse } from 'next/server'
import type { WrappedData } from '@/lib/types'

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.ritualfoundation.org'

async function rpcCall(method: string, params: any[] = []) {
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
      id: Math.floor(Math.random() * 1000000),
    }),
  })
  const data = await response.json()
  return data.result
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    if (!address || !address.startsWith('0x') || address.length !== 42) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
    }

    // Fetch real data from RPC
    const [balance, txCount, code] = await Promise.all([
      rpcCall('eth_getBalance', [address, 'latest']),
      rpcCall('eth_getTransactionCount', [address, 'latest']),
      rpcCall('eth_getCode', [address, 'latest']),
    ])

    // Parse balance (real)
    const balanceWei = parseInt(balance || '0x0', 16)
    const balanceRitual = balanceWei / 1e18

    // Parse tx count (real)
    const totalTransactions = parseInt(txCount || '0x0', 16)

    // Is contract?
    const isContract = code && code !== '0x' && code !== '0x0'

    // Estimate wallet age (honest estimate based on tx count)
    // ~1 tx per 2-3 days is reasonable for testnet
    const walletAgeDays = Math.max(1, Math.floor(totalTransactions * 2))
    const firstTxDate = new Date(Date.now() - walletAgeDays * 24 * 60 * 60 * 1000)

    // Activity level based on tx count
    let activityLevel: string
    let subtitle: string
    if (totalTransactions > 100) {
      activityLevel = 'Power User'
      subtitle = 'You live on-chain'
    } else if (totalTransactions > 50) {
      activityLevel = 'Active Builder'
      subtitle = 'Charting the chain'
    } else if (totalTransactions > 10) {
      activityLevel = 'Explorer'
      subtitle = 'Creating the future'
    } else if (totalTransactions > 0) {
      activityLevel = 'Newcomer'
      subtitle = 'Welcome to the chain'
    } else {
      activityLevel = 'Fresh Wallet'
      subtitle = 'Your journey begins'
    }

    // Fun fact based on real data
    let funFact: string
    if (totalTransactions === 0) {
      funFact = "No transactions yet. Time to explore Ritual Chain!"
    } else if (balanceRitual > 10) {
      funFact = `You're holding ${balanceRitual.toFixed(2)} RITUAL. That's a solid bag! 💰`
    } else if (totalTransactions > 50) {
      funFact = `${totalTransactions} transactions! You're one of the most active wallets on Ritual. 🔥`
    } else {
      funFact = `${totalTransactions} transactions and ${balanceRitual.toFixed(4)} RITUAL in your wallet. Keep building! 🚀`
    }

    // Stats - only real data
    const stats = [
      {
        label: 'Balance',
        value: `${balanceRitual.toFixed(4)} RITUAL`,
        icon: '💰',
      },
      {
        label: 'Transactions',
        value: totalTransactions.toString(),
        icon: '📊',
      },
      {
        label: 'Active Since',
        value: `~${walletAgeDays} days`,
        icon: '📅',
      },
      {
        label: 'Activity Level',
        value: activityLevel,
        icon: '⚡',
      },
    ]

    const wrappedData: WrappedData = {
      address,
      firstTxDate: firstTxDate.toISOString(),
      walletAgeDays,
      totalTransactions,
      totalGasSpent: '0',
      totalValueTransacted: '0',
      uniqueContracts: 0,
      largestTx: '0',
      activeDays: walletAgeDays,
      currentBalance: balanceRitual.toFixed(4),
      activityScore: Math.min(100, totalTransactions),
      monthlyAvg: 0,
      title: 'Ritual Recap',
      subtitle,
      stats,
      funFact,
    }

    return NextResponse.json(wrappedData)
  } catch (error) {
    console.error('Wrapped API error:', error)
    return NextResponse.json({ error: 'Failed to fetch wallet data' }, { status: 500 })
  }
}
