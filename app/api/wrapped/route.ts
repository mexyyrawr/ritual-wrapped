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
    const [balanceHex, txCountHex] = await Promise.all([
      rpcCall('eth_getBalance', [address, 'latest']),
      rpcCall('eth_getTransactionCount', [address, 'latest']),
    ])

    const balanceRitual = parseInt(balanceHex || '0x0', 16) / 1e18
    const txCount = parseInt(txCountHex || '0x0', 16)

    // === INDEXED DATA (bonus enrichment) ===
    const indexedData = getIndexedData()
    const addrData = indexedData?.addresses?.[addrLower]
    const blocksScanned = indexedData?.recentBlocks?.scanned || 0

    // === MERGE DATA ===
    // Use the HIGHER tx count (RPC = all-time, indexed = recent only)
    const displayTxCount = Math.max(addrData?.txCount || 0, txCount)

    const totalSent = addrData?.totalSent || 0
    const totalReceived = addrData?.totalReceived || 0
    const totalMoved = totalSent + totalReceived
    const largestTx = addrData?.largestTx || 0
    const totalGasSpent = addrData?.totalGasSpent || 0
    const uniqueContracts = addrData?.contracts?.length || 0
    const firstBlock = addrData?.firstBlock || null
    const lastBlock = addrData?.lastBlock || null

    // Wallet age: fetch actual timestamps from blocks
    let walletAgeDays = 0
    if (firstBlock && lastBlock) {
      try {
        const [firstBlockData, lastBlockData] = await Promise.all([
          rpcCall('eth_getBlockByNumber', ['0x' + firstBlock.toString(16), false]),
          rpcCall('eth_getBlockByNumber', ['0x' + lastBlock.toString(16), false]),
        ])
        const firstTs = parseInt(firstBlockData?.timestamp || '0x0', 16)
        const lastTs = parseInt(lastBlockData?.timestamp || '0x0', 16)
        if (firstTs > 0 && lastTs > firstTs) {
          // Timestamps are in milliseconds
          walletAgeDays = Math.max(1, Math.floor((lastTs - firstTs) / (1000 * 60 * 60 * 24)))
        }
      } catch {
        // Fallback: estimate using actual block time (~268s per block for Ritual Testnet)
        walletAgeDays = Math.max(1, Math.floor((lastBlock - firstBlock) * 268 / 86400))
      }
    }

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
      largestTx: largestTx.toFixed(4),
      walletAgeDays,
      uniqueContracts,
      activeDays: walletAgeDays,
      currentBalance: balanceRitual.toFixed(4),
      activityScore: Math.min(100, displayTxCount),
      title: 'Ritual Recap',
      subtitle,
      stats,
      funFact,
      blocksScanned,
    })
  } catch (error) {
    console.error('Wrapped API error:', error)
    return NextResponse.json({ error: 'Failed to fetch wallet data' }, { status: 500 })
  }
}
