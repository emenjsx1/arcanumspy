# Credenciais de Teste - ArcanumSpy

## 📋 Usuários de Teste

Os usuários de teste estão definidos em `src/lib/mock-data.ts`.

### 🔐 Credenciais de Login

**IMPORTANTE:** A senha para TODOS os usuários é: `password123`

---

### 👤 Usuários Cliente

#### 1. João Silva (Plano Pro)
- **Email:** `joao@example.com`
- **Senha:** `password123`
- **Plano:** Pro
- **Role:** user
- **Status:** active

#### 2. Maria Santos (Plano Elite)
- **Email:** `maria@example.com`
- **Senha:** `password123`
- **Plano:** Elite
- **Role:** user
- **Status:** active

#### 3. Pedro Costa (Plano Free)
- **Email:** `pedro@example.com`
- **Senha:** `password123`
- **Plano:** Free
- **Role:** user
- **Status:** active

---

### 👨‍💼 Usuário Admin

#### Admin User
- **Email:** `admin@arcanumspy.com`
- **Senha:** `password123`
- **Plano:** Elite
- **Role:** admin
- **Status:** active

---

## 🚀 Como Testar

1. Acesse `http://localhost:3000/login`
2. Use qualquer um dos emails acima com a senha `password123`
3. Para acessar o painel admin, use: `admin@arcanumspy.com`

## 📝 Notas

- Todos os usuários usam a mesma senha: `password123`
- Os dados são mockados e estão em memória (não persistem após recarregar)
- O sistema de autenticação é simulado para desenvolvimento
- Em produção, isso seria substituído por autenticação real

## 📁 Localização dos Dados

- **Arquivo de definição:** `src/lib/mock-data.ts`
- **Validação de login:** `src/app/(public)/login/page.tsx`
- **API de login:** `src/app/api/auth/login/route.ts`

