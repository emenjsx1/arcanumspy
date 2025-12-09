# 🎤 Vozes IA - Guia de Configuração

Este guia explica como configurar e usar a funcionalidade de **Vozes IA – Clone e Gere Narrações** na plataforma ArcanumSpy.

## 📋 Pré-requisitos

1. **Conta na Fish Audio API**
   - Acesse: https://fish.audio
   - Crie uma conta e obtenha sua API Key
   - Verifique os limites e preços no plano escolhido

2. **Banco de Dados Supabase**
   - Execute a migration `004_voice_cloning.sql` no seu banco Supabase
   - A migration cria as tabelas `voice_clones` e `voice_audio_generations`

## 🔧 Configuração

### 1. Variáveis de Ambiente

**✅ API Key da Fish Audio já fornecida!**

Adicione as seguintes variáveis no seu arquivo `.env.local`:

```env
# Fish Audio API
FISH_AUDIO_API_URL=https://api.fish.audio
FISH_AUDIO_API_KEY=7c0f58472b724703abc385164af007b5

# Supabase (já existentes)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

**⚠️ IMPORTANTE**: 
- Crie o arquivo `.env.local` na raiz do projeto
- NUNCA commite este arquivo no Git (já está no .gitignore)
- Reinicie o servidor Next.js após criar/editar o `.env.local`

### 2. Executar Migration

Execute a migration SQL no Supabase:

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Execute o conteúdo do arquivo `supabase/migrations/004_voice_cloning.sql`
4. Verifique se as tabelas foram criadas corretamente

### 3. Instalar Dependências

As dependências já estão no `package.json`. Execute:

```bash
npm install
```

## 🚀 Como Usar

### 1. Clonar uma Voz

1. Acesse a página `/voices` (após fazer login)
2. Clique em **Clonar Voz**
3. Selecione um arquivo de áudio (WAV, MP3, WEBM, OGG)
4. Digite um nome para a voz
5. Opcionalmente, adicione uma descrição
6. Clique em **Clonar Voz**

O sistema irá:
- Enviar o áudio para a Fish Audio API
- Criar um clone de voz
- Salvar o `voice_id` no banco de dados

**Nota:** O processamento pode levar alguns minutos dependendo do tamanho do áudio.

### 2. Gerar Narração (TTS)

1. Selecione uma voz clonada da lista
2. Digite ou cole o texto que deseja converter
3. Clique em **Gerar Narração**
4. Aguarde o processamento
5. Reproduza o áudio gerado ou faça download

O sistema:
- Verifica se já existe um áudio gerado com o mesmo texto (cache)
- Se não existir, gera novo áudio via Fish Audio API
- Salva o áudio gerado para reutilização futura

## 📁 Estrutura de Arquivos

```
ej-swipefile/
├── supabase/
│   └── migrations/
│       └── 004_voice_cloning.sql          # Migration do banco
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── voices/
│   │   │       ├── create-voice/
│   │   │       │   └── route.ts           # POST: Criar clone
│   │   │       ├── list/
│   │   │       │   └── route.ts           # GET: Listar vozes
│   │   │       ├── generate-tts/
│   │   │       │   └── route.ts           # POST: Gerar TTS
│   │   │       └── [id]/
│   │   │           └── route.ts           # DELETE: Deletar voz
│   │   └── (auth)/
│   │       └── voices/
│   │           └── page.tsx               # Página principal
│   └── lib/
│       ├── fish-audio.ts                  # Integração Fish Audio
│       └── types.ts                       # Tipos TypeScript
└── VOZES_IA_SETUP.md                      # Este arquivo
```

## 🔐 Segurança

- ✅ A API Key da Fish Audio **nunca** é exposta no frontend
- ✅ Todas as chamadas à Fish Audio passam pelo backend
- ✅ Validação de autenticação em todas as rotas
- ✅ Validação de propriedade (usuário só acessa suas próprias vozes)
- ✅ Validação de tipo e tamanho de arquivo

## 💾 Cache

O sistema implementa cache inteligente:

- Se o mesmo texto for gerado com a mesma voz, o sistema retorna o áudio já gerado
- Isso economiza chamadas à API e reduz custos
- O hash do texto é usado para busca rápida no banco

## 📊 Limites e Restrições

### Upload de Áudio:
- Formatos suportados: WAV, MP3, WEBM, OGG
- Tamanho máximo: 25MB
- Recomendado: Áudio claro, mínimo 10 segundos de duração

### Geração de TTS:
- Limites dependem do plano da Fish Audio
- Verifique sua conta para limites de uso

## 🐛 Troubleshooting

### Erro: "FISH_AUDIO_API_KEY não configurada"
- Verifique se a variável de ambiente está configurada
- Reinicie o servidor Next.js após adicionar a variável

### Erro: "Voz não encontrada ou não pertence ao usuário"
- Verifique se você está autenticado
- Verifique se o ID da voz está correto

### Erro: "Tipo de arquivo não suportado"
- Use apenas formatos: WAV, MP3, WEBM, OGG
- Verifique a extensão do arquivo

### Erro: "Arquivo muito grande"
- Reduza o tamanho do arquivo para menos de 25MB
- Use compressão de áudio se necessário

## 📝 Notas de Implementação

### Armazenamento de Áudio

Atualmente, o áudio gerado é retornado como base64 no JSON. Para produção, recomenda-se:

1. **Opção 1: Supabase Storage**
   - Upload para Supabase Storage
   - Salvar URL pública no banco
   - Mais eficiente e escalável

2. **Opção 2: S3 ou Cloud Storage**
   - Upload para S3, Cloudflare R2, etc.
   - Salvar URL no banco

### Streaming (Opcional)

Para implementar streaming de áudio em tempo real:

1. Fish Audio suporta WebSocket para streaming
2. Implementar endpoint WebSocket no backend
3. Criar componente no frontend que recebe chunks de áudio
4. Reproduzir conforme recebe os dados

## 🎯 Próximos Passos

- [ ] Implementar upload de áudio para Supabase Storage
- [ ] Adicionar suporte a streaming de áudio
- [ ] Adicionar mais opções de geração (velocidade, tom, etc.)
- [ ] Implementar histórico de gerações
- [ ] Adicionar compartilhamento de vozes entre usuários
- [ ] Adicionar analytics de uso

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do servidor Next.js
2. Verifique os logs do Supabase
3. Consulte a documentação da Fish Audio: https://fish.audio/docs

## ✅ Checklist de Deploy

Antes de fazer deploy em produção:

- [ ] Configurar variáveis de ambiente no servidor
- [ ] Executar migration no banco de dados de produção
- [ ] Testar upload de áudio
- [ ] Testar geração de TTS
- [ ] Verificar limites da Fish Audio API
- [ ] Configurar monitoramento de erros
- [ ] Configurar armazenamento de áudio (S3/Storage)

