# 🔐 Solução: Erro de Permissão no GitHub

## ❌ Erro Encontrado

```
remote: Permission to arcanumspy-crypto/acra.git denied to emenjsx1.
fatal: unable to access 'https://github.com/arcanumspy-crypto/acra.git/': The requested URL returned error: 403
```

## 🔍 Causa

O usuário `emenjsx1` não tem permissão para fazer push no repositório `arcanumspy-crypto/acra` porque:
- O repositório pertence à organização `arcanumspy-crypto`
- Você precisa ser adicionado como colaborador ou ter permissões de escrita

## ✅ Soluções

### Opção 1: Ser Adicionado como Colaborador (Recomendado)

1. Peça ao administrador da organização `arcanumspy-crypto` para:
   - Acessar: https://github.com/arcanumspy-crypto/acra/settings/access
   - Clicar em **"Add people"** ou **"Invite a collaborator"**
   - Adicionar seu usuário: `emenjsx1`
   - Dar permissão de **Write** ou **Admin**

2. Após ser adicionado, tente novamente:
   ```bash
   git push origin main
   ```

### Opção 2: Usar Personal Access Token (PAT)

Se você tem acesso à organização mas precisa autenticar:

1. **Criar Personal Access Token:**
   - Acesse: https://github.com/settings/tokens
   - Clique em **"Generate new token"** → **"Generate new token (classic)"**
   - Dê um nome: `acra-repo-access`
   - Selecione escopos: `repo` (acesso completo aos repositórios)
   - Clique em **"Generate token"**
   - **COPIE O TOKEN** (você não verá novamente!)

2. **Usar o token no push:**
   ```bash
   git push https://SEU_TOKEN@github.com/arcanumspy-crypto/acra.git main
   ```

   Ou configure a URL com token:
   ```bash
   git remote set-url origin https://SEU_TOKEN@github.com/arcanumspy-crypto/acra.git
   git push origin main
   ```

### Opção 3: Fork e Pull Request

Se não tiver acesso direto:

1. **Fazer Fork do repositório:**
   - Acesse: https://github.com/arcanumspy-crypto/acra
   - Clique em **"Fork"**
   - Isso criará uma cópia em: `https://github.com/emenjsx1/acra`

2. **Configurar seu fork:**
   ```bash
   git remote set-url origin https://github.com/emenjsx1/acra.git
   git push origin main
   ```

3. **Criar Pull Request:**
   - Após fazer push no seu fork
   - Acesse: https://github.com/arcanumspy-crypto/acra
   - Clique em **"Pull requests"** → **"New pull request"**
   - Selecione seu fork como source
   - Crie o PR para merge

### Opção 4: Usar SSH (Se tiver chave SSH configurada)

1. **Mudar para SSH:**
   ```bash
   git remote set-url origin git@github.com:arcanumspy-crypto/acra.git
   git push origin main
   ```

## 🔄 Reverter para Repositório Anterior

Se quiser voltar ao repositório anterior:

```bash
git remote set-url origin https://github.com/emenjsx1/spyacranum.git
git push origin main
```

## 📝 Verificar Permissões Atuais

Para verificar se você tem acesso:

1. Acesse: https://github.com/arcanumspy-crypto/acra
2. Se você vir botões como **"Code"**, **"Issues"**, **"Pull requests"**, você tem acesso de leitura
3. Se você vir **"Settings"**, você tem acesso de administração
4. Se não conseguir acessar, você não tem permissão

## ⚠️ Importante

- **Nunca** compartilhe seu Personal Access Token publicamente
- **Nunca** commite tokens no código
- Use tokens apenas para autenticação local
- Prefira ser adicionado como colaborador quando possível







