alter table if exists public.processos
  add column if not exists token text;

create unique index if not exists processos_token_key
  on public.processos (token)
  where token is not null;
