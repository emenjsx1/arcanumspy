import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { CATEGORIES } from "@/lib/constants"
import { withLongCache } from "@/lib/api-cache"

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Try to get categories from Supabase
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })

    // If error or no data, return static categories as fallback
    if (error || !data || data.length === 0) {
      const response = NextResponse.json({ categories: CATEGORIES.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        emoji: cat.icon || null,
        description: cat.description || null,
        is_premium: false,
        created_at: new Date().toISOString(),
      })) })
      return withLongCache(response)
    }

    const response = NextResponse.json({ categories: data })
    return withLongCache(response) // Cache de 5 minutos (dados estáticos)
  } catch (error: any) {
    // Fallback to static categories if there's any error
    const response = NextResponse.json({ categories: CATEGORIES.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      emoji: cat.icon || cat.emoji,
      description: cat.description,
      is_premium: false,
      created_at: new Date().toISOString(),
    })) })
    return withLongCache(response)
  }
}

