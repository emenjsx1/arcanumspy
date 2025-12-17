"use client"

/**
 * Página: Clonador de Sites
 * 
 * Interface para baixar sites completos em formato ZIP
 */

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Download, Globe, Loader2, AlertCircle, CheckCircle2, Copy } from "lucide-react"
import { useAuthStore } from "@/store/auth-store"

export default function ClonadorPage() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [url, setUrl] = useState("")
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState<string>("")
  const [zipBlob, setZipBlob] = useState<Blob | null>(null)
  const [fileName, setFileName] = useState<string>("")
  const [cloned, setCloned] = useState(false)

  const handleClone = async () => {
    if (!url.trim()) {
      toast({
        title: "URL obrigatória",
        description: "Digite a URL do site que deseja clonar",
        variant: "destructive"
      })
      return
    }

    // Validar formato básico de URL
    try {
      new URL(url)
    } catch {
      toast({
        title: "URL inválida",
        description: "Digite uma URL válida (ex: https://exemplo.com)",
        variant: "destructive"
      })
      return
    }

    setProcessing(true)
    setProgress("Iniciando clonagem...")

    try {
      // Obter token de autenticação
      const { supabase } = await import('@/lib/supabase/client')
      const { data: { session } } = await supabase.auth.getSession()

      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      setProgress("Baixando HTML e assets do site...")

      const response = await fetch('/api/ferramentas/clonador', {
        method: 'POST',
        headers,
        body: JSON.stringify({ url })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao clonar site')
      }

      setProgress("Criando arquivo ZIP...")

      // Verificar Content-Length antes de processar
      const contentLength = response.headers.get('Content-Length')
      const contentType = response.headers.get('Content-Type')
      
      console.log(`📥 Headers recebidos:`, {
        contentType,
        contentLength,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })
      
      if (contentLength && parseInt(contentLength) === 0) {
        throw new Error('O servidor retornou um arquivo vazio.')
      }

      // Verificar se a resposta é realmente um ZIP
      if (contentType && !contentType.includes('zip') && !contentType.includes('octet-stream') && !contentType.includes('application/zip')) {
        // Pode ser um erro JSON - clonar para ler sem consumir o stream
        const clonedResponse = response.clone()
        const text = await clonedResponse.text()
        console.error('❌ Resposta não é ZIP:', text.substring(0, 200))
        try {
          const errorData = JSON.parse(text)
          throw new Error(errorData.error || 'Erro ao criar ZIP')
        } catch {
          throw new Error('Resposta inválida do servidor')
        }
      }

      // Obter o arquivo ZIP como arrayBuffer
      console.log(`📥 Lendo arrayBuffer da resposta...`)
      const arrayBuffer = await response.arrayBuffer()
      
      console.log(`📥 ArrayBuffer lido: ${arrayBuffer.byteLength} bytes`)
      
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        console.error('❌ ArrayBuffer está vazio!', {
          contentLength,
          contentType,
          status: response.status
        })
        throw new Error('O arquivo ZIP está vazio. Nenhum arquivo foi baixado do site.')
      }
      
      console.log(`✅ ArrayBuffer recebido: ${(arrayBuffer.byteLength / 1024).toFixed(2)} KB`)
      
      // Converter para Blob
      const blob = new Blob([arrayBuffer], { type: 'application/zip' })
      
      // Verificar novamente o tamanho do blob
      if (blob.size === 0) {
        throw new Error('O arquivo ZIP está vazio após conversão.')
      }
      
      console.log(`✅ ZIP recebido: ${(blob.size / 1024).toFixed(2)} KB`)
      
      // Obter nome do arquivo do header
      const contentDisposition = response.headers.get('Content-Disposition')
      let file = `site-clone-${Date.now()}.zip`
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/)
        if (fileNameMatch) {
          file = fileNameMatch[1]
        }
      }

      // Salvar blob e nome do arquivo para download posterior
      setZipBlob(blob)
      setFileName(file)
      setCloned(true)
      setProgress(`Site clonado com sucesso! ${(blob.size / 1024).toFixed(2)} KB pronto para download.`)
      
      toast({
        title: "✅ Site clonado com sucesso!",
        description: "Clique no botão 'Baixar ZIP' para fazer o download",
      })
    } catch (error: any) {
      console.error('Erro ao clonar site:', error)
      toast({
        title: "Erro ao clonar site",
        description: error.message || "Ocorreu um erro ao processar a clonagem",
        variant: "destructive"
      })
      setProgress("")
      setCloned(false)
      setZipBlob(null)
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!zipBlob || !fileName) return

    // Criar URL para download
    const downloadUrl = window.URL.createObjectURL(zipBlob)
    
    // Fazer download
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    // Limpar URL após download
    window.URL.revokeObjectURL(downloadUrl)

    toast({
      title: "✅ Download iniciado!",
      description: "O arquivo ZIP está sendo baixado",
    })
  }

  const handleReset = () => {
    setUrl("")
    setProgress("")
    setZipBlob(null)
    setFileName("")
    setCloned(false)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl" style={{ minHeight: '100vh' }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#ff5a1f] rounded-lg">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Clonador de Sites</h1>
              <p className="text-gray-400">Baixe sites completos em formato ZIP</p>
            </div>
          </div>
        </div>

        {/* Card Principal */}
        <Card className="bg-[#0a0a0a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-white">Download Completo de Sites</CardTitle>
            <CardDescription className="text-gray-400">
              Cole a URL do site e baixe todos os arquivos (HTML, CSS, JS, imagens) em um ZIP
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Input URL */}
            <div className="space-y-2">
              <Label htmlFor="url" className="text-white">URL do Site</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://exemplo.com"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value)
                  // Resetar estado se URL mudar
                  if (cloned) {
                    handleReset()
                  }
                }}
                disabled={processing || cloned}
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500"
              />
              <p className="text-sm text-gray-400">
                Digite a URL completa do site que deseja clonar (ex: https://exemplo.com)
              </p>
            </div>

            {/* Progress */}
            {progress && (
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                <div className="flex items-center gap-3">
                  {processing ? (
                    <Loader2 className="h-5 w-5 text-[#ff5a1f] animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                  <p className="text-white text-sm">{progress}</p>
                </div>
              </div>
            )}

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardContent className="pt-6">
                  <h3 className="text-white font-semibold mb-2">O que é baixado</h3>
                  <ul className="text-gray-400 text-sm space-y-1">
                    <li>• HTML principal (index.html)</li>
                    <li>• Arquivos CSS</li>
                    <li>• Arquivos JavaScript</li>
                    <li>• Imagens e fontes</li>
                    <li>• Estrutura de pastas preservada</li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardContent className="pt-6">
                  <h3 className="text-white font-semibold mb-2">Limitações</h3>
                  <ul className="text-gray-400 text-sm space-y-1">
                    <li>• Apenas assets do mesmo domínio</li>
                    <li>• Máximo de 50 arquivos</li>
                    <li>• Tamanho máximo: 100MB</li>
                    <li>• Apenas HTTP/HTTPS</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            {!cloned ? (
              <Button
                onClick={handleClone}
                disabled={!url.trim() || processing}
                className="w-full bg-[#ff5a1f] hover:bg-[#ff5a1f]/90 text-white"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Clonando Site...
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Clonar Site
                  </>
                )}
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button
                  onClick={handleDownload}
                  disabled={!zipBlob}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar ZIP
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
                >
                  Clonar Outro Site
                </Button>
              </div>
            )}

            {/* Warning */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-yellow-500 text-sm font-semibold mb-1">
                    ⚠️ Aviso Importante
                  </p>
                  <p className="text-yellow-500/80 text-sm">
                    Esta ferramenta baixa apenas arquivos estáticos do site. Sites com conteúdo dinâmico 
                    (React, Vue, etc.) podem não funcionar corretamente após o download. Use apenas para 
                    sites estáticos ou para análise de design.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

