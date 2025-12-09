"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserCircle, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function MentoriaIndividualPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#ff5a1f] rounded-lg">
            <UserCircle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white break-words">Mentoria Individual</h1>
            <p className="text-gray-400 text-lg">Agende uma mentoria personalizada</p>
          </div>
        </div>
      </div>

      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-white">Agendar Mentoria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-400">
            Agende uma sessão de mentoria individual para receber orientação personalizada.
          </p>
          <Button className="bg-[#ff5a1f] hover:bg-[#ff4d29] text-white">
            <Calendar className="mr-2 h-4 w-4" />
            Agendar Agora
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

