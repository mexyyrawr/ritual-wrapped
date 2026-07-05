export interface WrappedData {
  address: string
  firstTxDate: string
  walletAgeDays: number
  totalTransactions: number
  totalGasSpent: string // in RITUAL
  uniqueContracts: number
  largestTx: string
  activeDays: number
  currentBalance: string
  title: string // AI-generated title like 'Ritual OG'
  subtitle: string // AI-generated subtitle
  stats: Array<{ label: string; value: string; icon: string }>
  funFact: string // AI-generated fun fact
}
