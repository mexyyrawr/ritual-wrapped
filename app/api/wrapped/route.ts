import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.ritualfoundation.org'

// Load indexed data (live - updates as indexer runs)
function getIndexedData() {
  try {
    const dataPath = path.join(process.cwd(), 'lib', 'indexed-data.json')
    if (!fs.existsSync(dataPath)) return null
    const raw = fs.readFileSync(dataPath, 'utf8')
    return JSON.parse(raw)
  } catch (e) {
    return null
  }
}

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

    const addrLower = address.toLowerCase()

    // Get current balance from RPC (always fresh)
    const [balanceHex, txCountHex] = await Promise.all([
      rpcCall('eth_getBalance', [address, 'latest']),
      rpcCall('eth_getTransactionCount', [address, 'latest']),
    ])
    const balanceWei = parseInt(balanceHex || '0x0', 16)
    const balanceRitual = balanceWei / 1e18
    const txCount = parseInt(txCountHex || '0x0', 16)

    // Try indexed data
    const indexedData = getIndexedData()
    const addrData = indexedData?.addresses?.[addrLower]
    const blocksScanned = indexedData?.lastBlock || 0
    const totalBlocks = 42000000 // approximate
    const indexProgress = Math.min(100, (blocksScanned / totalBlocks) * 100)

    if (addrData) {
      // Use indexed data
      const walletAgeDays = addrData.firstBlock && addrData.lastBlock
        ? Math.max(1, Math.floor((addrData.lastBlock - addrData.firstBlock) / 5760))
        : 0

      const totalSent = addrData.totalSent || 0
      const totalReceived = addrData.totalReceived || 0
      const totalMoved = totalSent + totalReceived
      const indexedTxCount = addrData.txCount || 0

      // Activity level based on real tx count
      let activityLevel: string
      let subtitle: string
      if (indexedTxCount > 100 || txCount > 100) {
        activityLevel = 'Power User'
        subtitle = 'You live on-chain'
      } else if (indexedTxCount > 50 || txCount > 50) {
        activityLevel = 'Active Builder'
        subtitle = 'Charting the chain'
      } else if (indexedTxCount > 10 || txCount > 10) {
        activityLevel = 'Explorer'
        subtitle = 'Creating the future'
      } else {
        activityLevel = 'Newcomer'
        subtitle = 'Welcome to the chain'
      }

      // Use the higher of indexed tx count or RPC tx count
      const displayTxCount = Math.max(indexedTxCount, txCount)

      let funFact: string
      if (totalMoved > 1000) {
        funFact = `You've moved ${totalMoved.toFixed(2)} RITUAL on-chain! 🐋`
      } else if (displayTxCount > 100) {
        funFact = `${displayTxCount} transactions! You're a Ritual OG. 🔥`
      } else if (displayTxCount > 0) {
        funFact = `${displayTxCount} transactions on Ritual Chain. 🚀`
      } else {
        funFact = 'Start your Ritual journey today!'
      }

      const stats = [
        { label: 'Balance', value: `${balanceRitual.toFixed(4)} RITUAL`, icon: '💰' },
        { label: 'Transactions', value: displayTxCount.toString(), icon: '📊' },
        { label: 'Total Moved', value: `${totalMoved.toFixed(4)} RITUAL`, icon: '💸' },
        { label: 'Largest Tx', value: `${(addrData.largestTx || 0).toFixed(4)} RITUAL`, icon: '🔥' },
        { label: 'Active Since', value: walletAgeDays > 0 ? `~${walletAgeDays} days` : 'N/A', icon: '📅' },
        { label: 'Contracts', value: (addrData.contracts?.length || 0).toString(), icon: '🔗' },
        { label: 'Activity', value: activityLevel, icon: '⚡' },
        { label: 'Data', value: `${indexProgress.toFixed(0)}% indexed`, icon: '🧱' },
      ]

      return NextResponse.json({
        address,
        totalTransactions: displayTxCount,
        totalSent: totalSent.toFixed(4),
        totalReceived: totalReceived.toFixed(4),
        totalValueTransacted: totalMoved.toFixed(4),
        totalGasSpent: (addrData.totalGasSpent || 0).toFixed(6),
        largestTx: `${(addrData.largestTx || 0).toFixed(4)} RITUAL`,
        walletAgeDays,
        uniqueContracts: addrData.contracts?.length || 0,
        activeDays: walletAgeDays,
        currentBalance: balanceRitual.toFixed(4),
        activityScore: Math.min(100, displayTxCount),
        monthlyAvg: 0,
        title: 'Ritual Recap',
        subtitle,
        stats,
        funFact,
        isIndexed: true,
        indexProgress: indexProgress.toFixed(1),
        blocksScanned,
      })
    }

    // No indexed data - use RPC only
    let activityLevel: string
    let subtitle: string
    if (txCount > 100) {
      activityLevel = 'Power User'
      subtitle = 'You live on-chain'
    } else if (txCount > 50) {
      activityLevel = 'Active Builder'
      subtitle = 'Charting the chain'
    } else if (txCount > 10) {
      activityLevel = 'Explorer'
      subtitle = 'Creating the future'
    } else if (txCount > 0) {
      activityLevel = 'Newcomer'
      subtitle = 'Welcome to the chain'
    } else {
      activityLevel = 'Fresh'
      subtitle = 'Your journey begins'
    }

    const stats = [
      { label: 'Balance', value: `${balanceRitual.toFixed(4)} RITUAL`, icon: '💰' },
      { label: 'Transactions', value: txCount.toString(), icon: '📊' },
      { label: 'Activity', value: activityLevel, icon: '⚡' },
      { label: 'Data', value: `${indexProgress.toFixed(0)}% indexed`, icon: '🧱' },
    ]

    return NextResponse.json({
      address,
      totalTransactions: txCount,
      totalSent: '0',
      totalReceived: '0',
      totalValueTransacted: '0',
      totalGasSpent: '0',
      largestTx: '0',
      walletAgeDays: 0,
      uniqueContracts: 0,
      activeDays: 0,
      currentBalance: balanceRitual.toFixed(4),
      activityScore: Math.min(100, txCount),
      monthlyAvg: 0,
      title: 'Ritual Recap',
      subtitle,
      stats,
      funFact: txCount > 0
        ? `${txCount} transactions found. Indexer still scanning (${indexProgress.toFixed(0)}%)...`
        : 'No data yet. Indexer is still scanning the chain!',
      isIndexed: false,
      indexProgress: indexProgress.toFixed(1),
      blocksScanned,
    })
  } catch (error) {
    console.error('Wrapped API error:', error)
    return NextResponse.json({ error: 'Failed to fetch wallet data' }, { status: 500 })
  }
}
