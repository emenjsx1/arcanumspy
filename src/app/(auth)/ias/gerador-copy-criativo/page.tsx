"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Type, Loader2, Copy as CopyIcon, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Badge } from "@/components/ui/badge"

interface CopyResult {
  headline: string
  subheadline: string
  body: string
  cta: string
}

export default function GeradorCopyCriativoPage() {
  const [style, setStyle] = useState("")
  const [creativeType, setCreativeType] = useState("")
  const [mechanism, setMechanism] = useState("")
  const [productName, setProductName] = useState("")
  const [audienceAge, setAudienceAge] = useState<number | "">("")
  const [pain, setPain] = useState("")
  const [promise, setPromise] = useState("")
  const [benefits, setBenefits] = useState("")
  const [story, setStory] = useState("")
  const [description, setDescription] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [copy, setCopy] = useState<CopyResult | null>(null)
  const { toast } = useToast()

  const handleGerar = async () => {
    // Validação de campos obrigatórios
    if (!style) {
      toast({
        title: "Erro",
        description: "Selecione o estilo da copy",
        variant: "destructive"
      })
      return
    }

    if (!creativeType) {
      toast({
        title: "Erro",
        description: "Selecione o tipo de criativo",
        variant: "destructive"
      })
      return
    }

    if (!mechanism.trim()) {
      toast({
        title: "Erro",
        description: "Digite o mecanismo do produto",
        variant: "destructive"
      })
      return
    }

    if (!productName.trim()) {
      toast({
        title: "Erro",
        description: "Digite o nome do produto",
        variant: "destructive"
      })
      return
    }

    if (!audienceAge || typeof audienceAge !== 'number' || audienceAge < 1 || audienceAge > 120) {
      toast({
        title: "Erro",
        description: "Digite uma idade válida (1-120 anos)",
        variant: "destructive"
      })
      return
    }

    // Validar description (máximo 500 caracteres)
    if (description.length > 500) {
      toast({
        title: "Erro",
        description: "A descrição deve ter no máximo 500 caracteres",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      setCopy(null)
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado",
          variant: "destructive"
        })
        return
      }

      const response = await fetch('/api/ias/gerador-copy-criativo', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          style,
          creative_type: creativeType,
          mechanism: mechanism.trim(),
          product_name: productName.trim(),
          audience_age: Number(audienceAge),
          pain: pain.trim() || undefined,
          promise: promise.trim() || undefined,
          benefits: benefits.trim() || undefined,
          story: story.trim() || undefined,
          description: description.trim() || undefined,
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar copy')
      }

      if (data.success && data.copy) {
        setCopy(data.copy)
        toast({
          title: "Sucesso",
          description: "Copy gerado com sucesso!",
        })
      } else {
        throw new Error(data.error || 'Erro ao gerar copy')
      }
    } catch (error: any) {
      console.error('Erro ao gerar copy:', error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível gerar o copy",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência`,
    })
  }

  const isFormValid = () => {
    return (
      style &&
      creativeType &&
      mechanism.trim() !== '' &&
      productName.trim() !== '' &&
      audienceAge !== '' &&
      typeof audienceAge === 'number' &&
      audienceAge >= 1 &&
      audienceAge <= 120 &&
      description.length <= 500
    )
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#ff5a1f] rounded-lg">
            <Type className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white break-words">
              Gerador de Copy para Criativos
            </h1>
            <p className="text-gray-400 text-sm md:text-base">
              Crie copies profissionais personalizadas para seus criativos
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Formulário */}
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-white">Configurações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Estilo da Copy */}
            <div className="space-y-2">
              <Label className="text-white">
                Estilo da Copy <span className="text-red-500">*</span>
              </Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger className="bg-[#0a0a0a] border-[#2a2a2a] text-white">
                  <SelectValue placeholder="Selecione o estilo" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <SelectItem value="Agressivo" className="text-white">Agressivo</SelectItem>
                  <SelectItem value="Neutro" className="text-white">Neutro</SelectItem>
                  <SelectItem value="Storytelling" className="text-white">Storytelling</SelectItem>
                  <SelectItem value="Podcast" className="text-white">Podcast</SelectItem>
                  <SelectItem value="Conversacional" className="text-white">Conversacional</SelectItem>
                  <SelectItem value="Estilo GC" className="text-white">Estilo GC</SelectItem>
                  <SelectItem value="Estilo VSL" className="text-white">Estilo VSL</SelectItem>
                  <SelectItem value="Estilo Direct Response" className="text-white">Estilo Direct Response</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Criativo */}
            <div className="space-y-2">
              <Label className="text-white">
                Tipo de Criativo <span className="text-red-500">*</span>
              </Label>
              <Select value={creativeType} onValueChange={setCreativeType}>
                <SelectTrigger className="bg-[#0a0a0a] border-[#2a2a2a] text-white">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <SelectItem value="Criativo curto" className="text-white">Criativo curto</SelectItem>
                  <SelectItem value="Criativo longo" className="text-white">Criativo longo</SelectItem>
                  <SelectItem value="Script de UGC" className="text-white">Script de UGC</SelectItem>
                  <SelectItem value="Criativo no formato Podcast" className="text-white">Criativo no formato Podcast</SelectItem>
                  <SelectItem value="Roteiro para Reels" className="text-white">Roteiro para Reels</SelectItem>
                  <SelectItem value="Roteiro para TikTok" className="text-white">Roteiro para TikTok</SelectItem>
                  <SelectItem value="Headline" className="text-white">Headline</SelectItem>
                  <SelectItem value="Copy de imagem" className="text-white">Copy de imagem</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mecanismo */}
            <div className="space-y-2">
              <Label className="text-white">
                Mecanismo <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Ex: Queima de gordura, Ganho de massa muscular..."
                value={mechanism}
                onChange={(e) => setMechanism(e.target.value)}
                className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#ff5a1f]"
              />
            </div>

            {/* Nome do Produto */}
            <div className="space-y-2">
              <Label className="text-white">
                Nome do Produto <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Ex: Queima Gordura X, Super Massa..."
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#ff5a1f]"
              />
            </div>

            {/* Idade do Público */}
            <div className="space-y-2">
              <Label className="text-white">
                Idade do Público <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                min="1"
                max="120"
                placeholder="Ex: 25, 35, 45..."
                value={audienceAge}
                onChange={(e) => {
                  const value = e.target.value === '' ? '' : Number(e.target.value)
                  setAudienceAge(value)
                }}
                className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#ff5a1f]"
              />
            </div>

            {/* Dor */}
            <div className="space-y-2">
              <Label className="text-white">Dor do Público (opcional)</Label>
              <Input
                placeholder="Ex: Não consegue emagrecer, falta de energia..."
                value={pain}
                onChange={(e) => setPain(e.target.value)}
                className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#ff5a1f]"
              />
            </div>

            {/* Promessa */}
            <div className="space-y-2">
              <Label className="text-white">Promessa (opcional)</Label>
              <Input
                placeholder="Ex: Emagreça 10kg em 30 dias..."
                value={promise}
                onChange={(e) => setPromise(e.target.value)}
                className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#ff5a1f]"
              />
            </div>

            {/* Benefícios */}
            <div className="space-y-2">
              <Label className="text-white">Benefícios (opcional)</Label>
              <Textarea
                placeholder="Liste os principais benefícios do produto..."
                value={benefits}
                onChange={(e) => setBenefits(e.target.value)}
                className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500 min-h-[80px] focus:border-[#ff5a1f]"
              />
            </div>

            {/* História Resumida */}
            <div className="space-y-2">
              <Label className="text-white">História Resumida (opcional)</Label>
              <Textarea
                placeholder="Conte uma história breve relacionada ao produto..."
                value={story}
                onChange={(e) => setStory(e.target.value)}
                className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500 min-h-[80px] focus:border-[#ff5a1f]"
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label className="text-white">
                Informações Extras (opcional)
                {description.length > 0 && (
                  <span className="text-gray-400 text-xs ml-2">
                    {description.length}/500
                  </span>
                )}
              </Label>
              <Textarea
                placeholder="Informações adicionais sobre o produto ou campanha..."
                value={description}
                onChange={(e) => {
                  if (e.target.value.length <= 500) {
                    setDescription(e.target.value)
                  }
                }}
                className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500 min-h-[100px] focus:border-[#ff5a1f]"
              />
              {description.length > 450 && (
                <p className="text-xs text-yellow-500">
                  Restam {500 - description.length} caracteres
                </p>
              )}
            </div>

            <Button 
              onClick={handleGerar}
              disabled={loading || !isFormValid()}
              className="w-full bg-[#ff5a1f] hover:bg-[#ff4d29] text-white rounded-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando Copy...
                </>
              ) : (
                <>
                  <Type className="mr-2 h-4 w-4" />
                  Criar Copy
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Resultado */}
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-white">Copy Gerado</CardTitle>
          </CardHeader>
          <CardContent>
            {copy ? (
              <div className="space-y-4">
                {/* Headline */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-white font-semibold">Headline</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyToClipboard(copy.headline, "Headline")}
                      className="h-7 text-[#ff5a1f] hover:text-[#ff4d29]"
                    >
                      <CopyIcon className="h-3 w-3 mr-1" />
                      Copiar
                    </Button>
                  </div>
                  <div className="p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg">
                    <p className="text-white text-lg font-semibold">{copy.headline}</p>
                  </div>
                </div>

                {/* Subheadline */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-white font-semibold">Subheadline</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyToClipboard(copy.subheadline, "Subheadline")}
                      className="h-7 text-[#ff5a1f] hover:text-[#ff4d29]"
                    >
                      <CopyIcon className="h-3 w-3 mr-1" />
                      Copiar
                    </Button>
                  </div>
                  <div className="p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg">
                    <p className="text-white">{copy.subheadline}</p>
                  </div>
                </div>

                {/* Body */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-white font-semibold">Body (Texto Principal)</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyToClipboard(copy.body, "Body")}
                      className="h-7 text-[#ff5a1f] hover:text-[#ff4d29]"
                    >
                      <CopyIcon className="h-3 w-3 mr-1" />
                      Copiar
                    </Button>
                  </div>
                  <div className="p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg">
                    <p className="text-white whitespace-pre-wrap">{copy.body}</p>
                  </div>
                </div>

                {/* CTA */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-white font-semibold">CTA (Call to Action)</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyToClipboard(copy.cta, "CTA")}
                      className="h-7 text-[#ff5a1f] hover:text-[#ff4d29]"
                    >
                      <CopyIcon className="h-3 w-3 mr-1" />
                      Copiar
                    </Button>
                  </div>
                  <div className="p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg">
                    <p className="text-white font-medium">{copy.cta}</p>
                  </div>
                </div>

                {/* Botão para copiar tudo */}
                <Button
                  onClick={() => {
                    const fullCopy = `${copy.headline}\n\n${copy.subheadline}\n\n${copy.body}\n\n${copy.cta}`
                    handleCopyToClipboard(fullCopy, "Copy completa")
                  }}
                  className="w-full bg-[#ff5a1f] hover:bg-[#ff4d29] text-white rounded-full"
                >
                  <CopyIcon className="mr-2 h-4 w-4" />
                  Copiar Copy Completa
                </Button>
              </div>
            ) : (
              <div className="min-h-[400px] bg-[#0a0a0a] border-2 border-dashed border-[#2a2a2a] rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Type className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Seu copy aparecerá aqui</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Preencha o formulário e clique em &quot;Criar Copy&quot;
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
