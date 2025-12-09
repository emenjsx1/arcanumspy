"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckSquare, Plus, Trash2, Loader2, List, MoreVertical, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Tarefa {
  id: string
  titulo: string
  descricao?: string
  prioridade: string
  prazo?: string
  concluida: boolean
  lista_id?: string
  created_at: string
}

interface Lista {
  id: string
  nome: string
  cor: string
  ordem: number
}

const CORES_PREDEFINIDAS = [
  '#3b82f6', // Azul
  '#10b981', // Verde
  '#f59e0b', // Amarelo
  '#ef4444', // Vermelho
  '#8b5cf6', // Roxo
  '#ec4899', // Rosa
  '#06b6d4', // Ciano
  '#f97316', // Laranja
]

export default function TarefaPage() {
  const { toast } = useToast()
  const [listas, setListas] = useState<Lista[]>([])
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [loading, setLoading] = useState(true)
  const [openListaDialog, setOpenListaDialog] = useState(false)
  const [openTarefaDialog, setOpenTarefaDialog] = useState(false)
  const [listaSelecionada, setListaSelecionada] = useState<string | null>(null)
  const [editingLista, setEditingLista] = useState<Lista | null>(null)
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    prioridade: "media",
    prazo: "",
    lista_id: ""
  })
  const [listaFormData, setListaFormData] = useState({
    nome: "",
    cor: CORES_PREDEFINIDAS[0]
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    await Promise.all([loadListas(), loadTarefas()])
  }

  const loadListas = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.warn('[loadListas] Sem sessão')
        return
      }

      const response = await fetch('/api/produtividade/tarefas/listas', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[loadListas] Dados recebidos:', data)
        if (data.success) {
          const listasRecebidas = data.listas || []
          console.log('[loadListas] Listas recebidas:', listasRecebidas.length)
          setListas(listasRecebidas)
          // Se não houver listas, criar uma padrão
          if (listasRecebidas.length === 0) {
            await criarListaPadrao()
          }
        } else {
          console.error('[loadListas] Resposta sem sucesso:', data)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('[loadListas] Erro na resposta:', response.status, errorData)
      }
    } catch (error) {
      console.error('[loadListas] Erro ao carregar listas:', error)
    }
  }

  const criarListaPadrao = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/produtividade/tarefas/listas', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          nome: 'Minhas Tarefas',
          cor: CORES_PREDEFINIDAS[0]
        })
      })

      if (response.ok) {
        await loadListas()
      }
    } catch (error) {
      console.error('Erro ao criar lista padrão:', error)
    }
  }

  const loadTarefas = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return

      const response = await fetch('/api/produtividade/tarefas', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTarefas(data.tarefas || [])
        }
      }
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLista = async () => {
    if (!listaFormData.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome da lista é obrigatório",
        variant: "destructive"
      })
      return
    }

    try {
      setSubmitting(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const url = editingLista 
        ? `/api/produtividade/tarefas/listas`
        : '/api/produtividade/tarefas/listas'
      
      const method = editingLista ? 'PATCH' : 'POST'
      const body = editingLista 
        ? { id: editingLista.id, ...listaFormData }
        : listaFormData

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Resposta da API:', result)
        
        if (result.success) {
          // Se for edição, atualizar a lista no estado
          if (editingLista && result.lista) {
            setListas(prevListas => 
              prevListas.map(lista => 
                lista.id === editingLista.id ? result.lista : lista
              )
            )
          } 
          // Se for criação, adicionar a nova lista ao estado
          else if (result.lista && !editingLista) {
            console.log('[handleCreateLista] Adicionando lista ao estado:', result.lista)
            setListas(prevListas => {
              const novasListas = [...prevListas, result.lista]
              console.log('[handleCreateLista] Estado atualizado, total de listas:', novasListas.length)
              return novasListas
            })
          }
          // Se não tiver a lista na resposta, recarregar todas
          else {
            console.log('[handleCreateLista] Lista não encontrada na resposta, recarregando...')
            // Aguardar um pouco antes de recarregar para garantir que o banco foi atualizado
            setTimeout(async () => {
              await loadListas()
            }, 500)
          }
          
          toast({
            title: "Sucesso",
            description: editingLista ? "Lista atualizada" : "Lista criada com sucesso",
          })
          setOpenListaDialog(false)
          setEditingLista(null)
          setListaFormData({ nome: "", cor: CORES_PREDEFINIDAS[0] })
          
          // NÃO recarregar listas se já adicionamos ao estado
          // Isso evita que o estado seja sobrescrito com dados vazios
        } else {
          // Se não tiver sucesso, recarregar listas
          console.warn('[handleCreateLista] Resposta sem sucesso:', result)
          toast({
            title: "Aviso",
            description: result.error || "Operação concluída, mas houve um problema ao atualizar a lista",
            variant: "destructive"
          })
          // Só recarregar se realmente houver erro
          if (result.error) {
            await loadListas()
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Erro na resposta:', errorData)
        toast({
          title: "Erro",
          description: errorData.error || "Não foi possível criar a lista",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar a lista",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateTarefa = async () => {
    if (!formData.titulo.trim()) {
      toast({
        title: "Erro",
        description: "Título é obrigatório",
        variant: "destructive"
      })
      return
    }

    if (!formData.lista_id) {
      toast({
        title: "Erro",
        description: "Selecione uma lista",
        variant: "destructive"
      })
      return
    }

    try {
      setSubmitting(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/produtividade/tarefas', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Tarefa criada com sucesso",
        })
        setOpenTarefaDialog(false)
        setFormData({ titulo: "", descricao: "", prioridade: "media", prazo: "", lista_id: "" })
        loadTarefas()
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar a tarefa",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (id: string, concluida: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      await fetch('/api/produtividade/tarefas', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id, concluida: !concluida })
      })

      loadTarefas()
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error)
    }
  }

  const handleDeleteTarefa = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      await fetch(`/api/produtividade/tarefas?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      toast({
        title: "Sucesso",
        description: "Tarefa excluída",
      })
      loadTarefas()
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error)
    }
  }

  const handleDeleteLista = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta lista? Todas as tarefas serão movidas para "Sem lista".')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      await fetch(`/api/produtividade/tarefas/listas?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      toast({
        title: "Sucesso",
        description: "Lista excluída",
      })
      loadData()
    } catch (error) {
      console.error('Erro ao excluir lista:', error)
    }
  }

  const getTarefasPorLista = (listaId: string | null) => {
    return tarefas.filter(t => 
      listaId ? t.lista_id === listaId : !t.lista_id
    )
  }

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'media': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default: return 'bg-green-500/20 text-green-400 border-green-500/30'
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#ff5a1f] rounded-lg">
              <CheckSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white break-words">Tarefas</h1>
              <p className="text-gray-400 text-lg">Organize suas tarefas em listas</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={openListaDialog} onOpenChange={(open) => {
              setOpenListaDialog(open)
              if (!open) {
                setEditingLista(null)
                setListaFormData({ nome: "", cor: CORES_PREDEFINIDAS[0] })
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-[#2a2a2a] text-white hover:bg-[#2a2a2a]">
                  <List className="mr-2 h-4 w-4" />
                  Nova Lista
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                <DialogHeader>
                  <DialogTitle>{editingLista ? 'Editar Lista' : 'Nova Lista'}</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    {editingLista ? 'Edite os dados da lista' : 'Crie uma nova lista para organizar suas tarefas'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome da Lista</Label>
                    <Input
                      value={listaFormData.nome}
                      onChange={(e) => setListaFormData({ ...listaFormData, nome: e.target.value })}
                      className="bg-[#0a0a0a] border-[#2a2a2a] text-white"
                      placeholder="Ex: Trabalho, Pessoal, etc"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cor</Label>
                    <div className="flex gap-2 flex-wrap">
                      {CORES_PREDEFINIDAS.map((cor) => (
                        <button
                          key={cor}
                          type="button"
                          onClick={() => setListaFormData({ ...listaFormData, cor })}
                          className={`w-10 h-10 rounded-lg border-2 transition-all ${
                            listaFormData.cor === cor 
                              ? 'border-white scale-110' 
                              : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: cor }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateLista}
                    disabled={submitting}
                    className="bg-[#ff5a1f] hover:bg-[#ff4d29] text-white"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      editingLista ? 'Salvar' : 'Criar Lista'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={openTarefaDialog} onOpenChange={setOpenTarefaDialog}>
              <DialogTrigger asChild>
                <Button className="bg-[#ff5a1f] hover:bg-[#ff4d29] text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Tarefa
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                <DialogHeader>
                  <DialogTitle>Nova Tarefa</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Crie uma nova tarefa em uma lista
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Lista</Label>
                    <Select 
                      value={formData.lista_id} 
                      onValueChange={(value) => setFormData({ ...formData, lista_id: value })}
                    >
                      <SelectTrigger className="bg-[#0a0a0a] border-[#2a2a2a] text-white">
                        <SelectValue placeholder="Selecione uma lista" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                        {listas.map((lista) => (
                          <SelectItem key={lista.id} value={lista.id} className="text-white">
                            {lista.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      className="bg-[#0a0a0a] border-[#2a2a2a] text-white"
                      placeholder="Digite o título da tarefa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      className="bg-[#0a0a0a] border-[#2a2a2a] text-white"
                      placeholder="Digite a descrição (opcional)"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Prioridade</Label>
                      <Select 
                        value={formData.prioridade} 
                        onValueChange={(value) => setFormData({ ...formData, prioridade: value })}
                      >
                        <SelectTrigger className="bg-[#0a0a0a] border-[#2a2a2a] text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                          <SelectItem value="baixa" className="text-white">Baixa</SelectItem>
                          <SelectItem value="media" className="text-white">Média</SelectItem>
                          <SelectItem value="alta" className="text-white">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Prazo</Label>
                      <Input
                        type="date"
                        value={formData.prazo}
                        onChange={(e) => setFormData({ ...formData, prazo: e.target.value })}
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateTarefa}
                    disabled={submitting}
                    className="bg-[#ff5a1f] hover:bg-[#ff4d29] text-white"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      "Criar Tarefa"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {loading ? (
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#ff5a1f] mx-auto" />
          </CardContent>
        </Card>
      ) : (
        <div className="w-full overflow-x-auto">
          {listas.length === 0 ? (
            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardContent className="p-12 text-center">
                <p className="text-gray-400 mb-4">Nenhuma lista criada ainda</p>
                <Button
                  onClick={() => setOpenListaDialog(true)}
                  className="bg-[#ff5a1f] hover:bg-[#ff4d29] text-white"
                >
                  Criar Primeira Lista
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="flex gap-4 pb-4 min-w-max">
              {listas.map((lista) => {
              const tarefasLista = getTarefasPorLista(lista.id)
              const tarefasPendentes = tarefasLista.filter(t => !t.concluida)
              const tarefasConcluidas = tarefasLista.filter(t => t.concluida)

              return (
                <Card 
                  key={lista.id} 
                  className="bg-[#1a1a1a] border-[#2a2a2a] min-w-[320px] flex-shrink-0"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: lista.cor }}
                        />
                        <CardTitle className="text-white text-lg">{lista.nome}</CardTitle>
                        <Badge variant="outline" className="text-xs border-[#2a2a2a] text-gray-400">
                          {tarefasPendentes.length}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                          <DropdownMenuItem
                            className="text-white"
                            onClick={() => {
                              setEditingLista(lista)
                              setListaFormData({ nome: lista.nome, cor: lista.cor })
                              setOpenListaDialog(true)
                            }}
                          >
                            <Edit2 className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-400"
                            onClick={() => handleDeleteLista(lista.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="h-[600px] overflow-y-auto pr-2">
                      {tarefasPendentes.length === 0 && tarefasConcluidas.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-sm">Nenhuma tarefa</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 text-[#ff5a1f] hover:text-[#ff4d29]"
                            onClick={() => {
                              setFormData({ ...formData, lista_id: lista.id })
                              setOpenTarefaDialog(true)
                            }}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Adicionar tarefa
                          </Button>
                        </div>
                      ) : (
                        <>
                          {tarefasPendentes.map((tarefa) => (
                            <Card
                              key={tarefa.id}
                              className="bg-[#0a0a0a] border-[#2a2a2a] hover:border-[#ff5a1f]/50 transition-colors cursor-pointer mb-2"
                              onClick={() => handleToggle(tarefa.id, tarefa.concluida)}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-start gap-2">
                                  <input
                                    type="checkbox"
                                    checked={tarefa.concluida}
                                    onChange={() => handleToggle(tarefa.id, tarefa.concluida)}
                                    className="mt-1 h-4 w-4 cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-white font-medium text-sm mb-1">
                                      {tarefa.titulo}
                                    </h4>
                                    {tarefa.descricao && (
                                      <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                                        {tarefa.descricao}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs ${getPrioridadeColor(tarefa.prioridade)}`}
                                      >
                                        {tarefa.prioridade}
                                      </Badge>
                                      {tarefa.prazo && (
                                        <span className="text-xs text-gray-500">
                                          {new Date(tarefa.prazo).toLocaleDateString('pt-BR')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-red-400 hover:text-red-500 hover:bg-red-500/10"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteTarefa(tarefa.id)
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          {tarefasConcluidas.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                              <p className="text-xs text-gray-500 mb-2">Concluídas ({tarefasConcluidas.length})</p>
                              {tarefasConcluidas.map((tarefa) => (
                                <Card
                                  key={tarefa.id}
                                  className="bg-[#0a0a0a]/50 border-[#2a2a2a] opacity-60 mb-2"
                                  onClick={() => handleToggle(tarefa.id, tarefa.concluida)}
                                >
                                  <CardContent className="p-3">
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={tarefa.concluida}
                                        onChange={() => handleToggle(tarefa.id, tarefa.concluida)}
                                        className="h-4 w-4 cursor-pointer"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <span className="text-white text-sm line-through flex-1">
                                        {tarefa.titulo}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-red-400 hover:text-red-500"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeleteTarefa(tarefa.id)
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 text-[#ff5a1f] hover:text-[#ff4d29] hover:bg-[#ff5a1f]/10"
                      onClick={() => {
                        setFormData({ ...formData, lista_id: lista.id })
                        setOpenTarefaDialog(true)
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar tarefa
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
