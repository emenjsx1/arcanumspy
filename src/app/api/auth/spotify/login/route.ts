import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/auth/spotify/callback'

export async function GET(request: Request) {
  try {
    // Verificar autenticação do usuário via cookies (padrão Next.js + Supabase)
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      // Se não autenticado, redirecionar para página de login
      const url = new URL('/login', request.url)
      url.searchParams.set('redirect', '/produtividade/cronometro')
      return NextResponse.redirect(url)
    }

    if (!SPOTIFY_CLIENT_ID) {
      return NextResponse.json(
        { error: 'SPOTIFY_CLIENT_ID não configurado' },
        { status: 500 }
      )
    }

    // Escopos necessários para o Web Playback SDK
    const scopes = [
      'user-read-private',
      'user-read-email',
      'user-read-playback-state',
      'user-modify-playback-state',
      'streaming',
      'user-read-currently-playing',
    ].join(' ')

    // Estado para prevenir CSRF (incluir user_id)
    const state = Buffer.from(JSON.stringify({ userId: user.id, timestamp: Date.now() })).toString('base64')

    // URL de autorização do Spotify
    const authUrl = new URL('https://accounts.spotify.com/authorize')
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', SPOTIFY_CLIENT_ID)
    authUrl.searchParams.set('scope', scopes)
    authUrl.searchParams.set('redirect_uri', SPOTIFY_REDIRECT_URI)
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('show_dialog', 'false')

    // Redirecionar para o Spotify
    return NextResponse.redirect(authUrl.toString())
  } catch (error: any) {
    console.error('[GET /api/auth/spotify/login] Erro:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao iniciar autenticação Spotify' },
      { status: 500 }
    )
  }
}

