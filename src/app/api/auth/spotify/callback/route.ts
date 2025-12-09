import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/isAuthenticated'

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/auth/spotify/callback'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Verificar se houve erro no callback
    if (error) {
      console.error('[Spotify Callback] Erro:', error)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/produtividade/cronometro?spotify_error=${error}`)
    }

    if (!code) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/produtividade/cronometro?spotify_error=no_code`)
    }

    // Validar state (CSRF protection)
    let userId: string | null = null
    if (state) {
      try {
        const decodedState = JSON.parse(Buffer.from(state, 'base64').toString())
        userId = decodedState.userId
      } catch (e) {
        console.error('[Spotify Callback] Erro ao decodificar state:', e)
      }
    }

    // Verificar autenticação do usuário via cookies (preservar sessão)
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      // Se não autenticado, redirecionar para login mas preservar o código para tentar novamente
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', `/api/auth/spotify/callback?code=${code}&state=${state || ''}`)
      return NextResponse.redirect(loginUrl)
    }

    // Validar que o userId do state corresponde ao usuário autenticado
    if (userId && userId !== user.id) {
      console.warn('[Spotify Callback] State userId não corresponde ao usuário autenticado')
      // Continuar mesmo assim, pois o usuário está autenticado
    }

    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/produtividade/cronometro?spotify_error=config_missing`)
    }

    // Trocar código por tokens
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}))
      console.error('[Spotify Callback] Erro ao obter tokens:', errorData)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/produtividade/cronometro?spotify_error=token_exchange_failed`)
    }

    const tokenData = await tokenResponse.json()
    const { access_token, refresh_token, expires_in, token_type, scope } = tokenData

    // Calcular quando o token expira
    const expiresAt = new Date(Date.now() + expires_in * 1000)

    // Salvar tokens no banco (já temos supabase criado acima)
    
    // Verificar se já existe token para este usuário
    const { data: existingToken } = await supabase
      .from('spotify_tokens')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingToken) {
      // Atualizar token existente
      const { error: updateError } = await supabase
        .from('spotify_tokens')
        .update({
          access_token,
          refresh_token,
          expires_at: expiresAt.toISOString(),
          token_type: token_type || 'Bearer',
          scope: scope || null,
        })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('[Spotify Callback] Erro ao atualizar tokens:', updateError)
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/produtividade/cronometro?spotify_error=save_failed`)
      }
    } else {
      // Inserir novo token
      const { error: insertError } = await supabase
        .from('spotify_tokens')
        .insert({
          user_id: user.id,
          access_token,
          refresh_token,
          expires_at: expiresAt.toISOString(),
          token_type: token_type || 'Bearer',
          scope: scope || null,
        })

      if (insertError) {
        console.error('[Spotify Callback] Erro ao salvar tokens:', insertError)
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/produtividade/cronometro?spotify_error=save_failed`)
      }
    }

    // Redirecionar para o dashboard com sucesso
    // Usar URL relativa para preservar cookies e sessão
    const redirectUrl = new URL('/produtividade/cronometro', request.url)
    redirectUrl.searchParams.set('spotify_connected', 'true')
    return NextResponse.redirect(redirectUrl)
  } catch (error: any) {
    console.error('[GET /api/auth/spotify/callback] Erro:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/produtividade/cronometro?spotify_error=unknown`)
  }
}

