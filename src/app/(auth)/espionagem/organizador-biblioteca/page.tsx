"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Library, FolderTree, Plus, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Pasta {
  id: string
  nome: string
  descricao: string | null
  created_at: string
  itens?: Array<{ count: number }>
}

export default function OrganizadorBibliotecaPage() {
  const [pastas, setPastas] = useState<Pasta[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newPasta, setNewPasta] = useState({ nome: "", descricao: "" })
  const [creating, setCreating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadPastas()
  }, [])

  const loadPastas = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return

      const response = await fetch('/api/espionagem/organizador-biblioteca', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPastas(data.pastas || [])
        }
      }
    } catch (error) {
      console.error('Erro ao carregar pastas:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar pastas",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePasta = async () => {
    if (!newPasta.nome.trim()) {
      toast({
        title: "Erro",
        description: "Digite um nome para a pasta",
        variant: "destructive"
      })
      return
    }

    try {
      setCreating(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return

      const response = await fetch('/api/espionagem/organizador-biblioteca', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(newPasta)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Sucesso",
          description: "Pasta criada com sucesso",
        })
        setShowCreateDialog(false)
        setNewPasta({ nome: "", descricao: "" })
        loadPastas()
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao criar pasta",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar pasta",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }

  const getItemsCount = (pasta: Pasta): number => {
    // A estrutura pode vir como array ou objeto
    if (pasta.itens) {
      if (Array.isArray(pasta.itens) && pasta.itens.length > 0) {
        const firstItem = pasta.itens[0] as any
        return firstItem.count || 0
      }
      // Se for objeto direto com count
      if (typeof pasta.itens === 'object' && 'count' in pasta.itens) {
        return (pasta.itens as any).count || 0
      }
    }
    return 0
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#ff5a1f] rounded-lg">
            <Library className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white break-words">Organizador de Biblioteca</h1>
            <p className="text-gray-400 text-sm">Organize suas ofertas e criativos</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-[#ff5a1f] hover:bg-[#ff4d29] text-white rounded-full">
              <Plus className="mr-2 h-4 w-4" />
              Nova Pasta
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Pasta</DialogTitle>
              <DialogDescription>
                Organize suas ofertas e criativos em pastas personalizadas
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Pasta</Label>
                <Input
                  value={newPasta.nome}
                  onChange={(e) => setNewPasta({ ...newPasta, nome: e.target.value })}
                  placeholder="Ex: Ofertas de Emagrecimento"
                  className="rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Textarea
                  value={newPasta.descricao}
                  onChange={(e) => setNewPasta({ ...newPasta, descricao: e.target.value })}
                  placeholder="Descreva o conteúdo desta pasta..."
                  className="rounded-2xl min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="rounded-full"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreatePasta}
                disabled={creating}
                className="bg-[#ff5a1f] hover:bg-[#ff4d29] text-white rounded-full"
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Pasta"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : pastas.length === 0 ? (
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardContent className="py-12 text-center">
            <FolderTree className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">Nenhuma pasta criada ainda</p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-[#ff5a1f] hover:bg-[#ff4d29] text-white rounded-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Pasta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
          {pastas.map((pasta) => (
            <Card
              key={pasta.id}
              onClick={() => window.location.href = `/espionagem/organizador-biblioteca/${pasta.id}`}
              className="bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#ff5a1f] transition-all duration-300 hover:shadow-xl hover:shadow-[#ff5a1f]/10 hover:-translate-y-1 rounded-3xl cursor-pointer group"
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#ff5a1f]/20 flex items-center justify-center group-hover:bg-[#ff5a1f]/30 transition-colors">
                    <FolderTree className="h-6 w-6 text-[#ff5a1f]" />
                  </div>
                  <CardTitle className="text-white text-base flex-1 truncate">{pasta.nome}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {pasta.descricao && (
                  <CardDescription className="text-gray-400 text-xs mb-2 line-clamp-2">
                    {pasta.descricao}
                  </CardDescription>
                )}
                <CardDescription className="text-gray-400 text-sm">
                  {getItemsCount(pasta)} {getItemsCount(pasta) === 1 ? 'item' : 'itens'}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

