/**
 * Utilitário para criar arquivos ZIP
 */

import archiver from 'archiver'
import { SiteAsset } from './crawler'

/**
 * Cria um arquivo ZIP a partir dos assets coletados
 */
export async function createZip(assets: SiteAsset[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let totalBytes = 0
    let filesAdded = 0
    let isResolved = false
    
    // Timeout de segurança (30 segundos)
    const timeout = setTimeout(() => {
      if (!isResolved) {
        isResolved = true
        reject(new Error('Timeout ao criar ZIP. O processo demorou mais de 30 segundos.'))
      }
    }, 30000)
    
    const archive = archiver('zip', {
      zlib: { level: 9 } // Máxima compressão
    })

    // Coletar chunks de dados
    archive.on('data', (chunk: Buffer) => {
      if (Buffer.isBuffer(chunk)) {
        chunks.push(chunk)
        totalBytes += chunk.length
        console.log(`📦 Chunk recebido: ${chunk.length} bytes (total: ${totalBytes} bytes)`)
      } else {
        console.warn(`⚠️ Chunk não é um Buffer:`, typeof chunk)
      }
    })

    // Quando finalizar
    archive.on('end', () => {
      if (isResolved) return
      
      clearTimeout(timeout)
      console.log(`✅ Archiver finalizado. Total de chunks: ${chunks.length}, Total bytes: ${totalBytes}`)
      
      if (chunks.length === 0) {
        isResolved = true
        reject(new Error('ZIP criado está vazio. Nenhum chunk foi coletado.'))
        return
      }
      
      const buffer = Buffer.concat(chunks)
      
      if (buffer.length === 0) {
        isResolved = true
        reject(new Error('ZIP criado está vazio. Buffer final tem 0 bytes.'))
        return
      }
      
      console.log(`✅ ZIP criado com sucesso: ${(buffer.length / 1024).toFixed(2)} KB`)
      isResolved = true
      resolve(buffer)
    })

    // Tratar erros
    archive.on('error', (error) => {
      if (isResolved) return
      
      clearTimeout(timeout)
      console.error('❌ Erro no archiver:', error)
      isResolved = true
      reject(error)
    })

    // Filtrar apenas assets com conteúdo válido
    const validAssets = assets.filter(asset => {
      const isValid = asset.content && 
                      asset.content.length > 0 && 
                      asset.path && 
                      asset.path.trim().length > 0
      
      if (!isValid) {
        console.warn(`⚠️ Asset inválido ignorado: ${asset.path || 'sem path'} (tamanho: ${asset.content?.length || 0})`)
      }
      
      return isValid
    })

    if (validAssets.length === 0) {
      reject(new Error('Nenhum arquivo válido para adicionar ao ZIP'))
      return
    }

    console.log(`📦 Adicionando ${validAssets.length} arquivos ao ZIP...`)

    // Adicionar cada asset ao ZIP de forma síncrona
    try {
      for (const asset of validAssets) {
        try {
          // Garantir que o path não seja vazio e não tenha caracteres inválidos
          let cleanPath = asset.path.trim()
          
          // Remover barras duplicadas e normalizar
          cleanPath = cleanPath.replace(/\/+/g, '/')
          if (cleanPath.startsWith('/')) {
            cleanPath = cleanPath.slice(1)
          }
          
          // Se ainda estiver vazio, usar um nome padrão
          if (!cleanPath) {
            cleanPath = `file-${filesAdded + 1}`
          }
          
          // Validar conteúdo antes de adicionar
          if (!asset.content || asset.content.length === 0) {
            console.warn(`  ⚠️ Asset ${cleanPath} tem conteúdo vazio, pulando...`)
            continue
          }
          
          // Preservar estrutura de diretórios
          archive.append(asset.content, {
            name: cleanPath
          })
          filesAdded++
          console.log(`  ✓ [${filesAdded}/${validAssets.length}] ${cleanPath} (${(asset.content.length / 1024).toFixed(2)} KB)`)
        } catch (error: any) {
          console.warn(`  ⚠️ Erro ao adicionar ${asset.path}:`, error.message)
        }
      }

      if (filesAdded === 0) {
        reject(new Error('Nenhum arquivo foi adicionado ao ZIP. Todos os arquivos estavam vazios ou inválidos.'))
        return
      }

      console.log(`✅ ${filesAdded} arquivos adicionados ao ZIP. Finalizando...`)

      // Finalizar o arquivo - IMPORTANTE: isso dispara o evento 'end'
      archive.finalize()
    } catch (error: any) {
      console.error('❌ Erro ao processar assets:', error)
      archive.abort()
      reject(error)
    }
  })
}

