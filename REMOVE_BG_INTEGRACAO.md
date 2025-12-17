# Integração Remove.bg API

## 📋 Visão Geral

A plataforma agora utiliza a API do [remove.bg](https://www.remove.bg/) para remover fundos de imagens com alta qualidade e precisão.

## 🔑 Configuração

### Variável de Ambiente

Adicione a seguinte variável ao seu arquivo `.env.local`:

```env
REMOVE_BG_API_KEY=bJXsnNRdQCsHMDx8KaTD2wRU
```

**Nota:** A API key já está configurada como padrão no código, mas é recomendado usar variáveis de ambiente para produção.

## 📚 Documentação da API

- **Documentação oficial:** https://www.remove.bg/api
- **Endpoint:** `https://api.remove.bg/v1.0/removebg`
- **Método:** POST
- **Formato:** multipart/form-data

## 🚀 Funcionalidades

### Remoção de Background

A função `removeBackground()` aceita:

- **Input:** Buffer ou File (imagem)
- **Output:** Data URL base64 da imagem sem fundo (PNG com transparência)

### Opções Disponíveis

```typescript
interface RemoveBgOptions {
  size?: 'auto' | 'regular' | 'hd' | '4k' | '50MP'  // Tamanho da saída
  format?: 'png' | 'jpg' | 'zip'                    // Formato de saída
  type?: 'auto' | 'person' | 'product' | 'car' | 'animal' | 'graphic' | 'transportation'
  type_level?: number                                // Nível de detecção (0-2)
  crop?: boolean                                     // Cortar áreas vazias
  crop_margin?: string                               // Margem do crop
  scale?: string                                     // Escala da imagem
  position?: string                                  // Posição do objeto
  roi?: string                                       // Região de interesse
  bg_color?: string                                  // Cor de fundo (hex)
  bg_image_url?: string                             // URL da imagem de fundo
  channels?: 'rgba' | 'alpha'                       // Canais de saída
  add_shadow?: boolean                               // Adicionar sombra
  semitransparency?: boolean                        // Semitransparência
  shadow_type?: 'realistic' | 'drop' | 'none'      // Tipo de sombra
  shadow_opacity?: number                           // Opacidade da sombra (0-100)
}
```

## 💻 Uso

### Exemplo Básico

```typescript
import { removeBackground } from '@/lib/remove-bg'

// Com Buffer
const buffer = Buffer.from(imageData)
const result = await removeBackground(buffer, {
  size: 'auto',
  format: 'png'
})

// Com File
const file = event.target.files[0]
const result = await removeBackground(file, {
  size: 'hd',
  format: 'png',
  type: 'person'
})
```

### Verificar Saldo de Créditos

```typescript
import { getAccountInfo } from '@/lib/remove-bg'

const accountInfo = await getAccountInfo()
console.log('Créditos disponíveis:', accountInfo.data.attributes.credits.total)
```

## 📊 Limites e Preços

- **50 chamadas gratuitas por mês** (plano gratuito)
- **Até 500 imagens por minuto** (rate limit)
- **Até 50 megapixels** com formato ZIP ou JPG
- **Até 10 megapixels** com formato PNG

Consulte a [página de preços](https://www.remove.bg/pricing) para mais informações.

## 🔧 Endpoint da API

### POST `/api/ias/remover-background`

**Request:**
- `file`: Arquivo de imagem (multipart/form-data)

**Response:**
```json
{
  "success": true,
  "imageUrl": "data:image/png;base64,...",
  "message": "Background removido com sucesso"
}
```

## 🐛 Tratamento de Erros

A função captura e retorna erros detalhados:

- **401:** API key inválida
- **402:** Créditos insuficientes
- **400:** Parâmetros inválidos
- **429:** Rate limit excedido
- **500:** Erro interno do servidor

## 📝 Logs

A integração inclui logs detalhados para debug:

- `📎 Preparando form-data` - Preparação dos dados
- `📤 Enviando requisição` - Envio da requisição
- `✅ Background removido com sucesso` - Sucesso
- `❌ Erro` - Erros detalhados

## 🔄 Migração da Stability AI

A implementação anterior usava a Stability AI. A nova implementação:

- ✅ Mais confiável e estável
- ✅ Melhor qualidade de remoção
- ✅ Mais opções de personalização
- ✅ 50 chamadas gratuitas por mês
- ✅ Documentação completa

## 📚 Referências

- [Documentação da API](https://www.remove.bg/api)
- [Exemplos de código](https://www.remove.bg/api#sample-code)
- [Referência da API](https://www.remove.bg/api#api-reference)









