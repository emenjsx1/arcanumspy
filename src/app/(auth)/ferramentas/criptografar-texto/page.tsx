"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Sparkles, Unlock, Copy, Check, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Switch } from "@/components/ui/switch"
import { supabase } from "@/lib/supabase/client"
import { encryptText, decryptText, isEncrypted } from "@/lib/unicode-crypto"

export default function CriptografarTextoPage() {
  const [text, setText] = useState("")
  const [encryptedText, setEncryptedText] = useState("")
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt")
  const [usarCriptografia, setUsarCriptografia] = useState(true) // Opção de ativar/desativar
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleEncrypt = () => {
    if (!text.trim()) {
      toast({
        title: "Erro",
        description: "Digite um texto para criptografar",
        variant: "destructive"
      })
      return
    }

    try {
      // Criptografar apenas se a opção estiver ativada
      const encrypted = usarCriptografia ? encryptText(text) : text
      setEncryptedText(encrypted)
      toast({
        title: "Sucesso",
        description: usarCriptografia 
          ? "Texto criptografado com sucesso" 
          : "Texto processado (criptografia desativada)",
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criptografar texto",
        variant: "destructive"
      })
    }
  }

  // CORREÇÃO: Processar automaticamente quando o texto mudar (modo encrypt)
  const handleTextChange = (newText: string) => {
    setText(newText)
    
    // Se estiver no modo encrypt e criptografia estiver ativada, processar automaticamente
    if (mode === "encrypt" && usarCriptografia && newText.trim()) {
      try {
        const encrypted = encryptText(newText)
        setEncryptedText(encrypted)
      } catch (error) {
        // Silenciosamente falhar se houver erro (pode ser texto incompleto)
        setEncryptedText("")
      }
    } else if (mode === "encrypt" && !usarCriptografia) {
      // Se criptografia desativada, mostrar texto original
      setEncryptedText(newText)
    } else {
      // Modo decrypt ou texto vazio
      setEncryptedText("")
    }
  }

  const handleDecrypt = () => {
    if (!text.trim()) {
      toast({
        title: "Erro",
        description: "Digite um texto criptografado para descriptografar",
        variant: "destructive"
      })
      return
    }

    try {
      // Descriptografar (funciona mesmo se não estiver criptografado)
      const decrypted = decryptText(text)
      setEncryptedText(decrypted)
      toast({
        title: "Sucesso",
        description: "Texto descriptografado com sucesso",
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao descriptografar texto",
        variant: "destructive"
      })
    }
  }

  const handleSave = async () => {
    if (!text.trim() || !encryptedText.trim()) {
      toast({
        title: "Erro",
        description: "Processe o texto antes de salvar",
        variant: "destructive"
      })
      return
    }

    try {
      setSaving(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado",
          variant: "destructive"
        })
        return
      }

      const response = await fetch('/api/ferramentas/criptografar-texto', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          texto: text,
          acao: mode,
          usar_criptografia: usarCriptografia
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar')
      }

      toast({
        title: "Sucesso",
        description: "Texto salvo no histórico com sucesso",
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCopy = () => {
    if (!encryptedText) return
    
    navigator.clipboard.writeText(encryptedText)
    setCopied(true)
    toast({
      title: "Copiado",
      description: "Texto copiado para a área de transferência",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClear = () => {
    setText("")
    setEncryptedText("")
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#ff5a1f] rounded-lg">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white break-words">
              Criptografar Texto
            </h1>
            <p className="text-gray-400 text-sm md:text-base">
              Converta textos para versão &quot;cripto estilizada&quot; usando homoglyphs Unicode (conversão automática)
            </p>
          </div>
        </div>
      </div>

      {/* Opção de ativar/desativar criptografia */}
      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-white">Configurações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-white">Usar Criptografia Unicode</Label>
              <p className="text-sm text-gray-400">
                {usarCriptografia 
                  ? "Texto será convertido automaticamente para homoglyphs Unicode (caracteres similares visualmente)" 
                  : "Texto será salvo normalmente (sem criptografia)"}
              </p>
            </div>
            <Switch
              checked={usarCriptografia}
              onCheckedChange={setUsarCriptografia}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-white">Modo de Operação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={mode === "encrypt" ? "default" : "outline"}
              onClick={() => {
                setMode("encrypt")
                setText("")
                setEncryptedText("")
              }}
              className={mode === "encrypt" 
                ? "bg-[#ff5a1f] hover:bg-[#ff4d29] text-white" 
                : "border-[#2a2a2a] text-gray-400 hover:text-white"}
            >
              <Lock className="mr-2 h-4 w-4" />
              Criptografar
            </Button>
            <Button
              variant={mode === "decrypt" ? "default" : "outline"}
              onClick={() => {
                setMode("decrypt")
                setText("")
                setEncryptedText("")
              }}
              className={mode === "decrypt" 
                ? "bg-[#ff5a1f] hover:bg-[#ff4d29] text-white" 
                : "border-[#2a2a2a] text-gray-400 hover:text-white"}
            >
              <Unlock className="mr-2 h-4 w-4" />
              Descriptografar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-white">
              {mode === "encrypt" ? "Texto Original" : "Texto Criptografado"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">
                {mode === "encrypt" ? "Digite o texto" : "Digite o texto criptografado"}
              </Label>
              <Textarea
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder={mode === "encrypt" 
                  ? "Digite o texto a ser criptografado (conversão automática)..." 
                  : "Cole o texto criptografado aqui..."}
                className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500 min-h-[200px] focus:border-[#ff5a1f]"
              />
              {mode === "decrypt" && text && (
                <p className="text-xs text-gray-500">
                  {isEncrypted(text) 
                    ? "✓ Texto detectado como criptografado" 
                    : "⚠ Texto não parece estar criptografado"}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={mode === "encrypt" ? handleEncrypt : handleDecrypt}
                className="flex-1 bg-[#ff5a1f] hover:bg-[#ff4d29] text-white rounded-full"
              >
                {mode === "encrypt" ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Criptografar
                  </>
                ) : (
                  <>
                    <Unlock className="mr-2 h-4 w-4" />
                    Descriptografar
                  </>
                )}
              </Button>
              <Button 
                onClick={handleClear}
                variant="outline"
                className="border-[#2a2a2a] text-gray-400 hover:text-white"
              >
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">
                {mode === "encrypt" ? "Texto Criptografado" : "Texto Descriptografado"}
              </CardTitle>
              {encryptedText && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleCopy}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                  <Button
                    onClick={handleSave}
                    size="sm"
                    variant="ghost"
                    disabled={saving}
                    className="h-8 w-8 p-0"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 min-h-[200px]">
              {encryptedText ? (
                <p className="text-white whitespace-pre-wrap break-words font-mono text-sm">
                  {encryptedText}
                </p>
              ) : (
                <p className="text-gray-400">
                  {mode === "encrypt" 
                    ? "O texto criptografado aparecerá aqui..." 
                    : "O texto descriptografado aparecerá aqui..."}
                </p>
              )}
            </div>
            {encryptedText && (
              <div className="mt-4 flex items-center gap-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-full"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar no Histórico
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
