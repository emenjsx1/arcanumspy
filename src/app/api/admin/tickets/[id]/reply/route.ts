import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { adminReplyToTicket } from "@/lib/db/tickets"
import { sendSupportEmail } from "@/lib/email"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const profileRole = profile ? (profile as unknown as { role?: string }).role : null
    if (profileRole !== 'admin') {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { message, status } = body

    if (!message) {
      return NextResponse.json(
        { error: "Campo obrigatório: message" },
        { status: 400 }
      )
    }

    // Buscar dados do ticket antes de responder (para enviar email)
    // Usar createAdminClient para buscar o ticket sem verificação de userId
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()
    const { data: ticket } = await adminClient
      .from('tickets')
      .select('id, user_id, subject, message')
      .eq('id', params.id)
      .single()
    
    const reply = await adminReplyToTicket(params.id, user.id, message, status)

    // Enviar email de resposta ao usuário (não bloqueia se falhar)
    if (reply && ticket) {
      try {
        // Buscar email do usuário do ticket
        const { data: ticketUser } = await supabase
          .from('profiles')
          .select('email, name')
          .eq('id', ticket.user_id)
          .single()

        if (ticketUser?.email) {
          const { data: adminProfile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', user.id)
            .single()

          await sendSupportEmail({
            name: ticketUser.name || ticketUser.email.split('@')[0] || 'Usuário',
            userEmail: ticketUser.email,
            ticketId: ticket.id,
            subject: ticket.subject,
            message: ticket.message,
            reply: message,
            replyFrom: adminProfile?.name || 'Equipe de Suporte',
          })
        }
      } catch (emailError) {
        console.warn('⚠️ Erro ao enviar email de resposta (não crítico):', emailError)
      }
    }

    return NextResponse.json({ reply }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao responder ticket" },
      { status: 500 }
    )
  }
}

