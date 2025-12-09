import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/isAuthenticated'

export async function GET(request: Request) {
  try {
    // Verificar autenticação do usuário
    const { user, error: authError } = await getAuthenticatedUser(request)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Buscar tokens do usuário
    const { data: tokenData, error: tokenError } = await supabase
      .from('spotify_tokens')
      .select('expires_at, created_at')
      .eq('user_id', user.id)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json({
        connected: false,
        message: 'Spotify não conectado',
      })
    }

    // Verificar se o token ainda é válido
    const expiresAt = new Date(tokenData.expires_at)
    const now = new Date()
    const isExpired = expiresAt <= now

    // Tentar verificar o status da conta Premium via API do Spotify
    let isPremium = false
    let needsRefresh = isExpired

    if (!isExpired) {
      // Buscar access_token para verificar status
      const { data: fullTokenData } = await supabase
        .from('spotify_tokens')
        .select('access_token')
        .eq('user_id', user.id)
        .single()

      if (fullTokenData?.access_token) {
        try {
          const profileResponse = await fetch('https://api.spotify.com/v1/me', {
            headers: {
              'Authorization': `Bearer ${fullTokenData.access_token}`,
            },
          })

          if (profileResponse.ok) {
            const profile = await profileResponse.json()
            isPremium = profile.product === 'premium'
          } else if (profileResponse.status === 401) {
            needsRefresh = true
          }
        } catch (e) {
          console.error('[Spotify Status] Erro ao verificar perfil:', e)
        }
      }
    }

    return NextResponse.json({
      connected: true,
      isPremium,
      needsRefresh,
      expiresAt: tokenData.expires_at,
    })
  } catch (error: any) {
    console.error('[GET /api/spotify/status] Erro:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao verificar status' },
      { status: 500 }
    )
  }
}

