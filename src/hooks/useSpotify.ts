import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

interface SpotifyStatus {
  connected: boolean
  isPremium?: boolean
  needsRefresh?: boolean
  expiresAt?: string
}

interface SpotifyPlayer {
  connect: () => Promise<boolean>
  disconnect: () => void
  play: (uri?: string) => Promise<void>
  pause: () => Promise<void>
  next: () => Promise<void>
  previous: () => Promise<void>
  setVolume: (volume: number) => Promise<void>
  getCurrentState: () => Promise<any>
}

export function useSpotify() {
  const [status, setStatus] = useState<SpotifyStatus>({ connected: false })
  const [loading, setLoading] = useState(true)
  const [player, setPlayer] = useState<SpotifyPlayer | null>(null)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [currentTrack, setCurrentTrack] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.5)

  // Verificar status da conexão
  const checkStatus = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setStatus({ connected: false })
        setLoading(false)
        return
      }

      const response = await fetch('/api/spotify/status', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      } else {
        setStatus({ connected: false })
      }
    } catch (error) {
      console.error('[useSpotify] Erro ao verificar status:', error)
      setStatus({ connected: false })
    } finally {
      setLoading(false)
    }
  }, [])

  // Conectar ao Spotify
  const connect = useCallback(() => {
    window.location.href = '/api/auth/spotify/login'
  }, [])

  // Renovar token
  const refreshToken = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return false

      const response = await fetch('/api/auth/spotify/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        await checkStatus()
        return true
      }
      return false
    } catch (error) {
      console.error('[useSpotify] Erro ao renovar token:', error)
      return false
    }
  }, [checkStatus])

  // Controlar reprodução
  const play = useCallback(async (uri?: string) => {
    if (!player || !deviceId) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const body: any = {
        device_id: deviceId,
        action: 'play',
      }

      if (uri) {
        if (uri.startsWith('spotify:playlist:')) {
          body.playlist_uri = uri
        } else if (uri.startsWith('spotify:track:')) {
          body.track_uri = uri
        }
      }

      const response = await fetch('/api/spotify/play', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setIsPlaying(true)
      } else if (response.status === 401) {
        // Token expirado, tentar renovar
        const refreshed = await refreshToken()
        if (refreshed) {
          // Tentar novamente
          await play(uri)
        }
      }
    } catch (error) {
      console.error('[useSpotify] Erro ao tocar:', error)
    }
  }, [player, deviceId, refreshToken])

  const pause = useCallback(async () => {
    if (!player || !deviceId) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/spotify/play', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          device_id: deviceId,
          action: 'pause',
        }),
      })

      if (response.ok) {
        setIsPlaying(false)
      }
    } catch (error) {
      console.error('[useSpotify] Erro ao pausar:', error)
    }
  }, [player, deviceId])

  const next = useCallback(async () => {
    if (!player || !deviceId) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      await fetch('/api/spotify/play', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          device_id: deviceId,
          action: 'next',
        }),
      })
    } catch (error) {
      console.error('[useSpotify] Erro ao pular:', error)
    }
  }, [player, deviceId])

  const previous = useCallback(async () => {
    if (!player || !deviceId) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      await fetch('/api/spotify/play', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          device_id: deviceId,
          action: 'previous',
        }),
      })
    } catch (error) {
      console.error('[useSpotify] Erro ao voltar:', error)
    }
  }, [player, deviceId])

  // Verificar status ao montar
  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  return {
    status,
    loading,
    player,
    deviceId,
    currentTrack,
    isPlaying,
    volume,
    connect,
    refreshToken,
    play,
    pause,
    next,
    previous,
    setPlayer,
    setDeviceId,
    setCurrentTrack,
    setIsPlaying,
    setVolume,
    checkStatus,
  }
}

