/**
 * Coqui TTS Integration
 * Documentação: https://github.com/coqui-ai/TTS
 * 
 * Coqui TTS suporta:
 * - Text-to-Speech: Gerar fala natural com múltiplos modelos
 * - Voice Cloning: Clonar vozes a partir de áudios de referência
 * - Multi-lingual: Suporte para múltiplos idiomas incluindo português
 * - Modelos pré-treinados: VITS, FastSpeech2, Tacotron2, etc.
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { randomUUID } from 'crypto'

// Configurações do Coqui TTS
// IMPORTANTE: Usar XTTS v2 para melhor qualidade de clonagem de voz
// XTTS v2 é o modelo mais avançado do Coqui TTS para clonagem de voz
// Documentação: https://github.com/coqui-ai/TTS
// Nome correto do modelo: tts_models/multilingual/multi-dataset/xtts_v2
const COQUI_TTS_MODEL = process.env.COQUI_TTS_MODEL || 'tts_models/multilingual/multi-dataset/xtts_v2'
const COQUI_TTS_VOCODER = process.env.COQUI_TTS_VOCODER || undefined // XTTS v2 não precisa de vocoder separado
const COQUI_TTS_WORKER_DIR = process.env.COQUI_TTS_WORKER_DIR || path.join(process.cwd(), 'workers')
const COQUI_TTS_OUTPUT_DIR = process.env.COQUI_TTS_OUTPUT_DIR || path.join(process.cwd(), 'tmp', 'coqui-output')

/**
 * Opções para geração de TTS
 */
export interface CoquiTTSOptions {
  model?: string // Modelo TTS (padrão: XTTS v2 - tts_models/multilingual/multi-dataset/xtts_v2)
  vocoder?: string // Modelo vocoder (opcional - XTTS v2 não precisa)
  speed?: number // Velocidade: 0.5 a 2.0 (padrão: 1.0)
  speaker_wav?: string | string[] // Caminho(s) para arquivo(s) WAV de referência para clonagem de voz (XTTS v2 suporta múltiplos)
  language?: string // Idioma (obrigatório para XTTS v2: 'pt', 'en', 'es', 'fr', 'de', 'it', 'pl', 'tr', 'ar', 'zh', 'ja', 'ko')
  speaker_id?: string // ID do speaker (para modelos multi-speaker)
  emotion?: string // Emoção (se o modelo suportar)
  output_format?: 'wav' | 'mp3' // Formato de saída (padrão: wav)
  temperature?: number // Temperatura para XTTS v2 (0.0-1.0, padrão: 0.75) - controla aleatoriedade/naturalidade
  top_p?: number // Top-p para XTTS v2 (0.0-1.0, padrão: 0.85) - controla diversidade
  top_k?: number // Top-k para XTTS v2 (padrão: 50) - controla amostragem
}

/**
 * Resultado da geração de TTS
 */
export interface CoquiTTSResult {
  audioPath: string // Caminho do arquivo de áudio gerado
  audioBuffer: Buffer // Buffer do áudio
  duration?: number // Duração em segundos (se disponível)
  model: string // Modelo usado
}

/**
 * Gerar áudio TTS usando Coqui TTS
 * 
 * @param text Texto a ser convertido em fala
 * @param options Opções de geração
 * @returns Buffer do áudio gerado
 */
export async function generateTTS(
  text: string,
  options?: CoquiTTSOptions
): Promise<Buffer> {
  if (!text || text.trim().length === 0) {
    throw new Error('Texto não pode ser vazio')
  }

  // Garantir que o diretório de saída existe
  await fs.mkdir(COQUI_TTS_OUTPUT_DIR, { recursive: true })

  // Gerar nome único para o arquivo de saída
  const outputFileName = `tts_${randomUUID()}.${options?.output_format || 'wav'}`
  const outputPath = path.join(COQUI_TTS_OUTPUT_DIR, outputFileName)

  // Preparar comando Python
  const pythonScript = path.resolve(COQUI_TTS_WORKER_DIR, 'coqui_tts_generator.py')
  
  // Verificar se o script existe
  try {
    await fs.access(pythonScript)
  } catch {
    throw new Error(`Script Python não encontrado: ${pythonScript}. Certifique-se de que o arquivo existe.`)
  }

  // Preparar argumentos
  // IMPORTANTE: Garantir que outputPath está definido e é um caminho válido
  if (!outputPath || outputPath.trim() === '') {
    throw new Error('Caminho de saída não definido')
  }
  
  // Converter caminho para formato absoluto se necessário
  const absoluteOutputPath = path.isAbsolute(outputPath) 
    ? outputPath 
    : path.resolve(COQUI_TTS_OUTPUT_DIR, path.basename(outputPath))
  
  // Garantir que o diretório de saída existe
  const outputDir = path.dirname(absoluteOutputPath)
  await fs.mkdir(outputDir, { recursive: true })
  
  // Normalizar texto: remover quebras de linha múltiplas e substituir por espaços
  // Isso evita que o texto quebre os argumentos do comando
  const normalizedText = text
    .trim()
    .replace(/\r\n/g, ' ') // Windows line breaks
    .replace(/\n/g, ' ')   // Unix line breaks
    .replace(/\r/g, ' ')   // Old Mac line breaks
    .replace(/\s+/g, ' ')  // Múltiplos espaços -> um espaço
    .trim()
  
  if (!normalizedText || normalizedText.length === 0) {
    throw new Error('Texto não pode ser vazio após normalização')
  }
  
  // Usar arquivo temporário para textos longos ou com espaços para evitar problemas com argumentos
  // Isso é especialmente importante no Windows quando shell: true é usado
  const TEXT_FILE_THRESHOLD = 100 // Usar arquivo se texto tiver mais de 100 caracteres
  const useTextFile = normalizedText.length > TEXT_FILE_THRESHOLD || normalizedText.includes(' ')
  
  let textFilePath: string | undefined = undefined
  
  if (useTextFile) {
    // Criar diretório para arquivos de texto temporários
    const textFileDir = path.join(process.cwd(), 'tmp', 'coqui-text')
    await fs.mkdir(textFileDir, { recursive: true })
    
    // Criar arquivo temporário com o texto
    textFilePath = path.join(textFileDir, `text_${randomUUID()}.txt`)
    await fs.writeFile(textFilePath, normalizedText, 'utf-8')
  }
  
  // Construir argumentos na ordem correta
  const args: string[] = [
    pythonScript, // Caminho absoluto do script
    '--output', absoluteOutputPath, // Caminho absoluto (PRIMEIRO para garantir que não seja perdido)
    '--model', options?.model || COQUI_TTS_MODEL,
  ]
  
  // Adicionar texto via arquivo ou argumento direto
  if (useTextFile && textFilePath) {
    args.push('--text-file', textFilePath)
  } else {
    args.push('--text', normalizedText)
  }
  
  // Log dos argumentos para debug

  if (options?.vocoder) {
    args.push('--vocoder', options.vocoder)
  }

  if (options?.speed !== undefined) {
    args.push('--speed', options.speed.toString())
  }

  if (options?.speaker_wav) {
    // XTTS v2 suporta múltiplos arquivos de referência (melhor qualidade)
    // Se for array, juntar com vírgula
    const speakerWavValue = Array.isArray(options.speaker_wav) 
      ? options.speaker_wav.join(',')
      : options.speaker_wav
    args.push('--speaker_wav', speakerWavValue)
  }

  // XTTS v2 sempre requer language - é obrigatório
  if (options?.language) {
    args.push('--language', options.language)
  } else if (options?.model?.includes('xtts') || options?.model?.includes('v2') || !options?.model) {
    // Se for XTTS v2 (padrão) e não tiver language, usar 'pt' como padrão
    args.push('--language', 'pt')
  }

  if (options?.speaker_id) {
    args.push('--speaker_id', options.speaker_id)
  }

  if (options?.emotion) {
    args.push('--emotion', options.emotion)
  }

  // Adicionar parâmetros avançados do XTTS v2 para melhor qualidade (evitar voz robótica)
  if (options?.temperature !== undefined) {
    args.push('--temperature', options.temperature.toString())
  }
  
  if (options?.top_p !== undefined) {
    args.push('--top_p', options.top_p.toString())
  }
  
  if (options?.top_k !== undefined) {
    args.push('--top_k', options.top_k.toString())
  }

  // Executar script Python usando spawn para melhor controle de argumentos
  // Detectar comando Python correto para Windows
  let pythonCmd = process.env.PYTHON_CMD
  if (!pythonCmd) {
    // Tentar detectar automaticamente
    if (process.platform === 'win32') {
      pythonCmd = 'py -3.12' // Windows: usar py launcher
    } else {
      pythonCmd = 'python3' // Linux/Mac: usar python3
    }
  }
  
  // Separar comando e argumentos para Windows (py -3.12 script.py args...)
  const { spawn } = require('child_process')
  let pythonArgs: string[]
  let pythonExec: string
  
  if (pythonCmd.includes(' ')) {
    // Comando tem espaços (ex: "py -3.12")
    const parts = pythonCmd.split(' ')
    pythonExec = parts[0]
    pythonArgs = [...parts.slice(1), ...args]
  } else {
    // Comando simples (ex: "python3")
    pythonExec = pythonCmd
    pythonArgs = args
  }
  
  // Debug: mostrar exatamente o que será executado
  
  // Verificar se --output está nos argumentos
  const outputIndex = pythonArgs.indexOf('--output')
  if (outputIndex === -1 || outputIndex === pythonArgs.length - 1) {
    console.error('❌ ERRO: --output não encontrado nos argumentos!')
    console.error(`   Argumentos completos (primeiros 10): ${JSON.stringify(pythonArgs.slice(0, 10))}`)
    console.error(`   Argumentos completos (últimos 10): ${JSON.stringify(pythonArgs.slice(-10))}`)
    throw new Error('Argumento --output não está sendo passado corretamente')
  }
  const outputValue = pythonArgs[outputIndex + 1]
  if (!outputValue || outputValue.trim() === '') {
    console.error('❌ ERRO: --output está presente mas o valor está vazio!')
    throw new Error('Valor do argumento --output está vazio')
  }
  
  // Verificar se --text ou --text-file está nos argumentos
  const textIndex = pythonArgs.indexOf('--text')
  const textFileIndex = pythonArgs.indexOf('--text-file')
  
  if (textIndex === -1 && textFileIndex === -1) {
    console.error('❌ ERRO: --text ou --text-file não encontrado nos argumentos!')
    throw new Error('Argumento --text ou --text-file não está sendo passado corretamente')
  }
  
  if (textIndex !== -1 && textIndex !== pythonArgs.length - 1) {
    const textValue = pythonArgs[textIndex + 1]
  }
  
  if (textFileIndex !== -1 && textFileIndex !== pythonArgs.length - 1) {
    const textFileValue = pythonArgs[textFileIndex + 1]
  }
  
  return new Promise<Buffer>((resolve, reject) => {
    // Timeout de 10 minutos para geração de TTS (XTTS v2 pode demorar)
    const TIMEOUT_MS = 10 * 60 * 1000 // 10 minutos
    let timeoutId: NodeJS.Timeout | null = null
    
    const pythonProcess = spawn(pythonExec, pythonArgs, {
      cwd: COQUI_TTS_WORKER_DIR,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: process.platform === 'win32' // Usar shell no Windows para encontrar 'py'
    })
    
    let stdout = ''
    let stderr = ''
    
    // Configurar timeout
    timeoutId = setTimeout(() => {
      if (!pythonProcess.killed) {
        pythonProcess.kill('SIGTERM')
        reject(new Error(`Timeout: Geração de TTS demorou mais de ${TIMEOUT_MS / 1000 / 60} minutos. O modelo XTTS v2 pode estar sendo baixado pela primeira vez (isso pode demorar).`))
      }
    }, TIMEOUT_MS)
    
    pythonProcess.stdout.on('data', (data: Buffer) => {
      const text = data.toString()
      stdout += text
      // Log em tempo real para debug
      process.stdout.write(text)
    })
    
    pythonProcess.stderr.on('data', (data: Buffer) => {
      const text = data.toString()
      stderr += text
      // Log em tempo real para debug
      process.stderr.write(text)
    })
    
    pythonProcess.on('close', async (code: number) => {
      // Limpar timeout se o processo terminou
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      if (code !== 0) {
        console.error('❌ Coqui TTS erro:', stderr)
        
        // Detectar erro específico do torchaudio no Windows
        if (stderr.includes('torchaudio') || stderr.includes('libtorchaudio') || stderr.includes('WinError 127')) {
          const errorMessage = `Erro ao carregar torchaudio no Windows. Este é um problema comum de dependências.\n\n` +
            `SOLUÇÕES:\n` +
            `1. Reinstalar PyTorch e torchaudio:\n` +
            `   pip uninstall torch torchaudio\n` +
            `   pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu\n\n` +
            `2. Instalar Visual C++ Redistributables:\n` +
            `   https://aka.ms/vs/17/release/vc_redist.x64.exe\n\n` +
            `3. Verificar se Python e pip estão atualizados\n\n` +
            `Erro detalhado: ${stderr.substring(0, 500)}`
          reject(new Error(errorMessage))
        } else {
          reject(new Error(`Coqui TTS falhou com código ${code}: ${stderr.substring(0, 500)}`))
        }
        return
      }
      
      if (stderr) {
        console.warn('⚠️ Coqui TTS stderr:', stderr)
      }
      
      if (stdout) {
      }
      
      // Verificar se o arquivo foi gerado
      try {
        await fs.access(absoluteOutputPath)
      } catch {
        // Limpar arquivo temporário de texto em caso de erro
        if (textFilePath) {
          try {
            await fs.unlink(textFilePath).catch(() => {})
          } catch {}
        }
        reject(new Error(`Áudio não foi gerado: ${absoluteOutputPath}. Verifique os logs acima.`))
        return
      }
      
      // Ler o arquivo de áudio
      try {
        const audioBuffer = await fs.readFile(absoluteOutputPath)
        
        // Limpar arquivo temporário de texto se foi usado
        if (textFilePath) {
          try {
            await fs.unlink(textFilePath)
          } catch (cleanupError) {
            console.warn(`⚠️ Não foi possível remover arquivo temporário: ${textFilePath}`)
          }
        }
        
        resolve(audioBuffer)
      } catch (error: any) {
        // Limpar arquivo temporário mesmo em caso de erro
        if (textFilePath) {
          try {
            await fs.unlink(textFilePath).catch(() => {})
          } catch {}
        }
        reject(new Error(`Erro ao ler áudio gerado: ${error.message}`))
      }
    })
    
    pythonProcess.on('error', (error: Error) => {
      // Limpar timeout em caso de erro
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      // Limpar arquivo temporário em caso de erro
      if (textFilePath) {
        fs.unlink(textFilePath).catch(() => {})
      }
      reject(new Error(`Erro ao executar Python: ${error.message}`))
    })
  })

  if (useTextFile) {
  }
  
  // A execução agora é feita via Promise acima
}

/**
 * Clonar voz a partir de áudio de referência
 * 
 * @param text Texto a ser convertido em fala
 * @param referenceAudioPath Caminho para o arquivo de áudio de referência
 * @param options Opções adicionais
 * @returns Buffer do áudio gerado
 */
export async function cloneVoice(
  text: string,
  referenceAudioPath: string | string[],
  options?: CoquiTTSOptions
): Promise<Buffer> {
  // Processar caminho(s) de referência - pode ser string única, array, ou string com vírgulas
  let audioPaths: string[] = []
  
  if (Array.isArray(referenceAudioPath)) {
    audioPaths = referenceAudioPath
  } else if (typeof referenceAudioPath === 'string' && referenceAudioPath.includes(',')) {
    // Múltiplos arquivos separados por vírgula
    audioPaths = referenceAudioPath.split(',').map(p => p.trim()).filter(p => p.length > 0)
  } else {
    // Arquivo único
    audioPaths = [referenceAudioPath]
  }
  
  // Verificar se todos os arquivos existem
  const existingPaths: string[] = []
  for (const audioPath of audioPaths) {
    try {
      await fs.access(audioPath)
      existingPaths.push(audioPath)
    } catch (error) {
      console.warn(`⚠️ Arquivo de referência não encontrado: ${audioPath}, ignorando...`)
      // Continuar mesmo se um arquivo não existir (usar os que existem)
    }
  }
  
  if (existingPaths.length === 0) {
    throw new Error(`Nenhum arquivo de referência válido encontrado. Tentados: ${audioPaths.join(', ')}`)
  }
  
  
  // Passar como string com vírgulas se múltiplos (formato esperado pelo Python)
  // ou string única se apenas um
  const speakerWavValue = existingPaths.length > 1 
    ? existingPaths.join(',') 
    : existingPaths[0]

  return generateTTS(text, {
    ...options,
    speaker_wav: speakerWavValue,
  })
}

/**
 * Listar modelos disponíveis do Coqui TTS
 * 
 * @returns Array com nomes dos modelos disponíveis
 */
export async function listAvailableModels(): Promise<string[]> {
  const pythonScript = path.join(COQUI_TTS_WORKER_DIR, 'coqui_list_models.py')
  
  // Detectar comando Python correto para Windows
  let pythonCmd = process.env.PYTHON_CMD
  if (!pythonCmd) {
    // Tentar detectar automaticamente
    if (process.platform === 'win32') {
      pythonCmd = 'py -3.12' // Windows: usar py launcher
    } else {
      pythonCmd = 'python3' // Linux/Mac: usar python3
    }
  }
  
  const { spawn } = require('child_process')
  
  // Separar comando e argumentos para Windows (py -3.12 script.py)
  let pythonArgs: string[]
  let pythonExec: string
  
  if (pythonCmd.includes(' ')) {
    // Comando tem espaços (ex: "py -3.12")
    const parts = pythonCmd.split(' ')
    pythonExec = parts[0]
    pythonArgs = [...parts.slice(1), pythonScript]
  } else {
    // Comando simples (ex: "python3")
    pythonExec = pythonCmd
    pythonArgs = [pythonScript]
  }
  
  
  return new Promise<string[]>((resolve, reject) => {
    const pythonProcess = spawn(pythonExec, pythonArgs, {
      cwd: COQUI_TTS_WORKER_DIR,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: process.platform === 'win32' // Usar shell no Windows para encontrar 'py'
    })
    
    let stdout = ''
    let stderr = ''
    
    pythonProcess.stdout.on('data', (data: Buffer) => {
      stdout += data.toString()
    })
    
    pythonProcess.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })
    
    pythonProcess.on('close', (code: number) => {
      if (code !== 0) {
        console.error('❌ Erro ao listar modelos:', stderr)
        resolve([])
        return
      }
      
      try {
        const models = JSON.parse(stdout.trim())
        resolve(Array.isArray(models) ? models : [])
      } catch (error: any) {
        console.error('❌ Erro ao parsear modelos:', error.message)
        resolve([])
      }
    })
    
    pythonProcess.on('error', (error: Error) => {
      console.error('❌ Erro ao executar Python:', error.message)
      resolve([])
    })
  })
}

/**
 * Gerar hash do texto para cache
 */
export function generateTextHash(text: string): string {
  if (typeof window === 'undefined') {
    // Server-side: usar crypto do Node.js
    const crypto = require('crypto')
    return crypto.createHash('md5').update(text).digest('hex')
  } else {
    // Client-side: usar hash simples
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }
}

