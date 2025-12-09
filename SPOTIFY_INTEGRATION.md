# 🎵 Integração Spotify - Documentação Completa

## 📋 Resumo da Implementação

Esta integração permite que usuários conectem suas contas Spotify Premium e reproduzam músicas durante as sessões de Pomodoro, com controle automático de play/pause sincronizado com o timer.

## 🗂️ Arquivos Criados

### 1. **Migration do Banco de Dados**
- `supabase/migrations/054_create_spotify_tokens.sql`
  - Cria tabela `spotify_tokens` para armazenar tokens OAuth
  - Implementa RLS (Row Level Security) policies
  - Adiciona índices e triggers

### 2. **Rotas de API (Backend)**

#### Autenticação OAuth
- `src/app/api/auth/spotify/login/route.ts`
  - Inicia fluxo OAuth do Spotify
  - Redireciona para página de login do Spotify
  - Solicita escopos necessários para Web Playback SDK

- `src/app/api/auth/spotify/callback/route.ts`
  - Recebe código de autorização do Spotify
  - Troca código por access_token e refresh_token
  - Salva tokens no banco de dados
  - Redireciona para dashboard

- `src/app/api/auth/spotify/refresh/route.ts`
  - Renova access_token quando expira
  - Atualiza tokens no banco
  - Retorna novo token para o frontend

#### Controle de Reprodução
- `src/app/api/spotify/status/route.ts`
  - Verifica status da conexão Spotify
  - Verifica se conta é Premium
  - Retorna informações sobre expiração de tokens

- `src/app/api/spotify/play/route.ts`
  - Controla reprodução (play, pause, next, previous)
  - Suporta tocar playlists ou músicas específicas
  - Requer device_id do Web Playback SDK

### 3. **Frontend**

#### Hook Customizado
- `src/hooks/useSpotify.ts`
  - Gerencia estado da conexão Spotify
  - Fornece funções para controlar reprodução
  - Verifica status e renova tokens automaticamente

#### Componente React
- `src/components/SpotifyPlayer.tsx`
  - Interface do player Spotify
  - Integra Web Playback SDK
  - Mostra música atual, controles e barra de progresso
  - Botão para conectar Spotify

### 4. **Integração com Pomodoro**
- `src/app/(auth)/produtividade/cronometro/page.tsx` (modificado)
  - Adiciona componente SpotifyPlayer
  - Integra play/pause automático com timer
  - Toca música quando timer inicia (modo foco)
  - Pausa música quando timer pausa ou completa

### 5. **Configuração**
- `.env.local.example`
  - Template de variáveis de ambiente
  - Credenciais do Spotify
  - URL de callback

## 🔧 Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
SPOTIFY_CLIENT_ID=f15321f6024b43c38451fa3051dfd026
SPOTIFY_CLIENT_SECRET=acfc9a2714134dd88363fe37d35ab687
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/spotify/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Para produção**, altere:
- `SPOTIFY_REDIRECT_URI` para seu domínio real
- `NEXT_PUBLIC_APP_URL` para seu domínio real

### 2. Configurar no Spotify Developer Dashboard

1. Acesse https://developer.spotify.com/dashboard
2. Crie uma nova aplicação
3. Adicione Redirect URI: `http://localhost:3000/api/auth/spotify/callback` (desenvolvimento)
4. Adicione Redirect URI de produção quando fizer deploy
5. Copie Client ID e Client Secret para `.env.local`

### 3. Executar Migration

Execute a migration no Supabase SQL Editor:

```sql
-- Execute o arquivo: supabase/migrations/054_create_spotify_tokens.sql
```

## 🎯 Funcionalidades

### ✅ Autenticação OAuth
- Fluxo completo Authorization Code Flow
- Refresh token automático
- Tokens armazenados de forma segura no backend
- Proteção CSRF com state parameter

### ✅ Web Playback SDK
- Player integrado no frontend
- Nome do player: "MozStarter Player"
- Volume padrão: 0.5
- Controles: play, pause, next, previous
- Detecção de mudança de música
- Exibição de capa, título e artista

### ✅ Integração com Pomodoro
- **Play automático**: Quando timer inicia no modo foco
- **Pause automático**: Quando timer pausa ou completa
- **Sincronização**: Música para automaticamente ao final do pomodoro

### ✅ Segurança
- Tokens nunca expostos no frontend
- RLS policies no Supabase
- Validação de usuário em todas as rotas
- Renovação automática de tokens

## 🚀 Como Usar

1. **Conectar Spotify**:
   - Acesse a página do Pomodoro
   - Clique em "🎧 Conectar com Spotify"
   - Faça login no Spotify
   - Autorize a aplicação

2. **Reproduzir Música**:
   - O player aparecerá após conectar
   - Use os controles para play/pause, next, previous
   - Ajuste o volume com o slider

3. **Integração Automática**:
   - Inicie um Pomodoro no modo "Foco"
   - A música começará automaticamente (se houver playlist configurada)
   - Ao pausar ou completar, a música pausará automaticamente

## ⚠️ Requisitos

- **Spotify Premium**: O Web Playback SDK requer conta Premium
- **Navegador moderno**: Chrome, Firefox, Safari ou Edge
- **HTTPS em produção**: O Spotify requer HTTPS para produção

## 🔍 Logs e Debug

O sistema inclui logs detalhados:
- `[GET /api/auth/spotify/login]` - Início do fluxo OAuth
- `[GET /api/auth/spotify/callback]` - Callback do Spotify
- `[POST /api/auth/spotify/refresh]` - Renovação de token
- `[SpotifyPlayer]` - Eventos do Web Playback SDK
- `[useSpotify]` - Estado do hook

## 🐛 Troubleshooting

### Erro: "Token expirado"
- O sistema renova automaticamente
- Se persistir, desconecte e reconecte

### Erro: "Spotify Premium necessário"
- Verifique se sua conta é Premium
- O Web Playback SDK não funciona com contas Free

### Player não conecta
- Verifique se o script do SDK está carregado
- Verifique console do navegador para erros
- Certifique-se de que está usando HTTPS em produção

### Música não toca automaticamente
- Verifique se há playlist configurada
- Verifique se o device_id está disponível
- Verifique logs do console

## 📝 Melhorias Futuras

1. **Seletor de Playlist**: Permitir escolher playlist antes de iniciar Pomodoro
2. **Músicas Ambiente**: Playlist específica para foco/concentração
3. **Volume Automático**: Ajustar volume baseado no modo (foco vs pausa)
4. **Estatísticas**: Rastrear músicas mais tocadas durante Pomodoros
5. **Integração com Spotify API**: Buscar playlists do usuário
6. **Notificações**: Avisar quando música muda ou para

## 🔐 Segurança

- ✅ Tokens armazenados apenas no backend
- ✅ RLS policies no Supabase
- ✅ Validação de usuário em todas as rotas
- ✅ CSRF protection com state parameter
- ✅ Refresh tokens seguros
- ✅ Tokens expiram automaticamente

## 📚 Referências

- [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- [Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk)
- [Authorization Code Flow](https://developer.spotify.com/documentation/general/guides/authorization/code-flow/)

