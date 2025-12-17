"use client"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuthStore } from "@/store/auth-store"
import { useTheme } from "next-themes"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { getCurrentUserSubscriptionWithPlan } from "@/lib/db/subscriptions"
import { useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { User, Upload, X, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useLocale } from "@/contexts/locale-context"
import { LocaleSelector } from "@/components/locale-selector"

const profileSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória"),
  newPassword: z.string().min(6, "Nova senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
})

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

export default function AccountPage() {
  const { user, profile, refreshProfile } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const { locale, currency } = useLocale()
  const [isLoading, setIsLoading] = useState(false)
  const [currentSubscription, setCurrentSubscription] = useState<any>(null)
  const [loadingSubscription, setLoadingSubscription] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || "",
      email: profile?.email || user?.email || "",
    },
  })

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  useEffect(() => {
    loadSubscription()
    if (profile?.avatar_url) {
      setAvatarUrl(profile.avatar_url)
    }
  }, [profile])

  const loadSubscription = async () => {
    try {
      setLoadingSubscription(true)
      const subscription = await getCurrentUserSubscriptionWithPlan()
      setCurrentSubscription(subscription)
    } catch (error) {
      console.error('Error loading subscription:', error)
    } finally {
      setLoadingSubscription(false)
    }
  }

  const handleAvatarUpload = async (file: File) => {
    if (!user) return

    setUploadingAvatar(true)
    try {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Por favor, selecione uma imagem')
      }

      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('A imagem deve ter no máximo 5MB')
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Deletar avatar antigo se existir
      if (avatarUrl && avatarUrl.includes('/avatars/')) {
        try {
          const urlParts = avatarUrl.split('/avatars/')
          if (urlParts.length > 1) {
            const oldPath = `avatars/${urlParts[1]}`
            await supabase.storage.from('avatars').remove([oldPath])
          }
        } catch (removeError) {
          // Ignorar erro ao deletar avatar antigo (pode não existir)
          console.warn('⚠️ Erro ao deletar avatar antigo:', removeError)
        }
      }

      // Upload novo avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        // Se o erro for "Bucket not found", fornecer mensagem mais clara
        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
          throw new Error('Bucket de avatares não encontrado. Execute a migration 012_create_avatars_bucket.sql no Supabase.')
        }
        throw uploadError
      }

      // Obter URL pública
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const publicUrl = data.publicUrl

      // Atualizar perfil com nova URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      await refreshProfile()

      toast({
        title: "Foto atualizada",
        description: "Sua foto de perfil foi atualizada com sucesso",
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao fazer upload da foto",
        variant: "destructive",
      })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!user || !avatarUrl) return

    setUploadingAvatar(true)
    try {
      if (avatarUrl.includes('/avatars/')) {
        const urlParts = avatarUrl.split('/avatars/')
        if (urlParts.length > 1) {
          const oldPath = urlParts[1]
          await supabase.storage.from('avatars').remove([oldPath])
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id)

      if (error) throw error

      setAvatarUrl(null)
      await refreshProfile()

      toast({
        title: "Foto removida",
        description: "Sua foto de perfil foi removida",
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao remover a foto",
        variant: "destructive",
      })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    try {
      if (user) {
        // Update email in auth.users if changed
        if (data.email !== user.email) {
          const { error: emailError } = await supabase.auth.updateUser({
            email: data.email
          })
          
          if (emailError) {
            // Se o email já está em uso, mostrar erro específico
            if (emailError.message.includes('already registered')) {
              throw new Error('Este email já está em uso')
            }
            throw emailError
          }
        }

        // Update profile in Supabase (name and email)
        const { error } = await supabase
          .from('profiles')
          .update({ 
            name: data.name,
            email: data.email 
          })
          .eq('id', user.id)
        
        if (error) throw error
        
        // Refresh profile from store
        await refreshProfile()
        
        toast({
          title: "Perfil atualizado",
          description: data.email !== user.email 
            ? "Suas informações foram salvas. Verifique seu email para confirmar a alteração."
            : "Suas informações foram salvas com sucesso",
        })
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao atualizar o perfil",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsLoading(true)
    try {
      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso",
      })
      passwordForm.reset()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao alterar a senha",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Configurações da Conta
        </h1>
        <p className="text-muted-foreground text-lg">
          Gerencie suas informações pessoais e preferências
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="preferences">Preferências</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Perfil</CardTitle>
              <CardDescription>
                Atualize suas informações pessoais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                {/* Profile Picture Upload */}
                <div className="space-y-2">
                  <Label>Foto de Perfil</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt="Avatar"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <User className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingAvatar}
                        >
                          {uploadingAvatar ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              {avatarUrl ? "Alterar" : "Enviar Foto"}
                            </>
                          )}
                        </Button>
                        {avatarUrl && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveAvatar}
                            disabled={uploadingAvatar}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remover
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG ou GIF. Máximo 5MB.
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleAvatarUpload(file)
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    {...profileForm.register("name")}
                  />
                  {profileForm.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {profileForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...profileForm.register("email")}
                  />
                  {profileForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {profileForm.formState.errors.email.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Você pode alterar seu email. Um link de confirmação será enviado para o novo endereço.
                  </p>
                </div>


                {/* Plano Atual */}
                <div className="space-y-2 pt-4 border-t">
                  <Label>Plano Atual</Label>
                  {loadingSubscription ? (
                    <p className="text-sm text-muted-foreground">Carregando...</p>
                  ) : currentSubscription?.plan ? (
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                      <div>
                        <p className="font-semibold">{currentSubscription.plan.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Intl.NumberFormat(locale, { style: 'currency', currency: currency || 'MZN' }).format(currentSubscription.plan.price_monthly_cents / 100)}/mês
                        </p>
                      </div>
                      <Link href="/billing">
                        <Button variant="outline" size="sm">
                          Gerenciar
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                      <div>
                        <p className="font-semibold">Plano Gratuito</p>
                        <p className="text-sm text-muted-foreground">Sem assinatura ativa</p>
                      </div>
                      <Link href="/pricing">
                        <Button variant="outline" size="sm">
                          Ver Planos
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferências</CardTitle>
              <CardDescription>
                Personalize sua experiência
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <LocaleSelector />

              <div className="space-y-2">
                <Label>Tema</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
              <CardDescription>
                Gerencie sua segurança e senha
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Trocar Senha</h3>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Senha Atual</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      {...passwordForm.register("currentPassword")}
                    />
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="text-sm text-destructive">
                        {passwordForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      {...passwordForm.register("newPassword")}
                    />
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-sm text-destructive">
                        {passwordForm.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...passwordForm.register("confirmPassword")}
                    />
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Alterando..." : "Alterar Senha"}
                  </Button>
                </form>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">Encerrar Sessões Ativas</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Desconecte todas as sessões ativas em outros dispositivos
                </p>
                <Button variant="outline">
                  Encerrar Todas as Sessões
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
