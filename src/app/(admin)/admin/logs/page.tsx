"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export default function AdminLogsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Logs e Auditoria</h1>
          <p className="text-muted-foreground">
            Histórico de ações do sistema
          </p>
        </div>
        <Button variant="outline" disabled>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">Sistema de logs em desenvolvimento</p>
            <p className="text-sm">Os logs serão exibidos aqui quando o sistema estiver completo.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

