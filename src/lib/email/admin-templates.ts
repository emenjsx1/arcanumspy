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
  renewalUrl?: string // Link de renovação da conta
  planName?: string
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
  const formattedAmount = new Intl.NumberFormat('pt-MZ', {
    style: 'currency',
    currency: data.currency || 'MZN'
  }).format(data.amount)
  
  // URL de renovação padrão se não fornecida
  const renewalUrl = data.renewalUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://arcanumspy.com'}/billing?renew=true`

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
              
              <p style="margin: 0 0 25px; color: #b3b3b3; font-size: 16px; line-height: 1.7;">
                Identificamos que seu pagamento está atrasado. Para continuar aproveitando todos os recursos do <strong style="color: #ff5a1f;">ArcanumSpy</strong>, é necessário renovar sua conta o quanto antes.
              </p>
              
              <p style="margin: 0 0 35px; color: #b3b3b3; font-size: 16px; line-height: 1.7;">
                Clique no botão abaixo para renovar sua conta e manter seu acesso ativo a todas as ferramentas de espionagem, IA e produtividade.
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
                ${data.planName ? `
                <tr>
                  <td style="padding: 22px; border-bottom: 1px solid #2a2a2a;">
                    <p style="margin: 0; color: #808080; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Plano</p>
                    <p style="margin: 8px 0 0; color: #e5e5e5; font-size: 16px; font-weight: 600;">${data.planName}</p>
                  </td>
                </tr>
                ` : ''}
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
              
              <!-- Botão Principal de Renovação -->
              <div style="text-align: center; margin: 45px 0;">
                <a href="${renewalUrl}" 
                   style="display: inline-block; padding: 18px 45px; background: linear-gradient(135deg, #ff5a1f 0%, #ff4d29 50%, #e63900 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; box-shadow: 0 6px 20px rgba(255, 90, 31, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
                  🔄 Renovar Minha Conta Agora
                </a>
              </div>
              
              <!-- Botão Secundário de Pagamento (se fornecido) -->
              ${data.paymentUrl ? `
              <div style="text-align: center; margin: 20px 0 35px;">
                <a href="${data.paymentUrl}" 
                   style="display: inline-block; padding: 14px 35px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);">
                  💳 Ver Detalhes do Pagamento
                </a>
              </div>
              ` : ''}
              
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

export interface AdminNewFeatureEmailData {
  name: string
  featureName: string
  featureDescription: string
  featureImage?: string
  ctaText?: string
  ctaUrl?: string
  benefits?: string[]
}

export interface AdminAccountExpiringEmailData {
  name: string
  planName: string
  expiresAt: string
  renewalUrl?: string
}

export interface AdminTrialEndingEmailData {
  name: string
  planName: string
  trialEndsAt: string
  upgradeUrl?: string
}

/**
 * Template de Email de Nova Funcionalidade - Modo Escuro
 */
export function getAdminNewFeatureEmail(data: AdminNewFeatureEmailData): string {
  const ctaUrl = data.ctaUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://arcanumspy.com'}/dashboard`
  const ctaText = data.ctaText || 'Explorar Nova Funcionalidade'

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nova Funcionalidade - ArcanumSpy</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0a0a0a;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 12px; border: 1px solid #2a2a2a;">
          <!-- Header -->
          <tr>
            <td style="padding: 50px 40px 30px; text-align: center; background: linear-gradient(135deg, #ff5a1f 0%, #ff4d29 50%, #e63900 100%); border-radius: 12px 12px 0 0;">
              <div style="width: 72px; height: 72px; margin: 0 auto 25px; background-color: rgba(255,255,255,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                <span style="color: #ffffff; font-size: 36px; font-weight: bold;">✨</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Nova Funcionalidade!</h1>
              <p style="margin: 15px 0 0; color: rgba(255,255,255,0.9); font-size: 20px; font-weight: 500;">${data.featureName}</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #e5e5e5; font-size: 18px; line-height: 1.6;">
                Olá <strong style="color: #ff5a1f;">${data.name}</strong>,
              </p>
              
              <p style="margin: 0 0 30px; color: #b3b3b3; font-size: 16px; line-height: 1.7;">
                ${data.featureDescription}
              </p>
              
              ${data.benefits && data.benefits.length > 0 ? `
              <div style="background-color: #0f0f0f; border-left: 4px solid #ff5a1f; padding: 25px; margin: 30px 0; border-radius: 8px; border: 1px solid #2a2a2a;">
                <p style="margin: 0 0 15px; color: #e5e5e5; font-size: 17px; font-weight: 600;">
                  🎯 Benefícios:
                </p>
                <ul style="margin: 0; padding-left: 25px; color: #b3b3b3; font-size: 15px; line-height: 2;">
                  ${data.benefits.map(benefit => `<li style="margin-bottom: 10px;">${benefit}</li>`).join('')}
                </ul>
              </div>
              ` : ''}
              
              <div style="text-align: center; margin: 45px 0;">
                <a href="${ctaUrl}" 
                   style="display: inline-block; padding: 18px 45px; background: linear-gradient(135deg, #ff5a1f 0%, #ff4d29 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; box-shadow: 0 6px 20px rgba(255, 90, 31, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
                  ${ctaText}
                </a>
              </div>
              
              <p style="margin: 35px 0 0; color: #808080; font-size: 14px; line-height: 1.6; text-align: center;">
                Estamos sempre trabalhando para melhorar sua experiência!<br>
                <a href="mailto:info@arcanumspy.com" style="color: #ff5a1f; text-decoration: none;">info@arcanumspy.com</a>
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
                Email: <a href="mailto:info@arcanumspy.com" style="color: #ff5a1f; text-decoration: none;">info@arcanumspy.com</a>
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
 * Template de Email de Conta Expirando - Modo Escuro
 */
export function getAdminAccountExpiringEmail(data: AdminAccountExpiringEmailData): string {
  const renewalUrl = data.renewalUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://arcanumspy.com'}/billing?renew=true`
  const expiresDate = new Date(data.expiresAt)
  const daysUntilExpiry = Math.ceil((expiresDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sua Conta Expira em Breve - ArcanumSpy</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0a0a0a;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 12px; border: 1px solid #2a2a2a;">
          <!-- Header -->
          <tr>
            <td style="padding: 50px 40px 30px; text-align: center; background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%); border-radius: 12px 12px 0 0;">
              <div style="width: 72px; height: 72px; margin: 0 auto 25px; background-color: rgba(255,255,255,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                <span style="color: #ffffff; font-size: 36px; font-weight: bold;">⏰</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Sua Conta Expira em Breve</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #e5e5e5; font-size: 18px; line-height: 1.6;">
                Olá <strong style="color: #ff5a1f;">${data.name}</strong>,
              </p>
              
              <p style="margin: 0 0 30px; color: #b3b3b3; font-size: 16px; line-height: 1.7;">
                Sua assinatura do plano <strong style="color: #ff5a1f;">${data.planName}</strong> expira em <strong style="color: #f59e0b;">${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'dia' : 'dias'}</strong>. Renove agora para continuar aproveitando todos os recursos do ArcanumSpy sem interrupções.
              </p>
              
              <!-- Expiry Details -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0; background-color: #0f0f0f; border-radius: 10px; overflow: hidden; border: 1px solid #2a2a2a;">
                <tr>
                  <td style="padding: 22px; border-bottom: 1px solid #2a2a2a;">
                    <p style="margin: 0; color: #808080; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Plano Atual</p>
                    <p style="margin: 8px 0 0; color: #e5e5e5; font-size: 20px; font-weight: 600;">${data.planName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 22px;">
                    <p style="margin: 0; color: #808080; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Data de Expiração</p>
                    <p style="margin: 8px 0 0; color: #f59e0b; font-size: 18px; font-weight: 700;">
                      ${expiresDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                </tr>
              </table>
              
              <div style="background: linear-gradient(135deg, #78350f 0%, #92400e 100%); border-left: 4px solid #f59e0b; padding: 22px; margin: 35px 0; border-radius: 8px;">
                <p style="margin: 0; color: #fef3c7; font-size: 15px; line-height: 1.6;">
                  <strong style="color: #ffffff;">💡 Dica:</strong> Renove antes da expiração para manter acesso contínuo e evitar interrupções no seu trabalho.
                </p>
              </div>
              
              <div style="text-align: center; margin: 45px 0;">
                <a href="${renewalUrl}" 
                   style="display: inline-block; padding: 18px 45px; background: linear-gradient(135deg, #ff5a1f 0%, #ff4d29 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; box-shadow: 0 6px 20px rgba(255, 90, 31, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
                  🔄 Renovar Minha Conta Agora
                </a>
              </div>
              
              <p style="margin: 30px 0 0; color: #808080; font-size: 14px; line-height: 1.6; text-align: center;">
                Em caso de dúvidas, entre em contato conosco.<br>
                <a href="mailto:info@arcanumspy.com" style="color: #ff5a1f; text-decoration: none;">info@arcanumspy.com</a>
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
                Email: <a href="mailto:info@arcanumspy.com" style="color: #ff5a1f; text-decoration: none;">info@arcanumspy.com</a>
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
 * Template de Email de Trial Terminando - Modo Escuro
 */
export function getAdminTrialEndingEmail(data: AdminTrialEndingEmailData): string {
  const upgradeUrl = data.upgradeUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://arcanumspy.com'}/billing?upgrade=true`
  const trialEndDate = new Date(data.trialEndsAt)
  const daysUntilEnd = Math.ceil((trialEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seu Trial Termina em Breve - ArcanumSpy</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0a0a0a;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 12px; border: 1px solid #2a2a2a;">
          <!-- Header -->
          <tr>
            <td style="padding: 50px 40px 30px; text-align: center; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); border-radius: 12px 12px 0 0;">
              <div style="width: 72px; height: 72px; margin: 0 auto 25px; background-color: rgba(255,255,255,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                <span style="color: #ffffff; font-size: 36px; font-weight: bold;">🎁</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Seu Trial Termina em Breve</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #e5e5e5; font-size: 18px; line-height: 1.6;">
                Olá <strong style="color: #a855f7;">${data.name}</strong>,
              </p>
              
              <p style="margin: 0 0 30px; color: #b3b3b3; font-size: 16px; line-height: 1.7;">
                Seu período de trial do plano <strong style="color: #a855f7;">${data.planName}</strong> termina em <strong style="color: #6366f1;">${daysUntilEnd} ${daysUntilEnd === 1 ? 'dia' : 'dias'}</strong>. Faça upgrade agora para continuar aproveitando todos os recursos premium do ArcanumSpy!
              </p>
              
              <!-- Trial Details -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0; background-color: #0f0f0f; border-radius: 10px; overflow: hidden; border: 1px solid #2a2a2a;">
                <tr>
                  <td style="padding: 22px; border-bottom: 1px solid #2a2a2a;">
                    <p style="margin: 0; color: #808080; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Plano Trial</p>
                    <p style="margin: 8px 0 0; color: #e5e5e5; font-size: 20px; font-weight: 600;">${data.planName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 22px;">
                    <p style="margin: 0; color: #808080; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Trial Termina em</p>
                    <p style="margin: 8px 0 0; color: #6366f1; font-size: 18px; font-weight: 700;">
                      ${trialEndDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                </tr>
              </table>
              
              <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); border-left: 4px solid #6366f1; padding: 22px; margin: 35px 0; border-radius: 8px;">
                <p style="margin: 0; color: #c7d2fe; font-size: 15px; line-height: 1.6;">
                  <strong style="color: #ffffff;">✨ Não perca acesso:</strong> Faça upgrade agora e mantenha todas as funcionalidades premium ativas.
                </p>
              </div>
              
              <div style="text-align: center; margin: 45px 0;">
                <a href="${upgradeUrl}" 
                   style="display: inline-block; padding: 18px 45px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
                  ⬆️ Fazer Upgrade Agora
                </a>
              </div>
              
              <p style="margin: 30px 0 0; color: #808080; font-size: 14px; line-height: 1.6; text-align: center;">
                Em caso de dúvidas, entre em contato conosco.<br>
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



