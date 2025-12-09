"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CATEGORIES } from "@/lib/constants"
import { ArrowRight, Flame, Sparkles } from "lucide-react"

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent break-words">
          Categorias
        </h1>
        <p className="text-muted-foreground text-lg">
          Explore ofertas por categoria
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        {CATEGORIES.map((category) => (
          <Link key={category.id} href={`/library?category=${category.slug}`}>
            <Card className="hover:shadow-xl transition-all border-2 hover:border-primary/50 cursor-pointer h-full group hover:scale-[1.02] bg-gradient-to-br from-background via-background to-muted/20">
              <CardHeader className="p-3 md:p-6">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl">{category.icon}</div>
                  <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <CardTitle className="text-base md:text-lg lg:text-xl">{category.name}</CardTitle>
                <CardDescription className="text-xs md:text-sm">{category.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-3 md:p-6 pt-0">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                  <span className="text-xs md:text-sm text-muted-foreground">
                    {category.offerCount || 28} ofertas
                  </span>
                  <div className="flex gap-1 md:gap-2">
                    {category.slug === 'nutra' || category.slug === 'crypto' ? (
                      <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                        <Flame className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" />Muita demanda
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                        <Sparkles className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" />Crescendo
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
