<<<<<<< HEAD
# Vida Prática e Financeira

Aplicação MVP em Vite com HTML, CSS e JavaScript para organizar rotina, controlar finanças e acompanhar tarefas.

## Tecnologias

- Vite
- HTML5 + CSS3 + JavaScript ES6+
- Supabase Auth e PostgreSQL
- Chart.js
- LocalStorage como fallback para demonstração
- PWA com manifest e service worker

## Estrutura

- index.html: landing page
- login.html: login
- cadastro.html: cadastro
- dashboard.html: visão geral
- financeiro.html: finanças e histórico
- planejamento.html: semana e tarefas
- perfil.html: conta e edição
- css/style.css: estilos principais
- css/responsive.css: responsividade
- js/core.js: utilitários e cálculos
- js/supabase.js: integração com Supabase + storage local
- js/auth.js: autenticação
- js/dashboard.js: dashboard
- js/financeiro.js: receitas, despesas, histórico
- js/planejamento.js: tarefas e semana
- js/perfil.js: perfil

## Como executar

1. npm install
2. npm run dev
3. abrir a URL informada pelo Vite

## Configuração do Supabase

Crie um arquivo `.env` com:

VITE_SUPABASE_URL=seu_url
VITE_SUPABASE_ANON_KEY=sua_chave_anonima

Se as variáveis não existirem, a aplicação usa `localStorage` para manter a experiência funcional em ambiente de demonstração.

## Banco de dados sugerido

```sql
create table profiles (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text check (type in ('receita','despesa')),
  description text,
  category text,
  value integer,
  date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  date date,
  status text check (status in ('pendente','concluida')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## RLS

Políticas podem ser configuradas por usuário autenticado para permitir apenas leitura, inserção, atualização e exclusão dos próprios registros.
=======
# vidapraticafinanceira
>>>>>>> 1c674a83f90bab1d92a5b711fe6a98893b681688
