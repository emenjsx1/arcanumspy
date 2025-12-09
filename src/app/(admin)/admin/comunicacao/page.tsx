"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { Loader2, Mail, Send, Users, AlertCircle, CheckCircle2 } from "lucide-react"

interface User {
  id: string
  name: string
  email: string | null
  role: string
}

export default function AdminComunicacaoPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [emailType, setEmailType] = useState<'newsletter' | 'payment_overdue'>('newsletter')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [ctaText, setCtaText] = useState('')
  const [ctaUrl, setCtaUrl] = useState('')
  
  // Campos para pagamento atrasado
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('BRL')
  const [dueDate, setDueDate] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [paymentUrl, setPaymentUrl] = useState('')
  
  const [results, setResults] = useState<{
    total: number
    sent: number
    failed: number
    errors: string[]
  } | null>(null)
  
  const { toast } = useToast()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "Erro",
          description: "Não autenticado",
          variant: "destructive",
        })
        return
      }

      const response = await fetch('/api/admin/users', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar usuários')
      }

      const data = await response.json()
      setUsers(data.users || [])
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível carregar os usuários",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === users.filter(u => u.email).length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.filter(u => u.email).map(u => u.id))
    }
  }

  const handleToggleUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId))
    } else {
      setSelectedUsers([...selectedUsers, userId])
    }
  }

  const handleSend = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um usuário",
        variant: "destructive",
      })
      return
    }

    if (emailType === 'newsletter' && (!subject || !message)) {
      toast({
        title: "Erro",
        description: "Assunto e mensagem são obrigatórios",
        variant: "destructive",
      })
      return
    }

    if (emailType === 'payment_overdue' && (!amount || !dueDate)) {
      toast({
        title: "Erro",
        description: "Valor e data de vencimento são obrigatórios",
        variant: "destructive",
      })
      return
    }

    setSending(true)
    setResults(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Não autenticado')
      }

      const payload: any = {
        emailType,
        userIds: selectedUsers,
        subject,
        message,
        ctaText: ctaText || undefined,
        ctaUrl: ctaUrl || undefined,
      }

      if (emailType === 'payment_overdue') {
        payload.amount = parseFloat(amount)
        payload.currency = currency
        payload.dueDate = dueDate
        payload.invoiceNumber = invoiceNumber || undefined
        payload.paymentUrl = paymentUrl || undefined
      }

      const response = await fetch('/api/admin/comunicacao', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar emails')
      }

      setResults(data.results)
      
      toast({
        title: "Emails enviados!",
        description: `${data.results.sent} de ${data.results.total} emails enviados com sucesso`,
        variant: data.results.failed > 0 ? "default" : "default",
      })

      // Limpar formulário se tudo foi enviado com sucesso
      if (data.results.failed === 0) {
        setSubject('')
        setMessage('')
        setCtaText('')
        setCtaUrl('')
        setAmount('')
        setDueDate('')
        setInvoiceNumber('')
        setPaymentUrl('')
        setSelectedUsers([])
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar os emails",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const usersWithEmail = users.filter(u => u.email)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📧 Comunicação</h1>
        <p className="text-muted-foreground">
          Envie emails personalizados para os usuários
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurar Email</CardTitle>
              <CardDescription>Escolha o tipo de email e preencha os dados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Tipo de Email</Label>
                <Select value={emailType} onValueChange={(value: any) => setEmailType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newsletter">📢 Novidades/Newsletter</SelectItem>
                    <SelectItem value="payment_overdue">⚠️ Pagamento Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {emailType === 'newsletter' ? (
                <>
                  <div className="space-y-2">
                    <Label>Assunto *</Label>
                    <Input
                      placeholder="Ex: Novidades do ArcanumSpy"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Mensagem *</Label>
                    <Textarea
                      placeholder="Digite sua mensagem aqui..."
                      rows={8}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Texto do Botão (opcional)</Label>
                      <Input
                        placeholder="Ex: Acessar Agora"
                        value={ctaText}
                        onChange={(e) => setCtaText(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL do Botão (opcional)</Label>
                      <Input
                        placeholder="https://..."
                        value={ctaUrl}
                        onChange={(e) => setCtaUrl(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Valor em Atraso *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Moeda</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BRL">BRL (R$)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Data de Vencimento *</Label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Número da Nota Fiscal (opcional)</Label>
                      <Input
                        placeholder="Ex: #INV-123456"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL de Pagamento (opcional)</Label>
                      <Input
                        placeholder="https://..."
                        value={paymentUrl}
                        onChange={(e) => setPaymentUrl(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              <Button
                onClick={handleSend}
                disabled={sending || selectedUsers.length === 0}
                className="w-full"
                size="lg"
              >
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar para {selectedUsers.length} usuário(s)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {results && (
            <Card>
              <CardHeader>
                <CardTitle>Resultados do Envio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total:</span>
                    <Badge variant="outline">{results.total}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Enviados:</span>
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      {results.sent}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Falhas:</span>
                    <Badge variant="destructive">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      {results.failed}
                    </Badge>
                  </div>
                  {results.errors.length > 0 && (
                    <div className="mt-4 p-4 bg-destructive/10 rounded-lg">
                      <p className="text-sm font-semibold mb-2">Erros:</p>
                      <ul className="text-sm space-y-1">
                        {results.errors.map((error, index) => (
                          <li key={index} className="text-destructive">• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Seleção de Usuários */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Selecionar Usuários</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedUsers.length === usersWithEmail.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </Button>
              </div>
              <CardDescription>
                {usersWithEmail.length} usuário(s) com email válido
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Carregando usuários...
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {usersWithEmail.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted cursor-pointer"
                      onClick={() => handleToggleUser(user.id)}
                    >
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => handleToggleUser(user.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

