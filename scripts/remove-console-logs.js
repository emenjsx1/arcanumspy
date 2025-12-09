/**
 * Script para remover console.logs desnecessários
 * Mantém apenas console.error e console.warn
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Diretórios para processar
const srcDir = path.join(__dirname, '..', 'src')
const excludeDirs = ['node_modules', '.next', 'dist', 'build', '.git']

// Padrões para remover
const patternsToRemove = [
  // console.log simples
  /console\.log\([^)]*\);?\s*\n/g,
  // console.log com múltiplas linhas (básico)
  /console\.log\([^)]*\);\s*\n/g,
]

// Função para verificar se deve processar o arquivo
function shouldProcessFile(filePath) {
  const ext = path.extname(filePath)
  return ['.ts', '.tsx', '.js', '.jsx'].includes(ext)
}

// Função para remover console.logs de um arquivo
function removeConsoleLogs(content) {
  let modified = content
  
  // Remover console.log() mas manter console.error e console.warn
  // Padrão mais sofisticado que não remove console.error/warn
  const lines = modified.split('\n')
  const filteredLines = lines.filter(line => {
    // Se a linha contém console.log, remover
    if (line.trim().startsWith('console.log(') || line.includes('console.log(')) {
      // Verificar se não é um comentário
      if (!line.trim().startsWith('//') && !line.trim().startsWith('*')) {
        return false
      }
    }
    return true
  })
  
  modified = filteredLines.join('\n')
  
  // Remover linhas vazias múltiplas
  modified = modified.replace(/\n{3,}/g, '\n\n')
  
  return modified
}

// Função recursiva para processar diretórios
function processDirectory(dir) {
  const files = fs.readdirSync(dir)
  
  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      // Pular diretórios excluídos
      if (!excludeDirs.includes(file)) {
        processDirectory(filePath)
      }
    } else if (shouldProcessFile(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8')
        const originalContent = content
        
        // Remover console.logs
        const modified = removeConsoleLogs(content)
        
        // Só escrever se houver mudanças
        if (modified !== originalContent) {
          fs.writeFileSync(filePath, modified, 'utf8')
          console.log(`✅ Processado: ${filePath}`)
        }
      } catch (error) {
        console.error(`❌ Erro ao processar ${filePath}:`, error.message)
      }
    }
  })
}

// Executar
console.log('🚀 Iniciando remoção de console.logs...')
processDirectory(srcDir)
console.log('✅ Concluído!')



