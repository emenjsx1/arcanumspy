import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Cache simples em memória para evitar múltiplas verificações
const authCache = new Map<string, { user: any; timestamp: number }>()
const CACHE_TTL = 5000 // 5 segundos de cache

/**
 * Middleware global authGuard - OTIMIZADO
 * Protege rotas automaticamente e redireciona para /login se não autenticado
 * Com cache para evitar verificações repetidas
 */
export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl
    
    // Rotas públicas (não requerem autenticação)
    const publicRoutes = [
      '/',
      '/login',
      '/signup',
      '/pricing',
      '/about',
      '/contact',
      '/auth/callback',
      '/forgot-password',
      '/reset-password',
    ]

    // Verificar se é uma rota pública
    const isPublicRoute = publicRoutes.some(route => 
      pathname === route || pathname.startsWith(route)
    )

    // OTIMIZAÇÃO: Pular verificação de autenticação para rotas públicas e assets
    // CORREÇÃO: Permitir todos os arquivos estáticos do Next.js
    // IMPORTANTE: Esta verificação deve estar ANTES de qualquer processamento
    if (
      isPublicRoute || 
      pathname.startsWith('/_next') || 
      pathname.startsWith('/_next/static') ||
      pathname.startsWith('/_next/image') ||
      pathname.startsWith('/_next/webpack') ||
      pathname.startsWith('/_next/chunks') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/favicon') ||
      pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot|css|js)$/)
    ) {
      return NextResponse.next()
    }

    // CORREÇÃO: Verificar se variáveis de ambiente estão configuradas
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('⚠️ Variáveis de ambiente do Supabase não configuradas')
      // Se não estiver configurado, permitir acesso a rotas públicas
      if (isPublicRoute) {
        return NextResponse.next()
      }
      // Para rotas protegidas, redirecionar para login
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // OTIMIZAÇÃO: Verificar cache primeiro
    const cacheKey = request.cookies.get('sb-auth-token')?.value || 'no-token'
    const cached = authCache.get(cacheKey)
    const now = Date.now()

    let user = null
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      // Usar cache se ainda válido
      user = cached.user
    } else {
      // Criar cliente Supabase apenas se necessário
      let response = NextResponse.next({
        request: {
          headers: request.headers,
        },
      })

      try {
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          {
            cookies: {
              get(name: string) {
                return request.cookies.get(name)?.value
              },
              set(name: string, value: string, options: any) {
                request.cookies.set({
                  name,
                  value,
                  ...options,
                })
                response = NextResponse.next({
                  request: {
                    headers: request.headers,
                  },
                })
                response.cookies.set({
                  name,
                  value,
                  ...options,
                })
              },
              remove(name: string, options: any) {
                request.cookies.set({
                  name,
                  value: '',
                  ...options,
                })
                response = NextResponse.next({
                  request: {
                    headers: request.headers,
                  },
                })
                response.cookies.set({
                  name,
                  value: '',
                  ...options,
                })
              },
            },
          }
        )

        // Verificar autenticação com timeout
        try {
          const authPromise = supabase.auth.getUser()
          const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) =>
            setTimeout(() => resolve({ data: { user: null } }), 2000)
          )
          
          const { data: { user: authUser } } = await Promise.race([authPromise, timeoutPromise])
          user = authUser

          // Atualizar cache
          authCache.set(cacheKey, { user, timestamp: now })
          
          // Limpar cache antigo (manter apenas últimos 100)
          if (authCache.size > 100) {
            const oldestKey = Array.from(authCache.entries())
              .sort((a, b) => a[1].timestamp - b[1].timestamp)[0]?.[0]
            if (oldestKey) authCache.delete(oldestKey)
          }
        } catch (error) {
          // Em caso de erro, considerar não autenticado
          console.error('⚠️ Erro ao verificar autenticação:', error)
          user = null
        }
      } catch (error) {
        // Em caso de erro ao criar cliente Supabase, permitir acesso a rotas públicas
        console.error('⚠️ Erro ao criar cliente Supabase:', error)
        if (isPublicRoute) {
          return NextResponse.next()
        }
        user = null
      }
    }

  // CORREÇÃO: Verificar se cookies existem mas usuário não é válido (estado inconsistente)
  // Se houver cookies mas não houver usuário válido, pode ser estado inconsistente
  const hasAuthCookies = request.cookies.get('sb-auth-token') || 
                          Array.from(request.cookies.getAll()).some(c => c.name.includes('sb-') && c.name.includes('auth'))
  
  if (hasAuthCookies && !user && !isPublicRoute) {
    // Cookies existem mas usuário não é válido - pode ser sessão expirada ou inconsistente
    // Limpar cache e permitir que o cliente lide com isso
    authCache.delete(cacheKey)
  }

  // Se está autenticado e tenta acessar login/signup, redirecionar para dashboard
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Se não é rota pública e não está autenticado, redirecionar para login
  // CORREÇÃO: Adicionar verificação para evitar loops de redirecionamento
  if (!isPublicRoute && !user) {
    // Verificar se já está sendo redirecionado para login para evitar loops
    if (pathname === '/login' || pathname === '/signup') {
      return NextResponse.next()
    }
    
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    
    const redirectResponse = NextResponse.redirect(url)
    redirectResponse.headers.set('x-auth-required', 'true')
    redirectResponse.headers.set('x-redirect-from', pathname)
    
    return redirectResponse
  }

    return NextResponse.next()
  } catch (error) {
    // CORREÇÃO: Em caso de erro inesperado, permitir acesso a rotas públicas
    console.error('❌ Erro crítico no middleware:', error)
    const { pathname } = request.nextUrl
    const publicRoutes = ['/', '/login', '/signup', '/pricing']
    const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route))
    
    if (isPublicRoute || pathname.startsWith('/_next') || pathname.startsWith('/api')) {
      return NextResponse.next()
    }
    
    // Para outras rotas, redirecionar para login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _next/webpack (webpack chunks)
     * - _next/chunks (webpack chunks)
     * - favicon.ico (favicon file)
     * - public folder
     * - static assets (images, fonts, css, js, etc)
     * 
     * CORREÇÃO: Garantir que todos os assets estáticos do Next.js são excluídos
     */
    '/((?!_next/static|_next/image|_next/webpack|_next/chunks|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|eot|ico|css|js)$).*)',
  ],
}

