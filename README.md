# ArcanumSpy - Frontend

Sistema completo de front-end para o SaaS ArcanumSpy, uma biblioteca de ofertas de Direct Response Marketing.

## 🚀 Tecnologias

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI
- **Zustand** - Gerenciamento de estado
- **React Hook Form + Zod** - Formulários e validação
- **next-themes** - Suporte a temas dark/light
- **Lucide React** - Ícones

## 📁 Estrutura do Projeto

```
ej-swipefile/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (public)/           # Rotas públicas
│   │   ├── (auth)/             # Rotas protegidas (usuário)
│   │   ├── (admin)/             # Rotas admin
│   │   └── api/                 # API routes (mock)
│   ├── components/
│   │   ├── ui/                 # Componentes shadcn/ui
│   │   ├── layout/             # Componentes de layout
│   │   ├── public/              # Componentes área pública
│   │   ├── dashboard/           # Componentes dashboard
│   │   └── admin/               # Componentes admin
│   ├── lib/
│   │   ├── types.ts            # Types TypeScript
│   │   ├── constants.ts        # Constantes
│   │   ├── mock-data.ts        # Dados mock
│   │   └── utils.ts            # Utilitários
│   └── store/                  # Zustand stores
├── public/                     # Arquivos estáticos
└── package.json
```

## 🎯 Funcionalidades

### Área Pública
- ✅ Landing page completa
- ✅ Página de preços
- ✅ Sobre o produto
- ✅ Login e Signup
- ✅ Página de contato

### Dashboard do Usuário
- ✅ Dashboard home com estatísticas
- ✅ Biblioteca de ofertas com filtros avançados
- ✅ Detalhes completos de cada oferta
- ✅ Sistema de favoritos
- ✅ Página de categorias
- ✅ Configurações da conta
- ✅ Gestão de billing

### Painel Administrativo
- ✅ Dashboard admin com métricas
- ✅ Gestão completa de usuários
- ✅ CRUD de ofertas
- ✅ Gestão de categorias
- ✅ Configuração de planos
- ✅ Editor de conteúdo da landing
- ✅ Logs e auditoria
- ✅ Sistema de suporte/tickets

## 🛠️ Instalação

1. Instale as dependências:
```bash
npm install
```

2. **Configure as variáveis de ambiente:**
   - Crie um arquivo `.env.local` na raiz do projeto
   - Adicione suas credenciais do Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
   ```
   - Veja instruções detalhadas em [ENV_SETUP.md](./ENV_SETUP.md)

3. **Configure o banco de dados:**
   - Execute o arquivo `supabase/migrations/COMPLETE_SETUP.sql` no SQL Editor do Supabase
   - Isso criará todas as tabelas, políticas RLS e dados iniciais

4. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

5. Acesse [http://localhost:3000](http://localhost:3000)

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run start` - Inicia servidor de produção
- `npm run lint` - Executa o linter

## 🔐 Autenticação Mock

Para testar o login, use:
- **Email**: qualquer email dos usuários mock em `src/lib/mock-data.ts`
- **Senha**: `password123`

Usuários disponíveis:
- `joao@example.com` - Plano Pro
- `maria@example.com` - Plano Elite
- `admin@arcanumspy.com` - Admin
- `pedro@example.com` - Plano Free

## 🎨 Design System

O projeto utiliza um design system baseado em:
- **Cores**: Definidas em `src/app/globals.css` com suporte a dark mode
- **Componentes**: shadcn/ui com customizações
- **Tipografia**: Inter (Google Fonts)
- **Espaçamento**: Sistema de espaçamento do Tailwind

## 📱 Responsividade

O projeto é totalmente responsivo com breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1400px

## 🌙 Tema Dark/Light

O sistema suporta temas claro e escuro, gerenciado pelo `next-themes`. O usuário pode alternar entre os temas através do seletor no header.

## 📚 Componentes Principais

### Layout
- `Header` - Cabeçalho com navegação
- `Footer` - Rodapé
- `Sidebar` - Barra lateral para dashboard/admin

### UI
Todos os componentes shadcn/ui estão disponíveis em `src/components/ui/`:
- Button, Input, Card, Dialog, Table, etc.

## 🔄 Estado Global

O estado é gerenciado com Zustand:
- `auth-store` - Autenticação e usuário
- `offer-store` - Ofertas e favoritos

## 📡 API Routes Mock

As rotas de API estão em `src/app/api/`:
- `/api/auth/login` - Autenticação
- `/api/offers` - Lista de ofertas
- `/api/users` - Lista de usuários (admin)
- `/api/categories` - Lista de categorias

## 🚧 Próximos Passos

Para produção, você precisará:
1. Conectar com backend real
2. Implementar autenticação real (JWT, OAuth)
3. Adicionar testes
4. Configurar CI/CD
5. Adicionar analytics
6. Implementar upload de imagens real
7. Adicionar paginação real
8. Implementar busca avançada

## 📄 Licença

Este projeto é privado e proprietário.

## 👥 Suporte

Para dúvidas ou suporte, entre em contato através da página de contato no sistema.

