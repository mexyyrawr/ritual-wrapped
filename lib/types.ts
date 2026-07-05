export interface WrappedData {
  address: string
  firstTxDate: string
  walletAgeDays: number
  totalTransactions: number
  totalGasSpent: string // in RITUAL
  totalValueTransacted: string // total value moved
  uniqueContracts: number
  largestTx: string
  activeDays: number
  currentBalance: string
  activityScore: number // 0-100
  monthlyAvg: number // tx per month
  title: string
  subtitle: string
  stats: Array<{ label: string; value: string; icon: string; color?: string }>
  funFact: string
}
