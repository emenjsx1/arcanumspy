"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { getUserFavorites, FavoriteWithOffer, updateFavoriteNotes, toggleFavorite } from "@/lib/db/favorites"
import { Eye, Trash2, Heart, ExternalLink, Calendar, Globe } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { COUNTRIES } from "@/lib/constants"

export default function FavoritesPage() {
  const { toast } = useToast()
  const [favorites, setFavorites] = useState<FavoriteWithOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [nicheFilter, setNicheFilter] = useState<string | undefined>()
  const [countryFilter, setCountryFilter] = useState<string | undefined>()
  const [sortBy, setSortBy] = useState<string>("recent")
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({})

  useEffect(() => {
    const loadFavorites = async () => {
      setLoading(true)
      try {
        const data = await getUserFavorites()
        setFavorites(data)
      } catch (error) {
        console.error('Error loading favorites:', error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os favoritos",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadFavorites()
  }, [toast])

  const handleRemove = async (offerId: string) => {
    try {
      await toggleFavorite(offerId)
      setFavorites(favorites.filter(fav => fav.offer_id !== offerId))
      toast({
        title: "Removido dos favoritos",
        description: "Oferta removida com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover dos favoritos",
        variant: "destructive",
      })
    }
  }

  const handleSaveNotes = async (offerId: string, notes: string) => {
    try {
      await updateFavoriteNotes(offerId, notes)
      setFavorites(favorites.map(fav => 
        fav.offer_id === offerId 
          ? { ...fav, personal_notes: notes }
          : fav
      ))
      setEditingNotes({ ...editingNotes, [offerId]: '' })
      toast({
        title: "Notas salvas",
        description: "Suas notas foram salvas com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as notas",
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

  // Filter and sort favorites
  let filteredFavorites = [...favorites]
  
  if (nicheFilter) {
    filteredFavorites = filteredFavorites.filter(
      (fav) => {
        const nicheValue = typeof fav.offer?.niche === 'string' ? fav.offer.niche : (fav.offer?.niche as any)?.name || ''
        return nicheValue.toLowerCase() === nicheFilter.toLowerCase()
      }
    )
  }
  
  if (countryFilter) {
    filteredFavorites = filteredFavorites.filter(
      (fav) => fav.offer?.country === countryFilter
    )
  }

  if (sortBy === "recent") {
    filteredFavorites.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  } else if (sortBy === "oldest") {
    filteredFavorites.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }

  const uniqueNiches = Array.from(new Set(favorites.map(fav => {
    const niche = fav.offer?.niche
    return typeof niche === 'string' ? niche : (niche as any)?.name || niche
  }).filter(Boolean))) as string[]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent break-words">
          Favoritos
        </h1>
        <p className="text-muted-foreground text-lg">
          Suas ofertas salvas para modelar
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Label>Filtrar por Nicho</Label>
          <Select value={nicheFilter || "all"} onValueChange={(value) => setNicheFilter(value === "all" ? undefined : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os nichos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {uniqueNiches.map((niche) => (
                <SelectItem key={niche} value={niche}>
                  {niche}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <Label>Filtrar por País</Label>
          <Select value={countryFilter || "all"} onValueChange={(value) => setCountryFilter(value === "all" ? undefined : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os países" />
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

        <div className="flex-1 min-w-[200px]">
          <Label>Ordenar por</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais recentes</SelectItem>
              <SelectItem value="oldest">Mais antigos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Favorites List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border">
              <CardHeader>
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredFavorites.length > 0 ? (
        <div className="space-y-4">
          {filteredFavorites.map((favorite) => {
            const offer = favorite.offer
            if (!offer) return null

            return (
              <Card key={favorite.id} className="hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {offer.category && (
                          <Badge variant="secondary">{offer.category.name}</Badge>
                        )}
                        <Badge variant="outline">
                          {getCountryIcon(offer.country)} {getCountryName(offer.country)}
                        </Badge>
                        {offer.niche && (
                          <Badge variant="outline">
                            {typeof offer.niche === 'string' ? offer.niche : (offer.niche as any)?.name || 'Nicho'}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl mb-2">{offer.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {offer.short_description || 'Sem descrição'}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(offer.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Link href={`/offer/${offer.id}`} className="flex-1">
                      <Button className="w-full" variant="outline">
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalhes
                      </Button>
                    </Link>
                    {(offer as any).original_url && (
                      <Button variant="outline" asChild>
                        <a href={(offer as any).original_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Ver original
                        </a>
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Suas notas pessoais</Label>
                    {editingNotes[offer.id] !== undefined ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingNotes[offer.id]}
                          onChange={(e) => setEditingNotes({ ...editingNotes, [offer.id]: e.target.value })}
                          placeholder="Adicione suas notas sobre esta oferta..."
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveNotes(offer.id, editingNotes[offer.id])}
                          >
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingNotes({ ...editingNotes, [offer.id]: '' })
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground min-h-[60px] p-3 bg-muted rounded-md">
                          {favorite.personal_notes || "Nenhuma nota adicionada ainda..."}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingNotes({ ...editingNotes, [offer.id]: favorite.personal_notes || '' })}
                        >
                          {favorite.personal_notes ? "Editar notas" : "Adicionar notas"}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Salvo em {new Date(favorite.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum favorito ainda</h3>
            <p className="text-muted-foreground mb-4">
              {nicheFilter || countryFilter 
                ? "Nenhum favorito encontrado com os filtros selecionados"
                : "Comece salvando ofertas que você gostou para acessá-las depois"}
            </p>
            {!nicheFilter && !countryFilter && (
              <Link href="/library">
                <Button>Explorar Biblioteca</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
