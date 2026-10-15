# Compass Rose — Feedback 360º

Plataforma web moderna para gestão de processos de Feedback 360º, permitindo que organizações conduzam ciclos completos de feedback multidirecional.

## Tecnologias

- **Frontend:** React 19 + TanStack Router + Tailwind CSS 4
- **Backend/Banco:** Supabase (PostgreSQL)
- **Hospedagem:** Netlify
- **PDF:** Puppeteer (preparado para relatórios futuros)
- **Ícones:** Lucide React

## Estrutura do Projeto

```
src/
├── components/
│   └── layout/
│       ├── Sidebar.tsx       # Menu lateral com navegação
│       └── Header.tsx        # Cabeçalho com busca e perfil
├── lib/
│   └── supabase.ts           # Cliente Supabase
├── types/
│   └── index.ts              # Tipos TypeScript do domínio
├── routes/
│   ├── __root.tsx             # Layout raiz (admin shell)
│   ├── index.tsx              # Dashboard
│   ├── processos.tsx          # Layout de processos
│   ├── processos.index.tsx    # Listagem de processos
│   ├── colaboradores.tsx      # Gestão de colaboradores
│   └── configuracoes.tsx      # Configurações
├── router.tsx                 # Configuração do router
└── styles.css                 # Estilos globais
```

## Configuração

### Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

### Desenvolvimento local

```bash
npm install
npm run dev
```

O servidor de desenvolvimento estará disponível em `http://localhost:3000`.

## Funcionalidades Planejadas

- Gestão de múltiplos processos independentes de avaliação
- Cadastro e gestão de colaboradores
- Questionários configuráveis por processo
- Coleta de avaliações multidirecionais (autoavaliação, gestor, pares, subordinados)
- Relatórios em PDF via Puppeteer
- Tabulação e analytics de resultados
