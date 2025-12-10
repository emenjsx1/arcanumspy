import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { scanDomain } from "@/lib/domain-scan/domainScanService"
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { isAuthenticatedServer } from '@/lib/auth/isAuthenticated'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação usando função reutilizável
    const authenticated = await isAuthenticatedServer(request)
    
    if (!authenticated) {
      return NextResponse.json(
        { error: "Não autenticado. Faça login para continuar." },
        { status: 401 }
      )
    }

    // Obter usuário autenticado
    let supabase = await createClient()
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Se falhar via cookies, tentar via header
    if (authError || !user) {
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        })
        const { data: { user: userFromToken } } = await supabase.auth.getUser(token)
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

    const body = await request.json()
    const domain = body.domain || body.dominio // Aceitar ambos os formatos

    if (!domain) {
      return NextResponse.json(
        { error: "Domínio é obrigatório" },
        { status: 400 }
      )
    }

    // Executar scan completo do domínio
    const scanResult = await scanDomain(domain)

    // Extrair domínio base para histórico (sem protocolo)
    let baseDomain = domain.trim()
    if (baseDomain.startsWith('http://') || baseDomain.startsWith('https://')) {
      baseDomain = baseDomain.replace(/^https?:\/\//, '')
    }
    baseDomain = baseDomain.split('/')[0]

    // Converter resultado para formato compatível com histórico antigo
    const urlsEncontradas = [
      ...scanResult.urls_found.map(url => ({
        url: url.url,
        status: 'active',
        tipo: url.type,
        statusCode: 200
      })),
      ...scanResult.sensitive_routes
        .filter(r => r.accessible)
        .map(r => ({
          url: `${baseDomain}${r.path}`,
          status: r.status >= 200 && r.status < 300 ? 'active' : 'redirect',
          tipo: r.type,
          statusCode: r.status
        })),
      ...scanResult.subdomains
        .filter(s => s.accessible)
        .map(s => ({
          url: s.url,
          status: 'active',
          tipo: 'subdomain',
          statusCode: s.status
        }))
    ]

    // Salvar histórico da verificação (formato antigo para compatibilidade)
    const { data: historico, error: historicoError } = await (supabase
      .from('espiao_dominios_historico') as any)
      .insert({
        user_id: user.id,
        dominio: baseDomain,
        urls_encontradas: urlsEncontradas
      })
      .select()
      .single()

    if (historicoError) {
      console.error('Erro ao salvar histórico:', historicoError)
    }

    // Retornar resultado completo no novo formato + campos de compatibilidade
    return NextResponse.json({
      success: true,
      // Novo formato completo
      ...scanResult,
      // Campos de compatibilidade com frontend existente
      dominio: baseDomain,
      urls: urlsEncontradas,
      total: urlsEncontradas.length
    })
  } catch (error: any) {
    console.error('Erro ao escanear domínio:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação usando função reutilizável
    const authenticated = await isAuthenticatedServer(request)
    
    if (!authenticated) {
      return NextResponse.json(
        { error: "Não autenticado. Faça login para continuar." },
        { status: 401 }
      )
    }

    // Obter usuário autenticado
    let supabase = await createClient()
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Se falhar via cookies, tentar via header
    if (authError || !user) {
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        })
        const { data: { user: userFromToken } } = await supabase.auth.getUser(token)
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

    // Buscar histórico de verificações
    const { data, error } = await supabase
      .from('espiao_dominios_historico')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json(
        { error: "Erro ao buscar histórico", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      historico: data || []
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

