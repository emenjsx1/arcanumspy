# 📝 Gerador de Copy para Criativos - Documentação Técnica

## 🎯 Visão Geral

Sistema completo de geração de copy para criativos usando IA (Gemini). O sistema recebe dados do front-end, valida, monta um prompt personalizado, chama a API do Gemini e retorna uma copy estruturada em JSON.

---

## 🔄 Fluxo Completo do Sistema

### 1. **Front-end → Back-end (POST Request)**

#### Dados Enviados:
```typescript
{
  style: "Agressivo" | "Neutro" | "Storytelling" | "Podcast" | "Conversacional" | "Estilo GC" | "Estilo VSL" | "Estilo Direct Response",
  creative_type: "Criativo curto" | "Criativo longo" | "Script de UGC" | "Criativo no formato Podcast" | "Roteiro para Reels" | "Roteiro para TikTok" | "Headline" | "Copy de imagem",
  mechanism: string,        // OBRIGATÓRIO
  product_name: string,     // OBRIGATÓRIO
  audience_age: number,     // OBRIGATÓRIO (1-120)
  pain?: string,            // Opcional
  promise?: string,          // Opcional
  benefits?: string,         // Opcional
  story?: string,            // Opcional
  description?: string       // Opcional (máx 500 caracteres)
}
```

#### Exemplo de Request:
```javascript
fetch('/api/ias/gerador-copy-criativo', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  },
  body: JSON.stringify({
    style: "Agressivo",
    creative_type: "Roteiro para TikTok",
    mechanism: "Queima de gordura através de termogênese",
    product_name: "Queima Gordura X",
    audience_age: 35,
    pain: "Não consegue emagrecer mesmo fazendo dieta",
    promise: "Perder 10kg em 30 dias",
    benefits: "Acelera metabolismo, reduz apetite, aumenta energia",
    story: "João perdeu 15kg em 2 meses usando este produto",
    description: "Produto natural, sem efeitos colaterais"
  })
})
```

---

### 2. **Validação no Back-end**

A função `validateInput()` verifica:

```typescript
✅ style: string não vazio
✅ creative_type: string não vazio
✅ mechanism: string não vazio
✅ product_name: string não vazio
✅ audience_age: number entre 1 e 120
✅ description: máximo 500 caracteres (se fornecido)
```

**Se algum campo obrigatório estiver inválido:**
```json
{
  "success": false,
  "error": "Campo 'mechanism' é obrigatório"
}
```
**Status: 400 (Bad Request)**

---

### 3. **Montagem do Prompt**

A função `buildPrompt()` constrói um prompt detalhado:

#### Estrutura do Prompt:

```
Você é um copywriter especialista em marketing digital e direct response marketing.

Crie uma copy completa seguindo estas especificações EXATAS:

ESTILO DA COPY: [Descrição do estilo escolhido]
TIPO DE CRIATIVO: [Descrição do tipo escolhido]
MECANISMO DO PRODUTO: [mechanism]
NOME DO PRODUTO: [product_name]
IDADE DO PÚBLICO: [audience_age] anos
DOR DO PÚBLICO: [pain] (se fornecido)
PROMESSA: [promise] (se fornecido)
BENEFÍCIOS: [benefits] (se fornecido)
HISTÓRIA RESUMIDA: [story] (se fornecido)
INFORMAÇÕES EXTRAS: [description] (se fornecido)

REGRAS IMPORTANTES:
- Adapte o tom e linguagem à idade do público
- Siga RIGOROSAMENTE o estilo escolhido
- Adapte o formato ao tipo de criativo
- Use o mecanismo como base
- NÃO invente informações que não foram fornecidas
- Seja específico e evite clichês genéricos
- Use gatilhos mentais apropriados ao estilo escolhido

IMPORTANTE: Você DEVE retornar APENAS um objeto JSON válido, sem markdown, sem explicações.

A estrutura JSON OBRIGATÓRIA é:
{
  "headline": "uma frase curta e impactante que captura atenção",
  "subheadline": "uma frase complementar que expande a headline",
  "body": "texto principal da copy, desenvolvido conforme o tipo de criativo escolhido",
  "cta": "call to action persuasivo e claro"
}
```

#### Exemplo de Prompt Gerado:

```
Você é um copywriter especialista em marketing digital e direct response marketing.

Crie uma copy completa seguindo estas especificações EXATAS:

ESTILO DA COPY: Use um tom agressivo, direto e impactante. Foque em urgência e ação imediata.
TIPO DE CRIATIVO: Roteiro otimizado para TikTok. Muito curto, direto e com hook impactante nos primeiros 3 segundos.
MECANISMO DO PRODUTO: Queima de gordura através de termogênese
NOME DO PRODUTO: Queima Gordura X
IDADE DO PÚBLICO: 35 anos
DOR DO PÚBLICO: Não consegue emagrecer mesmo fazendo dieta
PROMESSA: Perder 10kg em 30 dias
BENEFÍCIOS: Acelera metabolismo, reduz apetite, aumenta energia
HISTÓRIA RESUMIDA: João perdeu 15kg em 2 meses usando este produto
INFORMAÇÕES EXTRAS: Produto natural, sem efeitos colaterais

REGRAS IMPORTANTES:
- Adapte o tom e linguagem à idade do público (35 anos)
- Siga RIGOROSAMENTE o estilo "Agressivo"
- Adapte o formato ao tipo de criativo "Roteiro para TikTok"
- Use o mecanismo "Queima de gordura através de termogênese" como base
- NÃO invente informações que não foram fornecidas
- Seja específico e evite clichês genéricos
- Use gatilhos mentais apropriados ao estilo escolhido

IMPORTANTE: Você DEVE retornar APENAS um objeto JSON válido, sem markdown, sem explicações.

A estrutura JSON OBRIGATÓRIA é:
{
  "headline": "uma frase curta e impactante que captura atenção",
  "subheadline": "uma frase complementar que expande a headline",
  "body": "texto principal da copy, desenvolvido conforme o tipo de criativo escolhido",
  "cta": "call to action persuasivo e claro"
}
```

---

### 4. **Chamada à API do Gemini**

A função `generateWithGemini()` faz a requisição:

#### Request para Gemini:

```typescript
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=API_KEY

Headers:
  Content-Type: application/json

Body:
{
  "contents": [
    {
      "parts": [
        {
          "text": "[PROMPT MONTADO]"
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,        // Como especificado
    "topK": 40,
    "topP": 0.95,
    "maxOutputTokens": 500,   // Como especificado
    "responseMimeType": "application/json"  // Forçar JSON
  },
  "safetySettings": [
    {
      "category": "HARM_CATEGORY_HARASSMENT",
      "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    // ... outros safety settings
  ]
}
```

#### Parâmetros Importantes:

- **temperature: 0.7** - Balanceia criatividade e consistência
- **maxOutputTokens: 500** - Limita o tamanho da resposta
- **responseMimeType: "application/json"** - Força resposta em JSON

---

### 5. **Processamento da Resposta do Gemini**

#### Resposta Bruta do Gemini:

```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "{\"headline\":\"PERDEU 15KG EM 2 MESES!\",\"subheadline\":\"Descubra o segredo que João usou para transformar o corpo\",\"body\":\"Você já tentou de tudo para emagrecer? Dietas que não funcionam? Exercícios que não dão resultado? Queima Gordura X usa termogênese para acelerar seu metabolismo e queimar gordura 24h por dia. Acelera metabolismo, reduz apetite, aumenta energia. Produto 100% natural, sem efeitos colaterais. João perdeu 15kg em 2 meses. Você pode perder 10kg em 30 dias.\",\"cta\":\"GARANTE AGORA - PERDA 10KG EM 30 DIAS\"}"
          }
        ]
      },
      "finishReason": "STOP"
    }
  ]
}
```

#### Processamento:

1. **Extrair texto:**
   ```typescript
   const content = data.candidates[0].content.parts[0].text
   ```

2. **Limpar markdown (se houver):**
   ```typescript
   const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
   ```

3. **Parsear JSON:**
   ```typescript
   const parsed = JSON.parse(cleanContent)
   ```

4. **Validar estrutura:**
   ```typescript
   if (!parsed.headline || !parsed.subheadline || !parsed.body || !parsed.cta) {
     throw new Error('Resposta incompleta')
   }
   ```

---

### 6. **Resposta do Back-end → Front-end**

#### Estrutura JSON Retornada:

```json
{
  "success": true,
  "copy": {
    "headline": "PERDEU 15KG EM 2 MESES!",
    "subheadline": "Descubra o segredo que João usou para transformar o corpo",
    "body": "Você já tentou de tudo para emagrecer? Dietas que não funcionam? Exercícios que não dão resultado? Queima Gordura X usa termogênese para acelerar seu metabolismo e queimar gordura 24h por dia. Acelera metabolismo, reduz apetite, aumenta energia. Produto 100% natural, sem efeitos colaterais. João perdeu 15kg em 2 meses. Você pode perder 10kg em 30 dias.",
    "cta": "GARANTE AGORA - PERDA 10KG EM 30 DIAS"
  }
}
```

#### Em Caso de Erro:

```json
{
  "success": false,
  "error": "Mensagem de erro descritiva"
}
```

**Status Codes:**
- `200` - Sucesso
- `400` - Dados inválidos
- `401` - Não autenticado
- `500` - Erro no servidor/API

---

### 7. **Renderização no Front-end**

O front-end recebe e renderiza cada campo:

```tsx
{copy && (
  <div>
    {/* Headline */}
    <div>
      <Label>Headline</Label>
      <div className="p-3 bg-[#0a0a0a]">
        <p className="text-white font-semibold">{copy.headline}</p>
      </div>
      <Button onClick={() => copyToClipboard(copy.headline)}>
        Copiar
      </Button>
    </div>

    {/* Subheadline */}
    <div>
      <Label>Subheadline</Label>
      <div className="p-3 bg-[#0a0a0a]">
        <p className="text-white">{copy.subheadline}</p>
      </div>
      <Button onClick={() => copyToClipboard(copy.subheadline)}>
        Copiar
      </Button>
    </div>

    {/* Body */}
    <div>
      <Label>Body</Label>
      <div className="p-3 bg-[#0a0a0a]">
        <p className="text-white whitespace-pre-wrap">{copy.body}</p>
      </div>
      <Button onClick={() => copyToClipboard(copy.body)}>
        Copiar
      </Button>
    </div>

    {/* CTA */}
    <div>
      <Label>CTA</Label>
      <div className="p-3 bg-[#0a0a0a]">
        <p className="text-white font-medium">{copy.cta}</p>
      </div>
      <Button onClick={() => copyToClipboard(copy.cta)}>
        Copiar
      </Button>
    </div>

    {/* Copiar tudo */}
    <Button onClick={() => {
      const fullCopy = `${copy.headline}\n\n${copy.subheadline}\n\n${copy.body}\n\n${copy.cta}`
      copyToClipboard(fullCopy)
    }}>
      Copiar Copy Completa
    </Button>
  </div>
)}
```

---

## 📊 Estrutura de Dados

### Input (Front-end → Back-end)

```typescript
interface GeradorCopyCriativoRequest {
  style: string                    // OBRIGATÓRIO
  creative_type: string            // OBRIGATÓRIO
  mechanism: string                // OBRIGATÓRIO
  product_name: string             // OBRIGATÓRIO
  audience_age: number             // OBRIGATÓRIO (1-120)
  pain?: string                    // Opcional
  promise?: string                 // Opcional
  benefits?: string                // Opcional
  story?: string                   // Opcional
  description?: string             // Opcional (máx 500 chars)
}
```

### Output (Back-end → Front-end)

```typescript
interface CopyResponse {
  headline: string      // Frase curta e impactante
  subheadline: string  // Frase complementar
  body: string         // Texto principal
  cta: string          // Call to action
}
```

---

## 🔧 Configuração

### Variáveis de Ambiente Necessárias:

```env
# Gemini API Key
GEMINI_API_KEY=AIzaSyB8_lSPlLeUrbG_U5eltTbt1ooEDFjenis
# OU
GOOGLE_AI_API_KEY=AIzaSyB8_lSPlLeUrbG_U5eltTbt1ooEDFjenis
```

### Como Obter a API Key:

1. Acesse: https://makersuite.google.com/app/apikey
2. Crie uma nova API Key
3. Adicione no `.env.local`:
   ```env
   GEMINI_API_KEY=sua_key_aqui
   ```

---

## 🎨 Estilos Disponíveis

| Estilo | Descrição |
|--------|-----------|
| **Agressivo** | Tom direto, urgência, ação imediata |
| **Neutro** | Profissional, informativo, objetivo |
| **Storytelling** | Narrativa envolvente e emocional |
| **Podcast** | Conversacional e natural |
| **Conversacional** | Coloquial e amigável |
| **Estilo GC** | Urgência, escassez, comunidade |
| **Estilo VSL** | Narrativa longa, múltiplos gatilhos |
| **Estilo Direct Response** | Direto, foco em conversão |

---

## 📱 Tipos de Criativo Disponíveis

| Tipo | Descrição |
|------|-----------|
| **Criativo curto** | 2-3 parágrafos, objetivo |
| **Criativo longo** | Desenvolvido completamente |
| **Script de UGC** | Autêntico, conversacional |
| **Criativo Podcast** | Com pausas e transições |
| **Roteiro Reels** | Curto, dinâmico, hook forte |
| **Roteiro TikTok** | Muito curto, hook nos 3s |
| **Headline** | Apenas headline poderosa |
| **Copy de imagem** | Complementa o visual |

---

## 🛡️ Tratamento de Erros

### Erros de Validação (400):
```json
{
  "success": false,
  "error": "Campo 'mechanism' é obrigatório"
}
```

### Erros de Autenticação (401):
```json
{
  "success": false,
  "error": "Não autenticado. Faça login para continuar."
}
```

### Erros da API Gemini (500):
```json
{
  "success": false,
  "error": "Gemini API error: 429 - Rate limit exceeded"
}
```

### Erros de Segurança:
```json
{
  "success": false,
  "error": "Conteúdo bloqueado por políticas de segurança"
}
```

---

## 📝 Exemplo Completo de Uso

### 1. Front-end envia dados:

```javascript
const response = await fetch('/api/ias/gerador-copy-criativo', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    style: "Agressivo",
    creative_type: "Roteiro para TikTok",
    mechanism: "Queima de gordura através de termogênese",
    product_name: "Queima Gordura X",
    audience_age: 35,
    pain: "Não consegue emagrecer",
    promise: "Perder 10kg em 30 dias",
    benefits: "Acelera metabolismo, reduz apetite",
    story: "João perdeu 15kg em 2 meses"
  })
})
```

### 2. Back-end processa e retorna:

```json
{
  "success": true,
  "copy": {
    "headline": "PERDEU 15KG EM 2 MESES!",
    "subheadline": "O segredo que transformou o corpo de João",
    "body": "Você já tentou de tudo? Queima Gordura X usa termogênese para acelerar seu metabolismo 24h por dia. Acelera metabolismo, reduz apetite. Produto natural. João perdeu 15kg. Você pode perder 10kg em 30 dias.",
    "cta": "GARANTE AGORA - PERDA 10KG EM 30 DIAS"
  }
}
```

### 3. Front-end renderiza:

- **Headline** em destaque
- **Subheadline** como complemento
- **Body** como texto principal
- **CTA** destacado
- Botões para copiar cada parte individualmente
- Botão para copiar tudo junto

---

## 🔍 Como o Prompt é Montado

### Passo a Passo:

1. **Recebe dados do front-end**
2. **Busca descrições dos estilos e tipos** (dicionários `styleDescriptions` e `creativeTypeDescriptions`)
3. **Monta o prompt** concatenando:
   - Instruções gerais
   - Estilo escolhido com descrição
   - Tipo de criativo com descrição
   - Todos os campos fornecidos
   - Regras específicas
   - Estrutura JSON esperada
4. **Adiciona instrução final** para retornar apenas JSON

### Por que isso funciona?

- **Especificidade**: O prompt é altamente específico com todas as informações
- **Estrutura clara**: Define exatamente o formato JSON esperado
- **Contexto completo**: Inclui todas as informações necessárias
- **Instruções precisas**: Deixa claro o que fazer e o que não fazer

---

## 🚀 Melhorias Futuras

- [ ] Salvar histórico de copies geradas
- [ ] Permitir editar a copy gerada
- [ ] Gerar múltiplas variações
- [ ] Exportar em diferentes formatos (PDF, DOCX)
- [ ] Integração com outras IAs (OpenAI, Claude)
- [ ] Templates pré-definidos
- [ ] Análise de performance da copy

---

## ✅ Checklist de Implementação

- [x] API route criada (`/api/ias/gerador-copy-criativo`)
- [x] Validação de dados implementada
- [x] Função de montagem de prompt
- [x] Integração com Gemini API
- [x] Tratamento de erros
- [x] Front-end completo com todos os campos
- [x] Renderização estruturada da copy
- [x] Botões de copiar individuais e completo
- [x] Documentação completa

---

**Sistema 100% funcional e pronto para uso!** 🎉



