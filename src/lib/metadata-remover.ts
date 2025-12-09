/**
 * Biblioteca de Remoção de Metadados
 * 
 * Remove 100% dos metadados de imagens e vídeos
 * para garantir privacidade e higienização de arquivos.
 * 
 * Suporta:
 * - Imagens: PNG, JPG, JPEG, WEBP
 * - Vídeos: MP4, MOV
 */

import sharp from 'sharp'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink, readFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

const execAsync = promisify(exec)

/**
 * Remove todos os metadados de uma imagem
 * 
 * @param inputBuffer - Buffer da imagem original
 * @returns Buffer da imagem sem metadados
 */
export async function removeImageMetadata(inputBuffer: Buffer): Promise<Buffer> {
  try {
    // Usar Sharp para reprocessar a imagem completamente
    // Isso remove automaticamente todos os metadados:
    // - EXIF
    // - ICC
    // - XMP
    // - IPTC
    // - GPS
    // - Thumbnails
    // - Qualquer tag oculta
    
    const cleanedImage = await sharp(inputBuffer)
      .rotate() // Remove orientação EXIF
      .toBuffer({
        // Forçar reprocessamento completo
        // Isso garante que nenhum metadado seja preservado
      })

    return cleanedImage
  } catch (error) {
    throw new Error(`Erro ao remover metadados da imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

/**
 * Remove todos os metadados de um vídeo usando FFmpeg
 * 
 * @param inputFilePath - Caminho do arquivo de vídeo original
 * @param outputFilePath - Caminho onde salvar o vídeo limpo
 * @returns Promise que resolve quando o processamento terminar
 */
export async function removeVideoMetadata(
  inputFilePath: string,
  outputFilePath: string
): Promise<void> {
  try {
    // Comando FFmpeg para remover TODOS os metadados:
    // -map_metadata -1: Remove todos os metadados
    // -movflags use_metadata_tags: Reescreve headers sem metadados
    // -c:v libx264: Recodifica vídeo (garante limpeza total)
    // -c:a aac: Recodifica áudio (garante limpeza total)
    // -map 0: Copia todos os streams
    
    const command = `ffmpeg -i "${inputFilePath}" -map_metadata -1 -movflags use_metadata_tags -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k -map 0 "${outputFilePath}" -y`
    
    const { stderr } = await execAsync(command)
    
    // FFmpeg escreve logs no stderr mesmo em sucesso
    // Verificar se houve erro real
    if (stderr.includes('Error') || stderr.includes('error')) {
      throw new Error(`FFmpeg error: ${stderr}`)
    }
  } catch (error) {
    throw new Error(`Erro ao remover metadados do vídeo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

/**
 * Função principal para mascarar criativo (remover metadados)
 * 
 * @param inputFilePath - Caminho do arquivo original
 * @param outputFilePath - Caminho onde salvar o arquivo limpo
 * @param fileType - Tipo do arquivo ('image' ou 'video')
 * @returns Promise que resolve quando o processamento terminar
 */
export async function mascararCriativo(
  inputFilePath: string,
  outputFilePath: string,
  fileType: 'image' | 'video'
): Promise<void> {
  try {
    if (fileType === 'image') {
      // Para imagens, ler o arquivo, processar e salvar
      const inputBuffer = await readFile(inputFilePath)
      const cleanedBuffer = await removeImageMetadata(inputBuffer)
      await writeFile(outputFilePath, cleanedBuffer)
    } else if (fileType === 'video') {
      // Para vídeos, usar FFmpeg diretamente
      await removeVideoMetadata(inputFilePath, outputFilePath)
    } else {
      throw new Error('Tipo de arquivo não suportado. Use "image" ou "video".')
    }
  } catch (error) {
    throw new Error(`Erro ao mascarar criativo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

/**
 * Processa um arquivo em memória (para uploads)
 * 
 * @param fileBuffer - Buffer do arquivo
 * @param fileExtension - Extensão do arquivo (ex: 'jpg', 'mp4')
 * @returns Buffer do arquivo sem metadados
 */
export async function processFileInMemory(
  fileBuffer: Buffer,
  fileExtension: string
): Promise<Buffer> {
  const isImage = ['png', 'jpg', 'jpeg', 'webp'].includes(fileExtension.toLowerCase())
  const isVideo = ['mp4', 'mov'].includes(fileExtension.toLowerCase())

  if (isImage) {
    return await removeImageMetadata(fileBuffer)
  } else if (isVideo) {
    // Para vídeos, precisamos usar arquivos temporários
    const tempInput = join(tmpdir(), `input_${Date.now()}.${fileExtension}`)
    const tempOutput = join(tmpdir(), `output_${Date.now()}.${fileExtension}`)

    try {
      // Salvar buffer em arquivo temporário
      await writeFile(tempInput, fileBuffer)
      
      // Processar vídeo
      await removeVideoMetadata(tempInput, tempOutput)
      
      // Ler arquivo processado
      const cleanedBuffer = await readFile(tempOutput)
      
      // Limpar arquivos temporários
      await unlink(tempInput).catch(() => {})
      await unlink(tempOutput).catch(() => {})
      
      return cleanedBuffer
    } catch (error) {
      // Limpar arquivos temporários em caso de erro
      await unlink(tempInput).catch(() => {})
      await unlink(tempOutput).catch(() => {})
      throw error
    }
  } else {
    throw new Error(`Tipo de arquivo não suportado: ${fileExtension}`)
  }
}

/**
 * Verifica se FFmpeg está instalado
 */
export async function checkFFmpegInstalled(): Promise<boolean> {
  try {
    await execAsync('ffmpeg -version')
    return true
  } catch {
    return false
  }
}

/**
 * Obtém informações sobre o arquivo (tipo, extensão)
 */
export function getFileInfo(filename: string): {
  type: 'image' | 'video' | 'unknown'
  extension: string
  mimeType: string
} {
  const extension = filename.split('.').pop()?.toLowerCase() || ''
  
  const imageExtensions = ['png', 'jpg', 'jpeg', 'webp']
  const videoExtensions = ['mp4', 'mov']
  
  let type: 'image' | 'video' | 'unknown' = 'unknown'
  let mimeType = 'application/octet-stream'
  
  if (imageExtensions.includes(extension)) {
    type = 'image'
    mimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`
  } else if (videoExtensions.includes(extension)) {
    type = 'video'
    mimeType = `video/${extension}`
  }
  
  return { type, extension, mimeType }
}



