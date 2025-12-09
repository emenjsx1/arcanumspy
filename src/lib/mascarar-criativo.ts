/**
 * Biblioteca de Mascaramento de Criativos
 * 
 * Remove 100% dos metadados de imagens e vídeos
 * usando Sharp para imagens e FFmpeg para vídeos.
 */

import sharp from 'sharp'
import { exec } from 'child_process'
import { promisify } from 'util'
import { join } from 'path'
import { tmpdir } from 'os'

const execAsync = promisify(exec)

/**
 * Gera um caminho temporário único
 */
export function generateTempPath(extension: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  return join(tmpdir(), `mascarar_${timestamp}_${random}.${extension}`)
}

/**
 * Remove metadados de uma imagem usando Sharp
 * 
 * @param inputPath - Caminho do arquivo de entrada
 * @param outputPath - Caminho do arquivo de saída
 * @returns Resultado do processamento
 */
export async function mascararImagem(
  inputPath: string,
  outputPath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Usar Sharp para reprocessar completamente a imagem
    // Isso remove automaticamente todos os metadados
    await sharp(inputPath)
      .rotate() // Remove orientação EXIF
      .toFile(outputPath)

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao processar imagem'
    }
  }
}

/**
 * Remove metadados de um vídeo usando FFmpeg
 * 
 * @param inputPath - Caminho do arquivo de entrada
 * @param outputPath - Caminho do arquivo de saída
 * @returns Resultado do processamento
 */
export async function mascararVideo(
  inputPath: string,
  outputPath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar se FFmpeg está instalado
    try {
      await execAsync('ffmpeg -version')
    } catch {
      return {
        success: false,
        error: 'FFmpeg não está instalado no servidor'
      }
    }

    // Comando FFmpeg para remover TODOS os metadados
    // -map_metadata -1: Remove todos os metadados
    // -movflags use_metadata_tags: Reescreve headers
    // -c:v libx264: Recodifica vídeo (garante limpeza)
    // -c:a aac: Recodifica áudio (garante limpeza)
    const command = `ffmpeg -i "${inputPath}" -map_metadata -1 -movflags use_metadata_tags -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k -map 0 "${outputPath}" -y`

    const { stderr } = await execAsync(command)

    // FFmpeg escreve logs no stderr mesmo em sucesso
    // Verificar se houve erro real
    if (stderr.includes('Error') || stderr.includes('error')) {
      return {
        success: false,
        error: `FFmpeg error: ${stderr}`
      }
    }

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao processar vídeo'
    }
  }
}

/**
 * Função principal para mascarar criativo
 * 
 * @param inputFilePath - Caminho do arquivo original
 * @param outputFilePath - Caminho do arquivo processado
 * @param fileType - Tipo do arquivo ('image' ou 'video')
 */
export async function mascararCriativo(
  inputFilePath: string,
  outputFilePath: string,
  fileType: 'image' | 'video'
): Promise<{ success: boolean; error?: string }> {
  if (fileType === 'image') {
    return await mascararImagem(inputFilePath, outputFilePath)
  } else if (fileType === 'video') {
    return await mascararVideo(inputFilePath, outputFilePath)
  } else {
    return {
      success: false,
      error: 'Tipo de arquivo não suportado'
    }
  }
}
