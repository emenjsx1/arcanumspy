"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Users, MessageSquare, TrendingUp, Clock, ArrowRight, Heart, Check } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { getActiveCommunitiesForUser } from "@/lib/db/communities"
import { useToast } from "@/components/ui/use-toast"

interface Community {
  id: string
  name: string
  description: string | null
  is_paid: boolean
  join_link: string
  is_active: boolean
  created_at: string
  members_count?: number
  posts_count?: number
}

export default function CommunityPage() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [joiningCommunity, setJoiningCommunity] = useState<string | null>(null)
  const [joinedCommunities, setJoinedCommunities] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  useEffect(() => {
    const loadCommunities = async () => {
      const startTime = Date.now()
      
      try {
        setLoading(true)
        
        // Usar função que já tem tratamento de erro
        const communitiesData = await getActiveCommunitiesForUser()
        
        const totalTime = Date.now() - startTime

        // Mapear para o formato esperado pela página
        const mappedCommunities = communitiesData.map(community => ({
          id: community.id,
          name: community.name,
          description: community.description,
          is_paid: community.is_paid,
          join_link: community.join_link,
          is_active: community.is_active,
          created_at: community.created_at,
          members_count: community.member_count || 0,
          posts_count: community.posts_count || 0,
        }))

        setCommunities(mappedCommunities)

        // Verificar quais comunidades o usuário já é membro
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const { data: memberships } = await supabase
            .from('community_members')
            .select('community_id')
            .eq('user_id', session.user.id)

          if (memberships) {
            const joinedIds = new Set<string>(memberships.map((m: any) => m.community_id as string))
            setJoinedCommunities(joinedIds)
          }
        }
      } catch (error: any) {
        console.error('❌ [Community Page] Erro ao carregar comunidades:', error)
        // Se a tabela não existir, apenas mostrar array vazio (não quebrar a página)
        if (error?.code === '42P01' || error?.code === 'PGRST202' || error?.message?.includes('does not exist')) {
          console.warn('⚠️ [Community Page] Tabela communities não existe ainda. Execute a migration 025_create_communities_tables.sql')
        }
        setCommunities([])
      } finally {
        setLoading(false)
      }
    }

    loadCommunities()
  }, [])

  const filteredCommunities = communities.filter((community) =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleJoinCommunity = async (communityId: string) => {
    try {
      setJoiningCommunity(communityId)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado para entrar na comunidade",
          variant: "destructive"
        })
        return
      }

      const response = await fetch(`/api/communities/${communityId}/join`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Sucesso!",
          description: "Você entrou na comunidade com sucesso",
        })
        setJoinedCommunities(prev => new Set([...prev, communityId]))
        // Recarregar comunidades para atualizar contadores
        const communitiesData = await getActiveCommunitiesForUser()
        const mappedCommunities = communitiesData.map(community => ({
          id: community.id,
          name: community.name,
          description: community.description,
          is_paid: community.is_paid,
          join_link: community.join_link,
          is_active: community.is_active,
          created_at: community.created_at,
          members_count: community.member_count || 0,
          posts_count: community.posts_count || 0,
        }))
        setCommunities(mappedCommunities)
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao entrar na comunidade",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao entrar na comunidade",
        variant: "destructive"
      })
    } finally {
      setJoiningCommunity(null)
    }
  }

  const totalMembers = communities.reduce((sum, c) => sum + (c.members_count || 0), 0)
  const totalPosts = communities.reduce((sum, c) => sum + (c.posts_count || 0), 0)
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold flex items-center gap-2 md:gap-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent break-words">
          <Users className="h-6 w-6 md:h-7 md:w-7 text-primary" />
          Comunidade
        </h1>
        <p className="text-muted-foreground text-sm">
          Conecte-se com outros afiliados e compartilhe estratégias
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar comunidades, posts ou membros..."
          className="pl-10 h-12"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comunidades</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{communities.length}</div>
                <p className="text-xs text-muted-foreground">Ativas</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membros</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalMembers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total de membros</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalPosts.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total de posts</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Communities Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Comunidades Disponíveis</h2>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCommunities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
            {filteredCommunities.map((community) => (
              <div
                key={community.id}
                className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-background via-background to-muted/30 border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1"
              >
                {/* Círculo decorativo de fundo */}
                <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-colors duration-300" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-colors duration-300" />
                
                <div className="relative p-6">
                  {/* Avatar circular */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl border-2 border-primary/20 group-hover:border-primary/40 transition-colors">
                        <Users className="h-8 w-8 text-primary" />
                      </div>
                      {community.is_paid && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-[10px] font-bold text-primary-foreground">★</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold truncate">{community.name}</CardTitle>
                      <CardDescription className="text-xs mt-1 line-clamp-2">
                        {community.description || 'Sem descrição'}
                      </CardDescription>
                    </div>
                  </div>

                  {/* Estatísticas em círculos */}
                  <div className="flex items-center justify-center gap-6 mb-6">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-1 group-hover:bg-primary/20 transition-colors">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-sm font-semibold">{community.members_count?.toLocaleString() || 0}</span>
                      <span className="text-xs text-muted-foreground">membros</span>
                    </div>
                    <div className="w-px h-12 bg-border" />
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-1 group-hover:bg-primary/20 transition-colors">
                        <MessageSquare className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-sm font-semibold">{community.posts_count || 0}</span>
                      <span className="text-xs text-muted-foreground">posts</span>
                    </div>
                  </div>

                  {/* Botões circulares */}
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 rounded-full" 
                      variant="default"
                      asChild
                    >
                      <Link href={`/community/${community.id}`}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Ver Posts
                      </Link>
                    </Button>
                    <Button 
                      className="rounded-full px-4" 
                      variant={joinedCommunities.has(community.id) ? "default" : "outline"}
                      onClick={() => handleJoinCommunity(community.id)}
                      disabled={joiningCommunity === community.id || joinedCommunities.has(community.id)}
                    >
                      {joiningCommunity === community.id ? (
                        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : joinedCommunities.has(community.id) ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                {searchQuery ? 'Nenhuma comunidade encontrada' : 'Nenhuma comunidade disponível no momento'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Posts - Por enquanto desabilitado até ter tabela de posts */}
      {/* <div>
        <h2 className="text-2xl font-bold mb-4">Posts Recentes</h2>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              Sistema de posts em desenvolvimento
            </p>
          </CardContent>
        </Card>
      </div> */}
    </div>
  )
}

