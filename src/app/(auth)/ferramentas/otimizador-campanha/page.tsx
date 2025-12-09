"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TrendingUp, Target, BarChart3, Sparkles, Trash2, Plus, Loader2, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"

interface Upsell {
  ticket: string
  conversao: string
}

interface PerformanceData {
  vendas: string
  valorGasto: string
  quantoVoltou: string
  roi: string
}

interface OtimizacaoResult {
  analise: string
  recomendacoes: string[]
  metricasOtimizadas: {
    roasProjetado: number
    receitaProjetada: number
    lucroProjetado: number
  }
  pontosMelhoria: string[]
}

export default function OtimizadorCampanhaPage() {
  const [ticketProdutoPrincipal, setTicketProdutoPrincipal] = useState("")
  const [upsells, setUpsells] = useState<Upsell[]>([
    { ticket: "", conversao: "" }
  ])
  const [performance, setPerformance] = useState<PerformanceData>({
    vendas: "",
    valorGasto: "",
    quantoVoltou: "",
    roi: ""
  })
  const [analisando, setAnalisando] = useState(false)
  const [resultado, setResultado] = useState<OtimizacaoResult | null>(null)
  const { toast } = useToast()

  const adicionarUpsell = () => {
    setUpsells([...upsells, { ticket: "", conversao: "" }])
  }

  const removerUpsell = (index: number) => {
    if (upsells.length > 1) {
      setUpsells(upsells.filter((_, i) => i !== index))
    }
  }

  const atualizarUpsell = (index: number, field: keyof Upsell, value: string) => {
    const novosUpsells = [...upsells]
    novosUpsells[index][field] = value
    setUpsells(novosUpsells)
  }

  const atualizarPerformance = (field: keyof PerformanceData, value: string) => {
    setPerformance({ ...performance, [field]: value })
  }

  const limparDados = () => {
    setTicketProdutoPrincipal("")
    setUpsells([{ ticket: "", conversao: "" }])
    setPerformance({
      vendas: "",
      valorGasto: "",
      quantoVoltou: "",
      roi: ""
    })
    setResultado(null)
    toast({
      title: "Dados limpos",
      description: "Todos os campos foram limpos com sucesso.",
    })
  }

  const verificarCampanha = async () => {
    // Validar campos obrigatórios
    if (!ticketProdutoPrincipal || !performance.vendas || !performance.valorGasto || !performance.quantoVoltou) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      })
      return
    }

    setAnalisando(true)
    setResultado(null)

    try {
      // Obter sessão para autenticação
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado.",
          variant: "destructive"
        })
        setAnalisando(false)
        return
      }

      const response = await fetch("/api/ferramentas/otimizador-campanha/verificar", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ticketProdutoPrincipal,
          upsells,
          performance
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao verificar campanha")
      }

      const data = await response.json()
      setResultado(data.resultado)

      toast({
        title: "Análise concluída",
        description: "Campanha analisada com sucesso.",
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao verificar campanha. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setAnalisando(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#ff5a1f] rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Otimizador de Campanhas</h1>
              <p className="text-gray-400">Analise e otimize suas campanhas com inteligência artificial</p>
            </div>
          </div>
        </div>

        {/* Configuração do Funil */}
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <Target className="h-5 w-5 text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Configuração do Funil</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ticket do Produto Principal */}
                <div>
                  <Label htmlFor="ticket-produto" className="text-gray-300">
                    Ticket do produto principal
                  </Label>
                  <Input
                    id="ticket-produto"
                    type="number"
                    value={ticketProdutoPrincipal}
                    onChange={(e) => setTicketProdutoPrincipal(e.target.value)}
                    placeholder="Ex: 197"
                    className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Upsells */}
              <div className="space-y-4">
                {upsells.map((upsell, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]">
                    <div>
                      <Label htmlFor={`upsell-ticket-${index}`} className="text-gray-300">
                        Ticket do Upsell {index + 1}
                      </Label>
                      <Input
                        id={`upsell-ticket-${index}`}
                        type="number"
                        value={upsell.ticket}
                        onChange={(e) => atualizarUpsell(index, "ticket", e.target.value)}
                        placeholder="Ex: 497"
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`upsell-conversao-${index}`} className="text-gray-300">
                        Conversão do Upsell {index + 1} (%)
                      </Label>
                      <Input
                        id={`upsell-conversao-${index}`}
                        type="number"
                        step="0.1"
                        value={upsell.conversao}
                        onChange={(e) => atualizarUpsell(index, "conversao", e.target.value)}
                        placeholder="Ex: 25"
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                      />
                    </div>
                    {upsells.length > 1 && (
                      <div className="flex items-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removerUpsell(index)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Button
                onClick={adicionarUpsell}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar mais upsells
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Dados de Performance */}
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Dados de Performance</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vendas do Produto Principal */}
                <div>
                  <Label htmlFor="vendas" className="text-gray-300">
                    Vendas do Produto Principal
                  </Label>
                  <Input
                    id="vendas"
                    type="number"
                    value={performance.vendas}
                    onChange={(e) => atualizarPerformance("vendas", e.target.value)}
                    placeholder="Ex: 100"
                    className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                  />
                </div>

                {/* Valor gasto */}
                <div>
                  <Label htmlFor="valor-gasto" className="text-gray-300">
                    Valor gasto
                  </Label>
                  <Input
                    id="valor-gasto"
                    type="number"
                    value={performance.valorGasto}
                    onChange={(e) => atualizarPerformance("valorGasto", e.target.value)}
                    placeholder="Ex: 5000"
                    className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                  />
                </div>

                {/* Quanto voltou */}
                <div>
                  <Label htmlFor="quanto-voltou" className="text-gray-300">
                    Quanto voltou
                  </Label>
                  <Input
                    id="quanto-voltou"
                    type="number"
                    value={performance.quantoVoltou}
                    onChange={(e) => atualizarPerformance("quantoVoltou", e.target.value)}
                    placeholder="Ex: 15000"
                    className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                  />
                </div>

                {/* ROI */}
                <div>
                  <Label htmlFor="roi" className="text-gray-300">
                    ROI
                  </Label>
                  <Input
                    id="roi"
                    type="number"
                    step="0.1"
                    value={performance.roi}
                    onChange={(e) => atualizarPerformance("roi", e.target.value)}
                    placeholder="Ex: 300"
                    className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultado da Análise */}
        {resultado && (
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardContent className="p-6">
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">Resultado da Análise</h2>

                <div>
                  <h3 className="font-semibold text-white mb-2">Análise:</h3>
                  <p className="text-gray-300">{resultado.analise}</p>
                </div>

                {resultado.metricasOtimizadas && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]">
                      <p className="text-sm text-gray-400 mb-1">ROAS Projetado</p>
                      <p className="text-2xl font-bold text-green-400">
                        {resultado.metricasOtimizadas.roasProjetado.toFixed(2)}x
                      </p>
                    </div>
                    <div className="p-4 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]">
                      <p className="text-sm text-gray-400 mb-1">Receita Projetada</p>
                      <p className="text-2xl font-bold text-blue-400">
                        R$ {resultado.metricasOtimizadas.receitaProjetada.toFixed(2)}
                      </p>
                    </div>
                    <div className="p-4 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]">
                      <p className="text-sm text-gray-400 mb-1">Lucro Projetado</p>
                      <p className="text-2xl font-bold text-green-400">
                        R$ {resultado.metricasOtimizadas.lucroProjetado.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}

                {resultado.recomendacoes && resultado.recomendacoes.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-blue-400 mb-2">Recomendações:</h3>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                      {resultado.recomendacoes.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {resultado.pontosMelhoria && resultado.pontosMelhoria.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-yellow-400 mb-2">Pontos de Melhoria:</h3>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                      {resultado.pontosMelhoria.map((ponto, i) => (
                        <li key={i}>{ponto}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={verificarCampanha}
            disabled={analisando}
            className="bg-[#ff5a1f] hover:bg-[#ff6a2f] text-white"
          >
            {analisando ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Verificar Campanha
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={limparDados}
            className="border-gray-600 text-gray-400 hover:bg-gray-800"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar Dados
          </Button>
        </div>
      </div>
    </div>
  )
}
