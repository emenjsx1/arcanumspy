/**
 * Templates de Email para Comunicação Admin - ArcanumSpy
 * Templates para envio de emails em massa pelo admin
 */

export interface AdminNewsletterEmailData {
  name: string
  subject: string
  message: string
  ctaText?: string
  ctaUrl?: string
}

export interface AdminPaymentOverdueEmailData {
  name: string
  amount: number
  currency: string
  dueDate: string
  invoiceNumber?: string
  paymentUrl?: string
}

/**
 * Template de Email de Novidades/Newsletter - Modo Escuro
 */
export function getAdminNewsletterEmail(data: AdminNewsletterEmailData): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.subject} - ArcanumSpy</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0a0a0a;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 12px; border: 1px solid #2a2a2a;">
          <!-- Header -->
          <tr>
            <td style="padding: 50px 40px 30px; text-align: center; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); border-radius: 12px 12px 0 0;">
              <div style="margin-bottom: 20px;">
                <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">🔮 ArcanumSpy</h1>
              </div>
              <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">${data.subject}</h2>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #e5e5e5; font-size: 18px; line-height: 1.6;">
                Olá <strong style="color: #a855f7;">${data.name}</strong>,
              </p>
              
              <div style="color: #b3b3b3; font-size: 16px; line-height: 1.7; white-space: pre-wrap;">
${data.message}
              </div>
              
              ${data.ctaUrl && data.ctaText ? `
              <div style="text-align: center; margin: 45px 0;">
                <a href="${data.ctaUrl}" 
                   style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);">
                  ${data.ctaText}
                </a>
              </div>
              ` : ''}
              
              <p style="margin: 35px 0 0; color: #808080; font-size: 14px; line-height: 1.6; text-align: center;">
                Obrigado por fazer parte do ArcanumSpy!<br>
                <a href="mailto:info@arcanumspy.com" style="color: #6366f1; text-decoration: none;">info@arcanumspy.com</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 35px 40px; background-color: #0f0f0f; border-radius: 0 0 12px 12px; border-top: 1px solid #2a2a2a; text-align: center;">
              <p style="margin: 0 0 12px; color: #e5e5e5; font-size: 16px; font-weight: 600;">
                🔮 ArcanumSpy
              </p>
              <p style="margin: 0 0 12px; color: #808080; font-size: 13px;">
                Email: <a href="mailto:info@arcanumspy.com" style="color: #6366f1; text-decoration: none;">info@arcanumspy.com</a>
              </p>
              <p style="margin: 0; color: #666666; font-size: 12px;">
                © ${new Date().getFullYear()} ArcanumSpy. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * Template de Email de Pagamento Atrasado - Modo Escuro
 */
export function getAdminPaymentOverdueEmail(data: AdminPaymentOverdueEmailData): string {
  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: data.currency || 'BRL'
  }).format(data.amount)

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pagamento Atrasado - ArcanumSpy</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0a0a0a;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 12px; border: 1px solid #2a2a2a;">
          <!-- Header -->
          <tr>
            <td style="padding: 50px 40px 30px; text-align: center; background: linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%); border-radius: 12px 12px 0 0;">
              <div style="width: 72px; height: 72px; margin: 0 auto 25px; background-color: rgba(255,255,255,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                <span style="color: #ffffff; font-size: 36px; font-weight: bold;">⚠️</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Pagamento Atrasado</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #e5e5e5; font-size: 18px; line-height: 1.6;">
                Olá <strong style="color: #a855f7;">${data.name}</strong>,
              </p>
              
              <p style="margin: 0 0 35px; color: #b3b3b3; font-size: 16px; line-height: 1.7;">
                Identificamos que seu pagamento está atrasado. Para continuar aproveitando todos os recursos do ArcanumSpy, é necessário regularizar sua situação.
              </p>
              
              <!-- Payment Details -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0; background-color: #0f0f0f; border-radius: 10px; overflow: hidden; border: 1px solid #2a2a2a;">
                <tr>
                  <td style="padding: 22px; border-bottom: 1px solid #2a2a2a;">
                    <p style="margin: 0; color: #808080; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Valor em Atraso</p>
                    <p style="margin: 8px 0 0; color: #ef4444; font-size: 28px; font-weight: 700;">${formattedAmount}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 22px; border-bottom: 1px solid #2a2a2a;">
                    <p style="margin: 0; color: #808080; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Data de Vencimento</p>
                    <p style="margin: 8px 0 0; color: #e5e5e5; font-size: 16px; font-weight: 500;">${new Date(data.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  </td>
                </tr>
                ${data.invoiceNumber ? `
                <tr>
                  <td style="padding: 22px;">
                    <p style="margin: 0; color: #808080; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Número da Nota Fiscal</p>
                    <p style="margin: 8px 0 0; color: #e5e5e5; font-size: 16px; font-weight: 600;">${data.invoiceNumber}</p>
                  </td>
                </tr>
                ` : ''}
              </table>
              
              <div style="background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%); border-left: 4px solid #ef4444; padding: 22px; margin: 35px 0; border-radius: 8px;">
                <p style="margin: 0; color: #fecaca; font-size: 15px; line-height: 1.6;">
                  <strong style="color: #ffffff;">⚠️ Importante:</strong> Seu acesso pode ser suspenso caso o pagamento não seja regularizado em breve.
                </p>
              </div>
              
              ${data.paymentUrl ? `
              <div style="text-align: center; margin: 45px 0;">
                <a href="${data.paymentUrl}" 
                   style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);">
                  💳 Regularizar Pagamento
                </a>
              </div>
              ` : `
              <div style="text-align: center; margin: 45px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://arcanumspy.com'}/billing" 
                   style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);">
                  💳 Acessar Área de Pagamento
                </a>
              </div>
              `}
              
              <p style="margin: 30px 0 0; color: #808080; font-size: 14px; line-height: 1.6; text-align: center;">
                Se você já realizou o pagamento, ignore este email. Em caso de dúvidas, entre em contato conosco.<br>
                <a href="mailto:info@arcanumspy.com" style="color: #6366f1; text-decoration: none;">info@arcanumspy.com</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 35px 40px; background-color: #0f0f0f; border-radius: 0 0 12px 12px; border-top: 1px solid #2a2a2a; text-align: center;">
              <p style="margin: 0 0 12px; color: #e5e5e5; font-size: 16px; font-weight: 600;">
                🔮 ArcanumSpy
              </p>
              <p style="margin: 0 0 12px; color: #808080; font-size: 13px;">
                Email: <a href="mailto:info@arcanumspy.com" style="color: #6366f1; text-decoration: none;">info@arcanumspy.com</a>
              </p>
              <p style="margin: 0; color: #666666; font-size: 12px;">
                © ${new Date().getFullYear()} ArcanumSpy. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

