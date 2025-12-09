"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase/client"
import { MessageSquare, Send } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Ticket {
  id: string
  subject: string
  message: string
  status: 'open' | 'in_progress' | 'closed'
  priority: 'low' | 'medium' | 'high'
  created_at: string
  userEmail?: string
  user: {
    name: string
    email: string | null
    phone_number: string | null
    plan?: {
      name: string
    }
  }
  replies?: TicketReply[]
}

interface TicketReply {
  id: string
  message: string
  from_role: 'user' | 'admin'
  created_at: string
  user_id: string
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [replyMessage, setReplyMessage] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { toast } = useToast()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadTickets()
  }, [statusFilter])

  const loadTickets = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "Erro",
          description: "Não autenticado",
          variant: "destructive",
        })
        return
      }

      const url = statusFilter !== 'all' 
        ? `/api/admin/tickets?status=${statusFilter}`
        : '/api/admin/tickets'

      const response = await fetch(url, {
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

  const handleReply = async (ticketId: string) => {
    if (!replyMessage.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma mensagem",
        variant: "destructive",
      })
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/admin/tickets/${ticketId}/reply`, {
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
        throw new Error(error.error || 'Erro ao responder ticket')
      }

      toast({
        title: "Resposta enviada",
        description: "A resposta foi enviada com sucesso",
      })

      setReplyMessage("")
      await loadTicketWithReplies(ticketId)
      await loadTickets()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar a resposta",
        variant: "destructive",
      })
    }
  }

  const handleUpdateStatus = async (ticketId: string, status: 'open' | 'in_progress' | 'closed') => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/admin/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: replyMessage || `Status alterado para ${status === 'open' ? 'Aberto' : status === 'in_progress' ? 'Em Andamento' : 'Fechado'}`,
          status,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar status')
      }

      toast({
        title: "Status atualizado",
        description: "O status do ticket foi atualizado",
      })

      setReplyMessage("")
      await loadTickets()
      if (selectedTicket?.id === ticketId) {
        await loadTicketWithReplies(ticketId)
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o status",
        variant: "destructive",
      })
    }
  }

  const loadTicketWithReplies = async (ticketId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/admin/tickets/${ticketId}`, {
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Erro ao carregar ticket')

      const data = await response.json()
      setSelectedTicket(data.ticket)
    } catch (error) {
      console.error('Error loading ticket:', error)
    }
  }

  const openTicketDialog = async (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setIsDialogOpen(true)
    await loadTicketWithReplies(ticket.id)
  }

  const filteredTickets = tickets

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Suporte</h1>
        <p className="text-muted-foreground">
          Gerencie tickets de suporte
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">#{ticket.id}</TableCell>
                  <TableCell>{(ticket as Ticket).userEmail || ticket.user?.email || 'N/A'}</TableCell>
                  <TableCell>{ticket.subject}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        ticket.status === "closed"
                          ? "default"
                          : ticket.status === "open"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {ticket.status === "open"
                        ? "Aberto"
                        : ticket.status === "in_progress"
                        ? "Em Andamento"
                        : "Fechado"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        ticket.priority === "high"
                          ? "destructive"
                          : ticket.priority === "medium"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {ticket.priority === "high"
                        ? "Alta"
                        : ticket.priority === "medium"
                        ? "Média"
                        : "Baixa"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{ticket.subject}</DialogTitle>
                          <DialogDescription>
                            De: {(ticket as Ticket).userEmail || ticket.user?.email || 'N/A'}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium mb-2">Mensagem:</p>
                            <p className="text-sm text-muted-foreground">{ticket.message}</p>
                          </div>
                          {ticket.replies && ticket.replies.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">Respostas:</p>
                              {ticket.replies.map((response) => (
                                <div key={response.id} className="mb-2 p-3 bg-muted rounded">
                                  <p className="text-sm">{response.message}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {response.from_role === 'admin' ? "Admin" : "Usuário"} •{" "}
                                    {new Date(response.created_at).toLocaleString()}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Responder:</label>
                            <Textarea placeholder="Digite sua resposta..." rows={4} />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline">Fechar Ticket</Button>
                          <Button>Enviar Resposta</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

