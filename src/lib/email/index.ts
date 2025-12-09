/**
 * Biblioteca de Email - ArcanumSpy
 * Centraliza todas as funções de envio de email
 * Todos os emails usam modo escuro como principal
 */

import { sendEmail } from './resend'
import {
  getWelcomeEmail,
  getPaymentSuccessEmail,
  getSupportEmail,
  getPasswordResetEmail,
  type WelcomeEmailData,
  type PaymentSuccessEmailData,
  type SupportEmailData,
  type PasswordResetEmailData,
} from './templates'

/**
 * Envia email de boas-vindas quando uma conta é criada
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  const html = getWelcomeEmail(data)
  
  const result = await sendEmail({
    to: data.email,
    subject: '🔮 Bem-vindo ao ArcanumSpy! Sua jornada começa agora',
    html,
  })

  if (!result.success) {
    console.error('Erro ao enviar email de boas-vindas:', result.error)
  }

  return result.success
}

/**
 * Envia email de confirmação de pagamento
 */
export async function sendPaymentSuccessEmail(data: PaymentSuccessEmailData & { userEmail?: string }): Promise<boolean> {
  const html = getPaymentSuccessEmail(data)
  
  // Usar userEmail se fornecido, senão usar data.name como email
  const toEmail = data.userEmail || data.name
  
  const result = await sendEmail({
    to: toEmail,
    subject: '✅ Pagamento Confirmado - ArcanumSpy',
    html,
  })

  if (!result.success) {
    console.error('Erro ao enviar email de pagamento:', result.error)
  }

  return result.success
}

/**
 * Envia email de suporte/ticket
 */
export async function sendSupportEmail(data: SupportEmailData & { userEmail?: string }): Promise<boolean> {
  const html = getSupportEmail(data)
  
  // Usar userEmail se fornecido, senão usar data.name como email
  const toEmail = data.userEmail || data.name
  
  const result = await sendEmail({
    to: toEmail,
    subject: data.reply 
      ? `💬 Resposta ao Ticket #${data.ticketId} - ArcanumSpy`
      : `🎫 Ticket Criado #${data.ticketId} - ArcanumSpy`,
    html,
  })

  if (!result.success) {
    console.error('Erro ao enviar email de suporte:', result.error)
  }

  return result.success
}

/**
 * Envia email de recuperação de senha
 */
export async function sendPasswordResetEmail(data: PasswordResetEmailData & { userEmail?: string }): Promise<boolean> {
  const html = getPasswordResetEmail(data)
  
  // Usar userEmail se fornecido, senão usar data.name como email
  const toEmail = data.userEmail || data.name
  
  const result = await sendEmail({
    to: toEmail,
    subject: '🔐 Recuperação de Senha - ArcanumSpy',
    html,
  })

  if (!result.success) {
    console.error('Erro ao enviar email de recuperação:', result.error)
  }

  return result.success
}

// Re-exportar tipos e funções principais
export * from './resend'
export * from './templates'

