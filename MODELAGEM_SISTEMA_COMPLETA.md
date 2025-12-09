# 📐 MODELAGEM COMPLETA DO SISTEMA
## Baseado em: https://clubedaescala.com/dashboard

---

## 🎯 **1. ESTRUTURA GERAL DO SISTEMA**

### 1.1. Layout Principal
- **Header Fixo**: Logo + Menu Hambúrguer + Perfil + Tema
- **Sidebar**: Navegação lateral com ícones e labels
- **Área de Conteúdo**: Scrollável, padding responsivo
- **Footer**: (Opcional) Links úteis

### 1.2. Design System
- **Cores Primárias**: `#ff5a1f` (Laranja), `#0b0c10` (Preto), `#ffffff` (Branco)
- **Cores Secundárias**: Tons de cinza para backgrounds
- **Tipografia**: Inter ou similar, hierarquia clara
- **Espaçamento**: Sistema de 4px (4, 8, 12, 16, 24, 32, 48, 64)
- **Bordas**: `rounded-lg` (8px), `rounded-xl` (12px)
- **Sombras**: Subtis, apenas em hover

### 1.3. Remoções
- ❌ Card de créditos no dashboard
- ❌ Botão "Ver ArcanumSpy" na página de login

---

## 🔷 **2. MÓDULO DE SESSÕES**

### 2.1. Otimizações
- **Connection Pooling**: Aumentar pool de conexões
- **Query Optimization**: Índices em todas as foreign keys
- **Caching**: Cache de queries frequentes
- **Batch Operations**: Processar múltiplas operações em lote

### 2.2. Configurações
```sql
-- Aumentar max_connections se necessário
-- Otimizar timeouts
-- Implementar connection pooling no Supabase
```

---

## 🔷 **3. MÓDULO DE CRIPTOGRAFIA**

### 3.1. Funcionalidades
- **Criptografar Texto**: AES-256
- **Descriptografar Texto**: Com chave
- **Histórico**: Salvar operações
- **Exportar**: Copiar resultado

### 3.2. UI
- **Input**: Textarea grande
- **Botões**: Criptografar / Descriptografar
- **Resultado**: Área destacada com botão de copiar
- **Histórico**: Lista de operações recentes

---

## 🔷 **4. TAREFAS / LISTAS / CARDS (ESTILO TRELLO)**

### 4.1. Estrutura
```
Lista
  └── Card
      ├── Título
      ├── Descrição
      ├── Cor
      ├── Anotações
      └── Cronômetro integrado
```

### 4.2. Funcionalidades
- ✅ Criar listas (já implementado)
- ✅ Cards dentro de listas (já implementado)
- ⏳ Cronômetro por card
- ⏳ Drag and drop entre listas
- ⏳ Filtros e busca

---

## 🔷 **5. DOMAIN SPY**

### 5.1. Funcionalidades
- **Input**: Campo para domínio (ex: alvo.com)
- **Scanner**: Buscar URLs ativas
- **Descoberta**: Encontrar páginas ocultas (/up/1, /up/2, etc)
- **Resultados**: Lista organizada
- **Export**: CSV/JSON

### 5.2. Técnicas
- **Wordlist**: Lista de paths comuns
- **Status Codes**: Verificar 200, 301, 302
- **Rate Limiting**: Respeitar limites do servidor
- **Cache**: Evitar requisições duplicadas

---

## 🔷 **6. ESCALATED OFFERS (Ofertas Escaladas)**

### 6.1. Conexão com Ads
- **Tabela**: `ads` ou `facebook_ads`
- **Campos**: nome, criativo, link, data, status
- **Filtros**: Por data, status, plataforma

### 6.2. Visualização
- **Grid**: Cards com preview
- **Detalhes**: Modal com informações completas
- **Ações**: Editar, deletar, duplicar

---

## 🔷 **7. COMMUNITY SECTION**

### 7.1. Funcionalidades
- **Posts**: Criar, editar, deletar
- **Comentários**: Sistema de threads
- **Reações**: Like, útil, etc
- **Pesquisa**: Buscar posts
- **Categorias**: Organizar por tópicos

### 7.2. UI
- **Feed**: Timeline de posts
- **Sidebar**: Categorias, trending
- **Criar Post**: Modal ou página dedicada

---

## 🔷 **8. ARQUIVOS GRAVADOS**

### 8.1. Funcionalidades
- **Listagem**: Todos os arquivos salvos
- **Filtros**: Por tipo, data, nome
- **Download**: Botão de download
- **Preview**: Visualizar antes de baixar

### 8.2. Campos
- Data de upload
- Título/Nome
- Tipo (áudio, vídeo, documento)
- Tamanho
- Status

---

## 🔷 **9. ADMIN AREA - CADASTRO DE AULAS**

### 9.1. Estrutura de Dados
```sql
aulas (
  id, nome, descricao, link_video, 
  data_aula, nivel, categoria, 
  ordem, aula_anterior_id, aula_proxima_id
)

niveis_aula (
  id, aula_id, nome_nivel, ordem, 
  conteudo, concluido
)

progresso_usuario (
  user_id, aula_id, concluida, 
  data_conclusao, progresso_percentual
)
```

### 9.2. Funcionalidades Admin
- **CRUD de Aulas**: Criar, editar, deletar
- **Gerenciar Níveis**: Adicionar níveis por aula
- **Ordem**: Definir sequência
- **Pré-requisitos**: Aula anterior necessária

### 9.3. Funcionalidades Usuário
- **Visualizar Aulas**: Lista organizada
- **Assistir**: Player de vídeo
- **Marcar Conclusão**: Botão "Finalizar"
- **Progresso**: Barra de progresso

---

## 🔷 **10. MAPA DO INICIANTE**

### 10.1. Visualização
- **Timeline**: Linha do tempo com aulas
- **Status**: Concluída, Em andamento, Bloqueada
- **Progresso**: Percentual geral
- **Navegação**: Clicar para ir à aula

### 10.2. Indicadores
- ✅ Aula concluída
- 🔄 Aula em andamento
- 🔒 Aula bloqueada (pré-requisito não atendido)
- 📍 Aula atual

---

## 🔷 **11. CREATIVE LAB**

### 11.1. Criador de Criativos
- **Campos**:
  - Título
  - Descrição
  - Upload de imagem
  - Template (seleção)
  - Cores
  - Texto
- **Preview**: Visualização em tempo real
- **Export**: Download PNG/JPG

### 11.2. Avaliador de Criativos
- **Upload**: Imagem do criativo
- **Análise IA**:
  - Clareza (0-10)
  - Oferta (0-10)
  - Chamada (0-10)
  - Estrutura (0-10)
- **Nota Final**: Média ponderada
- **Recomendações**: Lista de melhorias

---

## 🔷 **12. DASHBOARD (AJUSTES)**

### 12.1. Cards Principais
- Ofertas Visualizadas
- Favoritos
- Categorias Acessadas
- Atividades Recentes

### 12.2. Seções
- Ofertas Quentes
- Ofertas Escaladas
- Ofertas Novas
- Recomendações

### 12.3. Remoções
- ❌ Card de Créditos Usados

---

## 🔷 **13. ESTRUTURA DE BANCO DE DADOS**

### 13.1. Tabelas Principais
```sql
-- Produtividade
tarefas, tarefa_listas, metas, anotacoes, pomodoros, pomodoro_settings, transacoes_financeiras

-- Comunidade
community_posts, community_comments, community_reactions

-- Aulas
aulas, niveis_aula, progresso_usuario

-- Criativos
criativos, criativo_avaliacoes

-- Domain Spy
domain_scans, discovered_urls

-- Arquivos
arquivos_gravados

-- Ads/Ofertas
ads, facebook_ads, escalated_offers
```

---

## 🔷 **14. PRIORIDADES DE IMPLEMENTAÇÃO**

### Fase 1 (Crítico)
1. ✅ Remover créditos do dashboard
2. ✅ Sistema de tarefas com listas
3. ⏳ Melhorar visual do cronômetro
4. ⏳ Melhorar anotações

### Fase 2 (Importante)
5. ⏳ Domain Spy
6. ⏳ Escalated Offers
7. ⏳ Arquivos Gravados
8. ⏳ Criptografia melhorada

### Fase 3 (Melhorias)
9. ⏳ Community Section
10. ⏳ Admin - Aulas
11. ⏳ Mapa do Iniciante
12. ⏳ Creative Lab

---

## 🔷 **15. REFERÊNCIA VISUAL**

Baseado em: https://clubedaescala.com/dashboard

**Características a imitar:**
- Layout limpo e espaçado
- Cards com bordas sutis
- Navegação lateral clara
- Cores neutras com acentos
- Tipografia legível
- Animações suaves


