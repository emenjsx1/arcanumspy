import { NextRequest, NextResponse } from "next/server"
import { getAllUsers } from "@/lib/db/admin/users"

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '0', 10)
    
    
    // Usar a função getAllUsers que já tem tratamento de erro e busca todos os usuários
    const users = await getAllUsers()
    
    // Se houver limite, aplicar
    const limitedUsers = limit > 0 ? users.slice(0, limit) : users
    
    const totalTime = Date.now() - startTime

    // Mapear para o formato esperado pela página
    const mappedUsers = limitedUsers.map(user => ({
      id: user.id,
      name: user.name,
      phone_number: user.phone_number || null,
      email: user.email || null,
      role: user.role,
      created_at: user.created_at,
      subscription: user.subscriptions?.[0] || null,
    }))

    return NextResponse.json({ users: mappedUsers })
  } catch (error: any) {
    console.error('❌ [API Admin Users] Erro ao buscar usuários:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}

