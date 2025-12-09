"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  Search, MessageSquare, Heart, ThumbsUp, Eye, 
  Pin, Lock, Plus, Send, Reply, MoreVertical,
  ArrowLeft, Clock, User, Image as ImageIcon, X
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Post {
  id: string
  title: string
  content: string
  category: string
  image_url?: string | null
  is_pinned: boolean
  is_locked: boolean
  views_count: number
  comments_count: number
  reactions_count: number
  created_at: string
  profiles: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  user_reaction?: string
}

interface Comment {
  id: string
  content: string
  reactions_count: number
  created_at: string
  profiles: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  replies?: Comment[]
}

export default function CommunityPostsPage() {
  const params = useParams()
  const router = useRouter()
  const communityId = params.id as string
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("todos")
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newPost, setNewPost] = useState({ title: "", content: "", category: "geral" })
  const [newComment, setNewComment] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (communityId) {
      loadPosts()
    }
  }, [communityId, selectedCategory])

  const loadPosts = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return

      const params = new URLSearchParams()
      params.append('community_id', communityId)
      if (selectedCategory !== 'todos') {
        params.append('category', selectedCategory)
      }

      const response = await fetch(`/api/community/posts?${params.toString()}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPosts(data.posts || [])
        }
      }
    } catch (error) {
      console.error('Erro ao carregar posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadComments = async (postId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/community/posts/${postId}/comments`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setComments(data.comments || [])
        }
      }
    } catch (error) {
      console.error('Erro ao carregar comentários:', error)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erro",
          description: "Por favor, selecione uma imagem",
          variant: "destructive"
        })
        return
      }

      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "A imagem deve ter no máximo 5MB",
          variant: "destructive"
        })
        return
      }

      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCreatePost = async () => {
    if (!newPost.content.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma mensagem",
        variant: "destructive"
      })
      return
    }

    try {
      setUploadingImage(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      let imageUrl: string | null = null

      // Upload da imagem se houver
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop()
        const fileName = `${session.user.id}/${communityId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('community-images')
          .upload(fileName, selectedImage, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          // Tentar criar o bucket se não existir
          if (uploadError.message?.includes('Bucket not found')) {
            toast({
              title: "Aviso",
              description: "Bucket de imagens não encontrado. A imagem não será salva.",
              variant: "default"
            })
          } else {
            throw uploadError
          }
        } else {
          const { data } = supabase.storage
            .from('community-images')
            .getPublicUrl(fileName)
          imageUrl = data.publicUrl
        }
      }

      const response = await fetch('/api/community/posts', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          community_id: communityId,
          title: newPost.title || "Sem título",
          content: newPost.content,
          category: newPost.category,
          image_url: imageUrl
        })
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Mensagem enviada com sucesso",
        })
        setShowCreateDialog(false)
        setNewPost({ title: "", content: "", category: "geral" })
        setSelectedImage(null)
        setImagePreview(null)
        loadPosts()
      } else {
        const data = await response.json()
        toast({
          title: "Erro",
          description: data.error || "Erro ao enviar mensagem",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar mensagem",
        variant: "destructive"
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleCreateComment = async (postId: string) => {
    if (!newComment.trim()) {
      toast({
        title: "Erro",
        description: "Digite um comentário",
        variant: "destructive"
      })
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ content: newComment })
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Comentário adicionado",
        })
        setNewComment("")
        loadComments(postId)
        loadPosts() // Atualizar contador de comentários
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar comentário",
        variant: "destructive"
      })
    }
  }

  const handleReaction = async (postId: string, reactionType: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/community/reactions', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          post_id: postId,
          reaction_type: reactionType
        })
      })

      if (response.ok) {
        loadPosts()
      }
    } catch (error) {
      console.error('Erro ao reagir:', error)
    }
  }

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const categoryLabels: Record<string, string> = {
    geral: "Geral",
    dicas: "Dicas",
    duvidas: "Dúvidas",
    sucessos: "Sucessos",
    anuncios: "Anúncios"
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
        <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.back()}
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Voltar</span>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold truncate">Posts da Comunidade</h1>
            <p className="text-muted-foreground text-xs md:text-sm">Compartilhe e discuta com a comunidade</p>
          </div>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="w-full md:w-auto">
              <Plus className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Nova Mensagem</span>
              <span className="md:hidden">Nova</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl w-[95vw] md:w-full max-h-[90vh] overflow-y-auto rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">Enviar Mensagem</DialogTitle>
              <DialogDescription className="text-sm">
                Compartilhe suas ideias, dúvidas ou sucessos com a comunidade
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Mensagem</Label>
                <Textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="Escreva sua mensagem aqui..."
                  className="min-h-[100px] md:min-h-[120px] text-sm rounded-2xl resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Imagem (opcional)</Label>
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="flex-1 text-sm rounded-2xl"
                  />
                  {imagePreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedImage(null)
                        setImagePreview(null)
                      }}
                      className="flex-shrink-0 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {imagePreview && (
                  <div className="relative mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-32 md:h-48 object-cover rounded-2xl border border-border/50"
                    />
                  </div>
                )}
              </div>
              <div className="flex flex-col md:flex-row gap-2">
                <Button 
                  onClick={handleCreatePost} 
                  className="flex-1"
                  disabled={uploadingImage}
                  size="sm"
                >
                  {uploadingImage ? "Enviando..." : "Enviar Mensagem"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Busca e Filtro */}
      <div className="flex flex-col md:flex-row gap-2 md:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar posts..."
            className="pl-9 md:pl-10 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-[180px] text-sm">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as Categorias</SelectItem>
            <SelectItem value="geral">Geral</SelectItem>
            <SelectItem value="dicas">Dicas</SelectItem>
            <SelectItem value="duvidas">Dúvidas</SelectItem>
            <SelectItem value="sucessos">Sucessos</SelectItem>
            <SelectItem value="anuncios">Anúncios</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <Card>
          <CardContent className="pt-6 md:pt-8 text-center">
            <p className="text-muted-foreground text-sm md:text-base">
              {searchQuery ? 'Nenhum post encontrado' : 'Nenhum post ainda. Seja o primeiro a postar!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 md:space-y-6">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="group relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-background via-background to-muted/20 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl"
            >
              {/* Círculo decorativo */}
              <div className="absolute -top-10 -right-10 w-24 h-24 md:w-32 md:h-32 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors" />
              
              <div className="relative p-4 md:p-6">
                {/* Header com avatar circular */}
                <div className="flex items-start gap-2 md:gap-4 mb-3 md:mb-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-primary/20">
                      {post.profiles?.avatar_url ? (
                        <img
                          src={post.profiles.avatar_url}
                          alt={post.profiles.full_name || 'Usuário'}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                      )}
                    </div>
                    {post.is_pinned && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 rounded-full bg-yellow-500 flex items-center justify-center">
                        <Pin className="h-2.5 w-2.5 md:h-3 md:w-3 text-yellow-900" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1 md:gap-2 mb-1">
                      <span className="font-semibold text-xs md:text-sm truncate max-w-[120px] md:max-w-none">{post.profiles?.full_name || 'Usuário'}</span>
                      <Badge variant="outline" className="text-xs rounded-full flex-shrink-0">
                        {categoryLabels[post.category] || post.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        {new Date(post.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="mb-3 md:mb-4">
                  <p className="text-xs md:text-sm whitespace-pre-wrap leading-relaxed break-words">{post.content}</p>
                  {post.image_url && (
                    <div className="mt-3 md:mt-4 rounded-xl md:rounded-2xl overflow-hidden border border-border/50">
                      <img
                        src={post.image_url}
                        alt="Post image"
                        className="w-full max-h-64 md:max-h-96 object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Ações em círculos */}
                <div className="flex items-center gap-2 md:gap-4 pt-3 md:pt-4 border-t border-border/50 flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full h-8 text-xs"
                    onClick={() => handleReaction(post.id, 'like')}
                  >
                    <ThumbsUp className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
                    <span className="text-xs ml-1 md:ml-0">{post.reactions_count || 0}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full h-8 text-xs"
                    onClick={() => {
                      setSelectedPost(post)
                      loadComments(post.id)
                    }}
                  >
                    <MessageSquare className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
                    <span className="text-xs ml-1 md:ml-0">{post.comments_count || 0}</span>
                  </Button>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                    <Eye className="h-3 w-3 md:h-4 md:w-4" />
                    {post.views_count || 0}
                  </div>
                </div>

                {selectedPost?.id === post.id && (
                  <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-border/50 space-y-3 md:space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Adicionar comentário</Label>
                      <div className="flex flex-col md:flex-row gap-2">
                        <Textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Escreva um comentário..."
                          className="min-h-[70px] md:min-h-[80px] rounded-xl md:rounded-2xl text-sm flex-1"
                        />
                        <Button 
                          onClick={() => handleCreateComment(post.id)}
                          className="rounded-full md:h-auto"
                          size="sm"
                        >
                          <Send className="h-4 w-4 md:mr-2" />
                          <span className="hidden md:inline">Enviar</span>
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2 md:space-y-3">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex items-start gap-2 md:gap-3 p-3 md:p-4 bg-muted/50 rounded-xl md:rounded-2xl">
                          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 flex-shrink-0">
                            {comment.profiles?.avatar_url ? (
                              <img
                                src={comment.profiles.avatar_url}
                                alt={comment.profiles.full_name || 'Usuário'}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <User className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-xs">
                                {comment.profiles?.full_name || 'Usuário'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(comment.created_at).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


