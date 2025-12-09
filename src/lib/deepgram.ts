/**
 * Cliente Deepgram para transcrição de áudio
 * Suporta áudio pré-gravado e streaming em tempo real
 */

import { createClient } from '@deepgram/sdk'

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || 'a41077af75ad26c59b39b1ed53483add6d8fd95c'

if (!DEEPGRAM_API_KEY) {
  console.warn('⚠️ DEEPGRAM_API_KEY não configurada. Configure no .env.local')
}

/**
 * Cria cliente Deepgram
 */
export function getDeepgramClient() {
  return createClient(DEEPGRAM_API_KEY)
}

/**
 * Opções padrão para transcrição
 */
export interface TranscriptionOptions {
  model?: string
  language?: string
  smart_format?: boolean
  punctuate?: boolean
  diarize?: boolean
  paragraphs?: boolean
  utterances?: boolean
}

export const DEFAULT_OPTIONS: TranscriptionOptions = {
  model: 'nova-2', // Modelo mais recente e preciso
  language: 'pt-BR', // Português do Brasil
  smart_format: true, // Formatação inteligente (números, datas, etc)
  punctuate: true, // Pontuação automática
  diarize: false, // Identificar diferentes falantes
  paragraphs: false,
  utterances: false
}

