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

// Get recent transactions for an address by scanning recent blocks
async function getRecentTxs(address: string, blockCount: number = 100) {
  try {
    const latestBlock = await rpcCall('eth_blockNumber')
    const latestBlockNum = parseInt(latestBlock, 16)
    const fromBlock = Math.max(0, latestBlockNum - blockCount)
    
    // Get logs where address is sender or receiver
    const [sentLogs, receivedLogs] = await Promise.all([
      rpcCall('eth_getLogs', [{
        fromBlock: `0x${fromBlock.toString(16)}`,
        toBlock: 'latest',
        topics: [null, `0x${address.slice(2).padStart(64, '0')}`]
      }]),
      rpcCall('eth_getLogs', [{
        fromBlock: `0x${fromBlock.toString(16)}`,
        toBlock: 'latest',
        topics: [null, null, `0x${address.slice(2).padStart(64, '0')}`]
      }])
    ])
    
    return { sentLogs: sentLogs || [], receivedLogs: receivedLogs || [] }
  } catch {
    return { sentLogs: [], receivedLogs: [] }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    if (!address || !address.startsWith('0x')) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
    }

    // Fetch core data from RPC
    const [balance, txCount, code, blockNumber] = await Promise.all([
      rpcCall('eth_getBalance', [address, 'latest']),
      rpcCall('eth_getTransactionCount', [address, 'latest']),
      rpcCall('eth_getCode', [address, 'latest']),
      rpcCall('eth_blockNumber'),
    ])

    // Parse balance from hex to decimal (in wei)
    const balanceWei = parseInt(balance || '0x0', 16)
    const balanceRitual = balanceWei / 1e18

    // Parse tx count from hex
    const totalTransactions = parseInt(txCount || '0x0', 16)

    // Check if contract
    const isContract = code && code !== '0x' && code !== '0x0'

    // Current block number
    const currentBlock = parseInt(blockNumber || '0x0', 16)

    // Estimate wallet age based on tx count (more realistic)
    // Assume ~1 tx per 2 days for active users
    const walletAgeDays = Math.max(1, Math.floor(totalTransactions * 1.8))
    const firstTxDate = new Date(Date.now() - walletAgeDays * 24 * 60 * 60 * 1000)

    // Calculate estimated total RITUAL spent (gas + transfers)
    // Average gas per tx: ~0.001-0.005 RITUAL
    const avgGasPerTx = 0.002 + (Math.random() * 0.003) // Randomize slightly
    const totalGasSpent = totalTransactions * avgGasPerTx
    
    // Estimate total value transacted (balance + gas + some transfers)
    // Users typically have moved 3-10x their current balance
    const txMultiplier = 3 + (Math.random() * 7)
    const totalValueTransacted = (balanceRitual * txMultiplier) + totalGasSpent

    // Largest transaction estimate
    const largestTx = balanceRitual * (0.15 + Math.random() * 0.35)

    // Unique contracts (estimate based on activity)
    const uniqueContracts = Math.max(1, Math.floor(totalTransactions * 0.6))

    // Active days (days with at least 1 tx)
    const activeDays = Math.max(1, Math.floor(walletAgeDays * 0.4))

    // Monthly average transactions
    const monthlyAvg = Math.round(totalTransactions / Math.max(1, walletAgeDays / 30))

    // Activity score (0-100)
    const activityScore = Math.min(100, Math.floor(
      (totalTransactions * 0.3) + 
      (walletAgeDays * 0.1) + 
      (uniqueContracts * 0.5) + 
      (balanceRitual > 0 ? 20 : 0)
    ))

    // Generate title based on activity
    let title = 'Ritual Recap'
    let subtitle: string
    if (totalTransactions > 100) {
      subtitle = 'You live on-chain'
    } else if (totalTransactions > 50) {
      subtitle = 'Charting the chain'
    } else if (totalTransactions > 10) {
      subtitle = 'Creating the future'
    } else {
      subtitle = 'Welcome to the chain'
    }

    // Generate fun facts (pick the most interesting one)
    const funFacts = [
      `You've transacted ${(totalValueTransacted).toFixed(0)} RITUAL in total! ${totalValueTransacted > 100 ? '🐋' : '🚀'}`,
      `That's ${monthlyAvg} transactions per month on average. ${monthlyAvg > 10 ? 'Insane!' : 'Steady builder!'}`,
      `Your wallet has been active for ${walletAgeDays} days. ${walletAgeDays > 365 ? 'OG status!' : 'Growing strong!'}`,
      `You've interacted with ${uniqueContracts} unique contracts. ${uniqueContracts > 20 ? 'Power user!' : 'Explorer!'}`,
      `Your activity score: ${activityScore}/100. ${activityScore > 80 ? 'Top tier!' : activityScore > 50 ? 'Solid!' : 'Room to grow!'}`,
    ]
    const funFact = funFacts[Math.floor(Math.random() * funFacts.length)]

    // Stats array with more interesting data
    const stats = [
      {
        label: 'Total Spent',
        value: `${totalGasSpent.toFixed(2)} RITUAL`,
        icon: '⛽',
        color: 'from-red-500 to-orange-500',
      },
      {
        label: 'Total Transacted',
        value: `${totalValueTransacted.toFixed(1)} RITUAL`,
        icon: '💸',
        color: 'from-green-400 to-emerald-500',
      },
      {
        label: 'Transactions',
        value: totalTransactions.toString(),
        icon: '📊',
        color: 'from-blue-400 to-cyan-500',
      },
      {
        label: 'Biggest Tx',
        value: `${largestTx.toFixed(2)} RITUAL`,
        icon: '🔥',
        color: 'from-orange-400 to-yellow-500',
      },
      {
        label: 'Active Days',
        value: `${activeDays} days`,
        icon: '📅',
        color: 'from-purple-400 to-pink-500',
      },
      {
        label: 'Contracts Used',
        value: uniqueContracts.toString(),
        icon: '🔗',
        color: 'from-indigo-400 to-violet-500',
      },
      {
        label: 'Monthly Avg',
        value: `${monthlyAvg} tx/mo`,
        icon: '📈',
        color: 'from-teal-400 to-cyan-500',
      },
      {
        label: 'Current Balance',
        value: `${balanceRitual.toFixed(4)} RITUAL`,
        icon: '💰',
        color: 'from-yellow-400 to-amber-500',
      },
    ]

    const wrappedData: WrappedData = {
      address,
      firstTxDate: firstTxDate.toISOString(),
      walletAgeDays,
      totalTransactions,
      totalGasSpent: totalGasSpent.toFixed(3),
      totalValueTransacted: totalValueTransacted.toFixed(2),
      uniqueContracts,
      largestTx: `${largestTx.toFixed(2)} RITUAL`,
      activeDays,
      currentBalance: balanceRitual.toFixed(4),
      activityScore,
      monthlyAvg,
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
