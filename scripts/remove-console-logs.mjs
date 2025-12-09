/**
 * Script para remover console.logs desnecessários
 * Mantém apenas console.error e console.warn
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const srcDir = path.join(__dirname, '..', 'src')

// Função para processar um arquivo
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    const originalContent = content
    
    // Remover console.log() mas manter console.error e console.warn
    // Padrão regex que não remove console.error/warn
    const lines = content.split('\n')
    const processedLines = []
    let inComment = false
    let commentType = null
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()
      
      // Detectar início de comentário de bloco
      if (trimmed.includes('/*')) {
        inComment = true
        commentType = 'block'
      }
      
      // Detectar fim de comentário de bloco
      if (inComment && commentType === 'block' && trimmed.includes('*/')) {
        inComment = false
        commentType = null
        processedLines.push(line)
        continue
      }
      
      // Se estiver em comentário, manter a linha
      if (inComment) {
        processedLines.push(line)
        continue
      }
      
      // Verificar se é comentário de linha
      if (trimmed.startsWith('//')) {
        processedLines.push(line)
        continue
      }
      
      // Verificar se contém console.log mas não console.error ou console.warn
      if (line.includes('console.log(') && 
          !line.includes('console.error(') && 
          !line.includes('console.warn(')) {
        // Verificar se não está em uma string
        const logIndex = line.indexOf('console.log(')
        const beforeLog = line.substring(0, logIndex)
        const singleQuotes = (beforeLog.match(/'/g) || []).length
        const doubleQuotes = (beforeLog.match(/"/g) || []).length
        const backticks = (beforeLog.match(/`/g) || []).length
        
        // Se número de aspas for par, não está dentro de string
        if (singleQuotes % 2 === 0 && doubleQuotes % 2 === 0 && backticks % 2 === 0) {
          // Remover a linha inteira se for apenas console.log
          if (trimmed.startsWith('console.log(') || trimmed.match(/^\s*console\.log\(/)) {
            continue // Pular esta linha
          }
          // Se console.log está no meio da linha, remover apenas a parte do console.log
          // (caso mais complexo, manter a linha por segurança)
          processedLines.push(line.replace(/console\.log\([^)]*\);?\s*/g, ''))
        } else {
          processedLines.push(line)
        }
      } else {
        processedLines.push(line)
      }
    }
    
    content = processedLines.join('\n')
    
    // Limpar linhas vazias múltiplas (máximo 2 consecutivas)
    content = content.replace(/\n{3,}/g, '\n\n')
    
    // Só escrever se houver mudanças
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8')
      return true
    }
    return false
  } catch (error) {
    console.error(`Erro ao processar ${filePath}:`, error.message)
    return false
  }
}

// Função recursiva para processar diretórios
function processDirectory(dir, stats = { processed: 0, skipped: 0, errors: 0 }) {
  const files = fs.readdirSync(dir)
  
  for (const file of files) {
    const filePath = path.join(dir, file)
    
    try {
      const stat = fs.statSync(filePath)
      
      if (stat.isDirectory()) {
        // Pular diretórios excluídos
        if (!['node_modules', '.next', 'dist', 'build', '.git'].includes(file)) {
          processDirectory(filePath, stats)
        }
      } else {
        // Processar apenas arquivos TypeScript/JavaScript
        const ext = path.extname(file)
        if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
          if (processFile(filePath)) {
            stats.processed++
            console.log(`✅ ${filePath}`)
          } else {
            stats.skipped++
          }
        }
      }
    } catch (error) {
      stats.errors++
      console.error(`❌ Erro em ${filePath}:`, error.message)
    }
  }
  
  return stats
}

// Executar
console.log('🚀 Iniciando remoção de console.logs...\n')
const stats = processDirectory(srcDir)
console.log(`\n✅ Concluído!`)
console.log(`   - Arquivos processados: ${stats.processed}`)
console.log(`   - Arquivos sem mudanças: ${stats.skipped}`)
console.log(`   - Erros: ${stats.errors}`)



