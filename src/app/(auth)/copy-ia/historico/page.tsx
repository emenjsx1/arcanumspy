"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { getCopyGenerations, deleteCopyGeneration, type CopyGeneration } from "@/lib/db/copy-generations"
import { Copy, Trash2, Eye, Calendar } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function HistoricoCopyPage() {
  const { toast } = useToast()
  const [copies, setCopies] = useState<CopyGeneration[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCopy, setSelectedCopy] = useState<CopyGeneration | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadCopies()
  }, [])

  const loadCopies = async () => {
    setLoading(true)
    try {
      const data = await getCopyGenerations(100)
      setCopies(data)
    } catch (error) {
      console.error("Erro ao carregar copies:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta copy?")) {
      return
    }

    try {
      const success = await deleteCopyGeneration(id)
      if (success) {
        setCopies(copies.filter((c) => c.id !== id))
        toast({
          title: "Excluído",
          description: "Copy removida do histórico",
        })
      } else {
        throw new Error("Erro ao excluir")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a copy",
        variant: "destructive",
      })
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência",
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Histórico</h1>
          <p className="text-muted-foreground mt-1">
            Visualize todas as copies geradas anteriormente
          </p>
        </div>

        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (copies.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Histórico</h1>
          <p className="text-muted-foreground mt-1">
            Visualize todas as copies geradas anteriormente
          </p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Nenhuma copy gerada ainda.{" "}
              <a href="/copy-ia/gerar" className="text-primary hover:underline">
                Gerar sua primeira copy
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Histórico</h1>
        <p className="text-muted-foreground mt-1">
          Visualize todas as copies geradas anteriormente
        </p>
      </div>

      <div className="grid gap-4">
        {copies.map((copy) => (
          <Card key={copy.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{copy.nicho}</CardTitle>
                    <Badge variant="secondary">{copy.tipo_criativo}</Badge>
                    <Badge variant="outline">{copy.modelo}</Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {formatDate(copy.created_at)}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCopy(copy)
                      setDialogOpen(true)
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(copy.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Público-alvo</p>
                  <p className="text-sm text-muted-foreground">{copy.publico}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Promessa</p>
                  <p className="text-sm text-muted-foreground">{copy.promessa}</p>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium mb-1">Copy Principal (preview)</p>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {copy.resultado.copy_principal}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Copy</DialogTitle>
            <DialogDescription>
              {selectedCopy && (
                <>
                  {selectedCopy.nicho} • {selectedCopy.tipo_criativo} • {selectedCopy.modelo}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedCopy && (
            <div className="space-y-6 mt-4">
              <div>
                <h3 className="font-semibold mb-2">Informações</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nicho</p>
                    <p className="font-medium">{selectedCopy.nicho}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tipo de Criativo</p>
                    <p className="font-medium">{selectedCopy.tipo_criativo}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Modelo</p>
                    <p className="font-medium">{selectedCopy.modelo}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">CTA</p>
                    <p className="font-medium">{selectedCopy.cta}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Copy Principal</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(selectedCopy.resultado.copy_principal)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                </div>
                <div className="border rounded-lg p-4 bg-muted/30">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {selectedCopy.resultado.copy_principal}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Variações</h3>
                <div className="space-y-2">
                  {selectedCopy.resultado.variacoes.map((variacao, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between border rounded-lg p-3 bg-muted/30"
                    >
                      <p className="text-sm flex-1">{variacao}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(variacao)}
                        className="ml-2"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Headlines</h3>
                <div className="space-y-2">
                  {selectedCopy.resultado.headlines.map((headline, idx) => (
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
                  <h3 className="font-semibold">Descrição Curta</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(selectedCopy.resultado.descricao_curta)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                </div>
                <div className="border rounded-lg p-4 bg-muted/30">
                  <p className="text-sm">{selectedCopy.resultado.descricao_curta}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Legenda para Anúncio</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(selectedCopy.resultado.legenda_anuncio)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                </div>
                <div className="border rounded-lg p-4 bg-muted/30">
                  <p className="whitespace-pre-wrap text-sm">
                    {selectedCopy.resultado.legenda_anuncio}
                  </p>
                </div>
              </div>

              {selectedCopy.resultado.script_ugc && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Script UGC</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(selectedCopy.resultado.script_ugc!)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar
                    </Button>
                  </div>
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {selectedCopy.resultado.script_ugc}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}









