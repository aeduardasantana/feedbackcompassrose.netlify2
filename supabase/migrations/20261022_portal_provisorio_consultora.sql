-- Estrutura do portal provisório isolado da aplicação em migração.
-- Os tokens e dados das consultoras NÃO devem ser versionados neste arquivo.
create table if not exists public.portal_consultoras_provisorio (
  id uuid primary key default gen_random_uuid(),
  token_sha256 text not null unique check (token_sha256 ~ '^[a-f0-9]{64}$'),
  nome text not null,
  razao_social text not null,
  cnpj text,
  whatsapp text,
  endereco text,
  empresa_cliente text not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.portal_avaliacoes_provisorio (
  id uuid primary key default gen_random_uuid(),
  consultora_id uuid not null references public.portal_consultoras_provisorio(id) on delete cascade,
  codigo text not null check (codigo ~ '^[0-9]{3}$'),
  avaliado text,
  situacao_credito text not null check (situacao_credito in ('disponivel','reservado','consumido','pendente_confirmacao')),
  status text not null default 'aguardando_configuracao' check (status in ('aguardando_configuracao','preparacao','enviado','em_andamento','concluido')),
  formulario_token text not null unique check (formulario_token ~ '^[a-f0-9]{64}$'),
  formulario_token_sha256 text not null unique check (formulario_token_sha256 ~ '^[a-f0-9]{64}$'),
  link_formulario_externo text check (link_formulario_externo is null or link_formulario_externo ~ '^https://'),
  link_status_externo text check (link_status_externo is null or link_status_externo ~ '^https://'),
  link_relatorio_final text check (link_relatorio_final is null or link_relatorio_final ~ '^https://'),
  respostas_recebidas integer check (respostas_recebidas is null or respostas_recebidas >= 0),
  respostas_previstas integer check (respostas_previstas is null or respostas_previstas >= 0),
  atualizado_em timestamptz not null default now(),
  unique(consultora_id,codigo)
);
create index if not exists portal_avaliacoes_provisorio_consultora_idx
  on public.portal_avaliacoes_provisorio(consultora_id,codigo);
alter table public.portal_consultoras_provisorio enable row level security;
alter table public.portal_avaliacoes_provisorio enable row level security;
revoke all on public.portal_consultoras_provisorio from public, anon, authenticated;
revoke all on public.portal_avaliacoes_provisorio from public, anon, authenticated;
