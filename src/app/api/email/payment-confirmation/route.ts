import { NextRequest, NextResponse } from "next/server"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, plan, amount, expiresAt, transactionId } = body

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      )
    }

    // Formatar data de término
    const expiresDate = new Date(expiresAt)
    const formattedDate = format(expiresDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    const formattedTime = format(expiresDate, "HH:mm", { locale: ptBR })

    // HTML do email com visual laranja/preto
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pagamento Confirmado - ArcanumSpy</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 20px 0; text-align: center; background-color: #000000;">
        <h1 style="color: #ff5a1f; margin: 0; font-size: 28px;">ArcanumSpy</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 20px; background-color: #ffffff;">
        <div style="max-width: 600px; margin: 0 auto;">
          <h2 style="color: #000000; margin-top: 0;">Pagamento Confirmado! 🎉</h2>
          
          <p style="color: #333333; font-size: 16px; line-height: 1.6;">
            Olá <strong>${name}</strong>,
          </p>
          
          <p style="color: #333333; font-size: 16px; line-height: 1.6;">
            Seu pagamento foi processado com sucesso! Sua conta foi ativada e você já tem acesso completo à plataforma ArcanumSpy.
          </p>
          
          <div style="background-color: #ff5a1f; color: #ffffff; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="margin-top: 0; color: #ffffff;">Detalhes do Pagamento</h3>
            <p style="margin: 10px 0; color: #ffffff;">
              <strong>Plano:</strong> ${plan}<br>
              <strong>Valor:</strong> ${amount.toLocaleString('pt-MZ')} MT<br>
              <strong>Transação:</strong> ${transactionId}
            </p>
          </div>
          
          <div style="background-color: #000000; color: #ff5a1f; padding: 20px; border-radius: 8px; margin: 30px 0; border: 2px solid #ff5a1f;">
            <h3 style="margin-top: 0; color: #ff5a1f;">📅 Data de Término do Pacote</h3>
            <p style="margin: 10px 0; font-size: 18px; color: #ff5a1f; font-weight: bold;">
              ${formattedDate} às ${formattedTime}
            </p>
            <p style="margin: 10px 0; color: #ffffff; font-size: 14px;">
              Sua assinatura expira nesta data. Para continuar usando a plataforma, renove seu plano antes do término.
            </p>
          </div>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" 
               style="display: inline-block; background-color: #ff5a1f; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Acessar Plataforma
            </a>
          </div>
          
          <p style="color: #666666; font-size: 14px; line-height: 1.6;">
            Se você tiver alguma dúvida, entre em contato conosco através do suporte.
          </p>
          
          <p style="color: #666666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
            Atenciosamente,<br>
            <strong style="color: #ff5a1f;">Equipe ArcanumSpy</strong>
          </p>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px; text-align: center; background-color: #000000; color: #ffffff; font-size: 12px;">
        <p style="margin: 0;">© ${new Date().getFullYear()} ArcanumSpy. Todos os direitos reservados.</p>
      </td>
    </tr>
  </table>
</body>
</html>
    `

    // Enviar email usando Resend ou outro serviço
    // Por enquanto, apenas retornar sucesso
    // TODO: Integrar com serviço de email real

    return NextResponse.json({
      success: true,
      message: "Email de confirmação será enviado"
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao processar email" },
      { status: 500 }
    )
  }
}

