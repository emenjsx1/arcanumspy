import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/isAuthenticated'

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!

export async function POST(request: Request) {
  try {
    // Verificar autenticação do usuário
    const { user, error: authError } = await getAuthenticatedUser(request)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'Configuração do Spotify não encontrada' },
        { status: 500 }
      )
    }

    const supabase = await createClient()

    // Buscar refresh_token do usuário
    const { data: tokenData, error: tokenError } = await supabase
      .from('spotify_tokens')
      .select('refresh_token')
      .eq('user_id', user.id)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Token do Spotify não encontrado. Faça login novamente.' },
        { status: 404 }
      )
    }

    // Trocar refresh_token por novo access_token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokenData.refresh_token,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}))
      console.error('[Spotify Refresh] Erro ao renovar token:', errorData)
      
      // Se o refresh_token expirou, deletar tokens do banco
      if (tokenResponse.status === 400) {
        await supabase
          .from('spotify_tokens')
          .delete()
          .eq('user_id', user.id)
      }

      return NextResponse.json(
        { error: 'Erro ao renovar token. Faça login novamente.' },
        { status: tokenResponse.status }
      )
    }

    const newTokenData = await tokenResponse.json()
    const { access_token, expires_in, token_type, scope } = newTokenData

    // Calcular quando o novo token expira
    const expiresAt = new Date(Date.now() + expires_in * 1000)

    // Atualizar tokens no banco
    const updateData: any = {
      access_token,
      expires_at: expiresAt.toISOString(),
      token_type: token_type || 'Bearer',
    }

    // Se um novo refresh_token foi retornado, atualizar também
    if (newTokenData.refresh_token) {
      updateData.refresh_token = newTokenData.refresh_token
    }

    if (scope) {
      updateData.scope = scope
    }

    const { error: updateError } = await supabase
      .from('spotify_tokens')
      .update(updateData)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('[Spotify Refresh] Erro ao atualizar tokens:', updateError)
      return NextResponse.json(
        { error: 'Erro ao salvar novo token' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      access_token,
      expires_at: expiresAt.toISOString(),
    })
  } catch (error: any) {
    console.error('[POST /api/auth/spotify/refresh] Erro:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao renovar token' },
      { status: 500 }
    )
  }
}

