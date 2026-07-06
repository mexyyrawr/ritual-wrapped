import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.ritualfoundation.org'

async function rpcCall(method: string, params: any[] = []): Promise<any> {
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
  if (data.error) throw new Error(data.error.message)
  return data.result
}

/**
 * Binary search for first block where address had activity
 * Uses eth_getTransactionCount at different block heights
 * ~25 calls for 42M blocks (log2)
 */
async function findFirstActiveBlock(address: string, latestBlock: number): Promise<number | null> {
  // Quick check: if txCount is 0 at latest, no history
  const countHex = await rpcCall('eth_getTransactionCount', [address, 'latest'])
  const count = parseInt(countHex, 16)
  if (count === 0) return null

  let low = 1
  let high = latestBlock
  let steps = 0
  const MAX_STEPS = 25

  while (low < high && steps < MAX_STEPS) {
    const mid = Math.floor((low + high) / 2)
    try {
      const cHex = await rpcCall('eth_getTransactionCount', [address, '0x' + mid.toString(16)])
      const c = parseInt(cHex, 16)
      if (c > 0) {
        high = mid
      } else {
        low = mid + 1
      }
    } catch {
      break
    }
    steps++
  }
  return low
}

function getIndexedData() {
  try {
    const dataPath = path.join(process.cwd(), 'lib', 'indexed-data.json')
    if (!fs.existsSync(dataPath)) return null
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'))
  } catch {
    return null
  }
}

function getActivityLevel(txCount: number): { level: string; subtitle: string } {
  if (txCount > 500) return { level: 'Legend', subtitle: 'You ARE the chain' }
  if (txCount > 100) return { level: 'Power User', subtitle: 'You live on-chain' }
  if (txCount > 50) return { level: 'Active Builder', subtitle: 'Charting the chain' }
  if (txCount > 20) return { level: 'Explorer', subtitle: 'Creating the future' }
  if (txCount > 5) return { level: 'Rising', subtitle: 'Building momentum' }
  if (txCount > 0) return { level: 'Newcomer', subtitle: 'Welcome to the chain' }
  return { level: 'Fresh', subtitle: 'Your journey begins' }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    if (!address || !address.startsWith('0x') || address.length !== 42) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
    }

    const addrLower = address.toLowerCase()

    // === ALWAYS FRESH FROM RPC (2 calls, instant) ===
    const [balanceHex, txCountHex, latestHex] = await Promise.all([
      rpcCall('eth_getBalance', [address, 'latest']),
      rpcCall('eth_getTransactionCount', [address, 'latest']),
      rpcCall('eth_blockNumber', []),
    ])

    const balanceRitual = parseInt(balanceHex || '0x0', 16) / 1e18
    const txCount = parseInt(txCountHex || '0x0', 16)
    const latestBlock = parseInt(latestHex, 16)

    // === INDEXED DATA (bonus enrichment) ===
    const indexedData = getIndexedData()
    const addrData = indexedData?.addresses?.[addrLower]
    const blocksScanned = indexedData?.recentBlocks?.scanned || 0

    // === FIND FIRST ACTIVE BLOCK (binary search) ===
    let firstActiveBlock: number | null = null
    let walletAgeDays = 0

    if (addrData?.firstBlock) {
      // Use cached first block from indexer
      firstActiveBlock = addrData.firstBlock
    } else if (txCount > 0) {
      // Binary search (~25 RPC calls)
      firstActiveBlock = await findFirstActiveBlock(address, latestBlock)
    }

    if (firstActiveBlock) {
      walletAgeDays = Math.max(1, Math.floor((latestBlock - firstActiveBlock) / 5760))
    }

    // === MERGE DATA ===
    const totalSent = addrData?.totalSent || 0
    const totalReceived = addrData?.totalReceived || 0
    const totalMoved = totalSent + totalReceived
    const largestTx = addrData?.largestTx || 0
    const totalGasSpent = addrData?.totalGasSpent || 0
    const uniqueContracts = addrData?.contracts?.length || 0
    const recentTxCount = addrData?.recentTxCount || 0

    // Use the higher of indexed tx count or RPC tx count
    const displayTxCount = Math.max(addrData?.txCount || 0, txCount)

    const { level: activityLevel, subtitle } = getActivityLevel(displayTxCount)

    // Fun facts
    let funFact: string
    if (totalMoved > 1000) {
      funFact = `You've moved ${totalMoved.toFixed(2)} RITUAL on-chain! 🐋`
    } else if (displayTxCount > 500) {
      funFact = `${displayTxCount} txs! You're a Ritual Legend. 👑`
    } else if (displayTxCount > 100) {
      funFact = `${displayTxCount} transactions! You're a Ritual OG. 🔥`
    } else if (displayTxCount > 20) {
      funFact = `${displayTxCount} transactions deep into Ritual. 🚀`
    } else if (displayTxCount > 0) {
      funFact = `${displayTxCount} transactions and counting. 🌱`
    } else {
      funFact = 'Start your Ritual journey today!'
    }

    const stats = [
      { label: 'Balance', value: `${balanceRitual.toFixed(4)} RITUAL`, icon: '💰' },
      { label: 'Transactions', value: displayTxCount.toString(), icon: '📊' },
    ]

    if (totalMoved > 0) {
      stats.push({ label: 'Total Moved', value: `${totalMoved.toFixed(4)} RITUAL`, icon: '💸' })
    }
    if (largestTx > 0) {
      stats.push({ label: 'Largest Tx', value: `${largestTx.toFixed(4)} RITUAL`, icon: '🔥' })
    }
    if (walletAgeDays > 0) {
      stats.push({ label: 'Active Since', value: `~${walletAgeDays} days`, icon: '📅' })
    }
    if (uniqueContracts > 0) {
      stats.push({ label: 'Contracts', value: uniqueContracts.toString(), icon: '🔗' })
    }
    if (totalGasSpent > 0) {
      stats.push({ label: 'Gas Spent', value: `${totalGasSpent.toFixed(6)} RITUAL`, icon: '⛽' })
    }

    stats.push({ label: 'Activity', value: activityLevel, icon: '⚡' })

    return NextResponse.json({
      address,
      totalTransactions: displayTxCount,
      totalSent: totalSent.toFixed(4),
      totalReceived: totalReceived.toFixed(4),
      totalValueTransacted: totalMoved.toFixed(4),
      totalGasSpent: totalGasSpent.toFixed(6),
      largestTx: `${largestTx.toFixed(4)} RITUAL`,
      walletAgeDays,
      uniqueContracts,
      activeDays: walletAgeDays,
      currentBalance: balanceRitual.toFixed(4),
      activityScore: Math.min(100, displayTxCount),
      title: 'Ritual Recap',
      subtitle,
      stats,
      funFact,
      firstActiveBlock,
      blocksScanned,
    })
  } catch (error) {
    console.error('Wrapped API error:', error)
    return NextResponse.json({ error: 'Failed to fetch wallet data' }, { status: 500 })
  }
}
