"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getAdminStats, AdminStats } from "@/lib/db/admin/stats"
import { getRecentUsers, UserWithSubscription } from "@/lib/db/admin/users"
import { getTopOffers, OfferWithViews } from "@/lib/db/admin/offers"
import { Users, TrendingUp, BookOpen, Shield, Eye } from "lucide-react"
import Link from "next/link"

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<UserWithSubscription[]>([])
  const [topOffers, setTopOffers] = useState<OfferWithViews[]>([])
  const [loading, setLoading] = useState(true)
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
        const loadStartTime = Date.now()
        const [statsData, usersData, offersData] = await Promise.all([
          getAdminStats(),
          getRecentUsers(10),
          getTopOffers(10),
        ])
        const loadTime = Date.now() - loadStartTime
        
        setStats(statsData)
        setRecentUsers(usersData)
        setTopOffers(offersData)
        setDataLoaded(true)
        
        const totalTime = Date.now() - startTime
      } catch (error) {
        console.error('❌ [Admin Dashboard] Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
        setIsLoadingData(false)
      }
    }
    
    loadData()
  }, [dataLoaded, isLoadingData])

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard Administrativo</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Visão geral do sistema
        </p>
      </div>

      {/* Metrics */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.newUsersToday} novos hoje
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Créditos Carregados</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCreditsLoaded.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Total de créditos comprados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Créditos Consumidos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCreditsConsumed.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Total de créditos gastos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ofertas Ativas</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeOffers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalOffers} total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Top Offers */}
        <Card>
          <CardHeader>
            <CardTitle>Ofertas Mais Vistas</CardTitle>
            <CardDescription>Top 10 ofertas mais acessadas</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : topOffers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Oferta</TableHead>
                    <TableHead>Visualizações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topOffers.map((offer) => (
                    <TableRow key={offer.id}>
                      <TableCell>
                        <Link href={`/admin/offers/${offer.id}`} className="hover:underline">
                          {offer.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {offer.views_count || 0}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma oferta encontrada</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Últimos Cadastros</CardTitle>
            <CardDescription>Usuários cadastrados recentemente</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentUsers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name || 'Sem nome'}</div>
                          <div className="text-xs text-muted-foreground">ID: {user.id.slice(0, 8)}...</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {user.email || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum usuário encontrado</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
