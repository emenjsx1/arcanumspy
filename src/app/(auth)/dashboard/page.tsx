"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/store/auth-store"
import { ArrowRight, Search, Heart, Clock, TrendingUp, Zap, Eye, Star, FolderTree, Crown, Flame, Sparkles, Globe, Shield } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { OfferWithCategory } from "@/lib/db/offers"
import type { RecentActivity } from "@/lib/db/dashboard"
import { Skeleton } from "@/components/ui/skeleton"
import { COUNTRIES, LANGUAGES } from "@/lib/constants"

export default function DashboardPage() {
  const { user, profile } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    offersViewed: 0,
    offersViewedTotal: 0,
    favoritesCount: 0,
    categoriesAccessed: 0,
  })
  const [scaledOffers, setScaledOffers] = useState<OfferWithCategory[]>([])
  const [hotOffers, setHotOffers] = useState<OfferWithCategory[]>([])
  const [newOffers, setNewOffers] = useState<OfferWithCategory[]>([])
  const [recommendedOffers, setRecommendedOffers] = useState<OfferWithCategory[]>([])
  const [recentSearches, setRecentSearches] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  
  // CORREÇÃO: Flag para evitar múltiplas execuções simultâneas do loadData
  const [dataLoaded, setDataLoaded] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)

  // CORREÇÃO: useEffect com proteção contra múltiplas execuções e timeout de segurança
  useEffect(() => {
    // Se já carregou os dados ou está carregando, não executar novamente
    if (dataLoaded || isLoadingData) return
    
    // CORREÇÃO: Se não tem usuário ainda, aguardar com timeout de segurança
    if (!user) {
      // Aguardar até 3 segundos para o usuário ser carregado
      const timeout = setTimeout(() => {
        const currentUser = useAuthStore.getState().user
        if (!currentUser && !dataLoaded) {
          console.warn('⚠️ [Dashboard] Usuário não encontrado após timeout')
          setLoading(false)
          setDataLoaded(true)
        }
      }, 3000)
      return () => clearTimeout(timeout)
    }

    const loadData = async () => {
      // Marcar como carregando para evitar execuções simultâneas
      setIsLoadingData(true)
      
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setLoading(false)
          setIsLoadingData(false)
          return
        }

        // OTIMIZAÇÃO: Carregar dados críticos primeiro, depois os secundários
        const loadStartTime = Date.now()
        
        // Carregar dados críticos via API (usa adminClient no servidor)
        const [statsResponse, activitiesResponse, categoriesResponse] = await Promise.all([
          fetch('/api/dashboard/stats', {
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          }),
          fetch('/api/dashboard/activities?limit=10', {
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          }),
          fetch('/api/categories', {
            credentials: 'include',
          }),
        ])
        
        // Processar respostas das APIs
        let statsData = {
          offersViewed: 0,
          offersViewedTotal: 0,
          favoritesCount: 0,
          categoriesAccessed: 0,
        }
        
        if (statsResponse.ok) {
          const statsResult = await statsResponse.json()
          if (statsResult.success && statsResult.stats) {
            statsData = statsResult.stats
          }
        } else {
          console.warn('⚠️ [Dashboard] Erro ao carregar estatísticas:', statsResponse.status)
        }

        let activities: RecentActivity[] = []
        if (activitiesResponse.ok) {
          const activitiesResult = await activitiesResponse.json()
          if (activitiesResult.success && activitiesResult.activities) {
            activities = activitiesResult.activities
          }
        } else {
          console.warn('⚠️ [Dashboard] Erro ao carregar atividades:', activitiesResponse.status)
        }

        // Processar categorias
        let cats: any[] = []
        if (categoriesResponse.ok) {
          const categoriesResult = await categoriesResponse.json()
          if (categoriesResult.categories) {
            cats = categoriesResult.categories
          }
        } else {
          console.warn('⚠️ [Dashboard] Erro ao carregar categorias:', categoriesResponse.status)
        }
        
        // Carregar dados secundários em paralelo (mas depois dos críticos)
        const [scaledResponse, hotResponse, newOffResponse, recommendedResponse, searchesResponse] = await Promise.all([
          fetch('/api/dashboard/scaled-offers?limit=4', {
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          }),
          fetch('/api/dashboard/hot-offers?limit=6', {
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          }),
          fetch('/api/dashboard/new-offers?limit=3', {
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          }),
          fetch('/api/dashboard/recommended-offers?limit=6', {
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          }),
          fetch('/api/dashboard/recent-searches?limit=5', {
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          }),
        ])

        // Processar respostas
        let scaled: OfferWithCategory[] = []
        if (scaledResponse.ok) {
          const result = await scaledResponse.json()
          if (result.success && result.offers) {
            scaled = result.offers
          }
        }

        let hot: OfferWithCategory[] = []
        if (hotResponse.ok) {
          const result = await hotResponse.json()
          if (result.success && result.offers) {
            hot = result.offers
          }
        }

        let newOff: OfferWithCategory[] = []
        if (newOffResponse.ok) {
          const result = await newOffResponse.json()
          if (result.success && result.offers) {
            newOff = result.offers
          }
        }

        let recommended: OfferWithCategory[] = []
        if (recommendedResponse.ok) {
          const result = await recommendedResponse.json()
          if (result.success && result.offers) {
            recommended = result.offers
          }
        }

        let searches: any[] = []
        if (searchesResponse.ok) {
          const result = await searchesResponse.json()
          if (result.success && result.searches) {
            searches = result.searches
          }
        }
        
        const loadTime = Date.now() - loadStartTime
        
        // Atualizar estado
        setStats(statsData)
        setCategories(cats.slice(0, 6))
        setScaledOffers(scaled)
        setHotOffers(hot)
        setNewOffers(newOff)
        setRecommendedOffers(recommended)
        setRecentSearches(searches)
        setRecentActivities(activities)
        
        // CORREÇÃO: Marcar como carregado para evitar re-execuções
        setDataLoaded(true)
      } catch (error) {
        console.error('❌ [Dashboard] Erro ao carregar dados:', error)
        // Não quebrar a página, apenas mostrar dados vazios
        setStats({
          offersViewed: 0,
          offersViewedTotal: 0,
          favoritesCount: 0,
          categoriesAccessed: 0,
        })
        // CORREÇÃO: Marcar como carregado mesmo em erro para evitar loops
        setDataLoaded(true)
      } finally {
        setLoading(false)
        setIsLoadingData(false)
      }
    }
    
    loadData()
    
    // CORREÇÃO: Cleanup para resetar flags se componente desmontar
    return () => {
      setIsLoadingData(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]) // CORREÇÃO: Executar apenas quando user.id mudar (ou na montagem inicial)

  const getCountryIcon = (country: string | { code?: string; name?: string; flag?: string } | null | undefined) => {
    if (!country) return <Globe className="h-3 w-3 inline" />
    // Se for objeto, extrair código
    const countryCode = typeof country === 'string' ? country : country.code
    if (!countryCode) return <Globe className="h-3 w-3 inline" />
    
    // Buscar país no array COUNTRIES
    const countryObj = COUNTRIES.find(c => c.code === countryCode)
    return countryObj ? <span>{countryObj.flag}</span> : <Globe className="h-3 w-3 inline" />
  }

  const getCountryName = (country: string | { code?: string; name?: string; flag?: string } | null | undefined): string => {
    if (!country) return 'N/A'
    // Se for objeto, extrair código ou nome
    if (typeof country === 'object' && country !== null) {
      if (country.name) return country.name
      if (country.code) {
        const countryObj = COUNTRIES.find(c => c.code === country.code)
        return countryObj?.name || country.code
      }
      return 'N/A'
    }
    // Se for string, buscar nome
    const countryObj = COUNTRIES.find(c => c.code === country)
    return countryObj?.name || country
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      window.location.href = `/library?search=${encodeURIComponent(searchQuery)}`
    } else {
      window.location.href = '/library'
    }
  }

  // CORREÇÃO: Não mostrar loading infinito - se já tentou carregar, mostrar conteúdo mesmo que vazio
  // Isso evita que o layout cause loops de "Carregando..."
  if (loading && !dataLoaded && isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent break-words">
              Dashboard
            </h1>
            <p className="text-muted-foreground text-sm md:text-base lg:text-lg mt-1">
              Bem-vindo de volta, <span className="font-bold text-foreground">{profile?.name || user?.email?.split('@')[0] || 'Usuário'}</span>!
            </p>
          </div>
          {profile?.role === 'admin' && (
            <Link href="/admin/dashboard" className="flex-shrink-0">
              <Button className="bg-[#ff5a1f] hover:bg-[#ff4d29] text-white text-sm md:text-base h-9 md:h-10">
                <Shield className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                <span className="hidden md:inline">Área Admin</span>
                <span className="md:hidden">Admin</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col md:flex-row gap-2 md:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por oferta, nicho, país ou tipo de página…"
            className="pl-9 md:pl-10 h-10 md:h-12 text-sm md:text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Link href="/library" className="w-full md:w-auto">
          <Button size="lg" className="h-10 md:h-12 w-full md:w-auto text-sm md:text-base">
            <span className="hidden md:inline">Ver biblioteca completa</span>
            <span className="md:hidden">Biblioteca</span>
            <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ofertas Vistas</CardTitle>
            <Eye className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-9 w-20 mb-2" />
            ) : (
              <>
                <div className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {stats.offersViewed}
                </div>
                <p className="text-xs text-muted-foreground">
                  Este mês • {stats.offersViewedTotal} total
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 hover:border-primary/50 transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favoritos</CardTitle>
            <Star className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-9 w-20 mb-2" />
            ) : (
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {stats.favoritesCount}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorias</CardTitle>
            <FolderTree className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-9 w-20 mb-2" />
            ) : (
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {stats.categoriesAccessed}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Acessadas</p>
          </CardContent>
        </Card>

      </div>

      {/* Ofertas Quentes */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold flex items-center gap-2">
              <Flame className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
              <span className="truncate">Ofertas Quentes para você</span>
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Selecionadas com base nas conversões e nicho que você mais vê
            </p>
          </div>
          <Link href="/library" className="flex-shrink-0">
            <Button variant="ghost" size="sm" className="text-xs md:text-sm">
              Ver todas <ArrowRight className="ml-2 h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {hotOffers.map((offer) => (
            <Card key={offer.id} className="hover:shadow-xl transition-all border-2 hover:border-primary/50 bg-gradient-to-br from-background via-background to-muted/30 hover:scale-[1.02]">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-base md:text-lg flex items-center gap-2 break-words">
                    <Flame className="h-3 w-3 md:h-4 md:w-4 text-orange-500 flex-shrink-0" />
                    <span className="truncate">{offer.title}</span>
                  </CardTitle>
                  <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    {offer.category?.name || 'Sem categoria'}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">{offer.short_description || (offer as any).big_idea || 'Sem descrição'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {offer.niche && (
                    <Badge variant="secondary" className="text-xs bg-[#ff5a1f]/20 text-[#ff5a1f]">
                      {typeof offer.niche === 'string' ? offer.niche : (offer.niche as any)?.name || 'Nicho'}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {offer.funnel_type || 'VSL'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getCountryIcon(offer.country)} {getCountryName(offer.country)}
                  </Badge>
                  {(offer as any).language && (
                    <Badge variant="outline" className="text-xs">
                      {(() => {
                        const lang = LANGUAGES.find(l => l.code === (offer as any).language)
                        return lang ? `${lang.flag} ${lang.name}` : (offer as any).language
                      })()}
                    </Badge>
                  )}
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {offer.conversion_rate && offer.conversion_rate > 2 && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="font-medium text-green-600">Conversão alta: {offer.conversion_rate}%</span>
                    </div>
                  )}
                  {offer.temperature && (
                    <div>Temperatura: {offer.temperature}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link href={`/offer/${offer.id}`} className="flex-1">
                    <Button className="w-full">Ver detalhes</Button>
                  </Link>
                  <Button variant="outline" size="icon" className="flex-shrink-0">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Ofertas Escalando */}
      {scaledOffers.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg md:text-xl lg:text-2xl font-bold flex items-center gap-2">
                <Zap className="h-6 w-6 text-yellow-500" />
                Ofertas Escalando Agora
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Ofertas com alta performance e crescimento no momento
              </p>
            </div>
            <Link href="/library?temperature=hot">
              <Button variant="ghost">
                Ver todas <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {scaledOffers.map((offer) => (
              <Card key={offer.id} className="hover:shadow-lg transition-shadow border-2 border-yellow-200 dark:border-yellow-800 bg-gradient-to-br from-yellow-50/50 to-orange-50/50 dark:from-yellow-950/20 dark:to-orange-950/20">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      {offer.title}
                    </CardTitle>
                    <Badge className="bg-yellow-500 text-white">Escalando</Badge>
                  </div>
                <CardDescription className="line-clamp-2 text-xs">{offer.short_description || (offer as any).big_idea || 'Sem descrição'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {offer.niche && (
                    <Badge variant="secondary" className="text-xs bg-[#ff5a1f]/20 text-[#ff5a1f]">
                      {typeof offer.niche === 'string' ? offer.niche : (offer.niche as any)?.name || 'Nicho'}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {getCountryIcon(offer.country)} {getCountryName(offer.country)}
                  </Badge>
                  {(offer as any).language && (
                    <Badge variant="outline" className="text-xs">
                      {(() => {
                        const lang = LANGUAGES.find(l => l.code === (offer as any).language)
                        return lang ? `${lang.flag} ${lang.name}` : (offer as any).language
                      })()}
                    </Badge>
                  )}
                </div>
                {offer.conversion_rate && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
                    <TrendingUp className="h-3 w-3" />
                    {offer.conversion_rate}% conversão
                  </div>
                )}
                  <Link href={`/offer/${offer.id}`} className="block">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      Ver detalhes
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Novas Ofertas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Novas Ofertas
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Adicionadas nos últimos 7 dias
            </p>
          </div>
          <Link href="/library">
            <Button variant="ghost">
              Ver todas <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {newOffers.map((offer) => (
            <Card key={offer.id} className="hover:shadow-lg transition-shadow border-dashed border-2">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{offer.title}</CardTitle>
                  <Badge variant="outline" className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Novo
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">{offer.short_description || (offer as any).big_idea || 'Sem descrição'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>{offer.funnel_type || 'VSL'}</span>
                  <span>{getCountryIcon(offer.country)} {getCountryName(offer.country)}</span>
                </div>
                <Link href={`/offer/${offer.id}`}>
                  <Button variant="outline" className="w-full">Ver Detalhes</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Explorar por Nicho */}
      <div>
        <h2 className="text-lg md:text-xl lg:text-2xl font-bold mb-3 md:mb-4">Explorar por Nicho</h2>
        {loading ? (
          <div className="flex flex-wrap gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="min-w-[140px]">
                <CardContent className="p-4 text-center">
                  <Skeleton className="h-10 w-10 mx-auto mb-2" />
                  <Skeleton className="h-4 w-20 mx-auto" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {categories.length > 0 ? categories.map((category) => (
              <Link
                key={category.id}
                href={`/library?category=${category.slug}`}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer min-w-[140px] hover:scale-105 transition-transform">
                  <CardContent className="p-4 text-center">
                    <FolderTree className="h-8 w-8 mb-2 mx-auto text-muted-foreground" />
                    <div className="font-semibold text-sm">{category.name}</div>
                  </CardContent>
                </Card>
              </Link>
            )) : (
              <Card className="w-full">
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Nenhuma categoria disponível
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Atividade Recente */}
      <div>
        <h2 className="text-lg md:text-xl lg:text-2xl font-bold mb-3 md:mb-4 flex items-center gap-2">
          Atividade Recente <Clock className="h-5 w-5" />
        </h2>
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-3 w-20" />
                  </div>
                ))}
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.slice(0, 5).map((activity) => {
                  const getActivityIcon = () => {
                    switch (activity.activity_type) {
                      case 'favorite_added':
                        return <Heart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      case 'offer_viewed':
                        return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                      case 'search_performed':
                        return <Search className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      default:
                        return <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    }
                  }

                  const getActivityBgColor = () => {
                    switch (activity.activity_type) {
                      case 'favorite_added':
                        return 'bg-blue-100 dark:bg-blue-900'
                      case 'offer_viewed':
                        return 'bg-green-100 dark:bg-green-900'
                      case 'search_performed':
                        return 'bg-purple-100 dark:bg-purple-900'
                      default:
                        return 'bg-gray-100 dark:bg-gray-900'
                    }
                  }

                  const getActivityMessage = () => {
                    switch (activity.activity_type) {
                      case 'favorite_added':
                        return `Você adicionou "${activity.offer?.title || activity.activity_data?.offer_title || 'uma oferta'}" aos favoritos`
                      case 'offer_viewed':
                        return `Você visualizou "${activity.offer?.title || activity.activity_data?.offer_title || 'uma oferta'}"`
                      case 'search_performed':
                        return `Você pesquisou por "${activity.activity_data?.query || 'algo'}"`
                      default:
                        return activity.activity_data?.message || 'Atividade recente'
                    }
                  }

                  const formatTimeAgo = (date: string) => {
                    const now = new Date()
                    const activityDate = new Date(date)
                    const diffInSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000)
                    
                    if (diffInSeconds < 60) return 'Agora'
                    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min atrás`
                    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} horas atrás`
                    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} dias atrás`
                    return activityDate.toLocaleDateString('pt-BR')
                  }

                  return (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`p-2 ${getActivityBgColor()} rounded-full`}>
                        {getActivityIcon()}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{getActivityMessage()}</p>
                        {activity.offer && (
                          <p className="text-sm text-muted-foreground">
                            {activity.offer.title}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimeAgo(activity.created_at)}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Nenhuma atividade recente
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Pesquisa */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Seu histórico de pesquisa
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Continue de onde parou
            </p>
          </div>
          <Link href="/library">
            <Button variant="ghost">
              Ver todas <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border">
                <CardContent className="p-3">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {recentSearches.length > 0 ? recentSearches.map((search) => (
              <Card key={search.id} className="hover:bg-accent transition-colors border shadow-sm hover:shadow-md hover:border-primary/30">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">{search.query}</h3>
                      <p className="text-xs text-muted-foreground">
                        {new Date(search.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Link href={`/library?search=${encodeURIComponent(search.query)}`}>
                      <Button variant="ghost" size="sm">
                        Ver <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <Card className="border">
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Nenhuma pesquisa recente
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
