create table if not exists public.empresas (
  id uuid primary key,
  nome text not null,
  cnpj text,
  setor text,
  responsavel text,
  email text,
  telefone text,
  endereco text,
  consultora_id uuid not null references public.consultoras(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists empresas_consultora_id_idx
  on public.empresas (consultora_id);

create index if not exists empresas_nome_idx
  on public.empresas (nome);

alter table public.empresas enable row level security;

create policy "authenticated admins can manage empresas"
  on public.empresas
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

alter table if exists public.processos
  add column if not exists empresa_id uuid references public.empresas(id) on delete restrict;

create index if not exists processos_empresa_id_idx
  on public.processos (empresa_id);

alter table if exists public.participantes
  add column if not exists empresa_id uuid references public.empresas(id) on delete restrict;

create index if not exists participantes_empresa_id_idx
  on public.participantes (empresa_id);
