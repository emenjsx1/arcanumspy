"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Search, Filter, Info, Grid, Heart, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import Image from "next/image"
import { COUNTRIES, FORMATS, NICHES, LANGUAGES } from "@/lib/constants"
import { OfferWithCategory, OfferFilters } from "@/lib/db/offers"
import { isFavorite, toggleFavorite } from "@/lib/db/favorites"

export default function OfertasEscaladasPage() {
  const [ofertas, setOfertas] = useState<OfferWithCategory[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [filtros, setFiltros] = useState({
    busca: "",
    category: "",
    status: "todos", // todos, escalando, pre-escala, validando
    nicho: "todos",
    formato: "todos",
    country: "todos",
    language: "todos",
    funnel_type: "todos",
    product_type: "todos",
    ordenar: "mais_recente"
  })
  const { toast } = useToast()

  useEffect(() => {
    loadCategories()
    loadFavorites()
  }, [])

  useEffect(() => {
    loadOfertas()
  }, [filtros])

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        credentials: 'include',
      })
      if (response.ok) {
        const result = await response.json()
        if (result.categories) {
          setCategories(result.categories)
        }
      } else {
        console.error('Erro ao carregar categorias:', response.status)
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    }
  }

  const loadFavorites = async () => {
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
        setFavorites(favoriteSet)
      }
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error)
    }
  }

  const loadOfertas = async () => {
    try {
      setLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }
      
      // Construir query string para filtros
      const queryParams = new URLSearchParams()
      if (filtros.busca) {
        queryParams.set('search', filtros.busca)
      }
      if (filtros.category) {
        queryParams.set('category', filtros.category)
      }
      if (filtros.country !== 'todos') {
        queryParams.set('country', filtros.country)
      }
      if (filtros.language !== 'todos') {
        queryParams.set('language', filtros.language)
      }
      if (filtros.funnel_type !== 'todos') {
        queryParams.set('funnel_type', filtros.funnel_type)
      }
      if (filtros.product_type !== 'todos') {
        queryParams.set('product_type', filtros.product_type)
      }
      
      // Filtro por temperature (status)
      if (filtros.status === 'escalando') {
        queryParams.set('temperature', 'hot')
      } else if (filtros.status === 'pre-escala') {
        queryParams.set('temperature', 'warm')
      } else if (filtros.status === 'validando') {
        queryParams.set('temperature', 'cold')
      }
      
      queryParams.set('limit', '100')

      // Carregar ofertas via API
      console.log('🔍 [OfertasEscaladas] Carregando ofertas com params:', queryParams.toString())
      
      const response = await fetch(`/api/offers?${queryParams.toString()}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      
      let offersData: OfferWithCategory[] = []
      if (response.ok) {
        const result = await response.json()
        console.log('🔍 [OfertasEscaladas] Resposta da API:', {
          success: result.success,
          offersCount: result.offers?.length || 0,
          hasOffers: !!result.offers
        })
        
        if (result.success && result.offers) {
          offersData = result.offers
          console.log('✅ [OfertasEscaladas] Ofertas carregadas:', offersData.length)
          
          // Se não houver ofertas, mostrar mensagem informativa
          if (offersData.length === 0 && result.message) {
            console.warn('⚠️ [OfertasEscaladas]', result.message)
            toast({
              title: "Nenhuma oferta encontrada",
              description: result.message || "Não há ofertas disponíveis no momento.",
              variant: "default"
            })
          }
        } else if (result.error) {
          console.error('❌ [OfertasEscaladas] Erro na resposta:', result.error)
          toast({
            title: "Erro",
            description: result.error || "Erro ao carregar ofertas",
            variant: "destructive"
          })
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ [OfertasEscaladas] Erro HTTP:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        toast({
          title: "Erro",
          description: errorData.error || `Erro ${response.status} ao carregar ofertas`,
          variant: "destructive"
        })
      }
      
      // Filtrar por nicho se necessário (campo niche é texto, não foreign key)
      let filteredOffers = offersData
      if (filtros.nicho !== 'todos') {
        filteredOffers = offersData.filter(offer => {
          const nicheValue = typeof offer.niche === 'string' ? offer.niche : (offer.niche as any)?.name || ''
          return nicheValue.toLowerCase() === filtros.nicho.toLowerCase()
        })
      }
      
      // Filtrar por formato (page_type ou funnel_type)
      if (filtros.formato !== 'todos') {
        filteredOffers = filteredOffers.filter(offer =>
          (offer as any).page_type === filtros.formato || offer.funnel_type === filtros.formato
        )
      }

      // Ordenação
      if (filtros.ordenar === 'mais_recente') {
        filteredOffers.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      } else if (filtros.ordenar === 'mais_antigo') {
        filteredOffers.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      } else if (filtros.ordenar === 'mais_like') {
        filteredOffers.sort((a, b) => 
          ((b as any).likes_count || 0) - ((a as any).likes_count || 0)
        )
      }

      setOfertas(filteredOffers)
    } catch (error: any) {
      console.error('Erro ao carregar ofertas:', error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível carregar as ofertas",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 md:p-2 bg-[#ff5a1f] rounded-lg flex-shrink-0">
            <TrendingUp className="h-4 w-4 md:h-6 md:w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white break-words">Ofertas Escaladas</h1>
            <p className="text-gray-400 text-sm md:text-base lg:text-lg">Descubra ofertas em alta no mercado</p>
          </div>
        </div>
      </div>

      {/* Banner YouTube */}
      <Card className="bg-[#ff5a1f] border-[#ff5a1f] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-8 gap-2 p-4">
            {Array.from({ length: 64 }).map((_, i) => (
              <div key={i} className="aspect-square bg-white rounded flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
        <CardContent className="p-4 md:p-6 lg:p-8 text-center relative z-10">
          <h2 className="text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-bold text-white mb-3 md:mb-4 break-words">VÍDEO NOVO NO YOUTUBE</h2>
          <Button className="bg-green-500 hover:bg-green-600 text-white px-4 md:px-6 lg:px-8 py-3 md:py-4 lg:py-6 text-sm md:text-base lg:text-lg">
            CLIQUE AQUI
          </Button>
        </CardContent>
      </Card>

      {/* Filtros */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-[#ff5a1f]" />
            <h2 className="text-xl font-bold text-white">Filtros</h2>
          </div>
          <Button variant="outline" className="bg-green-500 hover:bg-green-600 text-white border-green-500">
            <Info className="h-4 w-4 mr-2" />
            CLIQUE AQUI PARA LER A DICA
          </Button>
        </div>
        
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar campanhas..."
                value={filtros.busca}
                onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
                className="pl-10 bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#ff5a1f]"
              />
            </div>
          </div>
          
          {/* Categoria - mesmo que library */}
          <Select value={filtros.category || "todos"} onValueChange={(value) => setFiltros({ ...filtros, category: value === "todos" ? "" : value })}>
            <SelectTrigger className="w-[180px] bg-[#0a0a0a] border-[#2a2a2a] text-white">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
              <SelectItem value="todos" className="text-white">Todas as Categorias</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id} className="text-white">
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status/Temperature - escalando = hot */}
          <Select value={filtros.status} onValueChange={(value) => setFiltros({ ...filtros, status: value })}>
            <SelectTrigger className="w-[180px] bg-[#0a0a0a] border-[#2a2a2a] text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
              <SelectItem value="todos" className="text-white">Todos os Status</SelectItem>
              <SelectItem value="escalando" className="text-white">Escalando (Hot)</SelectItem>
              <SelectItem value="pre-escala" className="text-white">Pré-Escala (Warm)</SelectItem>
              <SelectItem value="validando" className="text-white">Validando (Cold)</SelectItem>
            </SelectContent>
          </Select>

          {/* Nicho - usar constantes */}
          <Select value={filtros.nicho} onValueChange={(value) => setFiltros({ ...filtros, nicho: value })}>
            <SelectTrigger className="w-[180px] bg-[#0a0a0a] border-[#2a2a2a] text-white">
              <SelectValue placeholder="Nicho" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
              <SelectItem value="todos" className="text-white">Todos os Nichos</SelectItem>
              {NICHES.map((nicho) => (
                <SelectItem key={nicho} value={nicho} className="text-white">
                  {nicho}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Formato/Funnel Type - usar constantes */}
          <Select value={filtros.formato} onValueChange={(value) => setFiltros({ ...filtros, formato: value })}>
            <SelectTrigger className="w-[180px] bg-[#0a0a0a] border-[#2a2a2a] text-white">
              <SelectValue placeholder="Formato" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
              <SelectItem value="todos" className="text-white">Todos os Formatos</SelectItem>
              {FORMATS.map((formato) => (
                <SelectItem key={formato} value={formato} className="text-white">
                  {formato}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* País - usar constantes COUNTRIES */}
          <Select value={filtros.country} onValueChange={(value) => setFiltros({ ...filtros, country: value })}>
            <SelectTrigger className="w-[180px] bg-[#0a0a0a] border-[#2a2a2a] text-white">
              <SelectValue placeholder="País" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] max-h-[300px]">
              <SelectItem value="todos" className="text-white">Todos os Países</SelectItem>
              {COUNTRIES.map((country) => (
                <SelectItem key={country.code} value={country.code} className="text-white">
                  {country.flag} {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Idioma */}
          <Select value={filtros.language} onValueChange={(value) => setFiltros({ ...filtros, language: value })}>
            <SelectTrigger className="w-[180px] bg-[#0a0a0a] border-[#2a2a2a] text-white">
              <SelectValue placeholder="Idioma" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
              <SelectItem value="todos" className="text-white">Todos os Idiomas</SelectItem>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code} className="text-white">
                  {lang.flag} {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Ordenação */}
          <Select value={filtros.ordenar} onValueChange={(value) => setFiltros({ ...filtros, ordenar: value })}>
            <SelectTrigger className="w-[180px] bg-[#0a0a0a] border-[#2a2a2a] text-white">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
              <SelectItem value="mais_recente" className="text-white">Mais Recente</SelectItem>
              <SelectItem value="mais_antigo" className="text-white">Mais Antigo</SelectItem>
              <SelectItem value="mais_like" className="text-white">Mais Like</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resultados */}
      <div className="flex items-center gap-2 text-white">
        <Grid className="h-5 w-5" />
        <p className="text-lg font-medium">{ofertas.length} ofertas encontradas</p>
      </div>

      {/* Grid de Ofertas */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 bg-[#1a1a1a]" />
          ))}
        </div>
      ) : ofertas.length === 0 ? (
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardContent className="p-12 text-center space-y-4">
            <p className="text-gray-400 text-lg font-semibold">Nenhuma oferta encontrada</p>
            <p className="text-gray-500 text-sm">
              Verifique se há ofertas cadastradas com <code className="bg-[#2a2a2a] px-2 py-1 rounded">is_active = true</code> no banco de dados.
            </p>
            <p className="text-gray-500 text-xs mt-4">
              💡 Dica: Execute o script <code className="bg-[#2a2a2a] px-2 py-1 rounded">ATIVAR_TODAS_OFERTAS.sql</code> no Supabase para ativar todas as ofertas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
          {ofertas.map((oferta) => (
            <Card key={oferta.id} className="bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#ff5a1f] transition-colors h-full">
              <div className="relative aspect-video bg-[#0a0a0a]">
                {(oferta as any).image_url ? (
                  <Image
                    src={(oferta as any).image_url}
                    alt={oferta.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    Sem imagem
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className={`h-8 w-8 bg-black/50 hover:bg-black/70 ${
                      favorites.has(oferta.id) ? 'text-red-500' : 'text-white'
                    }`}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleToggleFavorite(oferta.id)
                    }}
                  >
                    <Heart className={`h-4 w-4 ${favorites.has(oferta.id) ? 'fill-current' : ''}`} />
                  </Button>
                </div>
                <div className="absolute bottom-2 left-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    oferta.temperature === 'hot' ? 'bg-orange-500 text-white' :
                    oferta.temperature === 'warm' ? 'bg-yellow-500 text-white' :
                    'bg-blue-500 text-white'
                  }`}>
                    {oferta.temperature === 'hot' ? 'Escalando' : 
                     oferta.temperature === 'warm' ? 'Pré-Escala' : 
                     'Validando'}
                  </span>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  {oferta.category && (
                    <span className="bg-[#ff5a1f]/20 text-[#ff5a1f] px-2 py-1 rounded text-xs font-medium">
                      {oferta.category.name}
                    </span>
                  )}
                </div>
                <h3 className="text-white font-semibold mb-2 line-clamp-2">{oferta.title}</h3>
                <p className="text-gray-400 text-sm line-clamp-2 mb-3">{oferta.short_description || ''}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {oferta.niche && (
                    <span className="bg-[#ff5a1f]/20 text-[#ff5a1f] px-2 py-1 rounded text-xs font-medium">
                      {typeof oferta.niche === 'string' ? oferta.niche : (oferta.niche as any)?.name || 'Nicho'}
                    </span>
                  )}
                  {oferta.funnel_type && (
                    <span className="bg-[#2a2a2a] text-gray-300 px-2 py-1 rounded text-xs">
                      {oferta.funnel_type}
                    </span>
                  )}
                  {oferta.country && (
                    <span className="bg-[#2a2a2a] text-gray-300 px-2 py-1 rounded text-xs">
                      {COUNTRIES.find(c => c.code === oferta.country)?.flag || ''} {COUNTRIES.find(c => c.code === oferta.country)?.name || oferta.country}
                    </span>
                  )}
                  {(oferta as any).language && (
                    <span className="bg-[#2a2a2a] text-gray-300 px-2 py-1 rounded text-xs">
                      {LANGUAGES.find(l => l.code === (oferta as any).language)?.flag || ''} {LANGUAGES.find(l => l.code === (oferta as any).language)?.name || (oferta as any).language}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link href={`/offer/${oferta.id}`} className="flex-1">
                    <Button className="w-full bg-[#ff5a1f] hover:bg-[#ff5a1f]/80 text-white" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      Ver detalhes
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className={`border-[#2a2a2a] ${
                      favorites.has(oferta.id) ? 'bg-red-500/20 border-red-500 text-red-500' : 'text-white'
                    }`}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleToggleFavorite(oferta.id)
                    }}
                  >
                    <Heart className={`h-4 w-4 ${favorites.has(oferta.id) ? 'fill-current' : ''}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

