"use client"

/**
 * Página: Ferramenta de Mascaramento de Criativos
 * 
 * Interface para remover metadados de imagens e vídeos
 */

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Shield, Upload, Download, FileImage, FileVideo, Loader2 } from "lucide-react"
import { useAuthStore } from "@/store/auth-store"

export default function MascararCriativoPage() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Verificar tipo de arquivo
      const extension = selectedFile.name.toLowerCase().split('.').pop()
      const imageExtensions = ['png', 'jpg', 'jpeg', 'webp']
      const videoExtensions = ['mp4', 'mov']
      
      if (!extension || (!imageExtensions.includes(extension) && !videoExtensions.includes(extension))) {
        toast({
          title: "Formato não suportado",
          description: "Use PNG, JPG, JPEG, WEBP (imagens) ou MP4, MOV (vídeos)",
          variant: "destructive"
        })
        return
      }

      // Verificar tamanho
      const isImage = imageExtensions.includes(extension)
      const maxSize = isImage ? 50 * 1024 * 1024 : 500 * 1024 * 1024 // 50MB ou 500MB
      
      if (selectedFile.size > maxSize) {
        toast({
          title: "Arquivo muito grande",
          description: `Tamanho máximo: ${maxSize / 1024 / 1024}MB`,
          variant: "destructive"
        })
        return
      }

      setFile(selectedFile)
      setDownloadUrl(null)
      setFileName("")
    }
  }

  const handleProcess = async () => {
    if (!file) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Selecione um arquivo para processar",
        variant: "destructive"
      })
      return
    }

    setProcessing(true)
    setDownloadUrl(null)

    try {
      const extension = file.name.toLowerCase().split('.').pop()
      const isImage = ['png', 'jpg', 'jpeg', 'webp'].includes(extension || '')
      const endpoint = isImage ? '/api/mascarar/imagem' : '/api/mascarar/video'

      const formData = new FormData()
      formData.append('file', file)

      // Obter token de autenticação
      const { supabase } = await import('@/lib/supabase/client')
      const { data: { session } } = await supabase.auth.getSession()

      const headers: HeadersInit = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao processar arquivo')
      }

      // Criar URL para download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      setDownloadUrl(url)
      
      // Nome do arquivo de saída
      const outputFileName = `mascarado-${Date.now()}.${extension}`
      setFileName(outputFileName)

      toast({
        title: "✅ Arquivo processado!",
        description: "Todos os metadados foram removidos com sucesso",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao processar",
        description: error.message || "Ocorreu um erro ao processar o arquivo",
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!downloadUrl || !fileName) return

    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    // Limpar URL após download
    window.URL.revokeObjectURL(downloadUrl)
  }

  const isImage = file ? ['png', 'jpg', 'jpeg', 'webp'].includes(file.name.toLowerCase().split('.').pop() || '') : false
  const isVideo = file ? ['mp4', 'mov'].includes(file.name.toLowerCase().split('.').pop() || '') : false

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl" style={{ minHeight: '100vh' }} key="mascarar-container">
      <div className="space-y-6" key="mascarar-content">
        {/* Header */}
        <div className="space-y-2" key="mascarar-header">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#ff5a1f] rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Mascarar Criativo</h1>
              <p className="text-gray-400">Remova 100% dos metadados de imagens e vídeos</p>
            </div>
          </div>
        </div>

        {/* Card Principal */}
        <Card className="bg-[#0a0a0a] border-[#2a2a2a]" key="mascarar-card">
          <CardHeader>
            <CardTitle className="text-white">IA Anti-Metadados</CardTitle>
            <CardDescription className="text-gray-400">
              Remova EXIF, GPS, data de criação, informações da câmera e todos os metadados ocultos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upload Area */}
            <div className="border-2 border-dashed border-[#2a2a2a] rounded-lg p-8 text-center hover:border-[#ff5a1f] transition-colors">
              <input
                type="file"
                id="file-input"
                accept=".png,.jpg,.jpeg,.webp,.mp4,.mov"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="file-input"
                className="cursor-pointer flex flex-col items-center gap-4"
              >
                {file ? (
                  <>
                    {isImage ? (
                      <FileImage className="h-12 w-12 text-[#ff5a1f]" />
                    ) : isVideo ? (
                      <FileVideo className="h-12 w-12 text-[#ff5a1f]" />
                    ) : (
                      <Upload className="h-12 w-12 text-[#ff5a1f]" />
                    )}
                    <div>
                      <p className="text-white font-medium">{file.name}</p>
                      <p className="text-gray-400 text-sm">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-gray-400" />
                    <div>
                      <p className="text-white font-medium">Clique para selecionar arquivo</p>
                      <p className="text-gray-400 text-sm">
                        Imagens: PNG, JPG, JPEG, WEBP (até 50MB)
                        <br />
                        Vídeos: MP4, MOV (até 500MB)
                      </p>
                    </div>
                  </>
                )}
              </label>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardContent className="pt-6">
                  <h3 className="text-white font-semibold mb-2">Imagens</h3>
                  <ul className="text-gray-400 text-sm space-y-1">
                    <li>• Remove EXIF, GPS, data</li>
                    <li>• Remove ICC, XMP, IPTC</li>
                    <li>• Remove thumbnails</li>
                    <li>• Preserva qualidade visual</li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardContent className="pt-6">
                  <h3 className="text-white font-semibold mb-2">Vídeos</h3>
                  <ul className="text-gray-400 text-sm space-y-1">
                    <li>• Remove data/time</li>
                    <li>• Remove info da câmera</li>
                    <li>• Remove GPS e tracks</li>
                    <li>• Remove metadata atoms</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                onClick={handleProcess}
                disabled={!file || processing}
                className="flex-1 bg-[#ff5a1f] hover:bg-[#ff5a1f]/90 text-white"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Remover Metadados
                  </>
                )}
              </Button>

              {downloadUrl && (
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="flex-1 border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Arquivo Limpo
                </Button>
              )}
            </div>

            {/* Warning */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-yellow-500 text-sm">
                ⚠️ <strong>Importante:</strong> O arquivo processado terá todos os metadados removidos permanentemente. 
                Certifique-se de fazer backup se necessário.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
