"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Copy, Sparkles, Loader2, CheckCircle2, AlertCircle, Download, ExternalLink, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"

interface CloneResult {
  status: string
  download_url: string
  stats?: {
    assets_count: number
    total_size: number
    zip_size: number
  }
}

export default function ClonadorPage() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CloneResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleClone = async () => {
    if (!url.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma URL válida",
        variant: "destructive"
      })
      return
    }

    // Validação básica de URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      toast({
        title: "Erro",
        description: "URL deve começar com http:// ou https://",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado",
          variant: "destructive"
        })
        setLoading(false)
        return
      }

      const response = await fetch('/api/ferramentas/clonador', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ url: url.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao clonar site')
      }

      setResult(data)
      toast({
        title: "Sucesso!",
        description: "Site clonado com sucesso!",
      })
    } catch (error: any) {
      const errorMessage = error.message || "Erro ao processar clonagem"
      setError(errorMessage)
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!result?.download_url) return

    try {
      await navigator.clipboard.writeText(result.download_url)
      setCopied(true)
      toast({
        title: "Copiado!",
        description: "Link copiado para a área de transferência",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link",
        variant: "destructive"
      })
    }
  }

  const handleDownload = () => {
    if (result?.download_url) {
      window.open(result.download_url, '_blank')
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#ff5a1f] rounded-lg">
            <Copy className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white break-words">Clonador de Sites</h1>
            <p className="text-gray-400 text-sm md:text-base lg:text-lg">
              Clone sites completos com todos os assets (HTML, CSS, JS, imagens, fontes)
            </p>
          </div>
        </div>
      </div>

      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Globe className="h-5 w-5 text-[#ff5a1f]" />
            Clonar Site
          </CardTitle>
          <CardDescription className="text-gray-400">
            Cole a URL do site que deseja clonar. O sistema irá baixar todos os arquivos estáticos e criar um ZIP para download.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url" className="text-white">URL do Site</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://exemplo.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500"
            />
            <p className="text-xs text-gray-500">
              Apenas sites públicos. Máximo de 100MB. Timeout de 40 segundos.
            </p>
          </div>

          <Button 
            onClick={handleClone}
            disabled={loading || !url.trim()}
            className="w-full bg-[#ff5a1f] hover:bg-[#ff4d29] text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Clonando...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Clonar Site
              </>
            )}
          </Button>

          {/* Loading State */}
          {loading && (
            <div className="mt-4 p-4 bg-[#0a0a0a] border border-[#2a2a2a] rounded-md">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-[#ff5a1f] animate-spin" />
                <div className="flex-1">
                  <p className="text-white font-medium">Processando...</p>
                  <p className="text-sm text-gray-400">
                    Fazendo crawling do site, baixando assets e criando arquivo ZIP...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-md">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-400 font-medium">Erro ao clonar site</p>
                  <p className="text-sm text-red-300 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success State */}
          {result && !loading && (
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-md">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-green-400 font-medium">Site clonado com sucesso!</p>
                    {result.stats && (
                      <div className="mt-2 space-y-1 text-sm text-green-300">
                        <p>• {result.stats.assets_count} arquivos baixados</p>
                        <p>• Tamanho total: {formatBytes(result.stats.total_size)}</p>
                        <p>• ZIP: {formatBytes(result.stats.zip_size)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#0a0a0a] border border-[#2a2a2a] rounded-md space-y-3">
                <div>
                  <Label className="text-white text-sm mb-2 block">Link de Download</Label>
                  <div className="flex gap-2">
                    <Input
                      value={result.download_url}
                      readOnly
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-white text-sm font-mono"
                    />
                    <Button
                      onClick={handleCopy}
                      variant="outline"
                      size="icon"
                      className="border-[#2a2a2a] hover:bg-[#2a2a2a]"
                    >
                      {copied ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-white" />
                      )}
                    </Button>
                    <Button
                      onClick={handleDownload}
                      className="bg-[#ff5a1f] hover:bg-[#ff4d29] text-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="w-full border-[#2a2a2a] hover:bg-[#2a2a2a] text-white"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir em Nova Aba
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-white text-lg">Como Funciona</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-[#ff5a1f] mt-1">•</span>
              <span>O sistema acessa o site fornecido e faz download de todos os arquivos estáticos</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#ff5a1f] mt-1">•</span>
              <span>Baixa HTML, CSS, JavaScript, imagens, fontes e outros assets do mesmo domínio</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#ff5a1f] mt-1">•</span>
              <span>Preserva a estrutura de diretórios original</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#ff5a1f] mt-1">•</span>
              <span>Cria um arquivo ZIP com todos os arquivos baixados</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#ff5a1f] mt-1">•</span>
              <span>Fornece um link de download válido por tempo indeterminado</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

