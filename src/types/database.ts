export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'user' | 'admin'
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled'
export type AssetType = 'vsl_page' | 'vsl_script' | 'copy' | 'creatives' | 'screenshot' | 'other'
export type TicketStatus = 'open' | 'in_progress' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high'
export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded'
export type FromRole = 'user' | 'admin'
export type FunnelType = 'vsl' | 'sl' | 'quiz' | 'advertorial' | 'longform' | 'other'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          role: UserRole
          phone_number: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          role?: UserRole
          phone_number?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: UserRole
          phone_number?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      plans: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          price_monthly_cents: number
          max_offers_visible: number | null
          max_favorites: number | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          price_monthly_cents?: number
          max_offers_visible?: number | null
          max_favorites?: number | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          price_monthly_cents?: number
          max_offers_visible?: number | null
          max_favorites?: number | null
          is_active?: boolean
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          status: SubscriptionStatus
          started_at: string
          current_period_end: string
          cancelled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          status?: SubscriptionStatus
          started_at?: string
          current_period_end: string
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          status?: SubscriptionStatus
          started_at?: string
          current_period_end?: string
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          emoji: string | null
          description: string | null
          is_premium: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          emoji?: string | null
          description?: string | null
          is_premium?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          emoji?: string | null
          description?: string | null
          is_premium?: boolean
          created_at?: string
        }
      }
      offers: {
        Row: {
          id: string
          title: string
          short_description: string | null
          category_id: string
          niche_id: string | null
          country: string
          funnel_type: string
          temperature: string
          product_type: string | null
          main_url: string
          facebook_ads_url: string | null
          landing_page_url: string | null
          page_name: string | null
          ad_text: string | null
          creative_asset_urls: Json | null
          ad_library_snapshot: Json | null
          vsl_url: string | null
          drive_copy_url: string | null
          drive_creatives_url: string | null
          quiz_url: string | null
          conversion_rate: number | null
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          title: string
          short_description?: string | null
          category_id: string
          niche_id?: string | null
          country: string
          funnel_type: string
          temperature: string
          product_type?: string | null
          main_url: string
          facebook_ads_url?: string | null
          landing_page_url?: string | null
          page_name?: string | null
          ad_text?: string | null
          creative_asset_urls?: Json | null
          ad_library_snapshot?: Json | null
          vsl_url?: string | null
          drive_copy_url?: string | null
          drive_creatives_url?: string | null
          quiz_url?: string | null
          conversion_rate?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          title?: string
          short_description?: string | null
          category_id?: string
          niche_id?: string | null
          country?: string
          funnel_type?: string
          temperature?: string
          product_type?: string | null
          main_url?: string
          facebook_ads_url?: string | null
          landing_page_url?: string | null
          page_name?: string | null
          ad_text?: string | null
          creative_asset_urls?: Json | null
          ad_library_snapshot?: Json | null
          vsl_url?: string | null
          drive_copy_url?: string | null
          drive_creatives_url?: string | null
          quiz_url?: string | null
          conversion_rate?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      offer_assets: {
        Row: {
          id: string
          offer_id: string
          asset_type: AssetType
          storage_url: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          offer_id: string
          asset_type: AssetType
          storage_url: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          offer_id?: string
          asset_type?: AssetType
          storage_url?: string
          description?: string | null
          created_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          offer_id: string
          personal_notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          offer_id: string
          personal_notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          offer_id?: string
          personal_notes?: string | null
          created_at?: string
        }
      }
      offer_views: {
        Row: {
          id: string
          user_id: string
          offer_id: string
          viewed_at: string
          user_plan_snapshot: string | null
        }
        Insert: {
          id?: string
          user_id: string
          offer_id: string
          viewed_at?: string
          user_plan_snapshot?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          offer_id?: string
          viewed_at?: string
          user_plan_snapshot?: string | null
        }
      }
      offer_scalability_metrics: {
        Row: {
          id: string
          offer_id: string
          creative_count: number
          impressions_range: string | null
          frequency_score: number | null
          is_high_scale: boolean
          first_seen: string
          last_seen: string
          run_count: number
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          offer_id: string
          creative_count?: number
          impressions_range?: string | null
          frequency_score?: number | null
          is_high_scale?: boolean
          first_seen?: string
          last_seen?: string
          run_count?: number
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          offer_id?: string
          creative_count?: number
          impressions_range?: string | null
          frequency_score?: number | null
          is_high_scale?: boolean
          first_seen?: string
          last_seen?: string
          run_count?: number
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      search_history: {
        Row: {
          id: string
          user_id: string
          query: string
          filters: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          query: string
          filters?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          query?: string
          filters?: Json | null
          created_at?: string
        }
      }
      testimonials: {
        Row: {
          id: string
          title: string
          description: string | null
          youtube_url: string | null
          position: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          youtube_url?: string | null
          position?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          youtube_url?: string | null
          position?: number
          is_active?: boolean
          created_at?: string
        }
      }
      voice_clones: {
        Row: {
          id: string
          user_id: string
          name: string
          voice_id: string
          audio_url: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          voice_id: string
          audio_url?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          voice_id?: string
          audio_url?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      voice_audio_generations: {
        Row: {
          id: string
          user_id: string
          voice_clone_id: string
          text: string
          audio_url: string
          text_hash: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          voice_clone_id: string
          text: string
          audio_url: string
          text_hash: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          voice_clone_id?: string
          text?: string
          audio_url?: string
          text_hash?: string
          created_at?: string
        }
      }
      niches: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          category_id: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          category_id: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          category_id?: string
          is_active?: boolean
          created_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          user_id: string
          subject: string
          message: string
          status: TicketStatus
          priority: TicketPriority
          created_at: string
          updated_at: string
          last_reply_at: string | null
          last_reply_from: FromRole | null
        }
        Insert: {
          id?: string
          user_id: string
          subject: string
          message: string
          status?: TicketStatus
          priority?: TicketPriority
          created_at?: string
          updated_at?: string
          last_reply_at?: string | null
          last_reply_from?: FromRole | null
        }
        Update: {
          id?: string
          user_id?: string
          subject?: string
          message?: string
          status?: TicketStatus
          priority?: TicketPriority
          created_at?: string
          updated_at?: string
          last_reply_at?: string | null
          last_reply_from?: FromRole | null
        }
      }
      ticket_replies: {
        Row: {
          id: string
          ticket_id: string
          user_id: string
          message: string
          created_at: string
          from_role: FromRole
        }
        Insert: {
          id?: string
          ticket_id: string
          user_id: string
          message: string
          created_at?: string
          from_role: FromRole
        }
        Update: {
          id?: string
          ticket_id?: string
          user_id?: string
          message?: string
          created_at?: string
          from_role?: FromRole
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          amount_cents: number
          currency: string
          status: PaymentStatus
          provider: string | null
          external_id: string | null
          paid_at: string | null
          period_start: string | null
          period_end: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          amount_cents: number
          currency?: string
          status?: PaymentStatus
          provider?: string | null
          external_id?: string | null
          paid_at?: string | null
          period_start?: string | null
          period_end?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          amount_cents?: number
          currency?: string
          status?: PaymentStatus
          provider?: string | null
          external_id?: string | null
          paid_at?: string | null
          period_start?: string | null
          period_end?: string | null
          created_at?: string
        }
      }
      communities: {
        Row: {
          id: string
          name: string
          description: string | null
          is_paid: boolean
          join_link: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_paid?: boolean
          join_link: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_paid?: boolean
          join_link?: string
          is_active?: boolean
          created_at?: string
        }
      }
      community_members: {
        Row: {
          id: string
          community_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          community_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          community_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      credit_packages: {
        Row: {
          id: string
          name: string
          credits: number
          price_cents: number
          currency: string
          bonus_credits: number
          is_active: boolean
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          credits: number
          price_cents: number
          currency?: string
          bonus_credits?: number
          is_active?: boolean
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          credits?: number
          price_cents?: number
          currency?: string
          bonus_credits?: number
          is_active?: boolean
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_credits: {
        Row: {
          id: string
          user_id: string
          balance: number
          total_loaded: number
          total_consumed: number
          low_balance_threshold: number
          is_blocked: boolean
          last_notification_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          total_loaded?: number
          total_consumed?: number
          low_balance_threshold?: number
          is_blocked?: boolean
          last_notification_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          total_loaded?: number
          total_consumed?: number
          low_balance_threshold?: number
          is_blocked?: boolean
          last_notification_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          type: 'credit' | 'debit'
          amount: number
          balance_before: number
          balance_after: number
          category: string
          description: string | null
          metadata: Json | null
          package_id: string | null
          payment_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'credit' | 'debit'
          amount: number
          balance_before: number
          balance_after: number
          category: string
          description?: string | null
          metadata?: Json | null
          package_id?: string | null
          payment_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'credit' | 'debit'
          amount?: number
          balance_before?: number
          balance_after?: number
          category?: string
          description?: string | null
          metadata?: Json | null
          package_id?: string | null
          payment_id?: string | null
          created_at?: string
        }
      }
    }
  }
}

