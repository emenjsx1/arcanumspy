# 📦 Guia: Enviar Projeto para GitLab

## Passo 1: Criar Repositório no GitLab

1. Acesse [gitlab.com](https://gitlab.com) e faça login
2. Clique em **"New project"** ou **"Novo projeto"**
3. Escolha **"Create blank project"** ou **"Criar projeto em branco"**
4. Preencha:
   - **Project name**: `ej-swipefile` (ou o nome que preferir)
   - **Visibility Level**: Escolha (Private, Internal ou Public)
5. Clique em **"Create project"**

## Passo 2: Copiar a URL do Repositório GitLab

Após criar o projeto, você verá uma página com instruções. Copie a URL do repositório:
- **HTTPS**: `https://gitlab.com/seu-usuario/ej-swipefile.git`
- **SSH**: `git@gitlab.com:seu-usuario/ej-swipefile.git`

## Passo 3: Configurar GitLab no Projeto Local

Execute os comandos abaixo no terminal (substitua `SUA_URL_DO_GITLAB` pela URL que você copiou):

```bash
# Adicionar GitLab como novo remote (chamado de 'gitlab')
git remote add gitlab SUA_URL_DO_GITLAB

# Ou se quiser substituir o GitHub completamente:
# git remote set-url origin SUA_URL_DO_GITLAB

# Verificar os remotes configurados
git remote -v
```

## Passo 4: Fazer Commit das Alterações

```bash
# Adicionar todos os arquivos modificados e novos
git add .

# Fazer commit
git commit -m "feat: adiciona sistema de histórico de copys e transcrições, tutorial da plataforma e correções diversas"

# Ou se preferir commits separados:
# git add src/app/(auth)/ias/historico/
# git commit -m "feat: adiciona página de histórico de copys e transcrições"
# git add src/app/(auth)/tutorial/
# git commit -m "feat: adiciona página de tutorial da plataforma"
# git add supabase/migrations/057_create_copies_criativas.sql
# git commit -m "feat: adiciona migration para tabela de copys criativas"
```

## Passo 5: Enviar para o GitLab

```bash
# Enviar para o GitLab (branch main)
git push gitlab main

# Ou se configurou como origin:
# git push origin main
```

## Passo 6: Configurar Branch Padrão (Opcional)

Se o GitLab pedir para configurar a branch padrão:
1. Vá em **Settings** → **Repository**
2. Em **Default branch**, escolha `main`
3. Salve

## Comandos Rápidos (Resumo)

```bash
# 1. Adicionar GitLab como remote
git remote add gitlab https://gitlab.com/seu-usuario/ej-swipefile.git

# 2. Verificar remotes
git remote -v

# 3. Adicionar e commitar mudanças
git add .
git commit -m "feat: atualizações do sistema"

# 4. Enviar para GitLab
git push gitlab main
```

## Manter GitHub e GitLab Simultaneamente

Se quiser manter ambos os repositórios atualizados:

```bash
# Enviar para GitHub
git push origin main

# Enviar para GitLab
git push gitlab main

# Ou enviar para ambos de uma vez (criar alias)
git config alias.pushall '!git push origin main && git push gitlab main'
git pushall
```

## Solução de Problemas

### Erro: "remote gitlab already exists"
```bash
# Remover o remote existente
git remote remove gitlab

# Adicionar novamente
git remote add gitlab SUA_URL_DO_GITLAB
```

### Erro de Autenticação
- **HTTPS**: Use Personal Access Token (Settings → Access Tokens)
- **SSH**: Configure chave SSH no GitLab (Settings → SSH Keys)

### Mudar URL do Remote
```bash
# Ver URL atual
git remote get-url gitlab

# Mudar URL
git remote set-url gitlab NOVA_URL
```







