create table if not exists public.avaliacoes (
  id uuid primary key,
  matriz_relacional_id uuid not null references public.matrizes_relacionais(id) on delete cascade,
  matriz_relacional_avaliador_id uuid not null references public.matrizes_relacionais_avaliadores(id) on delete cascade,
  participante_avaliador_id uuid not null references public.participantes(id) on delete restrict,
  categoria text not null,
  status text not null default 'pendente',
  token_acesso text not null unique,
  enviado_at timestamptz,
  respondido_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint avaliacoes_categoria_check
    check (categoria in ('autoavaliacao', 'superior', 'liderado', 'par', 'outro')),
  constraint avaliacoes_status_check
    check (status in ('pendente', 'enviada', 'respondida', 'expirada', 'cancelada')),
  constraint avaliacoes_unique_vinculo
    unique (matriz_relacional_avaliador_id)
);

create index if not exists avaliacoes_matriz_relacional_id_idx
  on public.avaliacoes (matriz_relacional_id);

create index if not exists avaliacoes_participante_avaliador_id_idx
  on public.avaliacoes (participante_avaliador_id);

create index if not exists avaliacoes_status_idx
  on public.avaliacoes (status);

alter table public.avaliacoes enable row level security;

create policy "authenticated admins can manage avaliacoes"
  on public.avaliacoes
  for all
  to authenticated
  using (exists (
    select 1 from public.global_admin_profiles
    where id = auth.uid() and role = 'global_admin'
  ))
  with check (exists (
    select 1 from public.global_admin_profiles
    where id = auth.uid() and role = 'global_admin'
  ));
