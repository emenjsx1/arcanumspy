/**
 * Helpers para Storage (Supabase Storage)
 * Implementa saveToStorage para upload de arquivos
 */

import { createAdminClient } from "@/lib/supabase/admin"

export interface StorageUploadResult {
  url: string
  path: string
  size: number
}

/**
 * Salva arquivo no Supabase Storage
 * 
 * @param localFilePath Caminho local do arquivo (ou Buffer)
 * @param filename Nome do arquivo no storage
 * @param bucket Nome do bucket (padrão: 'voice-clones')
 * @returns URL pública do arquivo
 */
export async function saveToStorage(
  localFilePath: string | Buffer,
  filename: string,
  bucket: string = 'voice-clones'
): Promise<string> {
  const adminClient = createAdminClient()
  
  // Se for string (caminho), ler arquivo
  let fileData: Buffer
  if (typeof localFilePath === 'string') {
    // Em Next.js, não podemos usar fs diretamente em API routes
    // Assumir que já é Buffer ou usar fetch se for URL
    if (localFilePath.startsWith('http')) {
      const response = await fetch(localFilePath)
      const arrayBuffer = await response.arrayBuffer()
      fileData = Buffer.from(arrayBuffer)
    } else {
      // Se for caminho local, precisa ser processado no servidor
      throw new Error('Caminhos locais não suportados. Use Buffer ou URL.')
    }
  } else {
    fileData = localFilePath
  }
  
  // Upload para Supabase Storage
  const { data: uploadData, error: uploadError } = await adminClient.storage
    .from(bucket)
    .upload(filename, fileData, {
      contentType: getContentType(filename),
      upsert: false,
    })
  
  if (uploadError) {
    if (uploadError.message.includes('Bucket not found')) {
      throw new Error(`Bucket '${bucket}' não encontrado. Crie o bucket no Supabase Storage.`)
    }
    throw new Error(`Erro ao fazer upload: ${uploadError.message}`)
  }
  
  // Obter URL pública
  const { data: { publicUrl } } = adminClient.storage
    .from(bucket)
    .getPublicUrl(uploadData.path)
  
  return publicUrl
}

/**
 * Baixa arquivo do storage
 */
export async function downloadFromStorage(
  url: string
): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Erro ao baixar arquivo: ${response.statusText}`)
  }
  
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Deleta arquivo do storage
 */
export async function deleteFromStorage(
  path: string,
  bucket: string = 'voice-clones'
): Promise<void> {
  const adminClient = createAdminClient()
  
  const { error } = await adminClient.storage
    .from(bucket)
    .remove([path])
  
  if (error) {
    throw new Error(`Erro ao deletar arquivo: ${error.message}`)
  }
}

/**
 * Determina content type baseado na extensão
 */
function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  
  const contentTypes: Record<string, string> = {
    'wav': 'audio/wav',
    'mp3': 'audio/mpeg',
    'mpeg': 'audio/mpeg',
    'webm': 'audio/webm',
    'ogg': 'audio/ogg',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'zip': 'application/zip',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'svg': 'image/svg+xml',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'ico': 'image/x-icon',
    'ttf': 'font/ttf',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'otf': 'font/otf',
  }
  
  return contentTypes[ext || ''] || 'application/octet-stream'
}

