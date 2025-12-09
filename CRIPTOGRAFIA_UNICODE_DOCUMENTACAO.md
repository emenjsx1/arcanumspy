# 🔐 Criptografia Unicode - Documentação Completa

## ✅ Funcionalidade Implementada

Sistema de criptografia leve de texto usando Unicode, integrado na seção de criptografia de texto da plataforma.

## 📁 Arquivos Criados/Atualizados

### 1. Biblioteca de Criptografia (`src/lib/unicode-crypto.ts`)

Biblioteca centralizada com todas as funções de criptografia Unicode:

- `encryptText(text: string): string` - Criptografa texto para Unicode
- `decryptText(unicodeText: string): string` - Descriptografa Unicode para texto
- `isEncrypted(text: string): boolean` - Verifica se texto está criptografado
- `encryptIfEnabled(text: string, encrypt: boolean): string` - Criptografa apenas se ativado
- `decryptIfNeeded(text: string): string` - Descriptografa apenas se necessário

### 2. API Atualizada (`src/app/api/ferramentas/criptografar-texto/route.ts`)

- ✅ Integrado com criptografia Unicode
- ✅ Suporta opção de ativar/desativar criptografia
- ✅ Salva no banco de dados com flag `usar_criptografia`
- ✅ Descriptografa automaticamente ao buscar do banco
- ✅ Endpoint GET para buscar histórico

### 3. Front-end Atualizado (`src/app/(auth)/ferramentas/criptografar-texto/page.tsx`)

- ✅ Interface completa com opção de ativar/desativar criptografia
- ✅ Switch para controlar criptografia
- ✅ Botão para salvar no histórico
- ✅ Detecção automática de texto criptografado
- ✅ Preview em tempo real

### 4. Componente Switch (`src/components/ui/switch.tsx`)

- ✅ Componente Switch customizado
- ✅ Estilizado com tema da plataforma
- ✅ Acessível e responsivo

### 5. Testes (`src/lib/__tests__/unicode-crypto.test.ts`)

- ✅ Testes completos para todas as funções
- ✅ Testes de ciclo completo (criptografar → descriptografar)
- ✅ Testes de casos extremos

## 🔧 Como Funciona

### Criptografia Unicode

A criptografia converte cada caractere do texto para seu código Unicode em formato `\uXXXX`:

```typescript
// Exemplo:
"Hello" → "\u0048\u0065\u006c\u006c\u006f"
```

### Processo de Salvamento

1. **Usuário digita texto** no front-end
2. **Se criptografia ativada**: Texto é convertido para Unicode antes de salvar
3. **Se criptografia desativada**: Texto é salvo normalmente
4. **Ao buscar do banco**: Texto é automaticamente descriptografado se necessário

### Fluxo Completo

```
Front-end → [Criptografar?] → API → Banco de Dados
                ↓ Sim                    ↓
            Unicode (\uXXXX)      Salva Unicode
                ↓ Não                   ↓
            Texto Normal          Salva Normal

Banco de Dados → API → [Descriptografar?] → Front-end
     ↓                              ↓ Sim
  Unicode                    Descriptografa
     ↓                              ↓ Não
  Normal                      Retorna Normal
```

## 📊 Estrutura de Dados

### Tabela `criptografias_texto`

```sql
- id: UUID
- user_id: UUID
- texto_original: TEXT (pode ser NULL)
- texto_criptografado: TEXT
- acao: TEXT ('criptografar' | 'descriptografar')
- usar_criptografia: BOOLEAN
- created_at: TIMESTAMP
```

## 🎯 Exemplos de Uso

### Front-end

```typescript
import { encryptText, decryptText } from '@/lib/unicode-crypto'

// Criptografar
const texto = "Hello World"
const criptografado = encryptText(texto)
// Resultado: "\u0048\u0065\u006c\u006c\u006f\u0020\u0057\u006f\u0072\u006c\u0064"

// Descriptografar
const descriptografado = decryptText(criptografado)
// Resultado: "Hello World"
```

### API

```typescript
// POST /api/ferramentas/criptografar-texto
{
  "texto": "Hello World",
  "acao": "criptografar",
  "usar_criptografia": true
}

// Resposta
{
  "success": true,
  "resultado": "\\u0048\\u0065\\u006c\\u006c\\u006f\\u0020\\u0057\\u006f\\u0072\\u006c\\u0064",
  "acao": "criptografar",
  "usar_criptografia": true
}
```

## 🔍 Funcionalidades

### 1. Criptografar Texto

- Converte texto para Unicode
- Opção de ativar/desativar criptografia
- Preview em tempo real
- Salvar no histórico

### 2. Descriptografar Texto

- Converte Unicode de volta para texto
- Detecção automática de texto criptografado
- Funciona mesmo com texto não criptografado

### 3. Histórico

- Salva todas as operações no banco
- Busca histórico do usuário
- Descriptografa automaticamente ao exibir

## ⚙️ Configuração

### Opção de Ativar/Desativar

O usuário pode escolher se deseja usar criptografia:

- **Ativado**: Texto é convertido para Unicode antes de salvar
- **Desativado**: Texto é salvo normalmente (sem criptografia)

### Compatibilidade

- ✅ Compatível com campos `VARCHAR` e `TEXT` no banco
- ✅ Funciona com qualquer tipo de caractere (UTF-8)
- ✅ Suporta emojis e caracteres especiais

## 🛡️ Segurança

### Características

- **Leve**: Criptografia simples e rápida
- **Reversível**: Sempre pode ser descriptografado
- **Não é para dados sensíveis**: Não use para senhas ou informações críticas
- **Proteção contra bots**: Útil para dificultar automação simples

### Limitações

- ⚠️ **NÃO é criptografia forte**: Fácil de reverter se alguém souber o formato
- ⚠️ **NÃO use para senhas**: Use hashing (bcrypt, argon2) para senhas
- ⚠️ **NÃO use para dados sensíveis**: Use criptografia AES para dados críticos

## 📝 Testes

Execute os testes com:

```bash
npm test
# ou
npx jest src/lib/__tests__/unicode-crypto.test.ts
```

### Cobertura de Testes

- ✅ Criptografia de texto simples
- ✅ Criptografia com espaços e caracteres especiais
- ✅ Descriptografia correta
- ✅ Detecção de texto criptografado
- ✅ Funções condicionais (encryptIfEnabled, decryptIfNeeded)
- ✅ Ciclo completo (criptografar → descriptografar)
- ✅ Casos extremos (texto vazio, caracteres especiais)

## 🚀 Como Usar

### 1. Acessar a Página

Navegue para `/ferramentas/criptografar-texto`

### 2. Configurar Criptografia

Use o switch "Usar Criptografia Unicode" para ativar/desativar

### 3. Criptografar

1. Digite o texto
2. Clique em "Criptografar"
3. Veja o resultado em Unicode
4. Opcional: Salvar no histórico

### 4. Descriptografar

1. Cole o texto Unicode
2. Clique em "Descriptografar"
3. Veja o texto original
4. Opcional: Salvar no histórico

## ✅ Checklist de Implementação

- [x] Biblioteca de criptografia Unicode criada
- [x] Funções encryptText e decryptText implementadas
- [x] Integração com front-end existente
- [x] Opção de ativar/desativar criptografia
- [x] Integração com banco de dados
- [x] Salvamento com flag usar_criptografia
- [x] Descriptografia automática ao buscar
- [x] Testes completos criados
- [x] Documentação criada
- [x] Componente Switch criado
- [x] Interface atualizada

## 📚 Referências

- [Unicode Standard](https://unicode.org/)
- [JavaScript String.fromCharCode()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/fromCharCode)
- [JavaScript charCodeAt()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/charCodeAt)

---

**Sistema 100% funcional e pronto para uso!** 🎉



