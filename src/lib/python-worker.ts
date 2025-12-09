/**
 * Helper para chamar scripts Python do pipeline profissional
 * Executa workers Python e retorna resultados
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

const WORKERS_DIR = path.join(process.cwd(), 'workers')
const PYTHON_CMD = process.env.PYTHON_CMD || 'py -3.12'

export interface PreprocessResult {
  processedPath: string
  embeddingPath: string
  metadata: {
    duration: number
    samples: number
    target_sr: number
  }
}

export interface EmbeddingResult {
  embedding: number[]
  shape: number[]
  similarity?: number
}

/**
 * Pré-processa áudio e extrai embedding usando pipeline Python
 */
export async function preprocessAndExtractEmbedding(
  audioUrl: string,
  outputDir: string
): Promise<PreprocessResult> {
  try {
    let audioBuffer: Buffer
    
    // Verificar se é data URL (modo desenvolvimento)
    if (audioUrl.startsWith('data:')) {
      // Extrair base64 de data URL
      const base64Match = audioUrl.match(/^data:[^;]+;base64,(.+)$/)
      if (!base64Match) {
        throw new Error('Data URL inválida')
      }
      audioBuffer = Buffer.from(base64Match[1], 'base64')
    } else {
      // Baixar áudio de URL normal
      const response = await fetch(audioUrl)
      if (!response.ok) {
        throw new Error(`Erro ao baixar áudio: ${response.statusText}`)
      }
      audioBuffer = Buffer.from(await response.arrayBuffer())
    }
    
    // Salvar temporariamente
    const fs = require('fs')
    const tmpDir = path.join(process.cwd(), 'tmp')
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true })
    }

    const tmpInputPath = path.join(tmpDir, `input_${Date.now()}.mp3`)
    fs.writeFileSync(tmpInputPath, audioBuffer)

    const tmpOutputPath = path.join(tmpDir, `output_${Date.now()}.wav`)
    const embeddingPath = `${tmpOutputPath}.emb.json`

    // Executar script Python
    const scriptPath = path.join(WORKERS_DIR, 'preprocess_and_embed.py')
    const command = `${PYTHON_CMD} "${scriptPath}" --input "${tmpInputPath}" --out "${tmpOutputPath}" --target-sr 24000`

    
    const { stdout, stderr } = await execAsync(command, {
      cwd: WORKERS_DIR,
      maxBuffer: 10 * 1024 * 1024, // 10MB
    })

    if (stderr && !stderr.includes('RuntimeWarning')) {
      console.warn(`⚠️ Python stderr: ${stderr}`)
    }


    // Ler embedding JSON
    const embeddingData = JSON.parse(fs.readFileSync(embeddingPath, 'utf-8'))

    // Limpar arquivo temporário de entrada
    try {
      fs.unlinkSync(tmpInputPath)
    } catch (e) {
      // Ignorar erro de limpeza
    }

    return {
      processedPath: tmpOutputPath,
      embeddingPath: embeddingPath,
      metadata: {
        duration: embeddingData.metadata?.duration || 0,
        samples: embeddingData.metadata?.samples || 0,
        target_sr: 24000,
      },
    }
  } catch (error: any) {
    console.error('❌ Erro no pipeline Python:', error)
    throw new Error(`Erro no pré-processamento Python: ${error.message}`)
  }
}

/**
 * Processa múltiplos áudios e combina embeddings
 */
export async function processMultipleAudios(
  audioUrls: string[],
  outputDir: string
): Promise<{
  processedAudios: PreprocessResult[]
  combinedEmbedding: EmbeddingResult
}> {
  const processedAudios: PreprocessResult[] = []

  // Processar cada áudio
  for (let i = 0; i < audioUrls.length; i++) {
    const result = await preprocessAndExtractEmbedding(audioUrls[i], outputDir)
    processedAudios.push(result)
  }

  // Combinar embeddings (usar script Python)
  const embeddings = processedAudios.map(a => a.embeddingPath)
  
  // Executar script de combinação (criar se necessário)
  // Por enquanto, usar média simples
  const fs = require('fs')
  const allEmbeddings = embeddings.map(path => {
    const data = JSON.parse(fs.readFileSync(path, 'utf-8'))
    return data.embedding
  })

  // Calcular média
  const combined = allEmbeddings.reduce((acc, emb) => {
    return acc.map((val: number, idx: number) => val + emb[idx])
  }, new Array(allEmbeddings[0].length).fill(0)).map((val: number) => val / allEmbeddings.length)

  // Normalizar
  const norm = Math.sqrt(combined.reduce((sum: number, val: number) => sum + val * val, 0))
  const normalized = combined.map((val: number) => val / norm)

  return {
    processedAudios,
    combinedEmbedding: {
      embedding: normalized,
      shape: [normalized.length],
    },
  }
}

/**
 * Valida geração usando pipeline Python
 */
export async function validateGeneration(
  referenceEmbeddingPath: string,
  generatedAudioUrl: string,
  threshold: number = 0.82
): Promise<{
  similarity: number
  ok: boolean
  status: 'ok' | 'review' | 'reject'
}> {
  try {
    // Baixar áudio gerado
    const response = await fetch(generatedAudioUrl)
    const audioBuffer = Buffer.from(await response.arrayBuffer())

    // Salvar temporariamente
    const fs = require('fs')
    const tmpDir = path.join(process.cwd(), 'tmp')
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true })
    }

    const tmpGeneratedPath = path.join(tmpDir, `generated_${Date.now()}.wav`)
    fs.writeFileSync(tmpGeneratedPath, audioBuffer)

    // Executar script de validação
    const scriptPath = path.join(WORKERS_DIR, 'validate_generation.py')
    const command = `${PYTHON_CMD} "${scriptPath}" --reference "${referenceEmbeddingPath}" --generated "${tmpGeneratedPath}" --threshold ${threshold}`


    const { stdout, stderr } = await execAsync(command, {
      cwd: WORKERS_DIR,
      maxBuffer: 10 * 1024 * 1024,
    })

    if (stderr) {
      console.warn(`⚠️ Python stderr: ${stderr}`)
    }

    // 🚨 CRÍTICO: Extrair JSON do stdout
    // O JSON pode estar em qualquer linha, procurar pela última linha que seja JSON válido
    const lines = stdout.trim().split('\n')
    let result: any = { similarity: 0, ok: false, status: 'reject' }
    
    // Tentar parsear da última linha para a primeira
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim()
      if (line.startsWith('{') && line.endsWith('}')) {
        try {
          result = JSON.parse(line)
          break
        } catch (e) {
          // Continuar procurando
        }
      }
    }
    
    // Se não encontrou JSON válido, tentar extrair similaridade do stderr (fallback)
    if (!result.similarity && stderr) {
      const similarityMatch = stderr.match(/Similaridade[:\s]+([0-9.]+)/i)
      if (similarityMatch) {
        result.similarity = parseFloat(similarityMatch[1])
        result.ok = result.similarity >= 0.82
        result.status = result.ok ? 'ok' : (result.similarity >= 0.75 ? 'review' : 'reject')
      }
    }

    // Limpar arquivo temporário
    try {
      fs.unlinkSync(tmpGeneratedPath)
    } catch (e) {
      // Ignorar
    }

    return {
      similarity: result.similarity || 0,
      ok: result.ok || false,
      status: result.status || 'reject',
    }
  } catch (error: any) {
    console.error('❌ Erro na validação Python:', error)
    return {
      similarity: 0,
      ok: false,
      status: 'reject',
    }
  }
}

