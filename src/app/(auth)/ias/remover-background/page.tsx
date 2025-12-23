"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eraser, Upload, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"

export default function RemoverBackgroundPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
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

  const handleRemoveBackground = async () => {
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
      formData.append('file', selectedFile)

      const response = await fetch('/api/ias/remover-background', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data.error || data.message || data.warning || 'Erro ao remover background'
        throw new Error(errorMsg)
      }

      if (data.success && data.imageUrl) {
        setResultUrl(data.imageUrl)
        toast({
          title: "Sucesso",
          description: data.message || "Background removido com sucesso!",
        })
      } else if (data.imageUrl) {
        // Se tiver imageUrl mesmo sem success: true, usar (fallback)
        setResultUrl(data.imageUrl)
        toast({
          title: data.warning ? "Aviso" : "Sucesso",
          description: data.message || data.warning || "Imagem processada (pode não ter removido o background)",
          variant: data.warning ? "default" : "default"
        })
      } else {
        throw new Error(data.message || data.error || 'Resposta inválida do servidor')
      }
    } catch (error: any) {
      console.error('Erro ao remover background:', error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover o background",
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
      link.download = `imagem-sem-background-${Date.now()}.png`
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
            <Eraser className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white break-words">Remover Background</h1>
            <p className="text-gray-400 text-lg">Remova o fundo de suas imagens de forma rápida e precisa</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-white">Imagem Original</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-[#2a2a2a] rounded-lg p-8 text-center min-h-[300px] flex items-center justify-center">
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
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-white">Imagem sem Background</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                    <p className="text-gray-400">Processando...</p>
                  </div>
                ) : (
                  <div>
                    <Eraser className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">Resultado aparecerá aqui</p>
                  </div>
                )}
              </div>
              <Button
                onClick={handleRemoveBackground}
                disabled={loading || !selectedFile}
                className="w-full bg-[#ff5a1f] hover:bg-[#ff4d29] text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Eraser className="mr-2 h-4 w-4" />
                    Remover Background
                  </>
                )}
              </Button>
              {resultUrl && (
                <Button
                  onClick={handleDownload}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
