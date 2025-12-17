# 🎨 Integração Stability AI - Documentação Completa

## ✅ Status da Integração

A Stability AI foi **completamente integrada** na plataforma nas seguintes seções:

1. ✅ **Upscale de Imagens** (`/ias/upscale`)
2. ✅ **Criador de Criativo/Imagens** (`/ias/criador-criativo`)
3. ✅ **Removedor de Fundo** (`/ias/remover-background`)

## 🔑 API Key Configurada

Sua API Key da Stability AI foi configurada:

```
sk-BMOHox7VK5GJWBSlGMip51yQw2wZQS0wGgXiZXkKDiVumJJU
```

## 📁 Arquivos Criados/Atualizados

### 1. Biblioteca Helper (`src/lib/stability-ai.ts`)

Biblioteca centralizada com todas as funções da Stability AI:

- `generateImage()` - Gera imagens usando Stable Diffusion
- `upscaleImage()` - Faz upscale de imagens (Real-ESRGAN ou SD 4x)
- `removeBackground()` - Remove fundo de imagens
- `listModels()` - Lista modelos disponíveis

### 2. APIs Atualizadas

#### `/api/ias/upscale/route.ts`
- ✅ Integrado com Stability AI
- ✅ Suporta 2 modelos: Real-ESRGAN (rápido) e SD 4x Upscaler (qualidade)
- ✅ Validação de arquivos
- ✅ Salva no banco de dados

#### `/api/ias/criador-criativo/route.ts`
- ✅ Integrado com Stability AI (Stable Diffusion XL)
- ✅ Geração de imagens baseada em prompt
- ✅ Suporta diferentes dimensões e estilos
- ✅ Salva no banco de dados

#### `/api/ias/remover-background/route.ts`
- ✅ Integrado com Stability AI
- ✅ Remove fundo de imagens automaticamente
- ✅ Retorna imagem PNG com fundo transparente
- ✅ Salva no banco de dados

### 3. Páginas Front-end Atualizadas

#### `/ias/upscale/page.tsx`
- ✅ Interface completa para upload
- ✅ Seleção de escala (2x ou 4x)
- ✅ Seleção de modelo
- ✅ Preview antes e depois
- ✅ Download do resultado

#### `/ias/criador-criativo/page.tsx`
- ✅ Já estava funcional
- ✅ Atualizado para usar `imageUrl` diretamente

#### `/ias/remover-background/page.tsx`
- ✅ Já estava funcional
- ✅ Agora usa Stability AI em vez de Remove.bg

## 🔧 Configuração

### Variável de Ambiente

Adicione no `.env.local` (opcional, já está hardcoded como fallback):

```env
STABILITY_API_KEY=sk-BMOHox7VK5GJWBSlGMip51yQw2wZQS0wGgXiZXkKDiVumJJU
```

### Como Funciona

O sistema tenta usar a chave nesta ordem:

1. `process.env.STABILITY_API_KEY` (variável de ambiente)
2. Chave hardcoded como fallback (a chave fornecida)

## 📊 Funcionalidades Implementadas

### 1. Upscale de Imagens

**Modelos Disponíveis:**

- **Real-ESRGAN (2x)**: 
  - Rápido (~0.5 segundos)
  - Dobra a resolução
  - Ideal para uso geral

- **Stable Diffusion 4x Upscaler**:
  - Mais lento (20-40 segundos)
  - Quadruplica a resolução
  - Melhor qualidade e detalhes

**Como Usar:**
1. Acesse `/ias/upscale`
2. Faça upload da imagem
3. Escolha a escala (2x ou 4x)
4. Escolha o modelo
5. Clique em "Aplicar Upscale"
6. Download do resultado

### 2. Criador de Criativo/Imagens

**Recursos:**
- Geração de imagens baseada em prompt
- Múltiplos estilos (profissional, criativo, minimalista, colorido)
- Dimensões pré-configuradas:
  - 1080x1080 (Instagram)
  - 1200x628 (Facebook)
  - 1920x1080 (YouTube)
  - 1080x1920 (Stories)
- Modelo: Stable Diffusion XL 1024

**Como Usar:**
1. Acesse `/ias/criador-criativo`
2. Digite a descrição do criativo
3. Escolha o estilo
4. Escolha as dimensões
5. Clique em "Gerar Criativo"
6. Preview e download

### 3. Removedor de Fundo

**Recursos:**
- Remove fundo automaticamente
- Retorna imagem PNG com fundo transparente
- Processamento rápido
- Alta qualidade

**Como Usar:**
1. Acesse `/ias/remover-background`
2. Faça upload da imagem
3. Clique em "Remover Background"
4. Preview do resultado
5. Download da imagem sem fundo

## 🔍 Endpoints da API Stability AI Utilizados

### 1. Geração de Imagens
```
POST https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image
```

**Parâmetros:**
- `text_prompts`: Array com o prompt
- `width`: Largura (64-2048)
- `height`: Altura (64-2048)
- `steps`: Número de passos (1-50)
- `cfg_scale`: Escala de configuração (0-35)
- `samples`: Número de amostras (1-10)

### 2. Upscale de Imagens

**Real-ESRGAN:**
```
POST https://api.stability.ai/v1/image-to-image/upscale/esrgan-v1-x2plus
```

**SD 4x Upscaler:**
```
POST https://api.stability.ai/v1/image-to-image/upscale/stable-diffusion-x4-latent-upscaler
```

**Parâmetros:**
- `image`: Arquivo de imagem (FormData)

### 3. Remoção de Fundo
```
POST https://api.stability.ai/v2beta/stable-image/edit/erase-background
```

**Parâmetros:**
- `image`: Arquivo de imagem (FormData)

## 🛡️ Tratamento de Erros

Todas as APIs incluem:

- ✅ Validação de autenticação
- ✅ Validação de arquivos
- ✅ Tratamento de erros da Stability AI
- ✅ Mensagens de erro descritivas
- ✅ Logs de erro no console

## 📝 Exemplos de Uso

### Upscale de Imagem

```typescript
// Front-end
const formData = new FormData()
formData.append('imagem', imageFile)
formData.append('escala', '2x')
formData.append('modelo', 'esrgan-v1-x2plus')

const response = await fetch('/api/ias/upscale', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})

const data = await response.json()
// data.imageUrl contém a imagem upscaled em base64
```

### Gerar Criativo

```typescript
// Front-end
const response = await fetch('/api/ias/criador-criativo', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    descricao: "Um gato fofo brincando no jardim",
    estilo: "profissional",
    dimensoes: "1024x1024"
  })
})

const data = await response.json()
// data.imageUrl contém a imagem gerada em base64
```

### Remover Fundo

```typescript
// Front-end
const formData = new FormData()
formData.append('file', imageFile)

const response = await fetch('/api/ias/remover-background', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})

const data = await response.json()
// data.imageUrl contém a imagem sem fundo em base64
```

## 🚀 Melhorias Futuras

- [ ] Cache de resultados
- [ ] Histórico de gerações
- [ ] Batch processing
- [ ] Mais modelos de upscale
- [ ] Mais estilos de geração
- [ ] Edição de imagens (inpainting, outpainting)
- [ ] Análise de qualidade de imagem

## ✅ Checklist de Implementação

- [x] Biblioteca helper criada
- [x] API de upscale integrada
- [x] API de geração de imagens integrada
- [x] API de remoção de fundo integrada
- [x] Páginas front-end atualizadas
- [x] Tratamento de erros implementado
- [x] Validação de autenticação
- [x] Validação de arquivos
- [x] Documentação criada

## 📚 Referências

- [Stability AI Platform](https://platform.stability.ai/)
- [Stability AI Documentation](https://platform.stability.ai/docs)
- [Stable Diffusion Models](https://platform.stability.ai/docs/api-reference)

---

**Sistema 100% funcional e integrado!** 🎉









