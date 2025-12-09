import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Ticket = Database['public']['Tables']['tickets']['Row']
type TicketInsert = Database['public']['Tables']['tickets']['Insert']
type TicketUpdate = Database['public']['Tables']['tickets']['Update']
type TicketReply = Database['public']['Tables']['ticket_replies']['Row']
type TicketReplyInsert = Database['public']['Tables']['ticket_replies']['Insert']

export interface TicketWithReplies extends Ticket {
  replies?: TicketReply[]
  user?: {
    id: string
    name: string
    phone_number: string | null
    email?: string
  }
  plan?: {
    name: string
    slug: string
  }
}

export interface TicketFilters {
  status?: 'open' | 'in_progress' | 'closed'
  priority?: 'low' | 'medium' | 'high'
}

/**
 * Create a new ticket
 */
export async function createTicket(userId: string, subject: string, message: string): Promise<Ticket | null> {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .insert({
        user_id: userId,
        subject,
        message,
        status: 'open',
        priority: 'medium',
      })
      .select()
      .single()

    if (error) throw error

    return data as Ticket
  } catch (error) {
    console.error('Error creating ticket:', error)
    throw error
  }
}

/**
 * Get user's tickets
 */
export async function getUserTickets(userId: string): Promise<Ticket[]> {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []) as Ticket[]
  } catch (error) {
    console.error('Error fetching user tickets:', error)
    return []
  }
}

/**
 * Get ticket with replies (with permission check)
 */
export async function getTicketWithReplies(ticketId: string, userId: string): Promise<TicketWithReplies | null> {
  try {
    // First check if user has access to this ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single()

    if (ticketError) throw ticketError
    if (!ticket || ticket.user_id !== userId) {
      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (profile?.role !== 'admin') {
        return null // Unauthorized
      }
    }

    // Get replies
    const { data: replies, error: repliesError } = await supabase
      .from('ticket_replies')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    if (repliesError) throw repliesError

    return {
      ...ticket,
      replies: (replies || []) as TicketReply[],
    } as TicketWithReplies
  } catch (error) {
    console.error('Error fetching ticket with replies:', error)
    return null
  }
}

/**
 * User reply to ticket
 */
export async function userReplyToTicket(ticketId: string, userId: string, message: string): Promise<TicketReply | null> {
  try {
    // Verify ticket belongs to user
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('user_id')
      .eq('id', ticketId)
      .single()

    if (ticketError) throw ticketError
    if (!ticket || ticket.user_id !== userId) {
      throw new Error('Unauthorized')
    }

    // Insert reply
    const { data: reply, error: replyError } = await supabase
      .from('ticket_replies')
      .insert({
        ticket_id: ticketId,
        user_id: userId,
        message,
        from_role: 'user',
      })
      .select()
      .single()

    if (replyError) throw replyError

    // Update ticket last_reply_at and last_reply_from
    await supabase
      .from('tickets')
      .update({
        last_reply_at: new Date().toISOString(),
        last_reply_from: 'user',
      })
      .eq('id', ticketId)

    return reply as TicketReply
  } catch (error) {
    console.error('Error replying to ticket:', error)
    throw error
  }
}

/**
 * Admin: Get all tickets with filters
 */
export async function adminGetAllTickets(filters?: TicketFilters): Promise<TicketWithReplies[]> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()

    let query = adminClient
      .from('tickets')
      .select(`
        *,
        user:profiles(id, name, email, phone_number),
        subscriptions(
          plan:plans(name, slug)
        )
      `)
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority)
    }

    const { data, error } = await query

    if (error) throw error

    return (data || []).map((ticket: any) => ({
      ...ticket,
      user: ticket.user,
      plan: ticket.subscriptions?.[0]?.plan,
    })) as TicketWithReplies[]
  } catch (error) {
    console.error('Error fetching all tickets:', error)
    return []
  }
}

/**
 * Admin: Reply to ticket and optionally update status
 */
export async function adminReplyToTicket(
  ticketId: string,
  adminUserId: string,
  message: string,
  status?: Ticket['status']
): Promise<TicketReply | null> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()

    // Insert reply
    const { data: reply, error: replyError } = await adminClient
      .from('ticket_replies')
      .insert({
        ticket_id: ticketId,
        user_id: adminUserId,
        message,
        from_role: 'admin',
      })
      .select()
      .single()

    if (replyError) throw replyError

    // Update ticket
    const updateData: TicketUpdate = {
      last_reply_at: new Date().toISOString(),
      last_reply_from: 'admin',
    }
    if (status) {
      updateData.status = status
    }

    await adminClient
      .from('tickets')
      .update(updateData)
      .eq('id', ticketId)

    return reply as TicketReply
  } catch (error) {
    console.error('Error replying to ticket as admin:', error)
    throw error
  }
}

