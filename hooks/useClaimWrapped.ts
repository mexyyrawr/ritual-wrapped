'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`

const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: 'uint256', name: '_totalTransactions', type: 'uint256' },
      { internalType: 'uint256', name: '_totalSent', type: 'uint256' },
      { internalType: 'uint256', name: '_totalReceived', type: 'uint256' },
      { internalType: 'uint256', name: '_totalGasSpent', type: 'uint256' },
      { internalType: 'uint256', name: '_largestTx', type: 'uint256' },
      { internalType: 'uint256', name: '_walletAgeDays', type: 'uint256' },
      { internalType: 'uint256', name: '_uniqueContracts', type: 'uint256' },
      { internalType: 'uint256', name: '_activityScore', type: 'uint256' },
      { internalType: 'string', name: '_activityLevel', type: 'string' },
      { internalType: 'string', name: '_funFact', type: 'string' },
    ],
    name: 'claimWrapped',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_address', type: 'address' }],
    name: 'hasClaimed',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

interface ClaimParams {
  totalTransactions: number
  totalSent: string
  totalReceived: string
  totalGasSpent: string
  largestTx: string
  walletAgeDays: number
  uniqueContracts: number
  activityScore: number
  activityLevel: string
  funFact: string
}

export function useClaimWrapped() {
  const { address } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const { writeContractAsync } = useWriteContract()

  const claim = async (params: ClaimParams) => {
    if (!address || !CONTRACT_ADDRESS) {
      setError('Wallet not connected or contract not configured')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'claimWrapped',
        args: [
          BigInt(params.totalTransactions),
          parseEther(params.totalSent),
          parseEther(params.totalReceived),
          parseEther(params.totalGasSpent),
          parseEther(params.largestTx),
          BigInt(params.walletAgeDays),
          BigInt(params.uniqueContracts),
          BigInt(params.activityScore),
          params.activityLevel,
          params.funFact,
        ],
      })

      setTxHash(hash)
      return hash
    } catch (err: any) {
      setError(err.message || 'Transaction failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return { claim, isLoading, error, txHash }
}
