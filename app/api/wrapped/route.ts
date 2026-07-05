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

// Scan blocks to find real transactions for an address
async function scanBlocksForAddress(address: string, blocksToScan: number = 500) {
  const addressLower = address.toLowerCase()
  
  // Get latest block
  const latestBlockHex = await rpcCall('eth_blockNumber')
  const latestBlock = parseInt(latestBlockHex, 16)
  const fromBlock = Math.max(0, latestBlock - blocksToScan)
  
  let totalGasSpent = 0
  let totalValueTransacted = 0
  let largestTx = 0
  let firstTxTimestamp: number | null = null
  let lastTxTimestamp: number | null = null
  let txCount = 0
  let uniqueContracts = new Set<string>()
  
  // Scan in batches of 20 blocks
  const batchSize = 20
  for (let i = fromBlock; i <= latestBlock; i += batchSize) {
    const batchEnd = Math.min(i + batchSize - 1, latestBlock)
    
    // Fetch blocks in parallel
    const blockPromises = []
    for (let j = i; j <= batchEnd; j++) {
      blockPromises.push(
        rpcCall('eth_getBlockByNumber', [`0x${j.toString(16)}`, true])
      )
    }
    
    const blocks = await Promise.all(blockPromises)
    
    for (const block of blocks) {
      if (!block || !block.transactions) continue
      
      const blockTimestamp = parseInt(block.timestamp, 16) * 1000
      
      for (const tx of block.transactions) {
        const from = tx.from?.toLowerCase()
        const to = tx.to?.toLowerCase()
        
        if (from === addressLower || to === addressLower) {
          txCount++
          
          // Calculate value
          const value = parseInt(tx.value || '0x0', 16) / 1e18
          totalValueTransacted += value
          
          if (value > largestTx) {
            largestTx = value
          }
          
          // Track unique contracts
          if (to && to !== addressLower) {
            uniqueContracts.add(to)
          }
          
          // Track timestamps
          if (!firstTxTimestamp || blockTimestamp < firstTxTimestamp) {
            firstTxTimestamp = blockTimestamp
          }
          if (!lastTxTimestamp || blockTimestamp > lastTxTimestamp) {
            lastTxTimestamp = blockTimestamp
          }
          
          // Get gas used from receipt (skip for speed, estimate later)
          // We'll estimate gas spent based on gas price * gas limit
          const gasPrice = parseInt(tx.gasPrice || '0x0', 16)
          const gasLimit = parseInt(tx.gas || '0x5208', 16) // default 21000
          totalGasSpent += (gasPrice * gasLimit) / 1e18
        }
      }
    }
  }
  
  return {
    txCount,
    totalGasSpent,
    totalValueTransacted,
    largestTx,
    firstTxTimestamp,
    lastTxTimestamp,
    uniqueContracts: uniqueContracts.size,
    blocksScanned: blocksToScan,
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    if (!address || !address.startsWith('0x') || address.length !== 42) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
    }

    // Fetch balance and scan blocks in parallel
    const [balance, code, scanData] = await Promise.all([
      rpcCall('eth_getBalance', [address, 'latest']),
      rpcCall('eth_getCode', [address, 'latest']),
      scanBlocksForAddress(address, 500), // Scan last 500 blocks
    ])

    // Parse balance
    const balanceWei = parseInt(balance || '0x0', 16)
    const balanceRitual = balanceWei / 1e18

    // Check if contract
    const isContract = code && code !== '0x' && code !== '0x0'

    // Calculate wallet age from actual timestamps
    let walletAgeDays = 0
    let firstTxDate = new Date()
    if (scanData.firstTxTimestamp) {
      walletAgeDays = Math.max(1, Math.floor((Date.now() - scanData.firstTxTimestamp) / (24 * 60 * 60 * 1000)))
      firstTxDate = new Date(scanData.firstTxTimestamp)
    }

    // Activity level based on real tx count
    let activityLevel: string
    let subtitle: string
    if (scanData.txCount > 100) {
      activityLevel = 'Power User'
      subtitle = 'You live on-chain'
    } else if (scanData.txCount > 50) {
      activityLevel = 'Active Builder'
      subtitle = 'Charting the chain'
    } else if (scanData.txCount > 10) {
      activityLevel = 'Explorer'
      subtitle = 'Creating the future'
    } else if (scanData.txCount > 0) {
      activityLevel = 'Newcomer'
      subtitle = 'Welcome to the chain'
    } else {
      activityLevel = 'Fresh Wallet'
      subtitle = 'Your journey begins'
    }

    // Fun fact based on real data
    let funFact: string
    if (scanData.txCount === 0) {
      funFact = `No transactions found in the last ${scanData.blocksScanned} blocks. Time to explore!`
    } else if (scanData.totalValueTransacted > 10) {
      funFact = `You've moved ${scanData.totalValueTransacted.toFixed(2)} RITUAL on-chain! 🐋`
    } else if (scanData.txCount > 20) {
      funFact = `${scanData.txCount} transactions found! You're an active Ritual user. 🔥`
    } else {
      funFact = `Found ${scanData.txCount} transactions in the last ${scanData.blocksScanned} blocks. 🚀`
    }

    // Stats - all real data
    const stats = [
      {
        label: 'Balance',
        value: `${balanceRitual.toFixed(4)} RITUAL`,
        icon: '💰',
      },
      {
        label: 'Transactions',
        value: scanData.txCount.toString(),
        icon: '📊',
      },
      {
        label: 'Total Moved',
        value: `${scanData.totalValueTransacted.toFixed(4)} RITUAL`,
        icon: '💸',
      },
      {
        label: 'Biggest Tx',
        value: `${scanData.largestTx.toFixed(4)} RITUAL`,
        icon: '🔥',
      },
      {
        label: 'Contracts Used',
        value: scanData.uniqueContracts.toString(),
        icon: '🔗',
      },
      {
        label: 'Wallet Type',
        value: isContract ? 'Contract' : 'EOA',
        icon: '🔍',
      },
      {
        label: 'Active Since',
        value: walletAgeDays > 0 ? `${walletAgeDays} days ago` : 'N/A',
        icon: '📅',
      },
      {
        label: 'Blocks Scanned',
        value: scanData.blocksScanned.toString(),
        icon: '🧱',
      },
    ]

    const wrappedData: WrappedData = {
      address,
      firstTxDate: firstTxDate.toISOString(),
      walletAgeDays,
      totalTransactions: scanData.txCount,
      totalGasSpent: scanData.totalGasSpent.toFixed(6),
      totalValueTransacted: scanData.totalValueTransacted.toFixed(4),
      uniqueContracts: scanData.uniqueContracts,
      largestTx: `${scanData.largestTx.toFixed(4)} RITUAL`,
      activeDays: walletAgeDays,
      currentBalance: balanceRitual.toFixed(4),
      activityScore: Math.min(100, scanData.txCount),
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
