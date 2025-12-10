"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getOfferById, OfferWithCategory, registerOfferView } from "@/lib/db/offers"
import { isFavorite, toggleFavorite } from "@/lib/db/favorites"
import { ExternalLink, Heart, Share2, Copy, Check, Download, FileText, Image, Video, Globe, Flame, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuthStore } from "@/store/auth-store"
import { Label } from "@/components/ui/label"
import { COUNTRIES } from "@/lib/constants"
import { createTicket } from "@/lib/db/tickets"

export default function OfferDetailsPage() {
  const params = useParams()
  const offerId = params.id as string
  const [offer, setOffer] = useState<OfferWithCategory | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFav, setIsFav] = useState(false)
  const { profile, user } = useAuthStore()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [reporting, setReporting] = useState(false)

  useEffect(() => {
    const loadOffer = async () => {
      setLoading(true)
      try {
        const offerData = await getOfferById(offerId)
        if (offerData) {
          setOffer(offerData)
          // Check if favorite
          const favorite = await isFavorite(offerId)
          setIsFav(favorite)
        }
      } catch (error) {
        console.error('Error loading offer:', error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar a oferta",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    if (offerId) {
      loadOffer()
    }
  }, [offerId, toast])

  // Registrar visualização em um useEffect separado para evitar setState durante render
  useEffect(() => {
    if (offer && offerId) {
      // Registrar visualização de forma assíncrona sem bloquear o render
      registerOfferView(offerId).catch((error) => {
        console.error('Error registering offer view:', error)
        // Não mostrar erro ao usuário, apenas logar
      })
    }
  }, [offer, offerId])

  // Sistema baseado em planos - não há mais cobrança de créditos

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
        // Buscar nome do país no array COUNTRIES
        const countryObj = COUNTRIES.find(c => c.code === country.code)
        return countryObj?.name || country.code
      }
      return 'N/A'
    }
    // Se for string, buscar no array COUNTRIES
    const countryObj = COUNTRIES.find(c => c.code === country)
    return countryObj?.name || country
  }

  const handleFavorite = async () => {
    try {
      const newFavorite = await toggleFavorite(offerId)
      setIsFav(newFavorite)
      toast({
        title: newFavorite ? "Adicionado aos favoritos" : "Removido dos favoritos",
        description: newFavorite ? "Oferta salva com sucesso" : "Oferta removida com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os favoritos",
        variant: "destructive",
      })
    }
  }

  const handleCopy = () => {
    if (offer) {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Link copiado",
        description: "O link foi copiado para a área de transferência",
      })
    }
  }

  const handleShare = async () => {
    if (navigator.share && offer) {
      try {
        await navigator.share({
          title: offer.title,
          text: offer.short_description || '',
          url: window.location.href,
        })
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      handleCopy()
    }
  }

  const handleReportInactive = async () => {
    if (!user || !offer) return

    try {
      setReporting(true)
      
      const subject = `Oferta Desativada: ${offer.title}`
      const message = `O usuário reportou que a oferta "${offer.title}" (ID: ${offer.id}) está desativada.\n\n` +
        `URL da oferta: ${window.location.href}\n` +
        (offer.main_url ? `URL principal: ${offer.main_url}\n` : '') +
        `\nPor favor, verifique e atualize o status da oferta.`

      await createTicket(user.id, subject, message)
      
      toast({
        title: "Reporte enviado",
        description: "Obrigado por nos avisar! Nossa equipe irá verificar a oferta.",
      })
    } catch (error: any) {
      console.error('Erro ao reportar oferta:', error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar o reporte. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setReporting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (!offer) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Oferta não encontrada</p>
            <Link href="/library">
              <Button className="mt-4">Voltar para Biblioteca</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <h1 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold mb-2 break-words">{offer.title}</h1>
          <p className="text-muted-foreground text-lg">{offer.short_description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleFavorite}>
            <Heart className={`h-4 w-4 ${isFav ? 'fill-current text-red-500' : ''}`} />
          </Button>
          <Button variant="outline" size="icon" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Offer Structure */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Estrutura da Oferta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(offer as any).headline ? (
                <div>
                  <Label className="text-sm font-semibold">Headline</Label>
                  <p className="text-sm text-muted-foreground mt-1">{(offer as any).headline}</p>
                </div>
              ) : null}
              {(offer as any).subheadline ? (
                <div>
                  <Label className="text-sm font-semibold">Subheadline</Label>
                  <p className="text-sm text-muted-foreground mt-1">{(offer as any).subheadline}</p>
                </div>
              ) : null}
              {(offer as any).hook ? (
                <div>
                  <Label className="text-sm font-semibold">Hook</Label>
                  <p className="text-sm text-muted-foreground mt-1">{(offer as any).hook}</p>
                </div>
              ) : null}
              {(offer as any).big_idea ? (
                <div>
                  <Label className="text-sm font-semibold text-primary">Big Idea</Label>
                  <p className="text-sm mt-1 font-medium">{(offer as any).big_idea}</p>
                </div>
              ) : null}
              {(offer as any).bullets && Array.isArray((offer as any).bullets) && (offer as any).bullets.length > 0 ? (
                <div>
                  <Label className="text-sm font-semibold">Bullets</Label>
                  <ul className="list-disc list-inside space-y-1 mt-1 text-sm text-muted-foreground">
                    {(offer as any).bullets.map((bullet: string, idx: number) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {(offer as any).cta_text ? (
                <div>
                  <Label className="text-sm font-semibold">CTA</Label>
                  <p className="text-sm text-muted-foreground mt-1">{(offer as any).cta_text}</p>
                </div>
              ) : null}
              {!(offer as any).headline && !(offer as any).subheadline && !(offer as any).hook && !(offer as any).big_idea && 
               (!(offer as any).bullets || !Array.isArray((offer as any).bullets) || (offer as any).bullets.length === 0) && 
               !(offer as any).cta_text && (
                <div className="space-y-3 py-4">
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Nenhuma informação de estrutura disponível para esta oferta.
                  </p>
                  
                  {/* Mostrar URLs cadastradas */}
                  {(offer.main_url || offer.facebook_ads_url || offer.vsl_url || offer.drive_copy_url || offer.drive_creatives_url || offer.quiz_url) && (
                    <div className="border-t pt-4 space-y-3">
                      <Label className="text-sm font-semibold">Links e Recursos</Label>
                      
                      {offer.main_url && (
                        <div>
                          <Label className="text-xs text-muted-foreground">URL Principal</Label>
                          <a 
                            href={offer.main_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline block mt-1 break-all"
                          >
                            {offer.main_url}
                          </a>
                        </div>
                      )}
                      
                      {offer.facebook_ads_url && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Facebook Ads</Label>
                          <a 
                            href={offer.facebook_ads_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline block mt-1 break-all"
                          >
                            {offer.facebook_ads_url}
                          </a>
                        </div>
                      )}
                      
                      {offer.vsl_url && (
                        <div>
                          <Label className="text-xs text-muted-foreground">VSL</Label>
                          <a 
                            href={offer.vsl_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline block mt-1 break-all"
                          >
                            {offer.vsl_url}
                          </a>
                        </div>
                      )}
                      
                      {offer.drive_copy_url && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Drive - Copy</Label>
                          <a 
                            href={offer.drive_copy_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline block mt-1 break-all"
                          >
                            {offer.drive_copy_url}
                          </a>
                        </div>
                      )}
                      
                      {offer.drive_creatives_url && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Drive - Criativos</Label>
                          <a 
                            href={offer.drive_creatives_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline block mt-1 break-all"
                          >
                            {offer.drive_creatives_url}
                          </a>
                        </div>
                      )}
                      
                      {offer.quiz_url && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Quiz</Label>
                          <a 
                            href={offer.quiz_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline block mt-1 break-all"
                          >
                            {offer.quiz_url}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis */}
          {(offer as any).analysis && (
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Análise: Por que converte?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {(offer as any).analysis}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <Card className="rounded-2xl shadow-lg overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(offer as any).original_url && (
                <Button variant="outline" className="w-full" asChild> 
                  <a href={(offer as any).original_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ver Oferta Original
                  </a>
                </Button>
              )}
              
              <div className="flex flex-col gap-3">
                {offer.funnel_type && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tipo de Funil</span>
                    <span className="font-medium text-card-foreground">{offer.funnel_type}</span>
                  </div>
                )}
                
                {offer.conversion_rate && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Taxa de Conversão</span>
                    <span className="font-medium text-card-foreground">{offer.conversion_rate}%</span>
                  </div>
                )}
                
                {offer.temperature && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Temperatura</span>
                    <Badge className="bg-orange-600 dark:bg-orange-600/90 text-white px-3 py-1 rounded-full">
                      {offer.temperature === 'hot' ? (
                        <>
                          🔥 Muito Quente
                        </>
                      ) : (
                        offer.temperature
                      )}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Botão de Reportar Oferta Desativada */}
              <div className="pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10" 
                  onClick={handleReportInactive}
                  disabled={reporting || !user}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  {reporting ? "Enviando..." : "Reportar Oferta Desativada"}
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Ajude-nos a manter a qualidade. Reporte se esta oferta estiver desativada.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Creator Notes */}
          {(offer as any).creator_notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas do Criador</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {(offer as any).creator_notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
