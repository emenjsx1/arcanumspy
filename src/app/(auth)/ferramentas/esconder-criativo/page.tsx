"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Eye, Wrench } from "lucide-react"

export default function EsconderCriativoPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#ff5a1f] rounded-lg">
              <Eye className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Esconder Criativo</h1>
              <p className="text-gray-400">Esconda seus criativos de visualizações</p>
            </div>
          </div>
        </div>

        <Card className="bg-[#0a0a0a] border-[#2a2a2a]">
          <CardContent className="pt-12 pb-12">
            <div className="flex flex-col items-center justify-center text-center space-y-6">
              <div className="p-4 bg-yellow-500/10 rounded-full">
                <Wrench className="h-12 w-12 text-yellow-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Em Manutenção</h2>
                <p className="text-gray-400 max-w-md">
                  Esta funcionalidade está temporariamente indisponível para melhorias. 
                  Estamos trabalhando para trazer uma experiência ainda melhor em breve.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

