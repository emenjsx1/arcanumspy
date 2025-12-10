export type UserRole = 'user' | 'admin'

export type PlanType = 'free' | 'pro' | 'elite'

export type OfferStatus = 'active' | 'inactive'

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export type LogType = 'login' | 'action' | 'admin_change'

export interface User {
  id: string
  name: string
  email: string
  plan: PlanType
  role: UserRole
  status: 'active' | 'inactive' | 'banned'
  createdAt: string
  avatar?: string
  preferences?: {
    favoriteNiches?: string[]
    theme?: 'light' | 'dark'
  }
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
  order: number
  offerCount?: number
}

export interface Plan {
  id: string
  name: string
  type: PlanType
  description: string
  priceMonthly: number
  priceYearly: number
  limits: {
    offersVisible: number
    favorites: number
    categories: string[]
    fullAnalysis: boolean
  }
  features: string[]
}

export interface Offer {
  id: string
  title: string
  bigIdea: string
  niche: string
  country: string
  category: string
  categoryId: string
  status: OfferStatus
  originalUrl: string
  thumbnail?: string
  structure: {
    headline: string
    subheadline?: string
    hook: string
    angles: string[]
    bullets: string[]
    cta: string
  }
  analysis: {
    whyItConverts: string
    alternativeAngles: string[]
    creatorNotes?: string
  }
  creatives: string[]
  conversion?: number
  vslSize?: string
  format?: 'longform' | 'advertorial' | 'quiz' | 'shortform' | 'video'
  productType?: string
  views?: number
  createdAt: string
  updatedAt: string
}

export interface Favorite {
  id: string
  userId: string
  offerId: string
  offer: Offer
  personalNotes?: string
  createdAt: string
}

export interface Payment {
  id: string
  userId: string
  plan: PlanType
  amount: number
  status: 'completed' | 'pending' | 'failed'
  date: string
  nextBillingDate?: string
  invoiceUrl?: string
}

export interface Log {
  id: string
  type: LogType
  userId?: string
  userEmail?: string
  action: string
  ipAddress?: string
  timestamp: string
}

export interface Ticket {
  id: string
  userId: string
  userEmail: string
  subject: string
  message: string
  status: TicketStatus
  priority: 'low' | 'medium' | 'high'
  assignedTo?: string
  responses: TicketResponse[]
  createdAt: string
  updatedAt: string
}

export interface TicketResponse {
  id: string
  ticketId: string
  userId: string
  isAdmin: boolean
  message: string
  createdAt: string
}

export interface LandingContent {
  hero: {
    headline: string
    subheadline: string
    ctaText: string
    image?: string
  }
  socialProof: {
    numbers: Array<{ label: string; value: string }>
    logos?: string[]
  }
  benefits: Array<{ title: string; description: string; icon?: string }>
  faq: Array<{ question: string; answer: string }>
  footer: {
    links: Array<{ label: string; href: string }>
    copyright: string
  }
}


