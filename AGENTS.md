# AGENTS.md — Compass Rose (Feedback 360º)

## Arquitetura

Aplicação full-stack com frontend React hospedado no Netlify e backend via Supabase (PostgreSQL). Usa TanStack Start com file-based routing e Tailwind CSS 4 para estilização.

**Importante:** NÃO utilizar `@netlify/database`, Netlify Database, nem `createClient` do Netlify. Todo o armazenamento de dados é feito via Supabase.

## Diretórios Principais

- `src/routes/` — Páginas (file-based routing do TanStack Router)
- `src/components/layout/` — Componentes de layout (Sidebar, Header)
- `src/lib/` — Utilitários e configuração de serviços (Supabase client)
- `src/types/` — Tipos TypeScript do domínio

## Convenções

- **Linguagem da interface:** Português brasileiro
- **Estilização:** Tailwind CSS utility classes, sem CSS modules
- **Componentes:** Functional components com hooks
- **Tipagem:** TypeScript strict mode, import paths use `@/` alias
- **Rotas:** Flat file routing com dot notation (ex: `processos.index.tsx`)
- **Estado:** Preparado para múltiplos processos de avaliação independentes

## Modelo de Dados

Os tipos em `src/types/index.ts` definem o domínio:
- `Processo` — Ciclo de avaliação independente
- `Colaborador` — Participante das avaliações
- `Avaliador` — Relação avaliador-avaliado dentro de um processo
- `Questionario` — Conjunto de perguntas vinculado a um processo
- `Pergunta` — Pergunta individual do questionário
- `Resposta` — Resposta de um avaliador a uma pergunta

## Decisões Não Óbvias

- O layout admin (sidebar + header) está no `__root.tsx` porque todas as rotas são administrativas
- A sidebar tem estado de collapse local (sem persistência)
- O dashboard mostra contadores zerados propositalmente — serão conectados ao Supabase depois
- chart.js e react-chartjs-2 já estão instalados para uso futuro nos analytics

## Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite plugins: TanStack Start, Netlify, Tailwind |
| `tsconfig.json` | TypeScript config with `@/*` path alias for `src/*` |
| `netlify.toml` | Build command, output directory, dev server settings |
| `src/lib/supabase.ts` | Supabase client (reads VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) |

## Development Commands

```bash
npm run dev      # Start dev server (port 3000)
npm run build    # Production build
```
