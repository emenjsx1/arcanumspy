export interface FinancialStats {
  totalRevenue: number
  monthlyRevenue: number
  totalSubscriptions: number
  monthlySubscriptions: number
}

export interface Subscription {
  id: string
  user_id: string
  user_name?: string
  user_email?: string
  plan_name?: string
  amount_cents?: number
  created_at: string
}

export interface ToolStats {
  voiceGeneration: {
    totalVoices: number
  }
  audioGeneration: {
    totalGenerations: number
  }
  offerViews: {
    totalViews: number
  }
}



