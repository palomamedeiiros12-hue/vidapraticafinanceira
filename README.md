# Vida Prática e Financeira

Aplicação MVP em Vite com HTML, CSS e JavaScript para organizar rotina, controlar finanças e acompanhar tarefas.

## Tecnologias

- Vite
- HTML5 + CSS3 + JavaScript ES6+
- Supabase Auth e PostgreSQL com políticas RLS por usuário
- Chart.js
- PWA com manifest e service worker

## Estrutura

- index.html: landing page
- login.html: login
- cadastro.html: cadastro
- dashboard.html: visão geral
- financeiro.html: finanças e histórico
- planejamento.html: semana e tarefas
- perfil.html: conta e edição
- redefinir-senha.html: recuperação de senha
- css/style.css: estilos principais
- css/responsive.css: responsividade
- js/core.js: utilitários e cálculos
- js/supabase.js: autenticação e persistência no Supabase
- js/auth.js: autenticação
- js/dashboard.js: dashboard
- js/financeiro.js: receitas, despesas, histórico
- js/planejamento.js: tarefas e semana
- js/perfil.js: perfil

## Como executar

1. npm install
2. npm run dev
3. abrir a URL informada pelo Vite

Para validar os testes e gerar os arquivos de produção:

```sh
npm test
npm run build
```

## Deploy

O deploy é feito pelo GitHub Actions para o GitHub Pages a cada push na branch
`main`. O site usa o caminho do repositório:

https://palomamedeiiros12-hue.github.io/vidapraticafinanceira/

O fluxo publica a pasta `dist` e executa os testes antes do build.

## Configurar contas e sincronização

1. Crie um projeto Supabase e execute [`supabase/schema.sql`](./supabase/schema.sql) no SQL Editor do projeto.
2. Nas configurações de autenticação do Supabase, defina a URL do site como:

   `https://palomamedeiiros12-hue.github.io/vidapraticafinanceira/`

3. Inclua nas URLs de redirecionamento permitidas do Supabase:

   - `https://palomamedeiiros12-hue.github.io/vidapraticafinanceira/**`
   - `http://localhost:5173/**` (desenvolvimento local)

4. No GitHub, em **Settings → Secrets and variables → Actions**, crie os secrets:

   - `VITE_SUPABASE_URL`: URL do projeto Supabase.
   - `VITE_SUPABASE_ANON_KEY`: chave pública/anon do projeto. Nunca use a `service_role` no navegador.

5. Para executar localmente, crie `.env` a partir de `.env.example`, preencha os valores do projeto e rode `npm run dev`.

6. Em **Settings → Secrets and variables → Actions** do repositório GitHub, crie os secrets `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com os mesmos valores do projeto. O workflow usa esses valores para gerar o cliente e interrompe a publicação se estiverem ausentes.

Cadastro, login, recuperação de senha, movimentações, tarefas e perfil usam a conta autenticada do Supabase. As políticas Row Level Security em [`supabase/schema.sql`](./supabase/schema.sql) limitam leitura, criação, edição e exclusão de cada registro ao usuário autenticado que o possui. A chave `anon`/publishable é própria para uso no navegador; nunca coloque a chave `service_role` no cliente nem no workflow de build.

Dados de movimentações de versões antigas que existam somente no armazenamento local deste navegador não são sincronizados automaticamente. Eles não são apagados pelo novo fluxo; será necessário copiá-los para a conta após configurá-la.
