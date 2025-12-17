# 🚀 Instalação Rápida - Sistema de Remoção de Metadados

## Passo 1: Verificar Dependências

O projeto já inclui `sharp` no `package.json`. Verifique se está instalado:

```bash
npm install
```

## Passo 2: Instalar FFmpeg (Obrigatório para Vídeos)

### Windows
```bash
# Opção 1: Chocolatey
choco install ffmpeg

# Opção 2: Download manual
# Baixe de: https://www.gyan.dev/ffmpeg/builds/
# Extraia e adicione ao PATH
```

### macOS
```bash
brew install ffmpeg
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ffmpeg
```

### Verificar Instalação
```bash
ffmpeg -version
```

## Passo 3: Testar o Sistema

### Via API (cURL)

**Processar Imagem:**
```bash
curl -X POST http://localhost:3000/api/mascarar/imagem \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "file=@imagem.jpg"
```

**Processar Vídeo:**
```bash
curl -X POST http://localhost:3000/api/mascarar/video \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "file=@video.mp4"
```

### Via Interface Web

1. Acesse: `/ferramentas/mascarar-criativo`
2. Faça upload do arquivo
3. Clique em "Remover Metadados"
4. Baixe o arquivo processado

## Estrutura Criada

```
src/
├── lib/
│   └── mascarar-criativo.ts          ✅ Função principal
├── app/
│   ├── api/
│   │   └── mascarar/
│   │       ├── imagem/
│   │       │   └── route.ts          ✅ API para imagens
│   │       └── video/
│   │           └── route.ts          ✅ API para vídeos
│   └── (auth)/
│       └── ferramentas/
│           └── mascarar-criativo/
│               └── page.tsx          ✅ Interface web
```

## Endpoints Disponíveis

- `POST /api/mascarar/imagem` - Processa imagens (PNG, JPG, JPEG, WEBP)
- `POST /api/mascarar/video` - Processa vídeos (MP4, MOV)
- `GET /ferramentas/mascarar-criativo` - Interface web

## Limites

- **Imagens**: Máximo 50MB
- **Vídeos**: Máximo 500MB
- **Formatos**: PNG, JPG, JPEG, WEBP, MP4, MOV

## Troubleshooting

### Erro: "sharp não encontrado"
```bash
npm install sharp
```

### Erro: "FFmpeg não está instalado"
- Instale FFmpeg seguindo as instruções acima
- Verifique com `ffmpeg -version`

### Erro: "Arquivo muito grande"
- Imagens: máximo 50MB
- Vídeos: máximo 500MB

## Pronto! 🎉

O sistema está pronto para uso. Consulte `MASCARAR_CRIATIVO.md` para documentação completa.









