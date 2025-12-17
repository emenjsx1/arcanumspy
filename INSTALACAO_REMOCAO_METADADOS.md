# 📦 Instalação - Sistema de Remoção de Metadados

## ⚠️ Requisitos

### 1. Dependências Node.js

```bash
npm install sharp
```

### 2. FFmpeg (Obrigatório para processar vídeos)

#### Windows

**Opção 1: Chocolatey**
```powershell
choco install ffmpeg
```

**Opção 2: Download Manual**
1. Acesse: https://ffmpeg.org/download.html
2. Baixe a versão para Windows
3. Extraia e adicione ao PATH do sistema

**Opção 3: Usando winget**
```powershell
winget install ffmpeg
```

#### macOS

```bash
brew install ffmpeg
```

#### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install ffmpeg
```

#### Linux (CentOS/RHEL)

```bash
sudo yum install epel-release
sudo yum install ffmpeg
```

### 3. Verificar Instalação

```bash
# Verificar versão do FFmpeg
ffmpeg -version

# Verificar versão do Sharp (após npm install)
node -e "console.log(require('sharp').versions)"
```

## 🚀 Instalação Rápida

### Passo 1: Instalar Sharp

```bash
cd /caminho/do/projeto
npm install sharp
```

### Passo 2: Instalar FFmpeg

Siga as instruções acima para seu sistema operacional.

### Passo 3: Reiniciar Servidor

```bash
# Parar o servidor (Ctrl+C)
npm run dev
```

## ✅ Verificação

Após instalar, teste o sistema:

1. Acesse `/ferramentas/mascarar-criativo`
2. Faça upload de uma imagem
3. Clique em "Remover Metadados"
4. Verifique se o download funciona

## 🐛 Troubleshooting

### Erro: "FFmpeg não está instalado"

**Solução:**
1. Verifique se FFmpeg está no PATH:
   ```bash
   ffmpeg -version
   ```
2. Se não estiver, adicione ao PATH do sistema
3. Reinicie o servidor Next.js

### Erro: "Cannot find module 'sharp'"

**Solução:**
```bash
npm install sharp
# Reiniciar servidor
```

### Erro: "Sharp não suporta esta plataforma"

**Solução:**
Sharp precisa ser compilado para sua plataforma. Tente:

```bash
npm uninstall sharp
npm install sharp --platform=linux --arch=x64
# Ou para sua plataforma específica
```

### Vídeos não processam

**Solução:**
1. Verifique se FFmpeg está instalado: `ffmpeg -version`
2. Verifique permissões de escrita em `/tmp` (Linux/Mac)
3. Verifique espaço em disco disponível

## 📝 Notas Importantes

- **Sharp**: Funciona automaticamente após `npm install`
- **FFmpeg**: Deve estar instalado globalmente no sistema
- **Arquivos temporários**: São criados em `/tmp` (Linux/Mac) ou `%TEMP%` (Windows)
- **Limite de tamanho**: 500MB por arquivo de vídeo

## 🔧 Configuração Avançada

### Variáveis de Ambiente (Opcional)

```env
# Caminho customizado para FFmpeg (se não estiver no PATH)
FFMPEG_PATH=/usr/local/bin/ffmpeg

# Diretório temporário customizado
TEMP_DIR=/custom/temp/path
```

---

**Após instalar, o sistema estará pronto para uso!** ✅









