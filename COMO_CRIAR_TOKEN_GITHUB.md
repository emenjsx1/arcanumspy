# 🔑 Como Criar Token do GitHub para Push

## ⚠️ Problema
```
remote: Permission to arcanumspy-crypto/acra.git denied to emenjsx1.
fatal: unable to access 'https://github.com/arcanumspy-crypto/acra.git/': The requested URL returned error: 403
```

## ✅ Solução: Criar Personal Access Token

### Passo 1: Criar o Token

1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. Preencha:
   - **Note**: `acra-repo-push` (ou qualquer nome)
   - **Expiration**: Escolha (30 dias, 90 dias, ou No expiration)
   - **Select scopes**: Marque **`repo`** (isso dá acesso completo aos repositórios)
4. Clique em **"Generate token"** (no final da página)
5. **⚠️ IMPORTANTE**: Copie o token imediatamente! Você não verá novamente!
   - O token será algo como: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Passo 2: Usar o Token

Depois de copiar o token, execute no terminal:

```bash
# Substitua SEU_TOKEN pelo token que você copiou
git remote set-url origin https://SEU_TOKEN@github.com/arcanumspy-crypto/acra.git

# Fazer push
git push origin main
```

**Exemplo:**
```bash
git remote set-url origin https://ghp_abc123xyz@github.com/arcanumspy-crypto/acra.git
git push origin main
```

### Passo 3: Verificar

Após o push, você verá:
```
Enumerating objects: ...
Writing objects: 100% ...
To https://github.com/arcanumspy-crypto/acra.git
 * [new branch]      main -> main
```

## 🔒 Segurança

- ⚠️ **NUNCA** compartilhe seu token publicamente
- ⚠️ **NUNCA** commite o token no código
- ✅ O token fica apenas na URL do remote (local no seu computador)
- ✅ Você pode revogar o token a qualquer momento em: https://github.com/settings/tokens

## 🔄 Alternativa: Usar SSH

Se você tem chave SSH configurada no GitHub:

```bash
git remote set-url origin git@github.com:arcanumspy-crypto/acra.git
git push origin main
```

## 📝 Nota

O token é necessário porque o repositório pertence à organização `arcanumspy-crypto` e requer autenticação especial.







