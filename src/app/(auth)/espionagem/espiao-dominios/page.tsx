"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, Globe, Search, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

interface URLEncontrada {
  url: string
  status: string
  tipo: string
}

interface HistoricoItem {
  id: string
  dominio: string
  urls_encontradas: URLEncontrada[]
  created_at: string
}

export default function EspiaoDominiosPage() {
  const [domain, setDomain] = useState("")
  const [loading, setLoading] = useState(false)
  const [resultados, setResultados] = useState<URLEncontrada[]>([])
  const [historico, setHistorico] = useState<HistoricoItem[]>([])
  const [loadingHistorico, setLoadingHistorico] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadHistorico()
  }, [])

  const loadHistorico = async () => {
    try {
      setLoadingHistorico(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return

      const response = await fetch('/api/espionagem/espiao-dominios', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setHistorico(data.historico || [])
        }
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    } finally {
      setLoadingHistorico(false)
    }
  }

  const handleVerificar = async () => {
    if (!domain.trim()) {
      toast({
        title: "Erro",
        description: "Digite um domínio válido",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      setResultados([])
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado",
          variant: "destructive"
        })
        return
      }

      const response = await fetch('/api/espionagem/espiao-dominios', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ dominio: domain.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao verificar domínio')
      }

      if (data.success) {
        setResultados(data.urls || [])
        toast({
          title: "Sucesso",
          description: `${data.total || data.urls?.length || 0} URLs encontradas`,
        })
        loadHistorico() // Recarregar histórico
      } else {
        throw new Error(data.error || 'Erro ao verificar domínio')
      }
    } catch (error: any) {
      console.error('Erro ao verificar domínio:', error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível verificar o domínio",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 md:space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-1.5 md:p-2 bg-[#ff5a1f] rounded-lg flex-shrink-0">
            <Target className="h-4 w-4 md:h-6 md:w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white break-words">ESPIÃO DE DOMÍNIOS</h1>
            <p className="text-gray-400 text-sm md:text-base lg:text-lg">Digite um domínio para descobrir URLs ativas e páginas ocultas</p>
          </div>
        </div>
      </div>

      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-white">DOMÍNIO ALVO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
          <div className="relative">
            <Globe className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
            <Input
              placeholder="alvo.com ou alvo.com/up"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerificar()}
              disabled={loading}
              className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#ff5a1f] pr-9 md:pr-10 h-10 md:h-12 text-sm md:text-base"
            />
          </div>
          <p className="text-xs md:text-sm text-gray-400">
            Digite o domínio com ou sem slug base (ex: alvo.com/up testará /up/a1, /up/a2, etc.)
          </p>
          <Button 
            onClick={handleVerificar}
            disabled={loading || !domain.trim()}
            className="w-full bg-[#ff5a1f] hover:bg-[#ff4d29] text-white h-10 md:h-12 text-sm md:text-base"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
                <span className="hidden md:inline">VERIFICANDO...</span>
                <span className="md:hidden">VERIFICANDO</span>
              </>
            ) : (
              <>
                <Search className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden md:inline">INICIAR VERIFICAÇÃO</span>
                <span className="md:hidden">VERIFICAR</span>
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultados */}
      {resultados.length > 0 && (
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Resultados ({resultados.length} URLs encontradas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {resultados.map((url, index) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3 p-2 md:p-3 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a] hover:border-[#ff5a1f] transition-colors"
                >
                  <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                    {url.status === 'active' ? (
                      <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 md:h-5 md:w-5 text-red-500 flex-shrink-0" />
                    )}
                    <a
                      href={`https://${url.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-[#ff5a1f] truncate flex-1 text-sm md:text-base"
                    >
                      {url.url}
                    </a>
                  </div>
                  <Badge variant="outline" className="ml-0 md:ml-2 text-xs flex-shrink-0 self-start md:self-auto">
                    {url.tipo}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico */}
      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Verificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHistorico ? (
            <p className="text-gray-400">Carregando histórico...</p>
          ) : historico.length === 0 ? (
            <p className="text-gray-400">Nenhuma verificação realizada ainda</p>
          ) : (
            <div className="space-y-4">
              {historico.map((item) => (
                <div key={item.id} className="p-3 md:p-4 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-2 mb-2">
                    <span className="text-white font-medium text-sm md:text-base break-words">{item.dominio}</span>
                    <span className="text-gray-400 text-xs md:text-sm">
                      {new Date(item.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="text-xs md:text-sm text-gray-400">
                    {item.urls_encontradas?.length || 0} URLs encontradas
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

