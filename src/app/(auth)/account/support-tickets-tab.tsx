"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MessageSquare, Plus, Loader2, Send } from "lucide-react"
import { useAuthStore } from "@/store/auth-store"
import { useToast } from "@/components/ui/use-toast"

export function SupportTicketsTab() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null)
  const [replyMessage, setReplyMessage] = useState("")
  const [sendingReply, setSendingReply] = useState(false)
  const [newTicketSubject, setNewTicketSubject] = useState("")
  const [newTicketMessage, setNewTicketMessage] = useState("")
  const [creatingTicket, setCreatingTicket] = useState(false)
  const [isNewTicketDialogOpen, setIsNewTicketDialogOpen] = useState(false)

  const loadTickets = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tickets', {
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Erro ao carregar tickets')

      const data = await response.json()
      setTickets(data.tickets || [])
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível carregar os tickets",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadTickets()
    }
  }, [user])

  const handleCreateTicket = async () => {
    if (!newTicketSubject.trim() || !newTicketMessage.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      })
      return
    }

    try {
      setCreatingTicket(true)
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subject: newTicketSubject,
          message: newTicketMessage,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar ticket')
      }

      toast({
        title: "Sucesso",
        description: "Ticket criado com sucesso! Nossa equipe entrará em contato em breve.",
      })

      setNewTicketSubject("")
      setNewTicketMessage("")
      setIsNewTicketDialogOpen(false)
      loadTickets()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o ticket",
        variant: "destructive",
      })
    } finally {
      setCreatingTicket(false)
    }
  }

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma mensagem",
        variant: "destructive",
      })
      return
    }

    try {
      setSendingReply(true)
      const response = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: replyMessage,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao enviar resposta')
      }

      toast({
        title: "Sucesso",
        description: "Resposta enviada com sucesso!",
      })

      setReplyMessage("")
      loadTickets()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar a resposta",
        variant: "destructive",
      })
    } finally {
      setSendingReply(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      open: { variant: 'default' as const, label: 'Aberto' },
      in_progress: { variant: 'secondary' as const, label: 'Em Andamento' },
      closed: { variant: 'outline' as const, label: 'Fechado' },
    }
    const config = variants[status] || { variant: 'outline' as const, label: status }
    return (
      <Badge variant={config.variant}>{config.label}</Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, any> = {
      low: { variant: 'outline' as const, label: 'Baixa' },
      medium: { variant: 'secondary' as const, label: 'Média' },
      high: { variant: 'destructive' as const, label: 'Alta' },
    }
    const config = variants[priority] || { variant: 'outline' as const, label: priority }
    return (
      <Badge variant={config.variant}>{config.label}</Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Suporte</CardTitle>
            <CardDescription>
              Abra um ticket de suporte ou visualize seus tickets existentes
            </CardDescription>
          </div>
          <Dialog open={isNewTicketDialogOpen} onOpenChange={setIsNewTicketDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Ticket
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Ticket</DialogTitle>
                <DialogDescription>
                  Descreva seu problema ou dúvida. Nossa equipe entrará em contato em breve.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Assunto</Label>
                  <Input
                    id="subject"
                    placeholder="Ex: Problema com pagamento"
                    value={newTicketSubject}
                    onChange={(e) => setNewTicketSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem</Label>
                  <Textarea
                    id="message"
                    placeholder="Descreva seu problema ou dúvida em detalhes..."
                    value={newTicketMessage}
                    onChange={(e) => setNewTicketMessage(e.target.value)}
                    rows={6}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewTicketDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateTicket} disabled={creatingTicket}>
                  {creatingTicket ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Criar Ticket
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Você ainda não tem tickets de suporte.</p>
            <p className="text-sm mt-2">Clique em "Novo Ticket" para criar um.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Card key={ticket.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{ticket.subject}</h3>
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{ticket.message}</p>
                      <p className="text-xs text-muted-foreground">
                        Criado em: {new Date(ticket.created_at).toLocaleString('pt-BR')}
                      </p>
                      {ticket.replies && ticket.replies.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-sm font-semibold">Respostas:</p>
                          {ticket.replies.map((reply: any) => (
                            <div
                              key={reply.id}
                              className={`p-3 rounded-lg ${
                                reply.from_role === 'admin'
                                  ? 'bg-primary/10 border border-primary/20'
                                  : 'bg-muted'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold">
                                  {reply.from_role === 'admin' ? 'Equipe de Suporte' : 'Você'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(reply.created_at).toLocaleString('pt-BR')}
                                </span>
                              </div>
                              <p className="text-sm">{reply.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {ticket.status !== 'closed' && (
                      <Dialog
                        open={isDialogOpen && selectedTicket?.id === ticket.id}
                        onOpenChange={(open) => {
                          setIsDialogOpen(open)
                          if (open) {
                            setSelectedTicket(ticket)
                          } else {
                            setSelectedTicket(null)
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTicket(ticket)
                              setIsDialogOpen(true)
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Responder
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Responder Ticket</DialogTitle>
                            <DialogDescription>
                              Adicione uma resposta ao ticket: {ticket.subject}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="reply">Sua Resposta</Label>
                              <Textarea
                                id="reply"
                                placeholder="Digite sua resposta..."
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                rows={6}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsDialogOpen(false)
                                setSelectedTicket(null)
                                setReplyMessage("")
                              }}
                            >
                              Cancelar
                            </Button>
                            <Button onClick={handleReply} disabled={sendingReply}>
                              {sendingReply ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Enviando...
                                </>
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-2" />
                                  Enviar
                                </>
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

