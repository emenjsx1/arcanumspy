# 🔄 Fluxo Completo de Pagamento e-Mola/M-Pesa (E2Payment)

## 📍 Localização dos Arquivos

### Frontend (Checkout)
- **Arquivo:** `src/app/(public)/checkout/page.tsx`
- **Função:** `handlePayment()` (linha ~70)
- **Endpoint chamado:** `POST /api/payment/process`

### Backend (API de Pagamento)
- **Arquivo:** `src/app/api/payment/process/route.ts`
- **Função:** `POST()` (linha 10)
- **API Externa:** `https://mpesaemolatech.com/v1/c2b/{method}-payment/{walletId}`

---

## 🔄 Fluxo Passo a Passo

### 1. **Frontend - Checkout Page** (`checkout/page.tsx`)

```
Usuário preenche:
├── Método: M-Pesa ou e-Mola
├── Telefone: 841234567 (9 dígitos)
└── Clica em "Pagar"

↓

handlePayment() executa:
├── Valida telefone (regex: /^(84|85|86|87)\d{7}$/)
├── Obtém token de autenticação (supabase.auth.getSession())
├── Chama POST /api/payment/process
│   ├── Headers: Authorization: Bearer {token}
│   └── Body: { amount, phone, method, reference, plan, months, user_id }
└── Aguarda resposta
```

**Código relevante:**
```typescript
// Linha ~70-150
const handlePayment = async () => {
  // Validação de telefone
  // Obtenção de token
  // Chamada para API
  const response = await fetch('/api/payment/process', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({...})
  })
}
```

---

### 2. **Backend - API de Pagamento** (`api/payment/process/route.ts`)

#### 2.1. Autenticação (linhas 10-75)
```
POST /api/payment/process recebido
├── Tenta autenticar via cookies (createClient())
├── Se falhar, tenta via header Authorization
└── Se nenhum funcionar → Retorna 401
```

#### 2.2. Validação (linhas 77-108)
```
Valida:
├── method ∈ ['mpesa', 'emola']
├── phone: regex /^(84|85|86|87)\d{7}$/
├── amount: número válido > 0
└── reference: limpa e sanitiza
```

#### 2.3. Chamada API Externa (linhas 110-136)
```
Configura:
├── accessToken: DEFAULT_TOKEN (hardcoded)
├── walletId: MPESA_WALLET_ID ou EMOLA_WALLET_ID
└── apiUrl: https://mpesaemolatech.com/v1/c2b/{method}-payment/{walletId}

Faz requisição:
├── Method: POST
├── Headers:
│   ├── Authorization: Bearer {accessToken}
│   ├── Accept: application/json
│   └── Content-Type: application/json
└── Body:
    ├── client_id: '9f903862-a780-440d-8ed5-b8d8090b180e'
    ├── amount: {amountNum}
    ├── phone: {phoneDigits}
    └── reference: {cleanReference}
```

**Código relevante:**
```typescript
// Linha 115
const apiUrl = `https://mpesaemolatech.com/v1/c2b/${method}-payment/${walletId}`

// Linha 122-136
const apiResponse = await fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    client_id: CLIENT_ID,
    amount: amountNum,
    phone: phoneDigits,
    reference: cleanReference,
  }),
})
```

#### 2.4. Processamento da Resposta (linhas 138-228)

**Se sucesso (200 ou 201):**
```
1. Extrai transaction_id da resposta
2. Cria subscription no Supabase:
   ├── user_id
   ├── plan_name, price
   ├── status: 'active'
   └── trial_ends_at: now + months*30 dias
3. Registra payment no Supabase:
   ├── user_id
   ├── amount, status: 'confirmed'
   ├── method: 'mpesa' ou 'emola'
   ├── transaction_id
   └── payment_date: now
4. Atualiza profile (updated_at)
5. Retorna { success: true, transaction_id, ... }
```

**Se erro:**
```
Retorna { success: false, message, details }
```

---

## 🔍 Pontos de Falha Possíveis

### 1. **Autenticação (401)**
- ❌ Token não enviado corretamente
- ❌ Token expirado
- ❌ Cookies não funcionando

**Solução:** Já implementada - logs de debug adicionados

### 2. **Validação (400)**
- ❌ Telefone inválido
- ❌ Método inválido
- ❌ Amount inválido

**Solução:** Validações já implementadas

### 3. **API Externa (500/503)**
- ❌ Token DEFAULT_TOKEN expirado
- ❌ Wallet ID incorreto
- ❌ API e-Mola/M-Pesa fora do ar
- ❌ Timeout (30 segundos)

**Solução:** Adicionar logs e tratamento de erro melhor

### 4. **Banco de Dados (500)**
- ❌ Tabelas não existem
- ❌ RLS bloqueando inserção
- ❌ Campos obrigatórios faltando

**Solução:** Verificar migrations e RLS

---

## 🛠️ Melhorias Necessárias

### 1. Usar Variáveis de Ambiente para Token
```typescript
// ATUAL (hardcoded):
const DEFAULT_TOKEN = 'eyJ0eXAi...'

// DEVERIA SER:
const accessToken = process.env.MPESA_ACCESS_TOKEN || process.env.EMOLA_ACCESS_TOKEN || DEFAULT_TOKEN
```

### 2. Adicionar Logs Detalhados
```typescript
console.log('📞 [Payment] Chamando API:', {
  url: apiUrl,
  method: method,
  phone: phoneDigits,
  amount: amountNum,
  reference: cleanReference
})

console.log('📥 [Payment] Resposta API:', {
  status: apiResponse.status,
  data: responseData
})
```

### 3. Melhorar Tratamento de Erros
```typescript
if (!apiResponse.ok) {
  console.error('❌ [Payment] Erro da API:', {
    status: apiResponse.status,
    statusText: apiResponse.statusText,
    body: responseData
  })
}
```

---

## 📝 Próximos Passos

1. ✅ Adicionar logs detalhados em cada etapa
2. ✅ Usar variáveis de ambiente para tokens
3. ✅ Melhorar tratamento de erros da API externa
4. ✅ Adicionar retry logic para falhas temporárias
5. ✅ Validar resposta da API antes de criar subscription

