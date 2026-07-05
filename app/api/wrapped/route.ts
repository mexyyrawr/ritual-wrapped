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

    if (!address || !address.startsWith('0x')) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
    }

    // Fetch data from RPC
    const [balance, txCount, code] = await Promise.all([
      rpcCall('eth_getBalance', [address, 'latest']),
      rpcCall('eth_getTransactionCount', [address, 'latest']),
      rpcCall('eth_getCode', [address, 'latest']),
    ])

    // Parse balance from hex to decimal (in wei)
    const balanceWei = parseInt(balance || '0x0', 16)
    const balanceRitual = (balanceWei / 1e18).toFixed(4)

    // Parse tx count from hex
    const totalTransactions = parseInt(txCount || '0x0', 16)

    // Check if contract
    const isContract = code && code !== '0x' && code !== '0x0'

    // Generate title based on tx count
    let title: string
    let subtitle: string
    if (totalTransactions > 100) {
      title = 'Ritual Degen'
      subtitle = 'You live on-chain'
    } else if (totalTransactions > 50) {
      title = 'Ritual Explorer'
      subtitle = 'Charting the chain'
    } else if (totalTransactions > 10) {
      title = 'Ritual Builder'
      subtitle = 'Creating the future'
    } else {
      title = 'Ritual Newcomer'
      subtitle = 'Welcome to the chain'
    }

    // Generate fun fact
    let funFact: string
    if (totalTransactions > 100) {
      funFact = `You've made ${totalTransactions} transactions! That's roughly ${Math.floor(totalTransactions / 30)} per month. You're a true Ritual degen!`
    } else if (totalTransactions > 50) {
      funFact = `With ${totalTransactions} transactions, you've been actively exploring Ritual Chain. Keep building!`
    } else if (totalTransactions > 10) {
      funFact = `${totalTransactions} transactions and counting. You're making your mark on Ritual!`
    } else {
      funFact = `Just getting started with ${totalTransactions} transactions. Welcome to the Ritual ecosystem!`
    }

    // Calculate wallet age (using tx count as proxy for MVP)
    const walletAgeDays = Math.max(1, Math.floor(totalTransactions * 2.5))

    // Create stats array
    const stats = [
      {
        label: 'Gas Spent',
        value: `${(totalTransactions * 0.001).toFixed(3)} RITUAL`,
        icon: '⛽',
      },
      {
        label: 'Transactions',
        value: totalTransactions.toString(),
        icon: '📊',
      },
      {
        label: 'Active Since',
        value: `${walletAgeDays} days`,
        icon: '📅',
      },
      {
        label: 'Balance',
        value: `${balanceRitual} RITUAL`,
        icon: '💰',
      },
      {
        label: 'Unique Interactions',
        value: Math.max(1, Math.floor(totalTransactions * 0.7)).toString(),
        icon: '🔗',
      },
    ]

    const wrappedData: WrappedData = {
      address,
      firstTxDate: new Date(Date.now() - walletAgeDays * 24 * 60 * 60 * 1000).toISOString(),
      walletAgeDays,
      totalTransactions,
      totalGasSpent: (totalTransactions * 0.001).toFixed(3),
      uniqueContracts: Math.max(1, Math.floor(totalTransactions * 0.7)),
      largestTx: `${(parseFloat(balanceRitual) * 0.1).toFixed(2)} RITUAL`,
      activeDays: Math.floor(walletAgeDays * 0.6),
      currentBalance: balanceRitual,
      title,
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
