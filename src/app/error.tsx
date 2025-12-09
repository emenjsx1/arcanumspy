"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log do erro para monitoramento
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="container flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold">Erro</CardTitle>
          <CardDescription className="text-xl">
            Algo deu errado
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {error.message || "Ocorreu um erro inesperado. Por favor, tente novamente."}
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={reset}>
              Tentar novamente
            </Button>
            <Link href="/">
              <Button variant="outline">
                Voltar para Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



