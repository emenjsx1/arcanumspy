/**
 * Templates de Email para ArcanumSpy
 * Todos os templates são responsivos, compatíveis com clientes de email
 * e usam modo escuro como principal
 */

export interface WelcomeEmailData {
  name: string
  email: string
}

export interface PaymentSuccessEmailData {
  name: string
  amount: number
  currency: string
  planName: string
  invoiceNumber?: string
  invoiceUrl?: string
  paymentDate: string
  expiresAt?: string // Data de término do pacote
}

export interface SupportEmailData {
  name: string
  ticketId: string
  subject: string
  message: string
  reply?: string
  replyFrom?: string
}

export interface PasswordResetEmailData {
  name: string
  resetUrl: string
  expiresIn: string
}

/**
 * Template de Email de Boas-Vindas - Modo Escuro
 */
export function getWelcomeEmail(data: WelcomeEmailData): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao ArcanumSpy!</title>
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
              <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Bem-vindo à sua nova jornada!</h2>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #e5e5e5; font-size: 18px; line-height: 1.6;">
                Olá <strong style="color: #a855f7;">${data.name}</strong>,
              </p>
              
              <p style="margin: 0 0 25px; color: #b3b3b3; font-size: 16px; line-height: 1.7;">
                É um prazer ter você conosco! Sua conta foi criada com sucesso e você já pode começar a explorar todas as ferramentas poderosas do ArcanumSpy.
              </p>
              
              <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); border-left: 4px solid #6366f1; padding: 25px; margin: 30px 0; border-radius: 8px; box-shadow: 0 4px 6px rgba(99, 102, 241, 0.2);">
                <p style="margin: 0 0 12px; color: #e5e5e5; font-size: 18px; font-weight: 600;">
                  🎁 Créditos Grátis para Começar!
                </p>
                <p style="margin: 0; color: #c7c7c7; font-size: 15px; line-height: 1.6;">
                  Você recebeu créditos grátis para explorar todas as ferramentas. Comece agora mesmo e descubra o poder da inteligência artificial!
                </p>
              </div>
              
              <p style="margin: 35px 0 20px; color: #e5e5e5; font-size: 17px; font-weight: 600; line-height: 1.6;">
                ✨ O que você pode fazer agora:
              </p>
              <ul style="margin: 0 0 35px; padding-left: 25px; color: #b3b3b3; font-size: 16px; line-height: 2;">
                <li style="margin-bottom: 12px;">🔍 Espionar e analisar campanhas de concorrentes</li>
                <li style="margin-bottom: 12px;">🤖 Gerar copies criativos com IA avançada</li>
                <li style="margin-bottom: 12px;">📊 Validar e otimizar suas campanhas</li>
                <li style="margin-bottom: 12px;">🎨 Criar imagens e fazer upscale com IA</li>
                <li style="margin-bottom: 12px;">⚡ Acessar ferramentas de produtividade</li>
              </ul>
              
              <div style="text-align: center; margin: 45px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://arcanumspy.com'}/dashboard" 
                   style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4); transition: transform 0.2s;">
                  🚀 Acessar Dashboard
                </a>
              </div>
              
              <p style="margin: 35px 0 0; color: #808080; font-size: 14px; line-height: 1.6; text-align: center;">
                Se você tiver alguma dúvida, nossa equipe de suporte está sempre pronta para ajudar.<br>
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
 * Template de Email de Pagamento Bem-Sucedido - Modo Escuro
 */
export function getPaymentSuccessEmail(data: PaymentSuccessEmailData): string {
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
  <title>Pagamento Confirmado - ArcanumSpy</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0a0a0a;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 12px; border: 1px solid #2a2a2a;">
          <!-- Header -->
          <tr>
            <td style="padding: 50px 40px 30px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%); border-radius: 12px 12px 0 0;">
              <div style="width: 72px; height: 72px; margin: 0 auto 25px; background-color: rgba(255,255,255,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                <span style="color: #ffffff; font-size: 36px; font-weight: bold;">✓</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Pagamento Confirmado!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #e5e5e5; font-size: 18px; line-height: 1.6;">
                Olá <strong style="color: #a855f7;">${data.name}</strong>,
              </p>
              
              <p style="margin: 0 0 35px; color: #b3b3b3; font-size: 16px; line-height: 1.7;">
                Seu pagamento foi processado com sucesso! Agradecemos sua confiança no ArcanumSpy.
              </p>
              
              <!-- Payment Details -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0; background-color: #0f0f0f; border-radius: 10px; overflow: hidden; border: 1px solid #2a2a2a;">
                <tr>
                  <td style="padding: 22px; border-bottom: 1px solid #2a2a2a;">
                    <p style="margin: 0; color: #808080; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Plano</p>
                    <p style="margin: 8px 0 0; color: #e5e5e5; font-size: 20px; font-weight: 600;">${data.planName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 22px; border-bottom: 1px solid #2a2a2a;">
                    <p style="margin: 0; color: #808080; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Valor Pago</p>
                    <p style="margin: 8px 0 0; color: #10b981; font-size: 28px; font-weight: 700;">${formattedAmount}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 22px;">
                    <p style="margin: 0; color: #808080; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Data do Pagamento</p>
                    <p style="margin: 8px 0 0; color: #e5e5e5; font-size: 16px; font-weight: 500;">${new Date(data.paymentDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  </td>
                </tr>
                ${data.invoiceNumber ? `
                <tr>
                  <td style="padding: 22px; border-top: 1px solid #2a2a2a;">
                    <p style="margin: 0; color: #808080; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Número da Transação</p>
                    <p style="margin: 8px 0 0; color: #e5e5e5; font-size: 16px; font-weight: 600;">${data.invoiceNumber}</p>
                  </td>
                </tr>
                ` : ''}
                ${data.expiresAt ? `
                <tr>
                  <td style="padding: 22px; border-top: 1px solid #2a2a2a; background-color: #1a1a1a;">
                    <p style="margin: 0; color: #808080; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">📅 Data de Término do Pacote</p>
                    <p style="margin: 8px 0 0; color: #ff5a1f; font-size: 18px; font-weight: 700;">
                      ${new Date(data.expiresAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p style="margin: 8px 0 0; color: #b3b3b3; font-size: 13px; line-height: 1.5;">
                      Sua assinatura expira nesta data. Para continuar usando a plataforma, renove seu plano antes do término.
                    </p>
                  </td>
                </tr>
                ` : ''}
              </table>
              
              ${data.invoiceUrl ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.invoiceUrl}" 
                   style="display: inline-block; padding: 14px 28px; background-color: #2a2a2a; color: #e5e5e5; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; border: 1px solid #3a3a3a;">
                  📄 Baixar Nota Fiscal
                </a>
              </div>
              ` : ''}
              
              <div style="background: linear-gradient(135deg, #064e3b 0%, #065f46 100%); border-left: 4px solid #10b981; padding: 22px; margin: 35px 0; border-radius: 8px;">
                <p style="margin: 0; color: #d1fae5; font-size: 15px; line-height: 1.6;">
                  <strong style="color: #ffffff;">✓</strong> Seu plano está ativo e você já pode usar todos os recursos disponíveis.
                </p>
              </div>
              
              <div style="text-align: center; margin: 45px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://arcanumspy.com'}/dashboard" 
                   style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);">
                  🚀 Acessar Dashboard
                </a>
              </div>
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
 * Template de Email de Suporte/Ticket - Modo Escuro
 */
export function getSupportEmail(data: SupportEmailData): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.reply ? 'Resposta ao Seu Ticket' : 'Novo Ticket Criado'} - ArcanumSpy</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0a0a0a;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 12px; border: 1px solid #2a2a2a;">
          <!-- Header -->
          <tr>
            <td style="padding: 50px 40px 30px; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                ${data.reply ? '💬 Resposta ao Seu Ticket' : '🎫 Ticket Criado com Sucesso'}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #e5e5e5; font-size: 18px; line-height: 1.6;">
                Olá <strong style="color: #a855f7;">${data.name}</strong>,
              </p>
              
              ${data.reply ? `
              <p style="margin: 0 0 30px; color: #b3b3b3; font-size: 16px; line-height: 1.7;">
                Recebemos uma resposta ao seu ticket de suporte:
              </p>
              
              <div style="background-color: #0f0f0f; border-left: 4px solid #3b82f6; padding: 25px; margin: 30px 0; border-radius: 8px; border: 1px solid #2a2a2a;">
                <p style="margin: 0 0 12px; color: #808080; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                  ${data.replyFrom || 'Equipe de Suporte ArcanumSpy'}
                </p>
                <p style="margin: 0; color: #e5e5e5; font-size: 16px; line-height: 1.7; white-space: pre-wrap;">
${data.reply}
                </p>
              </div>
              ` : `
              <p style="margin: 0 0 30px; color: #b3b3b3; font-size: 16px; line-height: 1.7;">
                Seu ticket de suporte foi criado com sucesso! Nossa equipe entrará em contato em breve.
              </p>
              
              <div style="background-color: #0f0f0f; border-left: 4px solid #3b82f6; padding: 25px; margin: 30px 0; border-radius: 8px; border: 1px solid #2a2a2a;">
                <p style="margin: 0 0 12px; color: #808080; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                  ID do Ticket: ${data.ticketId}
                </p>
                <p style="margin: 0 0 15px; color: #e5e5e5; font-size: 20px; font-weight: 600;">
                  ${data.subject}
                </p>
                <p style="margin: 0; color: #b3b3b3; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">
${data.message}
                </p>
              </div>
              `}
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://arcanumspy.com'}/admin/support" 
                   style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);">
                  👁️ Ver Ticket
                </a>
              </div>
              
              <p style="margin: 30px 0 0; color: #808080; font-size: 14px; line-height: 1.6; text-align: center;">
                ⏱️ Tempo médio de resposta: 2-4 horas
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
 * Template de Email de Recuperação de Senha - Modo Escuro
 */
export function getPasswordResetEmail(data: PasswordResetEmailData): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperação de Senha - ArcanumSpy</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0a0a0a;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 12px; border: 1px solid #2a2a2a;">
          <!-- Header -->
          <tr>
            <td style="padding: 50px 40px 30px; text-align: center; background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🔐 Recuperação de Senha</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #e5e5e5; font-size: 18px; line-height: 1.6;">
                Olá <strong style="color: #a855f7;">${data.name}</strong>,
              </p>
              
              <p style="margin: 0 0 35px; color: #b3b3b3; font-size: 16px; line-height: 1.7;">
                Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha:
              </p>
              
              <div style="text-align: center; margin: 45px 0;">
                <a href="${data.resetUrl}" 
                   style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);">
                  🔑 Redefinir Senha
                </a>
              </div>
              
              <p style="margin: 35px 0 20px; color: #808080; font-size: 14px; line-height: 1.6;">
                Ou copie e cole este link no seu navegador:
              </p>
              <p style="margin: 0 0 35px; padding: 18px; background-color: #0f0f0f; border-radius: 8px; word-break: break-all; color: #b3b3b3; font-size: 12px; font-family: monospace; border: 1px solid #2a2a2a;">
                ${data.resetUrl}
              </p>
              
              <div style="background: linear-gradient(135deg, #78350f 0%, #92400e 100%); border-left: 4px solid #f59e0b; padding: 22px; margin: 35px 0; border-radius: 8px;">
                <p style="margin: 0; color: #fef3c7; font-size: 14px; line-height: 1.6;">
                  <strong style="color: #ffffff;">⚠️ Importante:</strong> Este link expira em ${data.expiresIn}. Se você não solicitou esta recuperação, ignore este email.
                </p>
              </div>
              
              <p style="margin: 30px 0 0; color: #808080; font-size: 14px; line-height: 1.6;">
                Se você não solicitou esta recuperação, sua senha permanecerá inalterada.
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
