"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { 
  ArrowLeft, Plus, Loader2, Trash2, Edit2, Search, 
  ChevronUp, ChevronDown, StickyNote, ExternalLink, X
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface Item {
  id: string
  tipo: string
  item_id?: string
  titulo: string
  url?: string
  descricao?: string
  notas?: string
  imagem_url?: string
  ordem: number
  created_at: string
}

interface Pasta {
  id: string
  nome: string
  descricao?: string
}

export default function PastaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const pastaId = params.pastaId as string
  const { toast } = useToast()
  
  const [pasta, setPasta] = useState<Pasta | null>(null)
  const [itens, setItens] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showSearchDialog, setShowSearchDialog] = useState(false)
  const [showNotesDialog, setShowNotesDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  
  const [newItem, setNewItem] = useState({
    tipo: 'manual',
    titulo: '',
    url: '',
    descricao: '',
    notas: ''
  })

  useEffect(() => {
    if (pastaId) {
      loadPasta()
      loadItens()
    }
  }, [pastaId])

  const loadPasta = async () => {
    try {
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
          const foundPasta = data.pastas.find((p: Pasta) => p.id === pastaId)
          if (foundPasta) {
            setPasta(foundPasta)
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar pasta:', error)
    }
  }

  const loadItens = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/espionagem/organizador-biblioteca/${pastaId}/itens`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setItens(data.itens || [])
        }
      }
    } catch (error) {
      console.error('Erro ao carregar itens:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar itens",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async () => {
    if (!newItem.titulo.trim()) {
      toast({
        title: "Erro",
        description: "Digite um título",
        variant: "destructive"
      })
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/espionagem/organizador-biblioteca/${pastaId}/itens`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(newItem)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Sucesso",
          description: "Item adicionado com sucesso",
        })
        setShowAddDialog(false)
        setNewItem({ tipo: 'manual', titulo: '', url: '', descricao: '', notas: '' })
        loadItens()
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao adicionar item",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar item",
        variant: "destructive"
      })
    }
  }

  const handleSearchOffers = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Erro",
        description: "Digite um termo para pesquisar",
        variant: "destructive"
      })
      return
    }

    try {
      setSearching(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/espionagem/ofertas-escaladas?busca=${encodeURIComponent(searchQuery)}&limit=20`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        // A API pode retornar 'ofertas' ou 'offers'
        setSearchResults(data.ofertas || data.offers || [])
      } else {
        const errorData = await response.json()
        toast({
          title: "Erro",
          description: errorData.error || "Erro ao pesquisar ofertas",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao pesquisar:', error)
      toast({
        title: "Erro",
        description: "Erro ao pesquisar ofertas",
        variant: "destructive"
      })
    } finally {
      setSearching(false)
    }
  }

  const handleAddOfferFromSearch = async (oferta: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/espionagem/organizador-biblioteca/${pastaId}/itens`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          tipo: 'oferta',
          item_id: oferta.id,
          titulo: oferta.title,
          url: oferta.main_url,
          descricao: oferta.short_description,
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Sucesso",
          description: "Oferta adicionada à pasta",
        })
        setShowSearchDialog(false)
        setSearchQuery("")
        setSearchResults([])
        loadItens()
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao adicionar oferta",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar oferta",
        variant: "destructive"
      })
    }
  }

  const handleUpdateNotes = async (itemId: string, notas: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/espionagem/organizador-biblioteca/itens/${itemId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ notas })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Sucesso",
          description: "Notas atualizadas",
        })
        setShowNotesDialog(false)
        setSelectedItem(null)
        loadItens()
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao atualizar notas",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar notas",
        variant: "destructive"
      })
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja deletar este item?')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/espionagem/organizador-biblioteca/itens/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Sucesso",
          description: "Item deletado",
        })
        loadItens()
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao deletar item",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao deletar item",
        variant: "destructive"
      })
    }
  }

  const handleMoveItem = async (itemId: string, direction: 'up' | 'down') => {
    const itemIndex = itens.findIndex(i => i.id === itemId)
    if (itemIndex === -1) return

    const newIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1
    if (newIndex < 0 || newIndex >= itens.length) return

    const item = itens[itemIndex]
    const targetItem = itens[newIndex]

    // Trocar ordens
    const newOrdem = targetItem.ordem
    const targetOrdem = item.ordem

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Atualizar ambos os itens
      await Promise.all([
        fetch(`/api/espionagem/organizador-biblioteca/itens/${itemId}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ ordem: newOrdem })
        }),
        fetch(`/api/espionagem/organizador-biblioteca/itens/${targetItem.id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ ordem: targetOrdem })
        })
      ])

      loadItens()
    } catch (error) {
      console.error('Erro ao mover item:', error)
      toast({
        title: "Erro",
        description: "Erro ao reorganizar item",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/espionagem/organizador-biblioteca')}
          className="text-white hover:text-[#ff5a1f]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">{pasta?.nome || 'Carregando...'}</h1>
          {pasta?.descricao && (
            <p className="text-gray-400 text-sm">{pasta.descricao}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => setShowSearchDialog(true)}
          className="bg-[#ff5a1f] hover:bg-[#ff4d29] text-white rounded-full"
        >
          <Search className="mr-2 h-4 w-4" />
          Pesquisar Ofertas
        </Button>
        <Button
          onClick={() => setShowAddDialog(true)}
          variant="outline"
          className="rounded-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Manualmente
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
        </div>
      ) : itens.length === 0 ? (
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardContent className="py-12 text-center">
            <p className="text-gray-400 mb-4">Nenhum item nesta pasta</p>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-[#ff5a1f] hover:bg-[#ff4d29] text-white rounded-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Primeiro Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {itens.map((item, index) => (
            <Card key={item.id} className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveItem(item.id, 'up')}
                      disabled={index === 0}
                      className="h-6 w-6"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveItem(item.id, 'down')}
                      disabled={index === itens.length - 1}
                      className="h-6 w-6"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold mb-1">{item.titulo}</h3>
                        {item.descricao && (
                          <p className="text-gray-400 text-sm mb-2">{item.descricao}</p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline">{item.tipo}</Badge>
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#ff5a1f] hover:underline text-sm flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Ver URL
                            </a>
                          )}
                        </div>
                        {item.notas && (
                          <div className="mt-2 p-2 bg-[#0a0a0a] rounded border border-[#2a2a2a]">
                            <p className="text-gray-300 text-sm">{item.notas}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedItem(item)
                            setShowNotesDialog(true)
                          }}
                          className="h-8 w-8"
                        >
                          <StickyNote className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteItem(item.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog: Adicionar Item Manualmente */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="rounded-3xl max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Item Manualmente</DialogTitle>
            <DialogDescription>
              Adicione uma oferta ou criativo que não está na plataforma
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={newItem.titulo}
                onChange={(e) => setNewItem({ ...newItem, titulo: e.target.value })}
                placeholder="Nome da oferta ou criativo"
                className="rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={newItem.url}
                onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                placeholder="https://..."
                className="rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={newItem.descricao}
                onChange={(e) => setNewItem({ ...newItem, descricao: e.target.value })}
                placeholder="Descreva o item..."
                className="rounded-2xl min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Notas Pessoais</Label>
              <Textarea
                value={newItem.notas}
                onChange={(e) => setNewItem({ ...newItem, notas: e.target.value })}
                placeholder="Suas notas sobre este item..."
                className="rounded-2xl min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              className="rounded-full"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddItem}
              className="bg-[#ff5a1f] hover:bg-[#ff4d29] text-white rounded-full"
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Pesquisar Ofertas */}
      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className="rounded-3xl max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pesquisar Ofertas</DialogTitle>
            <DialogDescription>
              Pesquise ofertas na plataforma para adicionar à pasta
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchOffers()}
                placeholder="Digite para pesquisar..."
                className="rounded-2xl flex-1"
              />
              <Button
                onClick={handleSearchOffers}
                disabled={searching}
                className="bg-[#ff5a1f] hover:bg-[#ff4d29] text-white rounded-full"
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {searchResults.map((oferta) => (
                  <Card key={oferta.id} className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold mb-1">{oferta.title}</h3>
                          {oferta.short_description && (
                            <p className="text-gray-400 text-sm mb-2">{oferta.short_description}</p>
                          )}
                          {oferta.main_url && (
                            <a
                              href={oferta.main_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#ff5a1f] hover:underline text-sm flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Ver oferta
                            </a>
                          )}
                        </div>
                        <Button
                          onClick={() => handleAddOfferFromSearch(oferta)}
                          className="bg-[#ff5a1f] hover:bg-[#ff4d29] text-white rounded-full"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSearchDialog(false)
                setSearchQuery("")
                setSearchResults([])
              }}
              className="rounded-full"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Notas */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Notas Pessoais</DialogTitle>
            <DialogDescription>
              Adicione ou edite suas notas sobre este item
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={selectedItem?.notas || ''}
              onChange={(e) => {
                if (selectedItem) {
                  setSelectedItem({ ...selectedItem, notas: e.target.value })
                }
              }}
              placeholder="Suas notas sobre este item..."
              className="rounded-2xl min-h-[150px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNotesDialog(false)
                setSelectedItem(null)
              }}
              className="rounded-full"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (selectedItem) {
                  handleUpdateNotes(selectedItem.id, selectedItem.notas || '')
                }
              }}
              className="bg-[#ff5a1f] hover:bg-[#ff4d29] text-white rounded-full"
            >
              Salvar Notas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

