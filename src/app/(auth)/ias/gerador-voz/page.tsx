"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AudioLines, Play, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Vozes pré-configuradas do Google TTS
// Organizadas por idioma e tipo (Neural2 > Wavenet > Standard)
const VOZES = [
  // Português (Brasil) - Neural2 (Mais Natural)
  { value: 'pt-BR-Neural2-A', label: '🇧🇷 Feminina Neural2 (pt-BR) - Premium', language: 'pt-BR', type: 'neural2' },
  { value: 'pt-BR-Neural2-B', label: '🇧🇷 Masculina Neural2 (pt-BR) - Premium', language: 'pt-BR', type: 'neural2' },
  { value: 'pt-BR-Neural2-C', label: '🇧🇷 Feminina Neural2 C (pt-BR) - Premium', language: 'pt-BR', type: 'neural2' },
  { value: 'pt-BR-Neural2-D', label: '🇧🇷 Masculina Neural2 D (pt-BR) - Premium', language: 'pt-BR', type: 'neural2' },
  
  // Português (Brasil) - Wavenet (Alta Qualidade)
  { value: 'pt-BR-Wavenet-A', label: '🇧🇷 Feminina Wavenet (pt-BR) - Alta Qualidade', language: 'pt-BR', type: 'wavenet' },
  { value: 'pt-BR-Wavenet-B', label: '🇧🇷 Masculina Wavenet (pt-BR) - Alta Qualidade', language: 'pt-BR', type: 'wavenet' },
  { value: 'pt-BR-Wavenet-C', label: '🇧🇷 Feminina Wavenet C (pt-BR) - Alta Qualidade', language: 'pt-BR', type: 'wavenet' },
  { value: 'pt-BR-Wavenet-D', label: '🇧🇷 Masculina Wavenet D (pt-BR) - Alta Qualidade', language: 'pt-BR', type: 'wavenet' },
  
  // Português (Brasil) - Standard (Básico)
  { value: 'pt-BR-Standard-A', label: '🇧🇷 Feminina Standard (pt-BR) - Básico', language: 'pt-BR', type: 'standard' },
  { value: 'pt-BR-Standard-B', label: '🇧🇷 Masculina Standard (pt-BR) - Básico', language: 'pt-BR', type: 'standard' },
  
  // Inglês (EUA) - Neural2
  { value: 'en-US-Neural2-A', label: '🇺🇸 Female Neural2 (en-US) - Premium', language: 'en-US', type: 'neural2' },
  { value: 'en-US-Neural2-B', label: '🇺🇸 Male Neural2 (en-US) - Premium', language: 'en-US', type: 'neural2' },
  { value: 'en-US-Neural2-C', label: '🇺🇸 Female Neural2 C (en-US) - Premium', language: 'en-US', type: 'neural2' },
  { value: 'en-US-Neural2-D', label: '🇺🇸 Male Neural2 D (en-US) - Premium', language: 'en-US', type: 'neural2' },
  { value: 'en-US-Neural2-E', label: '🇺🇸 Female Neural2 E (en-US) - Premium', language: 'en-US', type: 'neural2' },
  { value: 'en-US-Neural2-F', label: '🇺🇸 Female Neural2 F (en-US) - Premium', language: 'en-US', type: 'neural2' },
  { value: 'en-US-Neural2-G', label: '🇺🇸 Female Neural2 G (en-US) - Premium', language: 'en-US', type: 'neural2' },
  { value: 'en-US-Neural2-H', label: '🇺🇸 Female Neural2 H (en-US) - Premium', language: 'en-US', type: 'neural2' },
  { value: 'en-US-Neural2-I', label: '🇺🇸 Male Neural2 I (en-US) - Premium', language: 'en-US', type: 'neural2' },
  { value: 'en-US-Neural2-J', label: '🇺🇸 Male Neural2 J (en-US) - Premium', language: 'en-US', type: 'neural2' },
  
  // Inglês (EUA) - Wavenet
  { value: 'en-US-Wavenet-A', label: '🇺🇸 Female Wavenet (en-US) - Alta Qualidade', language: 'en-US', type: 'wavenet' },
  { value: 'en-US-Wavenet-B', label: '🇺🇸 Male Wavenet (en-US) - Alta Qualidade', language: 'en-US', type: 'wavenet' },
  { value: 'en-US-Wavenet-C', label: '🇺🇸 Female Wavenet C (en-US) - Alta Qualidade', language: 'en-US', type: 'wavenet' },
  { value: 'en-US-Wavenet-D', label: '🇺🇸 Male Wavenet D (en-US) - Alta Qualidade', language: 'en-US', type: 'wavenet' },
  { value: 'en-US-Wavenet-E', label: '🇺🇸 Female Wavenet E (en-US) - Alta Qualidade', language: 'en-US', type: 'wavenet' },
  { value: 'en-US-Wavenet-F', label: '🇺🇸 Female Wavenet F (en-US) - Alta Qualidade', language: 'en-US', type: 'wavenet' },
  { value: 'en-US-Wavenet-G', label: '🇺🇸 Female Wavenet G (en-US) - Alta Qualidade', language: 'en-US', type: 'wavenet' },
  { value: 'en-US-Wavenet-H', label: '🇺🇸 Female Wavenet H (en-US) - Alta Qualidade', language: 'en-US', type: 'wavenet' },
  { value: 'en-US-Wavenet-I', label: '🇺🇸 Male Wavenet I (en-US) - Alta Qualidade', language: 'en-US', type: 'wavenet' },
  { value: 'en-US-Wavenet-J', label: '🇺🇸 Male Wavenet J (en-US) - Alta Qualidade', language: 'en-US', type: 'wavenet' },
  
  // Inglês (EUA) - Standard
  { value: 'en-US-Standard-A', label: '🇺🇸 Female Standard (en-US) - Básico', language: 'en-US', type: 'standard' },
  { value: 'en-US-Standard-B', label: '🇺🇸 Male Standard (en-US) - Básico', language: 'en-US', type: 'standard' },
  { value: 'en-US-Standard-C', label: '🇺🇸 Female Standard C (en-US) - Básico', language: 'en-US', type: 'standard' },
  { value: 'en-US-Standard-D', label: '🇺🇸 Male Standard D (en-US) - Básico', language: 'en-US', type: 'standard' },
  { value: 'en-US-Standard-E', label: '🇺🇸 Female Standard E (en-US) - Básico', language: 'en-US', type: 'standard' },
  { value: 'en-US-Standard-F', label: '🇺🇸 Female Standard F (en-US) - Básico', language: 'en-US', type: 'standard' },
  { value: 'en-US-Standard-G', label: '🇺🇸 Female Standard G (en-US) - Básico', language: 'en-US', type: 'standard' },
  { value: 'en-US-Standard-H', label: '🇺🇸 Female Standard H (en-US) - Básico', language: 'en-US', type: 'standard' },
  { value: 'en-US-Standard-I', label: '🇺🇸 Male Standard I (en-US) - Básico', language: 'en-US', type: 'standard' },
  { value: 'en-US-Standard-J', label: '🇺🇸 Male Standard J (en-US) - Básico', language: 'en-US', type: 'standard' },
  
  // Espanhol (Espanha) - Neural2
  { value: 'es-ES-Neural2-A', label: '🇪🇸 Femenina Neural2 (es-ES) - Premium', language: 'es-ES', type: 'neural2' },
  { value: 'es-ES-Neural2-B', label: '🇪🇸 Masculina Neural2 (es-ES) - Premium', language: 'es-ES', type: 'neural2' },
  { value: 'es-ES-Neural2-C', label: '🇪🇸 Femenina Neural2 C (es-ES) - Premium', language: 'es-ES', type: 'neural2' },
  { value: 'es-ES-Neural2-D', label: '🇪🇸 Masculina Neural2 D (es-ES) - Premium', language: 'es-ES', type: 'neural2' },
  
  // Espanhol (Espanha) - Wavenet
  { value: 'es-ES-Wavenet-A', label: '🇪🇸 Femenina Wavenet (es-ES) - Alta Qualidade', language: 'es-ES', type: 'wavenet' },
  { value: 'es-ES-Wavenet-B', label: '🇪🇸 Masculina Wavenet (es-ES) - Alta Qualidade', language: 'es-ES', type: 'wavenet' },
  { value: 'es-ES-Wavenet-C', label: '🇪🇸 Femenina Wavenet C (es-ES) - Alta Qualidade', language: 'es-ES', type: 'wavenet' },
  { value: 'es-ES-Wavenet-D', label: '🇪🇸 Masculina Wavenet D (es-ES) - Alta Qualidade', language: 'es-ES', type: 'wavenet' },
  
  // Francês (França) - Neural2
  { value: 'fr-FR-Neural2-A', label: '🇫🇷 Féminine Neural2 (fr-FR) - Premium', language: 'fr-FR', type: 'neural2' },
  { value: 'fr-FR-Neural2-B', label: '🇫🇷 Masculine Neural2 (fr-FR) - Premium', language: 'fr-FR', type: 'neural2' },
  { value: 'fr-FR-Neural2-C', label: '🇫🇷 Féminine Neural2 C (fr-FR) - Premium', language: 'fr-FR', type: 'neural2' },
  { value: 'fr-FR-Neural2-D', label: '🇫🇷 Masculine Neural2 D (fr-FR) - Premium', language: 'fr-FR', type: 'neural2' },
  
  // Francês (França) - Wavenet
  { value: 'fr-FR-Wavenet-A', label: '🇫🇷 Féminine Wavenet (fr-FR) - Alta Qualidade', language: 'fr-FR', type: 'wavenet' },
  { value: 'fr-FR-Wavenet-B', label: '🇫🇷 Masculine Wavenet (fr-FR) - Alta Qualidade', language: 'fr-FR', type: 'wavenet' },
  { value: 'fr-FR-Wavenet-C', label: '🇫🇷 Féminine Wavenet C (fr-FR) - Alta Qualidade', language: 'fr-FR', type: 'wavenet' },
  { value: 'fr-FR-Wavenet-D', label: '🇫🇷 Masculine Wavenet D (fr-FR) - Alta Qualidade', language: 'fr-FR', type: 'wavenet' },
  
  // Alemão (Alemanha) - Neural2
  { value: 'de-DE-Neural2-A', label: '🇩🇪 Weiblich Neural2 (de-DE) - Premium', language: 'de-DE', type: 'neural2' },
  { value: 'de-DE-Neural2-B', label: '🇩🇪 Männlich Neural2 (de-DE) - Premium', language: 'de-DE', type: 'neural2' },
  { value: 'de-DE-Neural2-C', label: '🇩🇪 Weiblich Neural2 C (de-DE) - Premium', language: 'de-DE', type: 'neural2' },
  { value: 'de-DE-Neural2-D', label: '🇩🇪 Männlich Neural2 D (de-DE) - Premium', language: 'de-DE', type: 'neural2' },
  
  // Italiano (Itália) - Neural2
  { value: 'it-IT-Neural2-A', label: '🇮🇹 Femminile Neural2 (it-IT) - Premium', language: 'it-IT', type: 'neural2' },
  { value: 'it-IT-Neural2-B', label: '🇮🇹 Maschile Neural2 (it-IT) - Premium', language: 'it-IT', type: 'neural2' },
  { value: 'it-IT-Neural2-C', label: '🇮🇹 Femminile Neural2 C (it-IT) - Premium', language: 'it-IT', type: 'neural2' },
  { value: 'it-IT-Neural2-D', label: '🇮🇹 Maschile Neural2 D (it-IT) - Premium', language: 'it-IT', type: 'neural2' },
  
  // Japonês (Japão) - Neural2
  { value: 'ja-JP-Neural2-A', label: '🇯🇵 女性 Neural2 (ja-JP) - Premium', language: 'ja-JP', type: 'neural2' },
  { value: 'ja-JP-Neural2-B', label: '🇯🇵 男性 Neural2 (ja-JP) - Premium', language: 'ja-JP', type: 'neural2' },
  { value: 'ja-JP-Neural2-C', label: '🇯🇵 女性 Neural2 C (ja-JP) - Premium', language: 'ja-JP', type: 'neural2' },
  { value: 'ja-JP-Neural2-D', label: '🇯🇵 男性 Neural2 D (ja-JP) - Premium', language: 'ja-JP', type: 'neural2' },
  
  // Chinês (Mandarim) - Neural2
  { value: 'zh-CN-Neural2-A', label: '🇨🇳 女性 Neural2 (zh-CN) - Premium', language: 'zh-CN', type: 'neural2' },
  { value: 'zh-CN-Neural2-B', label: '🇨🇳 男性 Neural2 (zh-CN) - Premium', language: 'zh-CN', type: 'neural2' },
  { value: 'zh-CN-Neural2-C', label: '🇨🇳 女性 Neural2 C (zh-CN) - Premium', language: 'zh-CN', type: 'neural2' },
  { value: 'zh-CN-Neural2-D', label: '🇨🇳 男性 Neural2 D (zh-CN) - Premium', language: 'zh-CN', type: 'neural2' },
  
  // Coreano (Coreia) - Neural2
  { value: 'ko-KR-Neural2-A', label: '🇰🇷 여성 Neural2 (ko-KR) - Premium', language: 'ko-KR', type: 'neural2' },
  { value: 'ko-KR-Neural2-B', label: '🇰🇷 남성 Neural2 (ko-KR) - Premium', language: 'ko-KR', type: 'neural2' },
  { value: 'ko-KR-Neural2-C', label: '🇰🇷 여성 Neural2 C (ko-KR) - Premium', language: 'ko-KR', type: 'neural2' },
  { value: 'ko-KR-Neural2-D', label: '🇰🇷 남성 Neural2 D (ko-KR) - Premium', language: 'ko-KR', type: 'neural2' },
]

export default function GeradorVozPage() {
  const [texto, setTexto] = useState("")
  const [voz, setVoz] = useState("pt-BR-Neural2-A")
  const [velocidade, setVelocidade] = useState([1.0])
  const [pitch, setPitch] = useState([0.0])
  const [volume, setVolume] = useState([1.0])
  const [loading, setLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const { toast } = useToast()

  const handleGerar = async () => {
    if (!texto.trim()) {
      toast({
        title: "Erro",
        description: "Digite um texto para gerar o áudio",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      setAudioUrl(null)
      
      // Obter sessão do Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado. Faça login novamente.",
          variant: "destructive"
        })
        return
      }

      const response = await fetch('/api/ias/gerador-voz', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          texto,
          voz,
          velocidade: velocidade[0],
          pitch: pitch[0],
          volume: volume[0]
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.success && data.audioUrl) {
        setAudioUrl(data.audioUrl)
        toast({
          title: "Sucesso",
          description: "Áudio gerado com sucesso!",
        })
      } else if (data.message) {
        // Se houver mensagem (ex: API key não configurada), mostrar
        toast({
          title: "Aviso",
          description: data.message,
          variant: "default"
        })
        if (data.audioUrl) {
          setAudioUrl(data.audioUrl)
        }
      }
    } catch (error: any) {
      console.error('Erro ao gerar áudio:', error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível gerar o áudio",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (audioUrl) {
      const link = document.createElement('a')
      link.href = audioUrl
      link.download = `audio-${Date.now()}.mp3`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#ff5a1f] rounded-lg">
            <AudioLines className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white break-words">Gerador de Voz</h1>
            <p className="text-gray-400 text-sm md:text-base lg:text-lg">Converta texto em áudio com vozes naturais</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-white">Configurações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Texto</Label>
              <Textarea
                placeholder="Digite o texto que deseja converter em áudio..."
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500 min-h-[200px] focus:border-[#ff5a1f]"
              />
              <p className="text-xs text-gray-500">{texto.length} caracteres</p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-white">Voz ({VOZES.length} vozes disponíveis)</Label>
              <Select value={voz} onValueChange={setVoz}>
                <SelectTrigger className="bg-[#0a0a0a] border-[#2a2a2a] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] max-h-[300px]">
                  {VOZES.map((v) => (
                    <SelectItem key={v.value} value={v.value} className="text-white hover:bg-[#2a2a2a]">
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {VOZES.find(v => v.value === voz)?.type === 'neural2' && '✨ Neural2: Voz mais natural e expressiva'}
                {VOZES.find(v => v.value === voz)?.type === 'wavenet' && '🎯 Wavenet: Alta qualidade de áudio'}
                {VOZES.find(v => v.value === voz)?.type === 'standard' && '📢 Standard: Voz básica e rápida'}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Velocidade: {velocidade[0].toFixed(1)}x</Label>
              <input
                type="range"
                min="0.25"
                max="4.0"
                step="0.1"
                value={velocidade[0]}
                onChange={(e) => setVelocidade([parseFloat(e.target.value)])}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Tom: {pitch[0] > 0 ? '+' : ''}{pitch[0].toFixed(1)} semitons</Label>
              <input
                type="range"
                min="-20"
                max="20"
                step="0.1"
                value={pitch[0]}
                onChange={(e) => setPitch([parseFloat(e.target.value)])}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Volume: {Math.round(volume[0] * 100)}%</Label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume[0]}
                onChange={(e) => setVolume([parseFloat(e.target.value)])}
                className="w-full"
              />
            </div>

            <Button 
              onClick={handleGerar}
              disabled={loading || !texto.trim()}
              className="w-full bg-[#ff5a1f] hover:bg-[#ff4d29] text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <AudioLines className="mr-2 h-4 w-4" />
                  Gerar Áudio
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-white">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {audioUrl ? (
              <div className="space-y-4">
                <div className="aspect-video bg-[#0a0a0a] border-2 border-[#2a2a2a] rounded-lg flex items-center justify-center">
                  <audio controls className="w-full" src={audioUrl}>
                    Seu navegador não suporta o elemento de áudio.
                  </audio>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleDownload}
                    className="flex-1 bg-[#ff5a1f] hover:bg-[#ff4d29] text-white"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-[#0a0a0a] border-2 border-dashed border-[#2a2a2a] rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <AudioLines className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Seu áudio aparecerá aqui</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
