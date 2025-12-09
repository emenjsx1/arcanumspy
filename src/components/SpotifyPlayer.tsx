"use client"

import { useEffect, useRef, useState } from 'react'
import { useSpotify } from '@/hooks/useSpotify'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, Pause, SkipForward, SkipBack, Volume2, Music, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

declare global {
  interface Window {
    Spotify: any
    onSpotifyWebPlaybackSDKReady: () => void
  }
}

export function SpotifyPlayer() {
  const { toast } = useToast()
  const {
    status,
    loading,
    player,
    deviceId,
    currentTrack,
    isPlaying,
    volume,
    connect,
    play,
    pause,
    next,
    previous,
    setPlayer,
    setDeviceId,
    setCurrentTrack,
    setIsPlaying,
    setVolume,
  } = useSpotify()

  const [playerReady, setPlayerReady] = useState(false)
  const [progress, setProgress] = useState(0)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Carregar Web Playback SDK
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Verificar se já está carregado
    if (window.Spotify) {
      initializePlayer()
      return
    }

    // Carregar script do SDK
    const script = document.createElement('script')
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.async = true
    document.body.appendChild(script)

    window.onSpotifyWebPlaybackSDKReady = () => {
      initializePlayer()
    }

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  // Inicializar player quando SDK estiver pronto
  const initializePlayer = async () => {
    if (!window.Spotify || !status.connected) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Buscar access_token do backend
      const tokenResponse = await fetch('/api/auth/spotify/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!tokenResponse.ok) {
        console.error('[SpotifyPlayer] Erro ao obter token')
        return
      }

      const { access_token } = await tokenResponse.json()

      const spotifyPlayer = new window.Spotify.Player({
        name: 'MozStarter Player',
        getOAuthToken: (cb: (token: string) => void) => {
          cb(access_token)
        },
        volume: 0.5,
      })

      // Event listeners
      spotifyPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('[SpotifyPlayer] Ready com device_id:', device_id)
        setDeviceId(device_id)
        setPlayerReady(true)
        setPlayer(spotifyPlayer as any)
      })

      spotifyPlayer.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('[SpotifyPlayer] Device desconectado:', device_id)
        setDeviceId(null)
        setPlayerReady(false)
      })

      spotifyPlayer.addListener('player_state_changed', (state: any) => {
        if (!state) return

        setCurrentTrack(state.track_window.current_track)
        setIsPlaying(!state.paused)

        if (state.position && state.duration) {
          setProgress((state.position / state.duration) * 100)
        }
      })

      // Conectar ao player
      const connected = await spotifyPlayer.connect()
      if (connected) {
        console.log('[SpotifyPlayer] Conectado com sucesso')
      } else {
        console.error('[SpotifyPlayer] Falha ao conectar')
        toast({
          title: 'Erro',
          description: 'Falha ao conectar ao Spotify Player. Verifique se você tem Spotify Premium.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('[SpotifyPlayer] Erro ao inicializar:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao inicializar Spotify Player',
        variant: 'destructive',
      })
    }
  }

  // Atualizar progresso periodicamente
  useEffect(() => {
    if (isPlaying && player) {
      progressIntervalRef.current = setInterval(async () => {
        try {
          const state = await player.getCurrentState()
          if (state && state.position && state.duration) {
            setProgress((state.position / state.duration) * 100)
          }
        } catch (error) {
          console.error('[SpotifyPlayer] Erro ao obter estado:', error)
        }
      }, 1000)
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [isPlaying, player])

  // Limpar ao desmontar
  useEffect(() => {
    return () => {
      if (player) {
        player.disconnect()
      }
    }
  }, [player])

  if (loading) {
    return (
      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            <span className="text-gray-400 text-sm">Verificando conexão...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!status.connected) {
    return (
      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardContent className="p-6 text-center">
          <Music className="h-12 w-12 text-[#1db954] mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">Conectar com Spotify</h3>
          <p className="text-gray-400 text-sm mb-4">
            Conecte sua conta Spotify Premium para reproduzir músicas durante o Pomodoro
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] rounded-lg border border-[#3a3a3a]">
            <span className="text-gray-400 text-sm">🚧 Em breve</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!status.isPremium) {
    return (
      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardContent className="p-6 text-center">
          <Music className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">Spotify Premium Necessário</h3>
          <p className="text-gray-400 text-sm mb-4">
            O Web Playback SDK do Spotify requer uma conta Premium
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] rounded-lg border border-[#3a3a3a]">
            <span className="text-gray-400 text-sm">🚧 Em breve</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!playerReady || !deviceId) {
    return (
      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardContent className="p-6 text-center">
          <Music className="h-12 w-12 text-[#1db954] mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">Spotify Player</h3>
          <p className="text-gray-400 text-sm mb-4">
            Reproduza suas músicas favoritas durante o Pomodoro
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] rounded-lg border border-[#3a3a3a]">
            <span className="text-gray-400 text-sm">🚧 Em breve</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Mostrar "Em breve" para todos os estados funcionais também
  return (
    <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
      <CardContent className="p-6 text-center">
        <Music className="h-12 w-12 text-[#1db954] mx-auto mb-4" />
        <h3 className="text-white font-semibold mb-2">Spotify Player</h3>
        <p className="text-gray-400 text-sm mb-4">
          Reproduza suas músicas favoritas durante o Pomodoro
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] rounded-lg border border-[#3a3a3a]">
          <span className="text-gray-400 text-sm">🚧 Em breve</span>
        </div>
      </CardContent>
    </Card>
  )
}

