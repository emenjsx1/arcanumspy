export interface FinancialStats {
  totalCreditsLoaded: number
  totalCreditsConsumed: number
  totalRevenue: number
  monthlyRevenue: number
  totalPurchases: number
  monthlyPurchases: number
}

export interface CreditPurchase {
  id: string
  user_id: string
  user_name?: string
  user_email?: string
  amount: number
  created_at: string
}

export interface ToolStats {
  voiceGeneration: {
    totalVoices: number
    totalCredits: number
    averageCreditsPerGeneration: number
  }
  audioGeneration: {
    totalGenerations: number
    totalCredits: number
    averageCreditsPerGeneration: number
  }
  offerViews: {
    totalViews: number
  }
}



