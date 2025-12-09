"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Trash2, Plus, Loader2, TrendingUp, TrendingDown, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"

interface CriativoData {
  nome: string
  gastou: string
  voltou: string
  cliques: string
  ic: string
  ctr: string
  cpm: string
  cpc: string
}

interface AnaliseResult {
  validado: boolean
  podeEscalar: boolean
  score: number
  analise: string
  pontosPositivos: string[]
  pontosAtencao: string[]
  recomendacoes: string[]
}

export default function ValidadorCriativoPage() {
  const [criativos, setCriativos] = useState<CriativoData[]>([
    {
      nome: "",
      gastou: "",
      voltou: "",
      cliques: "",
      ic: "",
      ctr: "",
      cpm: "",
      cpc: ""
    }
  ])
  const [analisando, setAnalisando] = useState(false)
  const [resultados, setResultados] = useState<AnaliseResult[]>([])
  const { toast } = useToast()

  const adicionarCriativo = () => {
    setCriativos([...criativos, {
      nome: "",
      gastou: "",
      voltou: "",
      cliques: "",
      ic: "",
      ctr: "",
      cpm: "",
      cpc: ""
    }])
  }

  const removerCriativo = (index: number) => {
    if (criativos.length > 1) {
      setCriativos(criativos.filter((_, i) => i !== index))
      setResultados(resultados.filter((_, i) => i !== index))
    }
  }

  const atualizarCriativo = (index: number, field: keyof CriativoData, value: string) => {
    const novosCriativos = [...criativos]
    novosCriativos[index][field] = value
    setCriativos(novosCriativos)
  }

  const limparDados = () => {
    setCriativos([{
      nome: "",
      gastou: "",
      voltou: "",
      cliques: "",
      ic: "",
      ctr: "",
      cpm: "",
      cpc: ""
    }])
    setResultados([])
    toast({
      title: "Dados limpos",
      description: "Todos os campos foram limpos com sucesso.",
    })
  }

  const analisarCriativos = async () => {
    // Validar se pelo menos um criativo tem dados
    const criativosComDados = criativos.filter(c => 
      c.nome || c.gastou || c.voltou || c.cliques || c.ic || c.ctr || c.cpm || c.cpc
    )

    if (criativosComDados.length === 0) {
      toast({
        title: "Erro",
        description: "Preencha pelo menos um criativo com dados para analisar.",
        variant: "destructive"
      })
      return
    }

    setAnalisando(true)
    setResultados([])

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

      const response = await fetch("/api/ferramentas/validador-criativo/analisar", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ criativos: criativosComDados }),
      })

      if (!response.ok) {
        throw new Error("Erro ao analisar criativos")
      }

      const data = await response.json()
      setResultados(data.resultados || [])

      toast({
        title: "Análise concluída",
        description: `${data.resultados?.length || 0} criativo(s) analisado(s) com sucesso.`,
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao analisar criativos. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setAnalisando(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#ff5a1f] rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Validador de Criativo</h1>
                <p className="text-gray-400">Analise a performance dos seus criativos com IA</p>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={limparDados}
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar Dados
          </Button>
        </div>

        {/* Criativos */}
        <div className="space-y-6">
          {criativos.map((criativo, index) => (
            <Card key={index} className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Header do Criativo */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#ff5a1f] flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <h2 className="text-xl font-bold text-white">Criativo {index + 1}</h2>
                    </div>
                    {criativos.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removerCriativo(index)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Campos do Criativo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Nome do Criativo */}
                    <div className="md:col-span-2 lg:col-span-3">
                      <Label htmlFor={`nome-${index}`} className="text-gray-300">
                        Nome do Criativo
                      </Label>
                      <Input
                        id={`nome-${index}`}
                        value={criativo.nome}
                        onChange={(e) => atualizarCriativo(index, "nome", e.target.value)}
                        placeholder="Ex: Criativo A - VSL Principal"
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                      />
                    </div>

                    {/* Quanto gastou */}
                    <div>
                      <Label htmlFor={`gastou-${index}`} className="text-gray-300">
                        Quanto gastou ao todo
                      </Label>
                      <Input
                        id={`gastou-${index}`}
                        type="number"
                        value={criativo.gastou}
                        onChange={(e) => atualizarCriativo(index, "gastou", e.target.value)}
                        placeholder="Ex: 5000"
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                      />
                    </div>

                    {/* Quanto voltou */}
                    <div>
                      <Label htmlFor={`voltou-${index}`} className="text-gray-300">
                        Quanto voltou
                      </Label>
                      <Input
                        id={`voltou-${index}`}
                        type="number"
                        value={criativo.voltou}
                        onChange={(e) => atualizarCriativo(index, "voltou", e.target.value)}
                        placeholder="Ex: 15000"
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                      />
                    </div>

                    {/* Cliques */}
                    <div>
                      <Label htmlFor={`cliques-${index}`} className="text-gray-300">
                        Cliques
                      </Label>
                      <Input
                        id={`cliques-${index}`}
                        type="number"
                        value={criativo.cliques}
                        onChange={(e) => atualizarCriativo(index, "cliques", e.target.value)}
                        placeholder="Ex: 2500"
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                      />
                    </div>

                    {/* IC */}
                    <div>
                      <Label htmlFor={`ic-${index}`} className="text-gray-300">
                        IC (Índice de Conversão)
                      </Label>
                      <Input
                        id={`ic-${index}`}
                        type="number"
                        step="0.1"
                        value={criativo.ic}
                        onChange={(e) => atualizarCriativo(index, "ic", e.target.value)}
                        placeholder="Ex: 3.2"
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                      />
                    </div>

                    {/* CTR */}
                    <div>
                      <Label htmlFor={`ctr-${index}`} className="text-gray-300">
                        CTR (%)
                      </Label>
                      <Input
                        id={`ctr-${index}`}
                        type="number"
                        step="0.1"
                        value={criativo.ctr}
                        onChange={(e) => atualizarCriativo(index, "ctr", e.target.value)}
                        placeholder="Ex: 1.5"
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                      />
                    </div>

                    {/* CPM */}
                    <div>
                      <Label htmlFor={`cpm-${index}`} className="text-gray-300">
                        CPM (Custo por Mil)
                      </Label>
                      <Input
                        id={`cpm-${index}`}
                        type="number"
                        step="0.01"
                        value={criativo.cpm}
                        onChange={(e) => atualizarCriativo(index, "cpm", e.target.value)}
                        placeholder="Ex: 15.50"
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                      />
                    </div>

                    {/* CPC */}
                    <div>
                      <Label htmlFor={`cpc-${index}`} className="text-gray-300">
                        CPC (Custo por Clique)
                      </Label>
                      <Input
                        id={`cpc-${index}`}
                        type="number"
                        step="0.01"
                        value={criativo.cpc}
                        onChange={(e) => atualizarCriativo(index, "cpc", e.target.value)}
                        placeholder="Ex: 2.00"
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                      />
                    </div>
                  </div>

                  {/* Resultado da Análise */}
                  {resultados[index] && (
                    <div className="mt-6 p-4 rounded-lg border-2 bg-[#0a0a0a] border-[#2a2a2a]">
                      <div className="flex items-center gap-3 mb-4">
                        {resultados[index].validado ? (
                          <div className="flex items-center gap-2 text-green-400">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-bold">Criativo Validado</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-400">
                            <AlertCircle className="h-5 w-5" />
                            <span className="font-bold">Criativo Não Validado</span>
                          </div>
                        )}
                        {resultados[index].podeEscalar ? (
                          <div className="flex items-center gap-2 text-green-400">
                            <TrendingUp className="h-5 w-5" />
                            <span className="font-bold">Pode Escalar</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-yellow-400">
                            <TrendingDown className="h-5 w-5" />
                            <span className="font-bold">Não Recomendado Escalar</span>
                          </div>
                        )}
                        <div className="ml-auto">
                          <span className="text-sm text-gray-400">Score: </span>
                          <span className="font-bold text-white">{resultados[index].score}/100</span>
                        </div>
                      </div>

                      <div className="space-y-4 text-sm">
                        <div>
                          <h4 className="font-semibold text-white mb-2">Análise:</h4>
                          <p className="text-gray-300">{resultados[index].analise}</p>
                        </div>

                        {resultados[index].pontosPositivos.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-green-400 mb-2">Pontos Positivos:</h4>
                            <ul className="list-disc list-inside text-gray-300 space-y-1">
                              {resultados[index].pontosPositivos.map((ponto, i) => (
                                <li key={i}>{ponto}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {resultados[index].pontosAtencao.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-yellow-400 mb-2">Pontos de Atenção:</h4>
                            <ul className="list-disc list-inside text-gray-300 space-y-1">
                              {resultados[index].pontosAtencao.map((ponto, i) => (
                                <li key={i}>{ponto}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {resultados[index].recomendacoes.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-blue-400 mb-2">Recomendações:</h4>
                            <ul className="list-disc list-inside text-gray-300 space-y-1">
                              {resultados[index].recomendacoes.map((rec, i) => (
                                <li key={i}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={adicionarCriativo}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar +1 Criativo
          </Button>
          <Button
            onClick={analisarCriativos}
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
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Analisar Criativos
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
