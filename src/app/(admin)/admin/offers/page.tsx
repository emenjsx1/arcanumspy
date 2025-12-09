"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { getAllCategories } from "@/lib/db/categories"
import { supabase } from "@/lib/supabase/client"
import { Plus, Edit, Trash2, Eye, Zap, Upload, X, Image as ImageIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { COUNTRIES, FORMATS, NICHES, PRODUCT_TYPES, LANGUAGES } from "@/lib/constants"

type OfferWithCategory = {
  id: string
  title: string
  short_description?: string | null
  category_id?: string
  niche_id?: string | null
  country?: string
  funnel_type?: string
  temperature?: string
  main_url?: string
  facebook_ads_url?: string | null
  vsl_url?: string | null
  drive_copy_url?: string | null
  drive_creatives_url?: string | null
  quiz_url?: string | null
  is_active?: boolean
  category?: {
    id: string
    name: string
    slug: string
    emoji?: string | null
  }
  niche?: {
    id: string
    name: string
    slug: string
  }
}

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<OfferWithCategory[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [savingOffer, setSavingOffer] = useState(false)
  const [search, setSearch] = useState("")
  const [editingOffer, setEditingOffer] = useState<OfferWithCategory | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  const loadOffers = async () => {
    const startTime = Date.now()
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error('❌ [loadOffers] Sem sessão')
        toast({
          title: "Erro",
          description: "Sessão expirada. Por favor, faça login novamente.",
          variant: "destructive",
        })
        return
      }

      const fetchStartTime = Date.now()
      const response = await fetch('/api/admin/offers', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      
      const fetchTime = Date.now() - fetchStartTime
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ [loadOffers] Erro na resposta:', response.status, errorData)
        throw new Error(errorData.error || 'Erro ao carregar ofertas')
      }
      
      const parseStartTime = Date.now()
      const data = await response.json()
      const parseTime = Date.now() - parseStartTime
      
      setOffers(data.offers || [])
      
      const totalTime = Date.now() - startTime
    } catch (error: any) {
      console.error('❌ [loadOffers] Erro ao carregar ofertas:', error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível carregar as ofertas",
        variant: "destructive",
      })
    }
  }

  // CORREÇÃO: Flags para evitar múltiplas execuções simultâneas
  const [dataLoaded, setDataLoaded] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)

  useEffect(() => {
    // CORREÇÃO: Se já carregou os dados ou está carregando, não executar novamente
    if (dataLoaded || isLoadingData) return

    const loadData = async () => {
      // Marcar como carregando para evitar execuções simultâneas
      setIsLoadingData(true)
      const startTime = Date.now()
      
      setLoading(true)
      try {
        // OTIMIZAÇÃO: Carregar categorias e ofertas em paralelo
        const loadStartTime = Date.now()
        const [categoriesData] = await Promise.all([
          getAllCategories(),
        ])
        const categoriesTime = Date.now() - loadStartTime
        
        setCategories(categoriesData)
        
        // Carregar ofertas em paralelo (não precisa esperar categorias)
        const offersStartTime = Date.now()
        await loadOffers()
        const offersTime = Date.now() - offersStartTime
        
        setDataLoaded(true)
        const totalTime = Date.now() - startTime
      } catch (error) {
        console.error('❌ [Admin Offers Page] Erro ao carregar dados:', error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
        setIsLoadingData(false)
      }
    }
    
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast, dataLoaded, isLoadingData])

  const filteredOffers = offers.filter((offer) =>
    offer.title.toLowerCase().includes(search.toLowerCase()) ||
    offer.category?.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (offerId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta oferta?')) return
    
    try {
      const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', offerId)
      
      if (error) throw error
      
      setOffers(offers.filter((o) => o.id !== offerId))
      toast({
        title: "Oferta removida",
        description: "A oferta foi removida com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover a oferta",
        variant: "destructive",
      })
    }
  }

  const handleToggleStatus = async (offerId: string) => {
    try {
      const offer = offers.find(o => o.id === offerId)
      if (!offer) return
      
      const { error } = await supabase
        .from('offers')
        .update({ is_active: !offer.is_active })
        .eq('id', offerId)
      
      if (error) throw error
      
      setOffers(offers.map((o) =>
        o.id === offerId ? { ...o, is_active: !o.is_active } : o
      ))
      toast({
        title: "Status alterado",
        description: "O status da oferta foi atualizado",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status",
        variant: "destructive",
      })
    }
  }

  const handleSaveOffer = async (data: any) => {
    if (savingOffer) {
      return
    }
    
    setSavingOffer(true)
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Erro ao obter sessão:', sessionError)
        toast({
          title: "Erro",
          description: "Erro ao verificar autenticação: " + sessionError.message,
          variant: "destructive",
        })
        return
      }
      
      if (!session) {
        console.error('Sessão não encontrada')
        toast({
          title: "Erro",
          description: "Não autenticado. Por favor, faça login novamente.",
          variant: "destructive",
        })
        return
      }

      const url = editingOffer ? `/api/admin/offers/${editingOffer.id}` : '/api/admin/offers'
      const method = editingOffer ? 'PUT' : 'POST'

      const payload = {
        title: data.title,
        short_description: data.short_description || null,
        category_id: data.category_id,
        niche_id: data.niche_id && data.niche_id !== 'none' ? data.niche_id : null,
        country: data.country || 'BR',
        language: data.language || 'pt',
        funnel_type: data.funnel_type,
        temperature: data.temperature || 'testing',
        main_url: data.main_url,
        facebook_ads_url: data.facebook_ads_url || null,
        vsl_url: data.vsl_url || null,
        drive_copy_url: data.drive_copy_url || null,
        drive_creatives_url: data.drive_creatives_url || null,
        quiz_url: data.quiz_url || null,
        is_active: data.is_active !== undefined ? data.is_active : true,
        headline: data.headline || null,
        subheadline: data.subheadline || null,
        hook: data.hook || null,
        big_idea: data.big_idea || null,
        bullets: data.bullets || null,
        cta_text: data.cta_text || null,
        analysis: data.analysis || null,
        scaled_at: data.scaled_at || null,
        expires_at: data.expires_at || null,
        image_url: data.image_url || null,
      }

      console.log('📤 [handleSaveOffer] Enviando payload:', {
        url,
        method,
        hasImageUrl: !!payload.image_url,
        imageUrl: payload.image_url,
        language: payload.language,
        title: payload.title
      })
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      })

      const responseData = await response.json().catch((parseError) => {
        console.error('❌ [handleSaveOffer] Erro ao parsear resposta:', parseError)
        return { error: 'Erro ao processar resposta do servidor' }
      })

      console.log('📥 [handleSaveOffer] Resposta do servidor:', {
        status: response.status,
        ok: response.ok,
        hasOffer: !!responseData.offer,
        offerImageUrl: responseData.offer?.image_url,
        offerLanguage: responseData.offer?.language
      })

      if (!response.ok) {
        console.error('❌ [handleSaveOffer] Erro ao salvar oferta:', responseData)
        throw new Error(responseData.error || `Erro ${response.status}: ${response.statusText}`)
      }

      console.log('✅ [handleSaveOffer] Oferta salva com sucesso:', {
        id: responseData.offer?.id,
        title: responseData.offer?.title,
        image_url: responseData.offer?.image_url,
        language: responseData.offer?.language
      })

      toast({
        title: editingOffer ? "Oferta atualizada" : "Oferta criada",
        description: editingOffer ? "A oferta foi atualizada com sucesso" : "A nova oferta foi criada com sucesso",
      })
      
      await loadOffers()
      setEditingOffer(null)
      setIsDialogOpen(false)
    } catch (error: any) {
      console.error('ERRO CAPTURADO ao salvar oferta:', error)
      console.error('Stack trace:', error.stack)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar a oferta. Verifique o console para mais detalhes.",
        variant: "destructive",
      })
    } finally {
      setSavingOffer(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Ofertas</h1>
          <p className="text-muted-foreground">
            Gerencie todas as ofertas da biblioteca
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingOffer(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Oferta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingOffer ? "Editar Oferta" : "Nova Oferta"}</DialogTitle>
              <DialogDescription>
                Preencha os dados da oferta
              </DialogDescription>
            </DialogHeader>
            <OfferForm 
              offer={editingOffer} 
              categories={categories}
              onSave={handleSaveOffer}
              onCancel={() => {
                setEditingOffer(null)
                setIsDialogOpen(false)
              }}
              savingOffer={savingOffer}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder="Buscar ofertas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Offers Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Nicho</TableHead>
                  <TableHead>País</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOffers.length > 0 ? filteredOffers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell className="font-medium">{offer.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {offer.category?.name || 'Sem categoria'}
                      </Badge>
                    </TableCell>
                    <TableCell>{offer.niche?.name || '-'}</TableCell>
                    <TableCell>{offer.country || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={offer.is_active ? 'default' : 'secondary'}>
                        {offer.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/offer/${offer.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setEditingOffer(offer)
                            setIsDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(offer.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Nenhuma oferta encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function OfferForm({ 
  offer, 
  categories,
  onSave, 
  onCancel,
  savingOffer = false
}: { 
  offer: OfferWithCategory | null
  categories: any[]
  onSave: (data: any) => void
  onCancel: () => void
  savingOffer?: boolean
}) {
  const [formData, setFormData] = useState({
    title: offer?.title || '',
    short_description: offer?.short_description || '',
    category_id: offer?.category_id || '',
    niche_id: offer?.niche_id ? offer.niche_id : 'none',
    country: offer?.country || 'BR',
    language: (offer as any)?.language || 'pt',
    funnel_type: offer?.funnel_type || '',
    temperature: offer?.temperature || 'testing',
    main_url: offer?.main_url || '',
    facebook_ads_url: offer?.facebook_ads_url || '',
    vsl_url: offer?.vsl_url || '',
    drive_copy_url: offer?.drive_copy_url || '',
    drive_creatives_url: offer?.drive_creatives_url || '',
    quiz_url: offer?.quiz_url || '',
    is_active: offer?.is_active !== undefined ? offer.is_active : true,
    headline: (offer as any)?.headline || '',
    subheadline: (offer as any)?.subheadline || '',
    hook: (offer as any)?.hook || '',
    big_idea: (offer as any)?.big_idea || '',
    bullets: (offer as any)?.bullets || '',
    cta_text: (offer as any)?.cta_text || '',
    analysis: (offer as any)?.analysis || '',
    scaled_at: (offer as any)?.scaled_at || null,
    expires_at: (offer as any)?.expires_at || null,
    image_url: (offer as any)?.image_url || '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>((offer as any)?.image_url || null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [niches, setNiches] = useState<any[]>([])
  const [loadingNiches, setLoadingNiches] = useState(false)
  const [showCreateNiche, setShowCreateNiche] = useState(false)
  const [newNicheName, setNewNicheName] = useState('')
  const [showCreateFunnelType, setShowCreateFunnelType] = useState(false)
  const [newFunnelType, setNewFunnelType] = useState('')
  const { toast } = useToast()

  // Atualizar formData quando offer mudar
  useEffect(() => {
    if (offer) {
      setFormData({
        title: offer.title || '',
        short_description: offer.short_description || '',
        category_id: offer.category_id || '',
        niche_id: offer.niche_id ? offer.niche_id : 'none',
        country: offer.country || 'BR',
        language: (offer as any)?.language || 'pt',
        funnel_type: offer.funnel_type || '',
        temperature: offer.temperature || 'testing',
        main_url: offer.main_url || '',
        facebook_ads_url: offer.facebook_ads_url || '',
        vsl_url: offer.vsl_url || '',
        drive_copy_url: offer.drive_copy_url || '',
        drive_creatives_url: offer.drive_creatives_url || '',
        quiz_url: offer.quiz_url || '',
        is_active: offer.is_active !== undefined ? offer.is_active : true,
        headline: (offer as any)?.headline || '',
        subheadline: (offer as any)?.subheadline || '',
        hook: (offer as any)?.hook || '',
        big_idea: (offer as any)?.big_idea || '',
        bullets: (offer as any)?.bullets || '',
        cta_text: (offer as any)?.cta_text || '',
        analysis: (offer as any)?.analysis || '',
        scaled_at: (offer as any)?.scaled_at || null,
        expires_at: (offer as any)?.expires_at || null,
        image_url: (offer as any)?.image_url || '',
      })
    } else {
        // Reset form quando não há oferta
      setFormData({
        title: '',
        short_description: '',
        category_id: '',
        niche_id: 'none',
        country: 'BR',
        language: 'pt',
        funnel_type: '',
        temperature: 'testing',
        main_url: '',
        facebook_ads_url: '',
        vsl_url: '',
        drive_copy_url: '',
        drive_creatives_url: '',
        quiz_url: '',
        is_active: true,
        headline: '',
        subheadline: '',
        hook: '',
        big_idea: '',
        bullets: '',
        cta_text: '',
        analysis: '',
        scaled_at: null,
        expires_at: null,
        image_url: '',
      })
      setImagePreview(null)
      setImageFile(null)
      setNiches([])
    }
  }, [offer])

  const loadNiches = async (categoryId: string) => {
    setLoadingNiches(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.warn('⚠️ [OfferForm] Sem sessão, não é possível carregar nichos')
        setNiches([])
        return
      }

      const response = await fetch(`/api/niches?category_id=${categoryId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ [OfferForm] Erro na resposta da API:', response.status, errorData)
        throw new Error(errorData.error || 'Erro ao carregar nichos')
      }
      
      const data = await response.json()
      
      setNiches(data.niches || [])
      
      if (!data.niches || data.niches.length === 0) {
        console.warn('⚠️ [OfferForm] Nenhum nicho encontrado para esta categoria:', categoryId)
      }
    } catch (error: any) {
      console.error('❌ [OfferForm] Erro ao carregar nichos:', error)
      toast({
        title: "Aviso",
        description: error.message || "Não foi possível carregar os nichos. Você pode criar um novo nicho.",
        variant: "default",
      })
      setNiches([])
    } finally {
      setLoadingNiches(false)
    }
  }

  const handleCreateNiche = async (nicheName: string) => {
    
    if (!nicheName || !nicheName.trim()) {
      toast({
        title: "Erro",
        description: "Digite um nome para o nicho",
        variant: "destructive",
      })
      return
    }

    if (!formData.category_id) {
      toast({
        title: "Erro",
        description: "Selecione uma categoria primeiro",
        variant: "destructive",
      })
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Erro",
          description: "Não autenticado. Por favor, faça login novamente.",
          variant: "destructive",
        })
        return
      }

      // Criar nicho via API
      const response = await fetch('/api/niches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: nicheName.trim(),
          category_id: formData.category_id,
          slug: nicheName.toLowerCase().replace(/\s+/g, '-'),
        }),
      })

      const responseData = await response.json().catch(() => ({ error: 'Erro ao processar resposta' }))

      if (!response.ok) {
        console.error('Erro ao criar nicho:', responseData)
        throw new Error(responseData.error || `Erro ${response.status}: ${response.statusText}`)
      }

      
      toast({
        title: "Nicho criado",
        description: "O nicho foi criado com sucesso",
      })

      // Recarregar nichos e selecionar o novo
      await loadNiches(formData.category_id)
      if (responseData.niche?.id) {
        setFormData(prev => ({ ...prev, niche_id: responseData.niche.id }))
      }
      
      setShowCreateNiche(false)
      setNewNicheName('')
    } catch (error: any) {
      console.error('Erro ao criar nicho:', error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o nicho",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (formData.category_id) {
      loadNiches(formData.category_id)
    } else {
      setNiches([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.category_id])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Título *</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Título da oferta"
          />
        </div>
        <div className="space-y-2">
          <Label>Categoria *</Label>
          <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.emoji || '📁'} {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Descrição Curta</Label>
        <Textarea
          value={formData.short_description}
          onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
          placeholder="Breve descrição da oferta"
          rows={2}
        />
      </div>

      {/* Campo de Upload de Imagem */}
      <div className="space-y-2">
        <Label>Imagem da Oferta (opcional)</Label>
        <div className="space-y-3">
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => {
                  setImagePreview(null)
                  setImageFile(null)
                  setFormData({ ...formData, image_url: '' })
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
              <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Clique para fazer upload de uma imagem
              </p>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="image-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    // Validar tamanho (máximo 5MB)
                    if (file.size > 5 * 1024 * 1024) {
                      toast({
                        title: "Erro",
                        description: "A imagem deve ter no máximo 5MB",
                        variant: "destructive",
                      })
                      return
                    }
                    setImageFile(file)
                    const reader = new FileReader()
                    reader.onloadend = () => {
                      setImagePreview(reader.result as string)
                    }
                    reader.readAsDataURL(file)
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('image-upload')?.click()}
                disabled={uploadingImage}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadingImage ? "Enviando..." : "Selecionar Imagem"}
              </Button>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Formatos aceitos: JPG, PNG, WEBP. Tamanho máximo: 5MB
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Nicho</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowCreateNiche(!showCreateNiche)
              }}
              disabled={!formData.category_id}
            >
              {showCreateNiche ? 'Cancelar' : '+ Criar Novo'}
            </Button>
          </div>
          {showCreateNiche ? (
            <div className="flex gap-2">
              <Input
                placeholder="Nome do novo nicho"
                value={newNicheName}
                onChange={(e) => setNewNicheName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newNicheName.trim()) {
                    handleCreateNiche(newNicheName)
                  }
                }}
              />
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (newNicheName.trim()) {
                    handleCreateNiche(newNicheName)
                  } else {
                    toast({
                      title: "Aviso",
                      description: "Digite um nome para o nicho",
                      variant: "default",
                    })
                  }
                }}
                disabled={!newNicheName.trim() || loadingNiches}
              >
                {loadingNiches ? "Criando..." : "Criar"}
              </Button>
            </div>
          ) : (
            <Select 
              value={formData.niche_id || 'none'} 
              onValueChange={(value) => {
                setFormData(prev => ({ ...prev, niche_id: value === 'none' ? 'none' : value }))
              }}
              disabled={!formData.category_id || loadingNiches}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingNiches ? "Carregando..." : "Selecione um nicho"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="none" value="none">Nenhum</SelectItem>
                {niches.length > 0 && niches.map((niche) => (
                  <SelectItem key={`niche-${niche.id}`} value={niche.id}>
                    {niche.name}
                  </SelectItem>
                ))}
                {!loadingNiches && niches.length === 0 && formData.category_id && (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    Nenhum nicho encontrado
                  </div>
                )}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Tipo de Funil *</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowCreateFunnelType(!showCreateFunnelType)
              }}
            >
              {showCreateFunnelType ? 'Cancelar' : '+ Criar Novo'}
            </Button>
          </div>
          {showCreateFunnelType ? (
            <div className="flex gap-2">
              <Input
                placeholder="Nome do novo tipo de funil"
                value={newFunnelType}
                onChange={(e) => setNewFunnelType(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newFunnelType.trim()) {
                    const slug = newFunnelType.toLowerCase().replace(/\s+/g, '-')
                    setFormData({ ...formData, funnel_type: slug })
                    setShowCreateFunnelType(false)
                    setNewFunnelType('')
                  }
                }}
              />
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (newFunnelType.trim()) {
                    const slug = newFunnelType.toLowerCase().replace(/\s+/g, '-')
                    setFormData(prev => ({ ...prev, funnel_type: slug }))
                    setShowCreateFunnelType(false)
                    setNewFunnelType('')
                  }
                }}
                disabled={!newFunnelType.trim()}
              >
                Usar
              </Button>
            </div>
          ) : (
            <Select value={formData.funnel_type} onValueChange={(value) => setFormData({ ...formData, funnel_type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vsl">VSL</SelectItem>
                <SelectItem value="sl">SL</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="advertorial">Advertorial</SelectItem>
                <SelectItem value="longform">Longform</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>País *</Label>
          <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o país" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {COUNTRIES.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.flag} {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Idioma *</Label>
          <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o idioma" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Temperatura / Status *</Label>
          <Select value={formData.temperature} onValueChange={(value) => setFormData({ ...formData, temperature: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hot">🔥 Quente (Hot)</SelectItem>
              <SelectItem value="validated">✅ Validada</SelectItem>
              <SelectItem value="testing">🧪 Testando</SelectItem>
              <SelectItem value="highlighted">⭐ Em Destaque</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>URL Principal *</Label>
        <Input
          value={formData.main_url}
          onChange={(e) => setFormData({ ...formData, main_url: e.target.value })}
          placeholder="https://..."
          type="url"
        />
      </div>

      <div className="space-y-2">
        <Label>URL Facebook Ads (opcional)</Label>
        <Input
          value={formData.facebook_ads_url}
          onChange={(e) => setFormData({ ...formData, facebook_ads_url: e.target.value })}
          placeholder="https://..."
          type="url"
        />
      </div>

      <div className="space-y-2">
        <Label>URL VSL (opcional)</Label>
        <Input
          value={formData.vsl_url}
          onChange={(e) => setFormData({ ...formData, vsl_url: e.target.value })}
          placeholder="https://..."
          type="url"
        />
      </div>

      <div className="space-y-2">
        <Label>URL Drive - Copy (opcional)</Label>
        <Input
          value={formData.drive_copy_url}
          onChange={(e) => setFormData({ ...formData, drive_copy_url: e.target.value })}
          placeholder="https://..."
          type="url"
        />
      </div>

      <div className="space-y-2">
        <Label>URL Drive - Criativos (opcional)</Label>
        <Input
          value={formData.drive_creatives_url}
          onChange={(e) => setFormData({ ...formData, drive_creatives_url: e.target.value })}
          placeholder="https://..."
          type="url"
        />
      </div>

      <div className="space-y-2">
        <Label>URL Quiz (opcional)</Label>
        <Input
          value={formData.quiz_url}
          onChange={(e) => setFormData({ ...formData, quiz_url: e.target.value })}
          placeholder="https://..."
          type="url"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="is_active" className="cursor-pointer">
            Oferta ativa
          </Label>
        </div>
        
        <div className="space-y-2">
          <Label>Data de Expiração (opcional)</Label>
          <Input
            type="datetime-local"
            value={formData.expires_at ? new Date(formData.expires_at).toISOString().slice(0, 16) : ''}
            onChange={(e) => {
              const date = e.target.value ? new Date(e.target.value).toISOString() : null
              setFormData({ ...formData, expires_at: date })
            }}
            placeholder="Quando a oferta não estará mais disponível"
          />
          <p className="text-xs text-muted-foreground">
            Deixe vazio se a oferta não expira
          </p>
        </div>
      </div>

      <div className="space-y-2 border-t pt-4">
        <Label>Ofertas Escaladas</Label>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setFormData({ ...formData, scaled_at: new Date().toISOString() })
            toast({
              title: "Oferta marcada como escalando",
              description: "Esta oferta aparecerá na seção 'Ofertas Escalando' do dashboard",
            })
          }}
          className="w-full"
        >
          <Zap className="h-4 w-4 mr-2" />
          Marcar como Oferta Escalada
        </Button>
        {formData.scaled_at && (
          <p className="text-xs text-muted-foreground">
            Marcada como escalando em: {new Date(formData.scaled_at).toLocaleString('pt-BR')}
          </p>
        )}
      </div>

      {/* Estrutura da Oferta */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold">Estrutura da Oferta</h3>
        
        <div className="space-y-2">
          <Label>Headline</Label>
          <Textarea
            value={formData.headline}
            onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
            placeholder="Headline principal da oferta"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Subheadline</Label>
          <Textarea
            value={formData.subheadline}
            onChange={(e) => setFormData({ ...formData, subheadline: e.target.value })}
            placeholder="Subheadline da oferta"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Hook</Label>
          <Textarea
            value={formData.hook}
            onChange={(e) => setFormData({ ...formData, hook: e.target.value })}
            placeholder="Hook da oferta"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Big Idea</Label>
          <Textarea
            value={formData.big_idea}
            onChange={(e) => setFormData({ ...formData, big_idea: e.target.value })}
            placeholder="A grande ideia da oferta"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Bullets (um por linha)</Label>
          <Textarea
            value={Array.isArray(formData.bullets) ? formData.bullets.join('\n') : formData.bullets || ''}
            onChange={(e) => {
              const lines = e.target.value.split('\n').filter(line => line.trim())
              setFormData({ ...formData, bullets: lines.length > 0 ? lines : null })
            }}
            placeholder="Bullet 1&#10;Bullet 2&#10;Bullet 3"
            rows={5}
          />
        </div>

        <div className="space-y-2">
          <Label>CTA Text</Label>
          <Input
            value={formData.cta_text}
            onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
            placeholder="Texto do call-to-action"
          />
        </div>

        <div className="space-y-2">
          <Label>Análise</Label>
          <Textarea
            value={formData.analysis}
            onChange={(e) => setFormData({ ...formData, analysis: e.target.value })}
            placeholder="Análise: Por que esta oferta converte?"
            rows={5}
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          type="button"
          disabled={savingOffer || uploadingImage}
          onClick={async (e) => {
            e.preventDefault()
            e.stopPropagation()
            
            // Validar campos obrigatórios
            if (!formData.title || !formData.title.trim()) {
              toast({
                title: "Erro de Validação",
                description: "O título é obrigatório",
                variant: "destructive",
              })
              return
            }
            
            if (!formData.category_id) {
              toast({
                title: "Erro de Validação",
                description: "Selecione uma categoria",
                variant: "destructive",
              })
              return
            }
            
            if (!formData.funnel_type) {
              toast({
                title: "Erro de Validação",
                description: "Selecione um tipo de funil",
                variant: "destructive",
              })
              return
            }
            
            if (!formData.main_url || !formData.main_url.trim()) {
              toast({
                title: "Erro de Validação",
                description: "A URL principal é obrigatória",
                variant: "destructive",
              })
              return
            }
            
            if (!formData.country) {
              toast({
                title: "Erro de Validação",
                description: "Selecione um país",
                variant: "destructive",
              })
              return
            }
            
            try {
              // Se houver imagem para upload, fazer upload primeiro
              let finalImageUrl = formData.image_url
              if (imageFile) {
                setUploadingImage(true)
                try {
                  console.log('📤 Iniciando upload de imagem...', imageFile.name, imageFile.size)
                  const { data: { session } } = await supabase.auth.getSession()
                  if (!session) {
                    throw new Error("Não autenticado")
                  }

                  const formDataUpload = new FormData()
                  formDataUpload.append('image', imageFile)
                  
                  console.log('📡 Enviando requisição de upload...')
                  
                  // Criar AbortController para timeout
                  const controller = new AbortController()
                  const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 segundos
                  
                  try {
                    const uploadResponse = await fetch('/api/admin/offers/upload-image', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                      },
                      body: formDataUpload,
                      signal: controller.signal,
                    })
                    
                    clearTimeout(timeoutId)

                    console.log('📥 Resposta do upload:', uploadResponse.status, uploadResponse.statusText)

                    if (!uploadResponse.ok) {
                      const errorData = await uploadResponse.json().catch(() => ({}))
                      console.error('❌ Erro no upload:', errorData)
                      throw new Error(errorData.error || `Erro ${uploadResponse.status}: ${uploadResponse.statusText}`)
                    }

                    const uploadData = await uploadResponse.json()
                    console.log('📸 Upload response:', uploadData)
                    finalImageUrl = uploadData.imageUrl || uploadData.image_url
                    if (!finalImageUrl) {
                      console.error('❌ URL da imagem não encontrada na resposta:', uploadData)
                      throw new Error('URL da imagem não retornada pelo servidor')
                    }
                    console.log('✅ URL da imagem obtida:', finalImageUrl)
                    setFormData(prev => ({ ...prev, image_url: finalImageUrl }))
                  } catch (fetchError: any) {
                    clearTimeout(timeoutId)
                    if (fetchError.name === 'AbortError') {
                      console.error('❌ Timeout no upload')
                      throw new Error('Upload demorou muito tempo. Tente novamente com uma imagem menor.')
                    }
                    throw fetchError
                  }
                } catch (uploadError: any) {
                  console.error('❌ Erro completo no upload:', uploadError)
                  toast({
                    title: "Erro no Upload",
                    description: uploadError.message || "Erro ao fazer upload da imagem",
                    variant: "destructive",
                  })
                  setUploadingImage(false)
                  return
                } finally {
                  setUploadingImage(false)
                }
              }

              console.log('💾 [OfferForm] Salvando oferta com dados:', {
                title: formData.title,
                image_url: finalImageUrl,
                language: formData.language,
                category_id: formData.category_id,
                hasImageUrl: !!finalImageUrl
              })
              await onSave({ ...formData, image_url: finalImageUrl })
            } catch (error: any) {
              console.error('❌ Erro ao chamar onSave:', error)
              toast({
                title: "Erro",
                description: error.message || "Erro ao salvar oferta",
                variant: "destructive",
              })
            }
          }}
        >
          {uploadingImage ? "Enviando imagem..." : savingOffer ? "Salvando..." : (offer ? "Atualizar" : "Criar")} Oferta
        </Button>
      </DialogFooter>
    </div>
  )
}
