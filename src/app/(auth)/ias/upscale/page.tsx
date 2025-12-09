"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Maximize2, Upload, Sparkles, Loader2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Image from "next/image"

export default function UpscalePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [escala, setEscala] = useState("2x")
  const [modelo, setModelo] = useState("esrgan-v1-x2plus")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erro",
          description: "Por favor, selecione um arquivo de imagem",
          variant: "destructive"
        })
        return
      }
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setResultUrl(null)
    }
  }

  const handleUpscale = async () => {
    if (!selectedFile) {
      toast({
        title: "Erro",
        description: "Selecione uma imagem primeiro",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      setResultUrl(null)
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado",
          variant: "destructive"
        })
        return
      }

      const formData = new FormData()
      formData.append('imagem', selectedFile)
      formData.append('escala', escala)
      formData.append('modelo', modelo)

      const response = await fetch('/api/ias/upscale', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Erro ao fazer upscale')
      }

      if (data.success && data.imageUrl) {
        setResultUrl(data.imageUrl)
        toast({
          title: "Sucesso",
          description: "Upscale concluído com sucesso!",
        })
      } else {
        throw new Error('Resposta inválida do servidor')
      }
    } catch (error: any) {
      console.error('Erro ao fazer upscale:', error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível fazer o upscale",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (resultUrl) {
      const link = document.createElement('a')
      link.href = resultUrl
      link.download = `imagem-upscaled-${Date.now()}.png`
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
            <Maximize2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white break-words">
              Upscale de Imagens
            </h1>
            <p className="text-gray-400 text-sm md:text-base">
              Aumente a resolução de suas imagens com IA
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-white">Imagem Original</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-[#2a2a2a] rounded-lg p-8 text-center min-h-[300px] flex items-center justify-center bg-[#0a0a0a]">
              {previewUrl ? (
                <div className="relative w-full h-full">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div>
                  <Upload className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 mb-2">Faça upload da imagem</p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#ff5a1f] hover:bg-[#ff4d29] text-white"
                  >
                    Selecionar Imagem
                  </Button>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {previewUrl && (
              <Button
                onClick={() => {
                  setSelectedFile(null)
                  setPreviewUrl(null)
                  setResultUrl(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                variant="outline"
                className="w-full"
              >
                Trocar Imagem
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-white">Imagem Upscaled</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-[#2a2a2a] rounded-lg p-8 text-center min-h-[300px] flex items-center justify-center bg-[#0a0a0a]">
              {resultUrl ? (
                <div className="relative w-full h-full">
                  <Image
                    src={resultUrl}
                    alt="Resultado"
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
              ) : loading ? (
                <div>
                  <Loader2 className="h-12 w-12 text-[#ff5a1f] animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">Processando upscale...</p>
                </div>
              ) : (
                <div>
                  <Sparkles className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Resultado aparecerá aqui</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-white text-sm">Escala</label>
              <Select value={escala} onValueChange={(value) => {
                setEscala(value)
                // Atualizar modelo baseado na escala
                if (value === '4x') {
                  setModelo('stable-diffusion-x4-latent-upscaler')
                } else {
                  setModelo('esrgan-v1-x2plus')
                }
              }}>
                <SelectTrigger className="bg-[#0a0a0a] border-[#2a2a2a] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <SelectItem value="2x" className="text-white">2x (Rápido - Real-ESRGAN)</SelectItem>
                  <SelectItem value="4x" className="text-white">4x (Qualidade - SD Upscaler)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-white text-sm">Modelo</label>
              <Select value={modelo} onValueChange={setModelo}>
                <SelectTrigger className="bg-[#0a0a0a] border-[#2a2a2a] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <SelectItem value="esrgan-v1-x2plus" className="text-white">
                    Real-ESRGAN (Rápido - ~0.5s)
                  </SelectItem>
                  <SelectItem value="stable-diffusion-x4-latent-upscaler" className="text-white">
                    SD 4x Upscaler (Qualidade - 20-40s)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleUpscale}
              disabled={loading || !selectedFile}
              className="w-full bg-[#ff5a1f] hover:bg-[#ff4d29] text-white rounded-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Aplicar Upscale
                </>
              )}
            </Button>

            {resultUrl && (
              <Button
                onClick={handleDownload}
                className="w-full bg-green-600 hover:bg-green-700 text-white rounded-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
