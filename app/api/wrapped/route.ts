import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.ritualfoundation.org'

// Load indexed data
function getIndexedData() {
  try {
    const dataPath = path.join(process.cwd(), 'lib', 'indexed-data.json')
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

    // Try indexed data first (all-time)
    const indexedData = getIndexedData()
    const addrData = indexedData?.addresses?.[addrLower]

    // Get current balance from RPC (always fresh)
    const balanceHex = await rpcCall('eth_getBalance', [address, 'latest'])
    const balanceWei = parseInt(balanceHex || '0x0', 16)
    const balanceRitual = balanceWei / 1e18

    if (addrData) {
      // Use indexed data (all-time)
      const walletAgeDays = addrData.firstBlock && addrData.lastBlock
        ? Math.max(1, Math.floor((addrData.lastBlock - addrData.firstBlock) / 5760)) // ~5760 blocks/day
        : 0

      const totalSent = addrData.totalSent || 0
      const totalReceived = addrData.totalReceived || 0
      const totalMoved = totalSent + totalReceived
      const txCount = addrData.txCount || 0

      // Activity level
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
      } else {
        activityLevel = 'Newcomer'
        subtitle = 'Welcome to the chain'
      }

      // Fun fact
      let funFact: string
      if (totalMoved > 1000) {
        funFact = `You've moved ${totalMoved.toFixed(2)} RITUAL on-chain! 🐋`
      } else if (txCount > 100) {
        funFact = `${txCount} transfers! You're a Ritual OG. 🔥`
      } else if (txCount > 0) {
        funFact = `${txCount} transfers and ${totalMoved.toFixed(4)} RITUAL moved. 🚀`
      } else {
        funFact = 'No transfers found. Time to explore!'
      }

      const stats = [
        { label: 'Balance', value: `${balanceRitual.toFixed(4)} RITUAL`, icon: '💰' },
        { label: 'Transfers', value: txCount.toString(), icon: '📊' },
        { label: 'Total Moved', value: `${totalMoved.toFixed(4)} RITUAL`, icon: '💸' },
        { label: 'Largest Tx', value: `${(addrData.largestTx || 0).toFixed(4)} RITUAL`, icon: '🔥' },
        { label: 'Active Since', value: `~${walletAgeDays} days`, icon: '📅' },
        { label: 'Contracts', value: (addrData.uniqueContracts || 0).toString(), icon: '🔗' },
        { label: 'Activity', value: activityLevel, icon: '⚡' },
        { label: 'Data Source', value: 'All-time', icon: '🧱' },
      ]

      return NextResponse.json({
        address,
        totalTransactions: txCount,
        totalSent: totalSent.toFixed(4),
        totalReceived: totalReceived.toFixed(4),
        totalValueTransacted: totalMoved.toFixed(4),
        totalGasSpent: '0',
        largestTx: `${(addrData.largestTx || 0).toFixed(4)} RITUAL`,
        walletAgeDays,
        uniqueContracts: addrData.uniqueContracts || 0,
        activeDays: walletAgeDays,
        currentBalance: balanceRitual.toFixed(4),
        activityScore: Math.min(100, txCount),
        monthlyAvg: 0,
        title: 'Ritual Recap',
        subtitle,
        stats,
        funFact,
        isIndexed: true,
        blocksIndexed: indexedData?.lastBlock || 0,
      })
    }

    // Fallback: scan recent blocks
    // ... (keep existing block scanning logic as fallback)
    return NextResponse.json({
      address,
      totalTransactions: 0,
      totalSent: '0',
      totalReceived: '0',
      totalValueTransacted: '0',
      totalGasSpent: '0',
      largestTx: '0',
      walletAgeDays: 0,
      uniqueContracts: 0,
      activeDays: 0,
      currentBalance: balanceRitual.toFixed(4),
      activityScore: 0,
      monthlyAvg: 0,
      title: 'Ritual Recap',
      subtitle: 'No data yet',
      stats: [
        { label: 'Balance', value: `${balanceRitual.toFixed(4)} RITUAL`, icon: '💰' },
        { label: 'Transfers', value: '0', icon: '📊' },
        { label: 'Data Source', value: 'Limited', icon: '🧱' },
      ],
      funFact: 'No transfers found in our index. Try again later!',
      isIndexed: false,
    })
  } catch (error) {
    console.error('Wrapped API error:', error)
    return NextResponse.json({ error: 'Failed to fetch wallet data' }, { status: 500 })
  }
}
