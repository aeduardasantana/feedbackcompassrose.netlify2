alter table public.matrizes_relacionais
  add column if not exists token_acompanhamento text;

update public.matrizes_relacionais
set token_acompanhamento = encode(gen_random_bytes(32), 'hex')
where token_acompanhamento is null;

alter table public.matrizes_relacionais
  alter column token_acompanhamento set default encode(gen_random_bytes(32), 'hex'),
  alter column token_acompanhamento set not null;

create unique index if not exists matrizes_relacionais_token_acompanhamento_key
  on public.matrizes_relacionais (token_acompanhamento);
