/**
 * Endpoint de Criação de Modelo
 * Cria modelo na Fish API ou localmente
 * Pode ser chamado diretamente ou pelo worker
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { saveModelToDB } from "@/lib/db-voice"

const FISH_AUDIO_API_KEY = process.env.FISH_AUDIO_API_KEY
const FISH_AUDIO_API_URL = process.env.FISH_AUDIO_API_URL || "https://api.fish.audio"

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
    
    const body = await request.json()
    const { name, urls, transcripts } = body
    
    if (!urls || !urls.length) {
      return NextResponse.json(
        { error: "Nenhuma URL de áudio fornecida" },
        { status: 400 }
      )
    }
    
    // Baixar e converter arquivos para base64
    const audiosPayload: any[] = []
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i]
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Erro ao baixar áudio ${i + 1}: ${response.statusText}`)
      }
      
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const base64 = buffer.toString('base64')
      
      audiosPayload.push({
        filename: `audio_${i + 1}.wav`,
        content_base64: base64,
        transcript: (transcripts && transcripts[i]) || ""
      })
    }
    
    // Criar modelo na Fish API
    const payload = {
      name: name || `Voz ${new Date().toISOString()}`,
      audios: audiosPayload
    }
    
    
    let modelId: string | null = null
    let fishResponse: any = null
    
    try {
      const response = await fetch(`${FISH_AUDIO_API_URL}/v1/models`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FISH_AUDIO_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Erro na Fish API:', errorText)
        throw new Error(`Fish API error: ${response.status} ${errorText}`)
      }
      
      fishResponse = await response.json()
      modelId = fishResponse.id || fishResponse.model_id || fishResponse.result?.id
      
      
    } catch (error: any) {
      console.error('❌ Erro ao criar modelo na Fish:', error)
      // Fallback: usar modelo local
      modelId = `local-${Date.now()}`
    }
    
    if (!modelId) {
      return NextResponse.json(
        { error: "Não foi possível criar modelo" },
        { status: 500 }
      )
    }
    
    // Salvar no banco
    const voiceModel = await saveModelToDB({
      userId: user.id,
      name: name || `Voz ${new Date().toLocaleDateString('pt-BR')}`,
      model_id: modelId,
      audio_urls: urls,
      metadata: {
        fish_response: fishResponse,
        transcripts: transcripts
      }
    })
    
    
    return NextResponse.json({
      success: true,
      model_id: modelId,
      voiceModel: {
        id: voiceModel.id,
        name: voiceModel.name,
        model_id: voiceModel.model_id,
        status: voiceModel.status
      },
      fish_response: fishResponse
    })
    
  } catch (error: any) {
    console.error('❌ Erro ao criar modelo:', error)
    return NextResponse.json(
      { error: error.message || "Erro ao criar modelo" },
      { status: 500 }
    )
  }
}

