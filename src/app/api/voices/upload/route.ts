/**
 * Endpoint de Upload de Áudios
 * Recebe múltiplos áudios, salva no storage e enfileira job para processamento
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { saveToStorage } from "@/lib/storage"
import { enqueueJob } from "@/lib/queue"

export async function POST(request: NextRequest) {
  
  try {
    const supabase = await createClient()
    
    // Autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado", details: authError?.message },
        { status: 401 }
      )
    }
    
    
    // Ler FormData
    const formData = await request.formData()
    const name = formData.get("name") as string | null
    const audioCount = parseInt(formData.get("audioCount") as string || "1")
    const transcripts = formData.get("transcripts") 
      ? JSON.parse(formData.get("transcripts") as string) 
      : []
    
    // Coletar arquivos
    const audioFiles: File[] = []
    for (let i = 0; i < audioCount; i++) {
      const file = formData.get(`audio${i}`) as File | null
      if (file) {
        audioFiles.push(file)
      }
    }
    
    if (audioFiles.length < 2) {
      return NextResponse.json(
        { error: "Envie pelo menos 2 arquivos de áudio" },
        { status: 400 }
      )
    }
    
    // Salvar arquivos no storage
    const audioUrls: string[] = []
    
    for (let i = 0; i < audioFiles.length; i++) {
      const file = audioFiles[i]
      const fileExtension = file.name.split('.').pop() || 'wav'
      const fileName = `voice-uploads/${user.id}/${Date.now()}-${i}.${fileExtension}`
      
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      const url = await saveToStorage(buffer, fileName)
      audioUrls.push(url)
      
    }
    
    // Criar job para worker processar
    const jobPayload = {
      name: name || `Voz ${new Date().toLocaleDateString('pt-BR')}`,
      urls: audioUrls,
      userId: user.id,
      transcripts: transcripts
    }
    
    const job = await enqueueJob("build-voice", jobPayload)
    
    
    return NextResponse.json({
      success: true,
      jobId: job.id,
      urls: audioUrls,
      message: "Áudios enviados com sucesso. Processamento iniciado."
    })
    
  } catch (error: any) {
    console.error('❌ Erro no upload:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao processar upload" },
      { status: 500 }
    )
  }
}

