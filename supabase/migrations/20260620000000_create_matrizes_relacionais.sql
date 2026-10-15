create table if not exists public.matrizes_relacionais (
  id uuid primary key,
  processo_id uuid not null references public.processos(id) on delete cascade,
  avaliado_id uuid not null references public.participantes(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.matrizes_relacionais_avaliadores (
  id uuid primary key,
  matriz_id uuid not null references public.matrizes_relacionais(id) on delete cascade,
  participante_id uuid not null references public.participantes(id) on delete restrict,
  categoria text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matrizes_relacionais_avaliadores_categoria_check
    check (categoria in ('autoavaliacao', 'superior', 'liderado', 'par', 'outro')),
  constraint matrizes_relacionais_avaliadores_unique_participante
    unique (matriz_id, participante_id)
);

create index if not exists matrizes_relacionais_processo_id_idx
  on public.matrizes_relacionais (processo_id);

create index if not exists matrizes_relacionais_avaliado_id_idx
  on public.matrizes_relacionais (avaliado_id);

create index if not exists matrizes_relacionais_avaliadores_matriz_id_idx
  on public.matrizes_relacionais_avaliadores (matriz_id);

alter table public.matrizes_relacionais enable row level security;
alter table public.matrizes_relacionais_avaliadores enable row level security;

create policy "authenticated admins can manage matrizes relacionais"
  on public.matrizes_relacionais
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

create policy "authenticated admins can manage matrizes relacionais avaliadores"
  on public.matrizes_relacionais_avaliadores
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
