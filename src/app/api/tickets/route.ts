import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createTicket, getUserTickets } from "@/lib/db/tickets"
import { sendSupportEmail } from "@/lib/email"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const tickets = await getUserTickets(user.id)

    return NextResponse.json({ tickets })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar tickets" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { subject, message } = body

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Campos obrigatórios: subject, message" },
        { status: 400 }
      )
    }

    const ticket = await createTicket(user.id, subject, message)

    // Buscar dados do usuário para enviar email
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', user.id)
      .single()

    // Enviar email de confirmação (não bloqueia se falhar)
    if (ticket && profile) {
      try {
        const userEmail = profile.email || user.email
        if (userEmail) {
          await sendSupportEmail({
            name: profile.name || user.email?.split('@')[0] || 'Usuário',
            userEmail: userEmail,
            ticketId: ticket.id,
            subject: ticket.subject,
            message: ticket.message,
          })
        }
      } catch (emailError) {
        console.warn('⚠️ Erro ao enviar email de ticket (não crítico):', emailError)
      }
    }

    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao criar ticket" },
      { status: 500 }
    )
  }
}

