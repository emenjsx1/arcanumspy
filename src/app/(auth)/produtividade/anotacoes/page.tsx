"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StickyNote, Plus, Trash2, Loader2, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Anotacao {
  id: string
  titulo: string
  conteudo: string
  cor?: string
  created_at: string
  updated_at?: string
}

export default function AnotacoesPage() {
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    titulo: "",
    conteudo: "",
    cor: "#ff5a1f"
  })

  const CORES_PREDEFINIDAS = [
    '#ff5a1f', // Laranja
    '#3b82f6', // Azul
    '#10b981', // Verde
    '#f59e0b', // Amarelo
    '#ef4444', // Vermelho
    '#8b5cf6', // Roxo
    '#ec4899', // Rosa
    '#06b6d4', // Ciano
  ]
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadAnotacoes()
  }, [])

  const loadAnotacoes = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Erro",
          description: "Sessão expirada. Faça login novamente.",
          variant: "destructive"
        })
        setLoading(false)
        return
      }

      const response = await fetch('/api/produtividade/anotacoes', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAnotacoes(data.anotacoes || [])
      } else {
        toast({
          title: "Erro",
          description: "Erro ao carregar anotações",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao carregar anotações:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar anotações",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Erro",
          description: "Sessão expirada. Faça login novamente.",
          variant: "destructive"
        })
        setSubmitting(false)
        return
      }

      const url = editingId
        ? `/api/produtividade/anotacoes?id=${editingId}`
        : '/api/produtividade/anotacoes'
      
      const method = editingId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          titulo: formData.titulo,
          conteudo: formData.conteudo,
          cor: formData.cor,
        }),
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: editingId ? "Anotação atualizada com sucesso!" : "Anotação criada com sucesso!",
        })
        setOpenDialog(false)
        setEditingId(null)
        setFormData({
          titulo: "",
          conteudo: "",
          cor: "#ff5a1f"
        })
        loadAnotacoes()
      } else {
        const data = await response.json()
        toast({
          title: "Erro",
          description: data.error || "Erro ao salvar anotação",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao salvar anotação:', error)
      toast({
        title: "Erro",
        description: "Erro ao salvar anotação",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (anotacao: Anotacao) => {
    setEditingId(anotacao.id)
    setFormData({
      titulo: anotacao.titulo,
      conteudo: anotacao.conteudo,
      cor: anotacao.cor || "#ff5a1f"
    })
    setOpenDialog(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta anotação?')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Erro",
          description: "Sessão expirada. Faça login novamente.",
          variant: "destructive"
        })
        return
      }

      const response = await fetch(`/api/produtividade/anotacoes?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Anotação excluída com sucesso!",
        })
        loadAnotacoes()
      } else {
        toast({
          title: "Erro",
          description: "Erro ao excluir anotação",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao excluir anotação:', error)
      toast({
        title: "Erro",
        description: "Erro ao excluir anotação",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#ff5a1f] rounded-lg">
            <StickyNote className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white break-words">Anotações</h1>
            <p className="text-gray-400 text-lg">Mantenha suas anotações organizadas</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Dialog open={openDialog} onOpenChange={(open) => {
          setOpenDialog(open)
          if (!open) {
            setEditingId(null)
            setFormData({ titulo: "", conteudo: "", cor: "#ff5a1f" })
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-[#ff5a1f] hover:bg-[#ff4d29] text-white">
              <Plus className="mr-2 h-4 w-4" />
              Nova Anotação
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Anotação' : 'Nova Anotação'}</DialogTitle>
              <DialogDescription className="text-gray-400">
                {editingId ? 'Atualize sua anotação' : 'Crie uma nova anotação para manter suas ideias organizadas'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Título da anotação"
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Conteúdo</Label>
                <Textarea
                  value={formData.conteudo}
                  onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                  placeholder="Escreva sua anotação aqui..."
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-white min-h-[200px]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex gap-2 flex-wrap">
                  {CORES_PREDEFINIDAS.map((cor) => (
                    <button
                      key={cor}
                      type="button"
                      onClick={() => setFormData({ ...formData, cor })}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        formData.cor === cor 
                          ? 'border-white scale-110' 
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: cor }}
                    />
                  ))}
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-[#ff5a1f] hover:bg-[#ff4d29] text-white"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingId ? 'Atualizando...' : 'Criando...'}
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    {editingId ? 'Atualizar Anotação' : 'Criar Anotação'}
                  </>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardHeader>
                <div className="h-6 bg-[#2a2a2a] rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-[#2a2a2a] rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : anotacoes.length === 0 ? (
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardContent className="py-12 text-center">
            <StickyNote className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Nenhuma anotação criada ainda</p>
            <p className="text-gray-500 text-sm mt-2">Crie sua primeira anotação para começar!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
          {anotacoes.map((anotacao) => (
            <Card 
              key={anotacao.id} 
              className="bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#ff5a1f] transition-colors relative overflow-hidden"
            >
              {/* Barra de cor no topo */}
              <div 
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: anotacao.cor || '#ff5a1f' }}
              />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-white flex-1">{anotacao.titulo}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(anotacao)}
                      className="text-gray-400 hover:text-[#ff5a1f]"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(anotacao.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm line-clamp-4">{anotacao.conteudo}</p>
                {anotacao.updated_at && (
                  <p className="text-gray-500 text-xs mt-3">
                    Atualizado em {new Date(anotacao.updated_at).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
