import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // Try to get user from cookies first
    const supabase = await createClient()
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // If that fails, try from Authorization header
    if (authError || !user) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        // Create a new client with the token
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const tempClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        })
        const { data: { user: userFromToken } } = await tempClient.auth.getUser(token)
        if (userFromToken) {
          user = userFromToken
        }
      }
    }
    
    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    // Check if user is admin using adminClient to bypass RLS
    let adminClient
    try {
      adminClient = createAdminClient()
    } catch (adminError: any) {
      console.error('Erro ao criar admin client:', adminError)
      return NextResponse.json(
        { error: adminError.message || "Erro de configuração do servidor" },
        { status: 500 }
      )
    }

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('❌ [PUT /api/admin/offers/:id] Erro ao buscar perfil:', profileError)
      return NextResponse.json(
        { error: "Erro ao verificar permissões" },
        { status: 500 }
      )
    }

    const profileRole = profile ? (profile as unknown as { role?: string }).role : null
    if (profileRole !== 'admin') {
      console.warn('⚠️ [PUT /api/admin/offers/:id] Usuário não é admin:', profileRole)
      return NextResponse.json(
        { error: "Não autorizado. Apenas administradores podem atualizar ofertas." },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log('📥 [PUT /api/admin/offers/:id] Body recebido:', {
      id,
      title: body.title,
      hasImageUrl: !!body.image_url,
      imageUrl: body.image_url,
      language: body.language,
      category_id: body.category_id
    })
    
    const {
      title,
      short_description,
      category_id,
      niche_id,
      country,
      language,
      funnel_type,
      temperature,
      main_url,
      facebook_ads_url,
      vsl_url,
      drive_copy_url,
      drive_creatives_url,
      quiz_url,
      is_active,
      headline,
      subheadline,
      hook,
      big_idea,
      bullets,
      cta_text,
      analysis,
      creator_notes,
      scaled_at,
      expires_at,
      image_url,
    } = body

    // adminClient já foi criado acima

    const updates: any = {}
    if (title !== undefined) updates.title = title
    if (short_description !== undefined) updates.short_description = short_description
    if (category_id !== undefined) updates.category_id = category_id
    if (niche_id !== undefined) updates.niche_id = niche_id
    if (country !== undefined) updates.country = country
    // language pode não existir no schema cache - não incluir para evitar erro PGRST204
    // A migration 050 precisa ser executada e o PostgREST precisa ser reiniciado
    // if (language !== undefined && language !== null) {
    //   updates.language = language
    // }
    if (funnel_type !== undefined) updates.funnel_type = funnel_type
    if (temperature !== undefined) updates.temperature = temperature
    if (main_url !== undefined) updates.main_url = main_url
    if (facebook_ads_url !== undefined) updates.facebook_ads_url = facebook_ads_url
    if (vsl_url !== undefined) updates.vsl_url = vsl_url
    if (drive_copy_url !== undefined) updates.drive_copy_url = drive_copy_url
    if (drive_creatives_url !== undefined) updates.drive_creatives_url = drive_creatives_url
    if (quiz_url !== undefined) updates.quiz_url = quiz_url
    if (is_active !== undefined) updates.is_active = is_active
    // Campos de estrutura da oferta (apenas se fornecidos e não nulos)
    if (headline !== undefined && headline !== null) updates.headline = headline
    if (subheadline !== undefined && subheadline !== null) updates.subheadline = subheadline
    if (hook !== undefined && hook !== null) updates.hook = hook
    if (big_idea !== undefined && big_idea !== null) updates.big_idea = big_idea
    if (bullets !== undefined && bullets !== null) updates.bullets = bullets
    if (cta_text !== undefined && cta_text !== null) updates.cta_text = cta_text
    // analysis e creator_notes só serão adicionados se a migration 024 foi executada
    if (analysis !== undefined && analysis !== null) {
      try {
        updates.analysis = analysis
      } catch (e) {
        // Ignorar se a coluna não existir
        console.warn('⚠️ Campo analysis não disponível, ignorando')
      }
    }
    if (creator_notes !== undefined && creator_notes !== null) {
      try {
        updates.creator_notes = creator_notes
      } catch (e) {
        // Ignorar se a coluna não existir
        console.warn('⚠️ Campo creator_notes não disponível, ignorando')
      }
    }
    // Campos de escalamento e expiração
    if (scaled_at !== undefined) updates.scaled_at = scaled_at || null
    if (expires_at !== undefined) updates.expires_at = expires_at || null
    // Campo de imagem
    if (image_url !== undefined) {
      updates.image_url = image_url || null
      console.log('🖼️ [PUT /api/admin/offers/:id] Atualizando image_url:', image_url || 'null')
    }
    
    console.log('💾 [PUT /api/admin/offers/:id] Updates a serem aplicados:', {
      hasImageUrl: !!updates.image_url,
      imageUrl: updates.image_url,
      language: 'não incluído (coluna pode não existir)',
      totalFields: Object.keys(updates).length
    })

    const { data: offer, error } = await adminClient
      .from('offers')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        category:categories(id, name, slug, emoji)
      `)
      .single()

    if (error) {
      console.error('❌ [PUT /api/admin/offers/:id] Erro ao atualizar:', error)
      
      // Se o erro for relacionado a coluna não encontrada, tentar sem campos opcionais
      if (error.code === 'PGRST204' || error.message?.includes('schema cache') || error.message?.includes('column')) {
        console.warn('⚠️ Coluna não encontrada, tentando atualizar sem campos opcionais de estrutura')
        
        // Remover campos de estrutura que podem não existir
        const safeUpdates: any = {}
        if (title !== undefined) safeUpdates.title = title
        if (short_description !== undefined) safeUpdates.short_description = short_description
        if (category_id !== undefined) safeUpdates.category_id = category_id
        if (niche_id !== undefined) safeUpdates.niche_id = niche_id
        if (country !== undefined) safeUpdates.country = country
        // language pode não existir - não incluir no safeUpdates para evitar erro
        // if (language !== undefined) safeUpdates.language = language || null
        if (funnel_type !== undefined) safeUpdates.funnel_type = funnel_type
        if (temperature !== undefined) safeUpdates.temperature = temperature
        if (main_url !== undefined) safeUpdates.main_url = main_url
        if (facebook_ads_url !== undefined) safeUpdates.facebook_ads_url = facebook_ads_url
        if (vsl_url !== undefined) safeUpdates.vsl_url = vsl_url
        if (drive_copy_url !== undefined) safeUpdates.drive_copy_url = drive_copy_url
        if (drive_creatives_url !== undefined) safeUpdates.drive_creatives_url = drive_creatives_url
        if (quiz_url !== undefined) safeUpdates.quiz_url = quiz_url
        if (is_active !== undefined) safeUpdates.is_active = is_active
        if (image_url !== undefined) safeUpdates.image_url = image_url || null
        
        const { data: retryOffer, error: retryError } = await adminClient
          .from('offers')
          .update(safeUpdates)
          .eq('id', id)
          .select('*')
          .single()
        
        if (retryError) {
          return NextResponse.json(
            { 
              error: retryError.message || "Erro ao atualizar oferta",
              details: retryError.details || null,
              code: retryError.code || null,
              hint: "Execute a migration 024_add_offer_structure_fields.sql para adicionar campos de estrutura"
            },
            { status: 500 }
          )
        }
        
        return NextResponse.json({ offer: retryOffer })
      }
      
            throw error
          }

          console.log('✅ [PUT /api/admin/offers/:id] Oferta atualizada com sucesso:', {
            id: offer?.id,
            title: offer?.title,
            image_url: offer?.image_url,
            language: offer?.language
          })

          return NextResponse.json({ offer })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar oferta" },
      { status: 500 }
    )
  }
}

