Analise todo o projeto, arquivo por arquivo, com o objetivo de identificar e explicar todas as causas dos erros 500 que ocorrem nos seguintes assets e rotas internas do Next.js:

- /_next/static/css/app/layout.css
- /_next/static/chunks/main-app.js
- /_next/static/chunks/app/(public)/layout.js
- /_next/static/chunks/app-pages-internals.js
- /_next/static/chunks/app/(public)/page.js
- /_next/static/chunks/app/not-found.js
- /api/ias/remover-background

Objetivo Geral:
Descobrir exatamente o que está quebrando o build do Next.js e causando erros 500 nos arquivos do App Router e nos chunks gerados automaticamente.

Tarefas obrigatórias:
1. Ler e analisar todo o projeto do início ao fim, incluindo:
   - Pastas app/, pages/, public/, api/, libs/, config/
   - Middleware, rota raiz, interceptors e providers
   - Componentes server/client
   - Importações duplicadas, caminhos incorretos e loops de renderização
   - Qualquer extensão do Chrome que possa estar interferindo (como enable_copy.js)

2. Mapear:
   - Arquivos que o Next.js não está conseguindo compilar
   - Componentes client que estão sendo importados dentro de server components
   - Erros de SSR e hydration
   - Rotas que chamam funções inexistentes
   - APIs que não retornam Response correta
   - Dependências quebradas
   - Componentes ou arquivos que não seguem padrões do App Router

3. Identificar:
   - A origem exata dos erros 500
   - Por que o erro volta mesmo depois de apagado o .next/
   - Se existe algum arquivo corrompido no cache, build ou rota
   - Se existem arquivos que podem ser removidos do projeto (limpeza)
   - O que está impedindo o Next.js de gerar os chunks da pasta "/_next/static"

4. Criar um relatório detalhado contendo:
   - Lista completa dos arquivos problemáticos
   - Linha por linha onde o erro começa
   - Explicações técnicas claras
   - Por que esses chunks falham no carregamento
   - Como resolver de forma definitiva

5. Criar um plano final de correção:
   - Ajustes de estrutura
   - Correções em rotas, imports e componentes
   - Limpeza de arquivos obsoletos
   - Reorganização do projeto se necessário

IMPORTANTE:
Neste momento, você deve apenas PLANEJAR. 
Não modifique nenhum arquivo até eu aprovar o plano.
-- ============================================
-- CORRIGIR RECURSÃO INFINITA NAS POLÍTICAS RLS
-- ============================================

-- O problema: A função is_admin() faz SELECT na tabela profiles,
-- mas a política "Admins can view all profiles" também usa is_admin(),
-- causando recursão infinita.

-- SOLUÇÃO DEFINITIVA: Usar uma função SECURITY DEFINER que lê diretamente
-- da tabela profiles sem passar pelas políticas RLS, e usar essa função
-- nas políticas de forma que não cause recursão.

-- Remover todas as políticas existentes para recriar
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Criar função que verifica role do usuário atual SEM passar por RLS
-- Esta função usa SECURITY DEFINER para ler diretamente da tabela
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role_val TEXT;
BEGIN
  -- SECURITY DEFINER permite ler diretamente sem passar por RLS
  -- Isso evita recursão porque a função não é afetada pelas políticas
  SELECT role::TEXT INTO user_role_val
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_role_val, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recriar is_admin() usando a função auxiliar
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_current_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql STABLE;

-- Política 1: Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Política 2: Usuários podem inserir seu próprio perfil (para handle_new_user)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Política 3: Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Política 4: Admins podem ver todos os perfis
-- Usa get_current_user_role() que tem SECURITY DEFINER e não causa recursão
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (get_current_user_role() = 'admin');

-- Política 5: Admins podem atualizar todos os perfis
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (get_current_user_role() = 'admin');

