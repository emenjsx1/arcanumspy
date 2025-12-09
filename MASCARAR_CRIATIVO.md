# Sistema de Remoção de Metadados - "IA Anti-Metadados"

Sistema completo para remover 100% dos metadados de imagens e vídeos, garantindo privacidade total e higienização de arquivos.

## 📋 Índice

- [Funcionalidades](#funcionalidades)
- [Instalação](#instalação)
- [Uso da API](#uso-da-api)
- [Função Principal](#função-principal)
- [Metadados Removidos](#metadados-removidos)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)

## ✨ Funcionalidades

### Imagens Suportadas
- ✅ PNG
- ✅ JPG / JPEG
- ✅ WEBP

### Vídeos Suportados
- ✅ MP4
- ✅ MOV

### O que é Removido

**Imagens:**
- EXIF (dados da câmera, GPS, data, etc.)
- ICC (perfis de cor)
- XMP (metadados Adobe)
- IPTC (informações de direitos)
- Thumbnails internas
- Qualquer tag oculta

**Vídeos:**
- Data/time de criação
- Software de edição
- Informações da câmera
- Codec info
- GPS
- Track info
- Thumbnails
- Metadata atoms (moov, udta, free, etc.)

## 🚀 Instalação

### 1. Dependências do Node.js

O projeto já inclui `sharp` para processamento de imagens. Para vídeos, você precisa instalar o FFmpeg no sistema.

```bash
# Verificar se sharp está instalado
npm list sharp

# Se não estiver, instalar:
npm install sharp
```

### 2. Instalar FFmpeg (para processar vídeos)

#### Windows:
```bash
# Usando Chocolatey
choco install ffmpeg

# Ou baixar manualmente de: https://ffmpeg.org/download.html
```

#### macOS:
```bash
# Usando Homebrew
brew install ffmpeg
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install ffmpeg
```

### 3. Verificar Instalação

```bash
# Verificar FFmpeg
ffmpeg -version

# Deve mostrar a versão instalada
```

## 📡 Uso da API

### POST `/api/mascarar/imagem`

Remove metadados de imagens (PNG, JPG, JPEG, WEBP).

**Request:**
```javascript
const formData = new FormData()
formData.append('file', fileInput.files[0])

const response = await fetch('/api/mascarar/imagem', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}` // Opcional se usar cookies
  },
  body: formData
})

if (response.ok) {
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  // Download do arquivo limpo
  const a = document.createElement('a')
  a.href = url
  a.download = 'imagem-limpa.png'
  a.click()
} else {
  const error = await response.json()
  console.error('Erro:', error)
}
```

**Limites:**
- Tamanho máximo: 50MB
- Formatos: PNG, JPG, JPEG, WEBP

### POST `/api/mascarar/video`

Remove metadados de vídeos (MP4, MOV).

**Request:**
```javascript
const formData = new FormData()
formData.append('file', fileInput.files[0])

const response = await fetch('/api/mascarar/video', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}` // Opcional se usar cookies
  },
  body: formData
})

if (response.ok) {
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  // Download do arquivo limpo
  const a = document.createElement('a')
  a.href = url
  a.download = 'video-limpo.mp4'
  a.click()
} else {
  const error = await response.json()
  console.error('Erro:', error)
}
```

**Limites:**
- Tamanho máximo: 500MB
- Formatos: MP4, MOV

## 🔧 Função Principal

### `mascararCriativo(inputFilePath, outputFilePath)`

Função principal que remove metadados de imagens ou vídeos automaticamente.

```typescript
import { mascararCriativo } from '@/lib/mascarar-criativo'

const result = await mascararCriativo(
  '/caminho/para/arquivo-original.jpg',
  '/caminho/para/arquivo-limpo.jpg'
)

if (result.success) {
  console.log('Arquivo processado com sucesso!')
  console.log(`Tamanho original: ${result.originalSize} bytes`)
  console.log(`Tamanho novo: ${result.newSize} bytes`)
  console.log(`Arquivo salvo em: ${result.outputPath}`)
} else {
  console.error('Erro:', result.error)
}
```

### Funções Específicas

#### `mascararImagem(inputFilePath, outputFilePath)`

Remove metadados apenas de imagens.

```typescript
import { mascararImagem } from '@/lib/mascarar-criativo'

const result = await mascararImagem('input.jpg', 'output.jpg')
```

#### `mascararVideo(inputFilePath, outputFilePath)`

Remove metadados apenas de vídeos (requer FFmpeg).

```typescript
import { mascararVideo } from '@/lib/mascarar-criativo'

const result = await mascararVideo('input.mp4', 'output.mp4')
```

## 📊 Metadados Removidos

### Imagens

O Sharp remove automaticamente todos os metadados ao reprocessar a imagem:

- **EXIF**: Dados da câmera, GPS, data/hora, configurações
- **ICC**: Perfis de cor e calibração
- **XMP**: Metadados Adobe (Lightroom, Photoshop)
- **IPTC**: Informações de direitos autorais
- **Thumbnails**: Miniaturas internas
- **Outros**: Qualquer tag oculta ou metadado customizado

### Vídeos

O FFmpeg remove todos os metadados usando `-map_metadata -1`:

- **Data/Time**: Data de criação e modificação
- **Software**: Software de edição usado
- **Câmera**: Informações do dispositivo
- **Codec Info**: Informações técnicas do codec
- **GPS**: Localização geográfica
- **Track Info**: Informações de trilhas de áudio/vídeo
- **Thumbnails**: Miniaturas embutidas
- **Metadata Atoms**: Todos os atoms de metadados (moov, udta, free, etc.)

## 🛠 Tecnologias

- **Node.js**: Runtime JavaScript
- **Sharp**: Processamento de imagens (remove metadados automaticamente)
- **FFmpeg**: Processamento de vídeos (remove metadados via comandos)

## 📁 Estrutura do Projeto

```
src/
├── lib/
│   └── mascarar-criativo.ts      # Função principal e utilitários
├── app/
│   └── api/
│       └── mascarar/
│           ├── imagem/
│           │   └── route.ts      # API para processar imagens
│           └── video/
│               └── route.ts       # API para processar vídeos
```

## 🔒 Segurança

- ✅ Autenticação obrigatória (usuário deve estar logado)
- ✅ Validação de tipos de arquivo
- ✅ Limite de tamanho de arquivo
- ✅ Limpeza automática de arquivos temporários
- ✅ Não altera o conteúdo visual (apenas remove metadados)

## ⚠️ Notas Importantes

1. **FFmpeg é obrigatório para vídeos**: Sem FFmpeg instalado, o processamento de vídeos falhará.

2. **Arquivos temporários**: Os arquivos são processados em diretório temporário e limpos automaticamente após o processamento.

3. **Qualidade preservada**: O sistema não altera a qualidade visual dos arquivos, apenas remove metadados.

4. **Compatibilidade**: Os arquivos processados são totalmente compatíveis e podem ser usados normalmente.

## 🐛 Troubleshooting

### Erro: "FFmpeg não está instalado"
- Instale o FFmpeg seguindo as instruções acima
- Verifique com `ffmpeg -version`

### Erro: "Arquivo muito grande"
- Imagens: máximo 50MB
- Vídeos: máximo 500MB

### Erro: "Formato não suportado"
- Imagens: Use PNG, JPG, JPEG ou WEBP
- Vídeos: Use MP4 ou MOV

### Erro: "Erro ao processar arquivo"
- Verifique se o arquivo não está corrompido
- Tente com outro arquivo
- Verifique os logs do servidor

## 📝 Exemplo Completo

```typescript
// Exemplo de uso completo
import { mascararCriativo, generateTempPath } from '@/lib/mascarar-criativo'
import { writeFile, readFile } from 'fs/promises'

async function processarArquivo(inputPath: string) {
  // Gerar caminho de saída
  const outputPath = generateTempPath('jpg')
  
  // Processar arquivo
  const result = await mascararCriativo(inputPath, outputPath)
  
  if (result.success) {
    console.log('✅ Arquivo processado com sucesso!')
    console.log(`📁 Salvo em: ${result.outputPath}`)
    console.log(`📊 Tamanho original: ${(result.originalSize! / 1024).toFixed(2)} KB`)
    console.log(`📊 Tamanho novo: ${(result.newSize! / 1024).toFixed(2)} KB`)
    
    // Ler arquivo processado
    const cleanFile = await readFile(outputPath)
    return cleanFile
  } else {
    console.error('❌ Erro:', result.error)
    return null
  }
}
```

## 📄 Licença

Este sistema foi desenvolvido para uso interno da plataforma.

---

**Desenvolvido com foco em privacidade e segurança de dados.**



