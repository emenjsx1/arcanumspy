"use client"

import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { OfferWithCategory, OfferFilters } from "@/lib/db/offers"
import { saveSearch } from "@/lib/db/search"
import { isFavorite, toggleFavorite } from "@/lib/db/favorites"
import { Search, Eye, Heart, Flame, CheckCircle, Beaker, Globe } from "lucide-react"
import { COUNTRIES, FORMATS, NICHES, LANGUAGES } from "@/lib/constants"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"

function LibraryPageContent() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [offers, setOffers] = useState<OfferWithCategory[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  
  const [filters, setFilters] = useState<OfferFilters>({
    search: searchParams.get('search') || undefined,
    category: searchParams.get('category') || undefined,
    country: searchParams.get('country') || undefined,
    funnel_type: searchParams.get('funnel_type') || undefined,
    temperature: searchParams.get('temperature') || undefined,
    niche_id: searchParams.get('niche') || undefined,
    product_type: searchParams.get('product_type') || undefined,
  })

  useEffect(() => {
    const loadData = async () => {
      const startTime = Date.now()
      
      setLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setLoading(false)
          return
        }

        const loadStartTime = Date.now()
        
        // Construir query string para filtros
        const queryParams = new URLSearchParams()
        if (filters.search) queryParams.set('search', filters.search)
        if (filters.category) queryParams.set('category', filters.category)
        if (filters.country) queryParams.set('country', filters.country)
        if (filters.funnel_type) queryParams.set('funnel_type', filters.funnel_type)
        if (filters.temperature) queryParams.set('temperature', filters.temperature)
        if (filters.product_type) queryParams.set('product_type', filters.product_type)
        if (filters.niche_id) queryParams.set('niche_id', filters.niche_id)
        queryParams.set('limit', '50')
        
        const [offersResponse, categoriesResponse] = await Promise.all([
          fetch(`/api/offers?${queryParams.toString()}`, {
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          }),
          fetch('/api/categories', {
            credentials: 'include',
          }),
        ])
        
        const loadTime = Date.now() - loadStartTime
        
        let offersData: OfferWithCategory[] = []
        if (offersResponse.ok) {
          const result = await offersResponse.json()
          if (result.success && result.offers) {
            offersData = result.offers
          }
        } else {
          console.warn('⚠️ [Library] Erro ao carregar ofertas:', offersResponse.status)
        }

        let categoriesData: any[] = []
        if (categoriesResponse.ok) {
          const result = await categoriesResponse.json()
          if (result.categories) {
            categoriesData = result.categories
          }
        } else {
          console.warn('⚠️ [Library] Erro ao carregar categorias:', categoriesResponse.status)
        }
        
        setOffers(offersData)
        setCategories(categoriesData)
        
        // OTIMIZAÇÃO: Carregar todos os favoritos de uma vez
        const favoritesStartTime = Date.now()
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data: favoritesData } = await supabase
              .from('favorites')
              .select('offer_id')
              .eq('user_id', user.id)
            
            const favoriteSet = new Set<string>(
              favoritesData?.map((f: any) => f.offer_id) || []
            )
            const favoritesTime = Date.now() - favoritesStartTime
            setFavorites(favoriteSet)
          }
        } catch (favError) {
          console.error('Erro ao carregar favoritos:', favError)
          // Continuar mesmo se houver erro
        }
        
        const totalTime = Date.now() - startTime
      } catch (error: any) {
        console.error('❌ [Library] Erro ao carregar dados:', error)
        
        // Mensagem de erro mais específica
        let errorMessage = "Não foi possível carregar as ofertas"
        if (error?.message) {
          if (error.message.includes('JWT') || error.message.includes('auth')) {
            errorMessage = "Erro de autenticação. Por favor, faça login novamente."
          } else if (error.message.includes('timeout') || error.message.includes('network')) {
            errorMessage = "Erro de conexão. Verifique sua internet e tente novamente."
          } else {
            errorMessage = error.message.substring(0, 100)
          }
        }
        
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive",
        })
        
        // Garantir que o loading seja desativado mesmo em caso de erro
        setOffers([])
        setCategories([])
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [filters, toast])

  const handleSearch = async (query: string) => {
    if (query.trim()) {
      await saveSearch(query, filters)
    }
    setFilters({ ...filters, search: query || undefined })
  }

  const handleToggleFavorite = async (offerId: string) => {
    try {
      const newFavorite = await toggleFavorite(offerId)
      const newFavorites = new Set(favorites)
      if (newFavorite) {
        newFavorites.add(offerId)
        toast({
          title: "Adicionado aos favoritos",
          description: "Oferta salva com sucesso",
        })
      } else {
        newFavorites.delete(offerId)
        toast({
          title: "Removido dos favoritos",
          description: "Oferta removida com sucesso",
        })
      }
      setFavorites(newFavorites)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os favoritos",
        variant: "destructive",
      })
    }
  }

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

  const getTemperatureBadge = (offer: OfferWithCategory) => {
    if (offer.temperature === 'hot') {
      return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"><Flame className="h-3 w-3 mr-1" />Muito quente</Badge>
    }
    if (offer.conversion_rate && offer.conversion_rate > 1.5) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="h-3 w-3 mr-1" />Validada</Badge>
    }
    return <Badge variant="outline"><Beaker className="h-3 w-3 mr-1" />Em teste</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent break-words">
          Biblioteca de Ofertas
        </h1>
        <p className="text-muted-foreground text-lg">
          Encontre, filtre e salve as melhores ofertas para modelar
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por oferta, nicho, país ou tipo de página..."
            className="pl-10 h-12"
            value={filters.search || ""}
            onChange={(e) => handleSearch((e.target as HTMLInputElement).value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch((e.target as HTMLInputElement).value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Oferta</Label>
                <Select
                  value={filters.category || "all"}
                  onValueChange={(value) =>
                    setFilters({ ...filters, category: value === "all" ? undefined : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nicho</Label>
                <Select
                  value={filters.niche_id || "all"}
                  onValueChange={(value: string) =>
                    setFilters({ ...filters, niche_id: value === "all" ? undefined : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os nichos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {NICHES.map((niche) => (
                      <SelectItem key={niche} value={niche}>
                        {niche}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>País</Label>
                <Select
                  value={filters.country || "all"}
                  onValueChange={(value) =>
                    setFilters({ ...filters, country: value === "all" ? undefined : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Funil</Label>
                <Select
                  value={filters.funnel_type || "all"}
                  onValueChange={(value) =>
                    setFilters({ ...filters, funnel_type: value === "all" ? undefined : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {FORMATS.map((format) => (
                      <SelectItem key={format} value={format}>
                        {format}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Temperatura</Label>
                <Select
                  value={filters.temperature || "all"}
                  onValueChange={(value) =>
                    setFilters({ ...filters, temperature: value === "all" ? undefined : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="hot">
                      <Flame className="h-3 w-3 inline mr-1" />
                      Muito quente
                    </SelectItem>
                    <SelectItem value="validated">✅ Validada</SelectItem>
                    <SelectItem value="testing">🧪 Em teste</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setFilters({})}
              >
                Limpar Filtros
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Offers Grid */}
        <div className="lg:col-span-3">
          <div className="mb-4 text-sm text-muted-foreground">
            {loading ? (
              <Skeleton className="h-5 w-32" />
            ) : (
              `${offers.length} oferta(s) encontrada(s)`
            )}
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="border">
                  <CardHeader>
                    <Skeleton className="h-6 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {offers.length > 0 ? offers.map((offer) => (
                <Card key={offer.id} className="hover:shadow-xl transition-all border-2 hover:border-primary/50 hover:scale-[1.01] bg-gradient-to-br from-background via-background to-muted/20">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      {offer.category && (
                        <Badge variant="secondary">{offer.category.name}</Badge>
                      )}
                      {getTemperatureBadge(offer)}
                    </div>
                    <CardTitle className="text-lg">{offer.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {offer.short_description || 'Sem descrição'}
                    </CardDescription>
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
                      {offer.conversion_rate && (
                        <Badge variant="outline" className="text-xs">
                          {offer.conversion_rate}% conv.
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/offer/${offer.id}`} className="flex-1">
                        <Button className="w-full" variant="outline">
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalhes
                        </Button>
                      </Link>
                      <Button 
                        variant={favorites.has(offer.id) ? "default" : "outline"} 
                        size="icon"
                        onClick={() => handleToggleFavorite(offer.id)}
                      >
                        <Heart className={`h-4 w-4 ${favorites.has(offer.id) ? 'fill-current' : ''}`} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <Card className="col-span-full">
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    Nenhuma oferta encontrada com os filtros selecionados
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LibraryPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Skeleton className="h-96" />
          <div className="lg:col-span-3 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    }>
      <LibraryPageContent />
    </Suspense>
  )
}
