import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_ZTiDLRBD_GKhgrxujomj6JdLcYk6mqwfq'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'info@arcanumspy.com'
const FROM_NAME = process.env.RESEND_FROM_NAME || 'ArcanumSpy'

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!resend) {
    console.warn('⚠️ RESEND_API_KEY não configurada. Email não será enviado.')
    return { success: false, error: 'RESEND_API_KEY não configurada' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: options.from || `${FROM_NAME} <${FROM_EMAIL}>`,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
      reply_to: options.replyTo,
    })

    if (error) {
      console.error('Erro ao enviar email:', error)
      return { success: false, error: error.message || 'Erro ao enviar email' }
    }

    return { success: true, messageId: data?.id }
  } catch (error: any) {
    console.error('Erro ao enviar email:', error)
    return { success: false, error: error.message || 'Erro ao enviar email' }
  }
}

