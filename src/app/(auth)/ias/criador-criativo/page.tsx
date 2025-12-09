"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Image, Upload, Loader2 } from "lucide-react"
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

export default function CriadorCriativoPage() {
  const [descricao, setDescricao] = useState("")
  const [estilo, setEstilo] = useState("profissional")
  const [dimensoes, setDimensoes] = useState("1024x1024")
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<any>(null)
  const { toast } = useToast()

  const handleGerar = async () => {
    if (!descricao.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma descrição do criativo",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      setResultado(null)
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado",
          variant: "destructive"
        })
        return
      }

      const response = await fetch('/api/ias/criador-criativo', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          descricao,
          estilo,
          dimensoes
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // Mostrar erro detalhado do backend
        const errorMessage = data.details || data.error || 'Erro ao gerar criativo'
        throw new Error(errorMessage)
      }

      if (data.success) {
        // Usar imageUrl se disponível, senão usar criativo.url
        const resultadoFinal = {
          ...data.criativo,
          url: data.imageUrl || data.criativo?.url
        }
        setResultado(resultadoFinal)
        toast({
          title: "Sucesso",
          description: data.imageUrl ? "Criativo gerado com sucesso!" : "Criativo em processamento",
        })
      } else {
        throw new Error(data.error || 'Erro ao gerar criativo')
      }
    } catch (error: any) {
      console.error('Erro ao gerar criativo:', error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível gerar o criativo",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#ff5a1f] rounded-lg">
            <Image className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white break-words">Criador de Criativo</h1>
            <p className="text-gray-400 text-sm md:text-base lg:text-lg">Crie imagens profissionais para suas campanhas</p>
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
              <Label className="text-white">Descrição do Criativo</Label>
              <Textarea
                placeholder="Descreva o criativo que deseja criar..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500 min-h-[200px] focus:border-[#ff5a1f]"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-white">Estilo</Label>
              <Select value={estilo} onValueChange={setEstilo}>
                <SelectTrigger className="bg-[#0a0a0a] border-[#2a2a2a] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <SelectItem value="profissional" className="text-white">Profissional (Photographic)</SelectItem>
                  <SelectItem value="criativo" className="text-white">Criativo (Digital Art)</SelectItem>
                  <SelectItem value="minimalista" className="text-white">Minimalista (Line Art)</SelectItem>
                  <SelectItem value="colorido" className="text-white">Colorido (Enhance)</SelectItem>
                  <SelectItem value="cinematic" className="text-white">Cinematic</SelectItem>
                  <SelectItem value="anime" className="text-white">Anime</SelectItem>
                  <SelectItem value="fantasy" className="text-white">Fantasy Art</SelectItem>
                  <SelectItem value="3d" className="text-white">3D Model</SelectItem>
                  <SelectItem value="pixel" className="text-white">Pixel Art</SelectItem>
                  <SelectItem value="comic" className="text-white">Comic Book</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Dimensões</Label>
              <Select value={dimensoes} onValueChange={setDimensoes}>
                <SelectTrigger className="bg-[#0a0a0a] border-[#2a2a2a] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <SelectItem value="1024x1024" className="text-white">1024x1024 (Quadrado)</SelectItem>
                  <SelectItem value="1152x896" className="text-white">1152x896 (Landscape)</SelectItem>
                  <SelectItem value="1344x768" className="text-white">1344x768 (Wide)</SelectItem>
                  <SelectItem value="1536x640" className="text-white">1536x640 (Ultra Wide)</SelectItem>
                  <SelectItem value="896x1152" className="text-white">896x1152 (Portrait)</SelectItem>
                  <SelectItem value="768x1344" className="text-white">768x1344 (Tall)</SelectItem>
                  <SelectItem value="640x1536" className="text-white">640x1536 (Ultra Tall)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Dimensões serão ajustadas automaticamente para o formato mais próximo
              </p>
            </div>

            <Button 
              onClick={handleGerar}
              disabled={loading || !descricao.trim()}
              className="w-full bg-[#ff5a1f] hover:bg-[#ff4d29] text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Image className="mr-2 h-4 w-4" />
                  Gerar Criativo
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
            {resultado ? (
              <div className="space-y-4">
                <div className="aspect-video bg-[#0a0a0a] border-2 border-[#2a2a2a] rounded-lg flex items-center justify-center">
                  {resultado.url ? (
                    <img src={resultado.url} alt="Criativo gerado" className="max-w-full max-h-full" />
                  ) : (
                    <div className="text-center">
                      <Loader2 className="h-12 w-12 text-[#ff5a1f] animate-spin mx-auto mb-4" />
                      <p className="text-gray-400">Processando criativo...</p>
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-400">
                  <p>Status: <span className="text-white">{resultado.status}</span></p>
                  <p>Estilo: <span className="text-white">{resultado.estilo}</span></p>
                  <p>Dimensões: <span className="text-white">{resultado.dimensoes}</span></p>
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-[#0a0a0a] border-2 border-dashed border-[#2a2a2a] rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Upload className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Seu criativo aparecerá aqui</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
