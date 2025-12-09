"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Youtube, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CanalYoutubePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#ff5a1f] rounded-lg">
            <Youtube className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white break-words">Canal no YouTube</h1>
            <p className="text-gray-400 text-lg">Acesse nosso canal no YouTube</p>
          </div>
        </div>
      </div>

      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-white">Clube da Escala - YouTube</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-400">
            Acesse nosso canal no YouTube para ver vídeos exclusivos, tutoriais e muito mais.
          </p>
          <Button className="bg-[#ff5a1f] hover:bg-[#ff4d29] text-white">
            <ExternalLink className="mr-2 h-4 w-4" />
            Acessar Canal
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

