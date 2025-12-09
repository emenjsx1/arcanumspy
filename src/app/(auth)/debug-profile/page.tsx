"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/store/auth-store"
import { getCurrentUserProfile } from "@/lib/db/profiles"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function DebugProfilePage() {
  const { user, profile, refreshProfile } = useAuthStore()
  const [directProfile, setDirectProfile] = useState<any>(null)
  const [rawQuery, setRawQuery] = useState<any>(null)

  useEffect(() => {
    const loadProfile = async () => {
      // Tentar carregar perfil diretamente
      const direct = await getCurrentUserProfile()
      setDirectProfile(direct)

      // Tentar query raw
      if (user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setRawQuery({ data, error })
      }
    }

    loadProfile()
  }, [user])

  const handleRefresh = async () => {
    await refreshProfile()
    const direct = await getCurrentUserProfile()
    setDirectProfile(direct)
  }

  return (
    <div className="container py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Debug Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-bold mb-2">Auth Store Profile:</h3>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </div>

          <div>
            <h3 className="font-bold mb-2">Direct getCurrentUserProfile():</h3>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
              {JSON.stringify(directProfile, null, 2)}
            </pre>
          </div>

          <div>
            <h3 className="font-bold mb-2">Raw Supabase Query:</h3>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
              {JSON.stringify(rawQuery, null, 2)}
            </pre>
          </div>

          <div>
            <h3 className="font-bold mb-2">User Info:</h3>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
              {JSON.stringify({ id: user?.id, email: user?.email }, null, 2)}
            </pre>
          </div>

          <Button onClick={handleRefresh}>Refresh Profile</Button>
        </CardContent>
      </Card>
    </div>
  )
}












