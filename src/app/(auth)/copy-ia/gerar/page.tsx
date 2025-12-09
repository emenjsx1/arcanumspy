"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Copy, Sparkles, Loader2, Save, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"
import { useAuthStore } from "@/store/auth-store"

const TIPOS_CRIATIVO = [
  "Vídeo UGC",
  "Vídeo Problema → Solução",
  "Criativo imagem",
  "Story",
  "Copy para carrossel",
  "Copy longa",
  "Copy curta",
]

const MODELOS = [
  "AIDA",
  "PAS",
  "QPQ",
  "4P's",
  "Big Promise",
  "Storytelling",
  "Anti-Método",
  "Lista de Benefícios",
]

interface FormData {
  nicho: string
  tipo_criativo: string
  modelo: string
  publico: string
  promessa: string
  prova: string
  diferencial: string
  cta: string
}

interface CopyResult {
  copy_principal: string
  variacoes: string[]
  headlines: string[]
  descricao_curta: string
  legenda_anuncio: string
  script_ugc?: string
}

export default function GerarCopyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, isAuthenticated } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    nicho: "",
    tipo_criativo: "",
    modelo: "",
    publico: "",
    promessa: "",
    prova: "",
    diferencial: "",
    cta: "",
  })
  const [result, setResult] = useState<CopyResult | null>(null)
  const [generationId, setGenerationId] = useState<string | null>(null)

  const totalSteps = 8

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.nicho.trim() !== ""
      case 2:
        return formData.tipo_criativo !== ""
      case 3:
        return formData.modelo !== ""
      case 4:
        return formData.publico.trim() !== ""
      case 5:
        return formData.promessa.trim() !== ""
      case 6:
        return true // Prova é opcional
      case 7:
        return formData.diferencial.trim() !== ""
      case 8:
        return formData.cta.trim() !== ""
      default:
        return false
    }
  }

  const handleNext = () => {
    if (canProceed() && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleGenerate = async () => {
    if (!canProceed()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    // Verificar autenticação
    if (!isAuthenticated || !user) {
      toast({
        title: "Não autenticado",
        description: "Faça login para gerar copy",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Obter sessão e token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        toast({
          title: "Sessão expirada",
          description: "Faça login novamente para continuar",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      // Adicionar token de autenticação
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch("/api/copy-ia/generate", {
        method: "POST",
        credentials: 'include', // Incluir cookies
        headers,
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || "Erro ao gerar copy")
      }

      setResult(data.data)
      setGenerationId(data.id)
      setCurrentStep(9) // Mostrar resultado

      toast({
        title: "Copy gerada!",
        description: "Sua copy foi gerada com sucesso",
      })
    } catch (error: any) {
      console.error('Erro ao gerar copy:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar copy",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência",
    })
  }

  const handleSave = () => {
    if (generationId) {
      router.push("/copy-ia/historico")
    }
  }

  const handleNewVariations = async () => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Não autenticado",
        description: "Faça login para gerar variações",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Obter sessão e token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        toast({
          title: "Sessão expirada",
          description: "Faça login novamente para continuar",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      // Adicionar token de autenticação
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch("/api/copy-ia/generate", {
        method: "POST",
        credentials: 'include',
        headers,
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || "Erro ao gerar variações")
      }

      setResult(data.data)
      setGenerationId(data.id)

      toast({
        title: "Novas variações geradas!",
        description: "Suas novas variações foram criadas",
      })
    } catch (error: any) {
      console.error('Erro ao gerar variações:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar variações",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    if (currentStep === 9 && result) {
      return (
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-semibold">Copy Gerada</h2>
            <p className="text-muted-foreground mt-1">
              Sua copy foi gerada com sucesso. Use os botões abaixo para copiar, salvar ou gerar novas variações.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-base font-semibold">Copy Principal</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(result.copy_principal)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
              </div>
              <div className="border rounded-lg p-4 bg-muted/30">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {result.copy_principal}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold mb-2 block">Variações</Label>
              <div className="space-y-3">
                {result.variacoes.map((variacao, idx) => (
                  <div key={idx} className="border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-start justify-between">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed flex-1">
                        {variacao}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(variacao)}
                        className="ml-2"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold mb-2 block">Headlines</Label>
              <div className="space-y-2">
                {result.headlines.map((headline, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between border rounded-lg p-3 bg-muted/30"
                  >
                    <p className="text-sm font-medium">{headline}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(headline)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-base font-semibold">Descrição Curta</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(result.descricao_curta)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
              </div>
              <div className="border rounded-lg p-4 bg-muted/30">
                <p className="text-sm">{result.descricao_curta}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-base font-semibold">Legenda para Anúncio</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(result.legenda_anuncio)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
              </div>
              <div className="border rounded-lg p-4 bg-muted/30">
                <p className="whitespace-pre-wrap text-sm">{result.legenda_anuncio}</p>
              </div>
            </div>

            {result.script_ugc && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-base font-semibold">Script UGC</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(result.script_ugc!)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                </div>
                <div className="border rounded-lg p-4 bg-muted/30">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {result.script_ugc}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleNewVariations} disabled={loading} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Criar Novas Variações
            </Button>
            <Button onClick={handleSave} variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Salvar no Histórico
            </Button>
            <Button
              onClick={() => {
                setResult(null)
                setCurrentStep(1)
                setFormData({
                  nicho: "",
                  tipo_criativo: "",
                  modelo: "",
                  publico: "",
                  promessa: "",
                  prova: "",
                  diferencial: "",
                  cta: "",
                })
              }}
            >
              Nova Copy
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-1">
            {currentStep === 1 && "Qual é o nicho do seu produto?"}
            {currentStep === 2 && "Qual tipo de criativo você precisa?"}
            {currentStep === 3 && "Qual estrutura de copy deseja usar?"}
            {currentStep === 4 && "Quem é o público-alvo?"}
            {currentStep === 5 && "Qual é a principal promessa do seu produto?"}
            {currentStep === 6 && "Tem alguma prova/credibilidade?"}
            {currentStep === 7 && "Qual é o principal diferencial?"}
            {currentStep === 8 && "Qual chamada para ação deseja usar?"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {currentStep === 1 && "Exemplo: emagrecimento, capilar, crédito, serviços, moda..."}
            {currentStep === 2 && "Selecione o formato do criativo"}
            {currentStep === 3 && "Escolha o modelo de copywriting"}
            {currentStep === 4 && "Descreva idade, dor principal, perfil do público"}
            {currentStep === 5 && "A promessa principal que seu produto oferece"}
            {currentStep === 6 && "Ex: resultados, depoimentos, anos de experiência, números (opcional)"}
            {currentStep === 7 && "O que torna seu produto único"}
            {currentStep === 8 && "Ex: clique agora, arraste pra cima, fale com especialista"}
          </p>
        </div>

        <div className="space-y-4">
          {currentStep === 1 && (
            <div>
              <Label htmlFor="nicho">Nicho</Label>
              <Input
                id="nicho"
                value={formData.nicho}
                onChange={(e) => updateFormData("nicho", e.target.value)}
                placeholder="Ex: emagrecimento"
              />
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <Label>Tipo de Criativo</Label>
              <Select
                value={formData.tipo_criativo}
                onValueChange={(value) => updateFormData("tipo_criativo", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_CRIATIVO.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <Label>Modelo de Copy</Label>
              <Select
                value={formData.modelo}
                onValueChange={(value) => updateFormData("modelo", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o modelo" />
                </SelectTrigger>
                <SelectContent>
                  {MODELOS.map((modelo) => (
                    <SelectItem key={modelo} value={modelo}>
                      {modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {currentStep === 4 && (
            <div>
              <Label htmlFor="publico">Público-alvo</Label>
              <Textarea
                id="publico"
                value={formData.publico}
                onChange={(e) => updateFormData("publico", e.target.value)}
                placeholder="Ex: Mulheres de 25-40 anos, que sofrem com queda de cabelo e buscam soluções naturais"
                rows={4}
              />
            </div>
          )}

          {currentStep === 5 && (
            <div>
              <Label htmlFor="promessa">Promessa Principal</Label>
              <Textarea
                id="promessa"
                value={formData.promessa}
                onChange={(e) => updateFormData("promessa", e.target.value)}
                placeholder="Ex: Recupere seus cabelos em 30 dias sem produtos químicos"
                rows={4}
              />
            </div>
          )}

          {currentStep === 6 && (
            <div>
              <Label htmlFor="prova">Prova/Credibilidade (opcional)</Label>
              <Textarea
                id="prova"
                value={formData.prova}
                onChange={(e) => updateFormData("prova", e.target.value)}
                placeholder="Ex: Mais de 10.000 resultados comprovados, 5 anos de experiência"
                rows={4}
              />
            </div>
          )}

          {currentStep === 7 && (
            <div>
              <Label htmlFor="diferencial">Diferencial</Label>
              <Textarea
                id="diferencial"
                value={formData.diferencial}
                onChange={(e) => updateFormData("diferencial", e.target.value)}
                placeholder="Ex: Única fórmula 100% natural com resultados em 30 dias"
                rows={4}
              />
            </div>
          )}

          {currentStep === 8 && (
            <div>
              <Label htmlFor="cta">Chamada para Ação</Label>
              <Input
                id="cta"
                value={formData.cta}
                onChange={(e) => updateFormData("cta", e.target.value)}
                placeholder="Ex: Clique agora e garante 50% de desconto"
              />
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            Voltar
          </Button>
          {currentStep < totalSteps ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Próximo
            </Button>
          ) : (
            <Button onClick={handleGenerate} disabled={loading || !canProceed()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar Copy
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold break-words">Gerar Copy</h1>
        <p className="text-muted-foreground mt-1">
          Crie copies profissionais em minutos com nosso assistente guiado
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="space-y-2">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                <div
                  key={step}
                  className={`
                    flex items-center gap-3 text-sm
                    ${currentStep === step ? "font-semibold text-primary" : "text-muted-foreground"}
                    ${currentStep > step ? "text-foreground" : ""}
                  `}
                >
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center border-2
                      ${
                        currentStep === step
                          ? "border-primary bg-primary text-primary-foreground"
                          : currentStep > step
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-muted-foreground"
                      }
                    `}
                  >
                    {currentStep > step ? "✓" : step}
                  </div>
                  <span>Etapa {step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              {renderStep()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

