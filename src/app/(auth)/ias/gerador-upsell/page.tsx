"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

export default function GeradorUpsellPage() {
  const [produtoPrincipal, setProdutoPrincipal] = useState("")
  const [produtoUpsell, setProdutoUpsell] = useState("")
  const [loading, setLoading] = useState(false)
  const [upsell, setUpsell] = useState<string | null>(null)
  const { toast } = useToast()

  const handleGerar = async () => {
    if (!produtoPrincipal.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma descrição do produto principal",
        variant: "destructive"
      })
      return
    }

    if (!produtoUpsell.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma descrição do produto de upsell",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      setUpsell(null)
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado",
          variant: "destructive"
        })
        return
      }

      const response = await fetch('/api/ias/gerador-upsell', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          produto_principal: produtoPrincipal,
          produto_upsell: produtoUpsell
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao gerar upsell')
      }

      const data = await response.json()
      if (data.success && data.upsell) {
        setUpsell(data.upsell)
        toast({
          title: "Sucesso",
          description: "Upsell gerado com sucesso!",
        })
      }
    } catch (error: any) {
      console.error('Erro ao gerar upsell:', error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível gerar o upsell",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#ff5a1f] rounded-lg">
            <ShoppingCart className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">Gerador de Upsell</h1>
            <p className="text-gray-400 text-lg">Crie ofertas complementares para aumentar suas vendas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-white">Configurar Upsell</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Produto Principal</Label>
              <Textarea
                placeholder="Descreva o produto principal..."
                value={produtoPrincipal}
                onChange={(e) => setProdutoPrincipal(e.target.value)}
                className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500 min-h-[100px] focus:border-[#ff5a1f]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Produto de Upsell</Label>
              <Textarea
                placeholder="Descreva o produto de upsell..."
                value={produtoUpsell}
                onChange={(e) => setProdutoUpsell(e.target.value)}
                className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500 min-h-[100px] focus:border-[#ff5a1f]"
              />
            </div>
            <Button 
              onClick={handleGerar}
              disabled={loading || !produtoPrincipal.trim() || !produtoUpsell.trim()}
              className="w-full bg-[#ff5a1f] hover:bg-[#ff4d29] text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Gerar Upsell
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-white">Texto de Upsell Gerado</CardTitle>
          </CardHeader>
          <CardContent>
            {upsell ? (
              <div className="space-y-4">
                <Textarea
                  value={upsell}
                  readOnly
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-white min-h-[300px]"
                />
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(upsell)
                    toast({
                      title: "Copiado!",
                      description: "Texto copiado para a área de transferência",
                    })
                  }}
                  className="w-full bg-[#ff5a1f] hover:bg-[#ff4d29] text-white"
                >
                  Copiar Texto
                </Button>
              </div>
            ) : (
              <div className="min-h-[300px] bg-[#0a0a0a] border-2 border-dashed border-[#2a2a2a] rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <ShoppingCart className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Seu texto de upsell aparecerá aqui</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
