"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Timer, Play, Pause, RotateCcw, SkipForward, Settings, Coffee, Target, History, Music } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { SpotifyPlayer } from "@/components/SpotifyPlayer"
import { useSpotify } from "@/hooks/useSpotify"

type TimerMode = 'focus' | 'shortBreak' | 'longBreak'

interface TimerSettings {
  focusMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  pomodorosUntilLongBreak: number
}

const DEFAULT_SETTINGS: TimerSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  pomodorosUntilLongBreak: 4,
}

export default function CronometroPage() {
  const { toast } = useToast()
  const [mode, setMode] = useState<TimerMode>('focus')
  const [timeLeft, setTimeLeft] = useState(25 * 60) // em segundos
  const [isRunning, setIsRunning] = useState(false)
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [currentPomodoroId, setCurrentPomodoroId] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [historico, setHistorico] = useState<any[]>([])
  const [showHistorico, setShowHistorico] = useState(false)
  const [spotifyConnected, setSpotifyConnected] = useState(false)
  const [spotifyPlaylist, setSpotifyPlaylist] = useState<string>("")
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  // Integração com Spotify
  const { play: spotifyPlay, pause: spotifyPause, status: spotifyStatus } = useSpotify()

  // Carregar configurações do backend
  useEffect(() => {
    loadSettings()
    loadStats()
    
    // Verificar se houve callback do Spotify
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('spotify_connected') === 'true') {
      toast({
        title: "Spotify Conectado! 🎵",
        description: "Sua conta Spotify foi conectada com sucesso!",
      })
      // Limpar parâmetro da URL
      window.history.replaceState({}, '', window.location.pathname)
    } else if (urlParams.get('spotify_error')) {
      const error = urlParams.get('spotify_error')
      toast({
        title: "Erro ao conectar Spotify",
        description: error === 'not_authenticated' 
          ? 'Você precisa estar logado para conectar o Spotify'
          : 'Ocorreu um erro ao conectar sua conta Spotify. Tente novamente.',
        variant: "destructive",
      })
      // Limpar parâmetro da URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/produtividade/pomodoros/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.settings) {
          setSettings({
            focusMinutes: data.settings.focus_minutes,
            shortBreakMinutes: data.settings.short_break_minutes,
            longBreakMinutes: data.settings.long_break_minutes,
            pomodorosUntilLongBreak: data.settings.pomodoros_until_long_break,
          })
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async (newSettings: TimerSettings) => {
    try {
      const response = await fetch('/api/produtividade/pomodoros/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          focus_minutes: newSettings.focusMinutes,
          short_break_minutes: newSettings.shortBreakMinutes,
          long_break_minutes: newSettings.longBreakMinutes,
          pomodoros_until_long_break: newSettings.pomodorosUntilLongBreak,
        }),
      })
      if (!response.ok) {
        throw new Error('Erro ao salvar configurações')
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações",
        variant: "destructive",
      })
    }
  }

  const loadStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/produtividade/pomodoros?limit=100', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setStats(data.stats)
          setHistorico(data.pomodoros || [])
          // Contar pomodoros de foco completados hoje
          const today = new Date().toDateString()
          const todayPomodoros = data.pomodoros.filter((p: any) => {
            const pomodoroDate = new Date(p.started_at).toDateString()
            return pomodoroDate === today && p.mode === 'focus' && p.completed
          })
          setCompletedPomodoros(todayPomodoros.length)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const startPomodoro = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const duration = mode === 'focus' 
        ? settings.focusMinutes * 60
        : mode === 'shortBreak'
        ? settings.shortBreakMinutes * 60
        : settings.longBreakMinutes * 60

      const response = await fetch('/api/produtividade/pomodoros', {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          mode,
          duration_seconds: duration,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.pomodoro) {
          setCurrentPomodoroId(data.pomodoro.id)
        }
      }
    } catch (error) {
      console.error('Erro ao iniciar pomodoro:', error)
    }
  }

  const updatePomodoro = async (completed: boolean, completedSeconds?: number) => {
    if (!currentPomodoroId) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      await fetch('/api/produtividade/pomodoros', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          id: currentPomodoroId,
          completed,
          completed_seconds: completedSeconds || timeLeft,
        }),
      })
      
      // Recarregar histórico após atualizar
      if (completed) {
        await loadStats()
      }
    } catch (error) {
      console.error('Erro ao atualizar pomodoro:', error)
    }
  }

  // Inicializar tempo baseado no modo
  useEffect(() => {
    if (mode === 'focus') {
      setTimeLeft(settings.focusMinutes * 60)
    } else if (mode === 'shortBreak') {
      setTimeLeft(settings.shortBreakMinutes * 60)
    } else if (mode === 'longBreak') {
      setTimeLeft(settings.longBreakMinutes * 60)
    }
    setIsRunning(false)
  }, [mode, settings])

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft])

  const handleTimerComplete = async () => {
    setIsRunning(false)
    
    // Pausar música do Spotify se conectado
    if (spotifyStatus.connected) {
      try {
        await spotifyPause()
      } catch (error) {
        console.error('[Pomodoro] Erro ao pausar música:', error)
      }
    }
    
    // Marcar pomodoro como completo
    await updatePomodoro(true, 0)
    setCurrentPomodoroId(null)
    
    // Tocar som de notificação (usando Web Audio API)
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (e) {
      console.error('Erro ao tocar som:', e)
    }

    if (mode === 'focus') {
      const newCompleted = completedPomodoros + 1
      setCompletedPomodoros(newCompleted)
      
      // Recarregar estatísticas
      await loadStats()
      
      toast({
        title: "Pomodoro Completo! 🎉",
        description: `Você completou ${newCompleted} pomodoro(s). Hora de uma pausa!`,
      })

      // Verificar se é hora da pausa longa
      if (newCompleted % settings.pomodorosUntilLongBreak === 0) {
        setMode('longBreak')
        toast({
          title: "Pausa Longa! ☕",
          description: `Você completou ${newCompleted} pomodoros. Descanse por ${settings.longBreakMinutes} minutos.`,
        })
      } else {
        setMode('shortBreak')
        toast({
          title: "Pausa Curta! ☕",
          description: `Descanse por ${settings.shortBreakMinutes} minutos.`,
        })
      }
    } else {
      // Pausa terminou, voltar para foco
      setMode('focus')
      toast({
        title: "Pausa Terminada! ⏰",
        description: "Hora de voltar ao foco!",
      })
    }
  }

  const toggleTimer = async () => {
    if (!isRunning) {
      // Iniciar
      await startPomodoro()
      // Tocar música do Spotify se conectado e no modo foco
      if (spotifyStatus.connected && mode === 'focus' && spotifyPlaylist) {
        try {
          await spotifyPlay(spotifyPlaylist)
        } catch (error) {
          console.error('[Pomodoro] Erro ao tocar música:', error)
        }
      }
    } else {
      // Pausar - atualizar tempo completado
      await updatePomodoro(false, timeLeft)
      // Pausar música do Spotify se conectado
      if (spotifyStatus.connected) {
        try {
          await spotifyPause()
        } catch (error) {
          console.error('[Pomodoro] Erro ao pausar música:', error)
        }
      }
    }
    setIsRunning(!isRunning)
  }

  const resetTimer = async () => {
    setIsRunning(false)
    // Se houver pomodoro em andamento, marcar como não completado
    if (currentPomodoroId) {
      await updatePomodoro(false, timeLeft)
      setCurrentPomodoroId(null)
    }
    if (mode === 'focus') {
      setTimeLeft(settings.focusMinutes * 60)
    } else if (mode === 'shortBreak') {
      setTimeLeft(settings.shortBreakMinutes * 60)
    } else if (mode === 'longBreak') {
      setTimeLeft(settings.longBreakMinutes * 60)
    }
  }

  const skipTimer = async () => {
    setIsRunning(false)
    // Marcar pomodoro atual como não completado
    if (currentPomodoroId) {
      await updatePomodoro(false, timeLeft)
      setCurrentPomodoroId(null)
    }
    if (mode === 'focus') {
      const newCompleted = completedPomodoros + 1
      setCompletedPomodoros(newCompleted)
      if (newCompleted % settings.pomodorosUntilLongBreak === 0) {
        setMode('longBreak')
      } else {
        setMode('shortBreak')
      }
    } else {
      setMode('focus')
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgress = (): number => {
    let totalTime = 0
    if (mode === 'focus') {
      totalTime = settings.focusMinutes * 60
    } else if (mode === 'shortBreak') {
      totalTime = settings.shortBreakMinutes * 60
    } else if (mode === 'longBreak') {
      totalTime = settings.longBreakMinutes * 60
    }
    return ((totalTime - timeLeft) / totalTime) * 100
  }

  const getModeLabel = (): string => {
    if (mode === 'focus') return 'Foco'
    if (mode === 'shortBreak') return 'Pausa Curta'
    return 'Pausa Longa'
  }

  const getModeIcon = () => {
    if (mode === 'focus') return <Target className="h-5 w-5" />
    return <Coffee className="h-5 w-5" />
  }

  const getModeColor = (): string => {
    if (mode === 'focus') return 'bg-[#ff5a1f]'
    if (mode === 'shortBreak') return 'bg-blue-500'
    return 'bg-green-500'
  }

  const circumference = 2 * Math.PI * 90 // raio de 90
  const progress = getProgress()
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Ícone quadrado laranja com contorno branco */}
            <div className="w-12 h-12 bg-[#ff5a1f] rounded-lg flex items-center justify-center border-2 border-white/20 flex-shrink-0">
              <Timer className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold text-white leading-tight break-words">
                <span className="block">Pomodoro</span>
                <span className="block">Timer</span>
              </h1>
              <p className="text-gray-400 text-base md:text-lg mt-2">Técnica de produtividade</p>
            </div>
          </div>
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="border-gray-600 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 h-10 px-4"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
              <DialogHeader>
                <DialogTitle>Configurações do Pomodoro</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Personalize os tempos do seu timer
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="focus">Tempo de Foco (minutos)</Label>
                  <Input
                    id="focus"
                    type="number"
                    min="1"
                    max="60"
                    value={settings.focusMinutes}
                    onChange={(e) =>
                      setSettings({ ...settings, focusMinutes: parseInt(e.target.value) || 25 })
                    }
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shortBreak">Pausa Curta (minutos)</Label>
                  <Input
                    id="shortBreak"
                    type="number"
                    min="1"
                    max="30"
                    value={settings.shortBreakMinutes}
                    onChange={(e) =>
                      setSettings({ ...settings, shortBreakMinutes: parseInt(e.target.value) || 5 })
                    }
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longBreak">Pausa Longa (minutos)</Label>
                  <Input
                    id="longBreak"
                    type="number"
                    min="1"
                    max="60"
                    value={settings.longBreakMinutes}
                    onChange={(e) =>
                      setSettings({ ...settings, longBreakMinutes: parseInt(e.target.value) || 15 })
                    }
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pomodoros">Pomodoros até Pausa Longa</Label>
                  <Input
                    id="pomodoros"
                    type="number"
                    min="1"
                    max="10"
                    value={settings.pomodorosUntilLongBreak}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        pomodorosUntilLongBreak: parseInt(e.target.value) || 4,
                      })
                    }
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={async () => {
                    await saveSettings(settings)
                    setIsSettingsOpen(false)
                    toast({
                      title: "Configurações salvas!",
                      description: "Suas configurações foram salvas com sucesso.",
                    })
                  }}
                  className="bg-[#ff5a1f] hover:bg-[#ff4d29] text-white"
                >
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Contador de Pomodoros */}
      <div className="flex justify-center gap-4">
        {Array.from({ length: Math.min(completedPomodoros, 8) }).map((_, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full bg-[#ff5a1f]"
            title={`Pomodoro ${i + 1} completo`}
          />
        ))}
        {completedPomodoros > 8 && (
          <Badge variant="outline" className="border-[#2a2a2a] text-white">
            +{completedPomodoros - 8}
          </Badge>
        )}
      </div>

      {/* Timer Principal */}
      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge className={`${getModeColor()} text-white`}>
              {getModeIcon()}
              <span className="ml-2">{getModeLabel()}</span>
            </Badge>
          </div>
          {/* Timer Cinematográfico */}
          <div className="flex justify-center items-center relative w-80 h-80 mx-auto">
            {/* Círculo externo com brilho */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#ff5a1f]/20 via-transparent to-transparent blur-2xl" />
            
            {/* Círculo de Progresso - Estilo Cinematográfico */}
            <svg className="transform -rotate-90 w-80 h-80 drop-shadow-2xl">
              {/* Círculo de fundo com gradiente */}
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={mode === 'focus' ? '#ff5a1f' : mode === 'shortBreak' ? '#3b82f6' : '#10b981'} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={mode === 'focus' ? '#ff5a1f' : mode === 'shortBreak' ? '#3b82f6' : '#10b981'} stopOpacity="1" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Círculo de fundo */}
              <circle
                cx="160"
                cy="160"
                r="140"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                className="text-[#1a1a1a] opacity-30"
              />
              
              {/* Círculo de progresso com brilho */}
              <circle
                cx="160"
                cy="160"
                r="140"
                stroke="url(#progressGradient)"
                strokeWidth="6"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-linear"
                strokeLinecap="round"
                filter="url(#glow)"
                style={{
                  boxShadow: `0 0 20px ${mode === 'focus' ? '#ff5a1f' : mode === 'shortBreak' ? '#3b82f6' : '#10b981'}`,
                }}
              />
              
              {/* Marcadores de minutos (estilo relógio) */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30 - 90) * (Math.PI / 180)
                const x1 = 160 + 130 * Math.cos(angle)
                const y1 = 160 + 130 * Math.sin(angle)
                const x2 = 160 + 140 * Math.cos(angle)
                const y2 = 160 + 140 * Math.sin(angle)
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-gray-600"
                  />
                )
              })}
            </svg>
            
            {/* Tempo - Estilo Cinematográfico */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="relative">
                {/* Efeito de brilho atrás do texto */}
                <div 
                  className="absolute inset-0 blur-2xl opacity-50"
                  style={{
                    background: mode === 'focus' 
                      ? 'radial-gradient(circle, #ff5a1f 0%, transparent 70%)'
                      : mode === 'shortBreak'
                      ? 'radial-gradient(circle, #3b82f6 0%, transparent 70%)'
                      : 'radial-gradient(circle, #10b981 0%, transparent 70%)'
                  }}
                />
                <CardTitle className="relative text-7xl md:text-8xl font-bold text-white drop-shadow-[0_0_30px_rgba(255,90,31,0.5)] tracking-tight">
                  {formatTime(timeLeft)}
                </CardTitle>
              </div>
              {/* Indicador de modo */}
              <div className="mt-4">
                <Badge className={`${getModeColor()} text-white px-4 py-1.5 text-sm font-semibold shadow-lg`}>
                  {getModeLabel()}
                </Badge>
              </div>
            </div>
          </div>
          <CardDescription className="text-center text-gray-400 mt-4">
            {completedPomodoros > 0 && (
              <p className="text-lg">
                {completedPomodoros} pomodoro{completedPomodoros !== 1 ? 's' : ''} completado
                {completedPomodoros !== 1 ? 's' : ''}
              </p>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button
              onClick={toggleTimer}
              className={`${isRunning ? 'bg-orange-500 hover:bg-orange-600' : 'bg-[#ff5a1f] hover:bg-[#ff4d29]'} text-white`}
              size="lg"
            >
              {isRunning ? (
                <>
                  <Pause className="h-5 w-5 mr-2" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Iniciar
                </>
              )}
            </Button>
            <Button
              onClick={resetTimer}
              variant="outline"
              className="border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
              size="lg"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Resetar
            </Button>
            <Button
              onClick={skipTimer}
              variant="outline"
              className="border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
              size="lg"
            >
              <SkipForward className="h-5 w-5 mr-2" />
              Pular
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="text-white text-lg">Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl md:text-2xl lg:text-3xl font-bold text-[#ff5a1f]">{stats.today}</p>
              <p className="text-sm text-gray-400">pomodoros</p>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="text-white text-lg">Esta Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[#ff5a1f]">{stats.this_week}</p>
              <p className="text-sm text-gray-400">pomodoros</p>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="text-white text-lg">Completados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-500">{stats.completed}</p>
              <p className="text-sm text-gray-400">de {stats.total}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="text-white text-lg">Tempo Focado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-500">
                {Math.floor(stats.total_focus_time / 60)}
              </p>
              <p className="text-sm text-gray-400">minutos</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Botões de Ação Adicionais */}
      <div className="flex justify-center gap-4">
        <Button
          onClick={() => setShowHistorico(!showHistorico)}
          variant="outline"
          className="border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
        >
          <History className="h-4 w-4 mr-2" />
          {showHistorico ? 'Ocultar' : 'Ver'} Histórico
        </Button>
        <Button
          onClick={() => {
            // Integração com Spotify - abrir popup de autenticação
            const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || ''
            const redirectUri = `${window.location.origin}/api/spotify/callback`
            const scopes = 'user-read-playback-state user-modify-playback-state'
            const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`
            
            if (clientId) {
              window.open(authUrl, 'Spotify Auth', 'width=500,height=600')
            } else {
              toast({
                title: "Spotify não configurado",
                description: "A integração com Spotify ainda não está configurada.",
                variant: "destructive"
              })
            }
          }}
          variant="outline"
          className={`border-[#2a2a2a] ${spotifyConnected ? 'bg-green-500/20 border-green-500' : 'text-white hover:bg-[#2a2a2a]'}`}
        >
          <Music className="h-4 w-4 mr-2" />
          {spotifyConnected ? 'Spotify Conectado' : 'Conectar Spotify'}
        </Button>
      </div>

      {/* Histórico de Pomodoros */}
      {showHistorico && (
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Uso
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historico.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                Nenhum pomodoro registrado ainda. Comece a usar o cronômetro!
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {historico.map((pomodoro: any) => {
                  const date = new Date(pomodoro.started_at)
                  const duration = Math.floor(pomodoro.completed_seconds / 60)
                  const modeLabels: Record<string, string> = {
                    focus: 'Foco',
                    shortBreak: 'Pausa Curta',
                    longBreak: 'Pausa Longa'
                  }
                  const modeColors: Record<string, string> = {
                    focus: 'bg-orange-500/20 text-orange-400 border-orange-500',
                    shortBreak: 'bg-blue-500/20 text-blue-400 border-blue-500',
                    longBreak: 'bg-green-500/20 text-green-400 border-green-500'
                  }

                  return (
                    <div
                      key={pomodoro.id}
                      className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]"
                    >
                      <div className="flex items-center gap-3">
                        <Badge className={modeColors[pomodoro.mode] || ''}>
                          {modeLabels[pomodoro.mode] || pomodoro.mode}
                        </Badge>
                        <div>
                          <p className="text-white text-sm font-medium">
                            {date.toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {duration} min / {Math.floor(pomodoro.duration_seconds / 60)} min
                            {pomodoro.completed ? ' ✓ Completo' : ' ⏸ Interrompido'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Spotify Player */}
      <SpotifyPlayer />

      {/* Informações sobre a Técnica */}
      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-white">Como funciona o Pomodoro?</CardTitle>
        </CardHeader>
        <CardContent className="text-gray-400 space-y-2">
          <p>
            A técnica Pomodoro é um método de gerenciamento de tempo que divide o trabalho em
            intervalos de 25 minutos (chamados &quot;pomodoros&quot;), separados por pausas curtas.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Trabalhe focado por 25 minutos</li>
            <li>Faça uma pausa curta de 5 minutos</li>
            <li>Após 4 pomodoros, faça uma pausa longa de 15 minutos</li>
            <li>Repita o ciclo</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
