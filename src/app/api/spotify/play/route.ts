import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/isAuthenticated'

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

    const body = await request.json()
    const { device_id, track_uri, playlist_uri, action = 'play' } = body

    const supabase = await createClient()

    // Buscar access_token do usuário
    const { data: tokenData, error: tokenError } = await supabase
      .from('spotify_tokens')
      .select('access_token, expires_at')
      .eq('user_id', user.id)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Spotify não conectado. Faça login primeiro.' },
        { status: 404 }
      )
    }

    // Verificar se o token expirou
    const tokenDataTyped = tokenData as { expires_at?: string; access_token?: string; [key: string]: any }
    const expiresAt = new Date(tokenDataTyped.expires_at || 0)
    const now = new Date()
    if (expiresAt <= now) {
      return NextResponse.json(
        { error: 'Token expirado. Renovando...', needsRefresh: true },
        { status: 401 }
      )
    }

    const accessToken = tokenDataTyped.access_token

    // Preparar requisição baseada na ação
    let spotifyUrl = 'https://api.spotify.com/v1/me/player'
    let method = 'PUT'
    let requestBody: any = {}

    if (action === 'play') {
      if (playlist_uri) {
        // Tocar playlist
        spotifyUrl = 'https://api.spotify.com/v1/me/player/play'
        requestBody = {
          context_uri: playlist_uri,
        }
      } else if (track_uri) {
        // Tocar música específica
        spotifyUrl = 'https://api.spotify.com/v1/me/player/play'
        requestBody = {
          uris: [track_uri],
        }
      } else {
        // Apenas retomar reprodução
        spotifyUrl = 'https://api.spotify.com/v1/me/player/play'
      }
    } else if (action === 'pause') {
      spotifyUrl = 'https://api.spotify.com/v1/me/player/pause'
    } else if (action === 'next') {
      spotifyUrl = 'https://api.spotify.com/v1/me/player/next'
    } else if (action === 'previous') {
      spotifyUrl = 'https://api.spotify.com/v1/me/player/previous'
    }

    // Adicionar device_id se fornecido
    if (device_id) {
      spotifyUrl += `?device_id=${device_id}`
    }

    // Fazer requisição ao Spotify
    const spotifyResponse = await fetch(spotifyUrl, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined,
    })

    if (!spotifyResponse.ok) {
      const errorData = await spotifyResponse.json().catch(() => ({}))
      console.error('[Spotify Play] Erro:', errorData)

      // Se token expirou, indicar que precisa renovar
      if (spotifyResponse.status === 401) {
        return NextResponse.json(
          { error: 'Token expirado', needsRefresh: true },
          { status: 401 }
        )
      }

      return NextResponse.json(
        { error: errorData.error?.message || 'Erro ao controlar reprodução' },
        { status: spotifyResponse.status }
      )
    }

    return NextResponse.json({
      success: true,
      action,
    })
  } catch (error: any) {
    console.error('[POST /api/spotify/play] Erro:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao controlar reprodução' },
      { status: 500 }
    )
  }
}

