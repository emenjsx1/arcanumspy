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
    const archive = archiver('zip', {
      zlib: { level: 9 } // Máxima compressão
    })

    archive.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })

    archive.on('end', () => {
      const buffer = Buffer.concat(chunks)
      resolve(buffer)
    })

    archive.on('error', (error) => {
      reject(error)
    })

    // Adicionar cada asset ao ZIP
    for (const asset of assets) {
      if (asset.content) {
        // Preservar estrutura de diretórios
        archive.append(asset.content, {
          name: asset.path
        })
      }
    }

    // Finalizar o arquivo
    archive.finalize()
  })
}

