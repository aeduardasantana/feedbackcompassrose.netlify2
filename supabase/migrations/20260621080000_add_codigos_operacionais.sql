create or replace function public.next_operational_code(prefix text, sequence_name text)
returns text
language plpgsql
as $$
declare
  sequence_value bigint;
begin
  execute format('select nextval(%L)', sequence_name) into sequence_value;
  return prefix || '-' || lpad(sequence_value::text, 3, '0');
end;
$$;

create sequence if not exists public.empresas_codigo_operacional_seq;
create sequence if not exists public.processos_codigo_operacional_seq;
create sequence if not exists public.matrizes_relacionais_codigo_operacional_seq;
create sequence if not exists public.avaliacoes_codigo_operacional_seq;

alter table public.empresas
  add column if not exists codigo_operacional text;

alter table public.processos
  add column if not exists codigo_operacional text;

alter table public.matrizes_relacionais
  add column if not exists codigo_operacional text;

alter table public.avaliacoes
  add column if not exists codigo_operacional text;

with numbered as (
  select id, row_number() over (order by created_at, id) as code_number
  from public.empresas
  where codigo_operacional is null
)
update public.empresas target
set codigo_operacional = 'EMP-' || lpad(numbered.code_number::text, 3, '0')
from numbered
where target.id = numbered.id;

with numbered as (
  select id, row_number() over (order by created_at, id) as code_number
  from public.processos
  where codigo_operacional is null
)
update public.processos target
set codigo_operacional = 'PROC-' || lpad(numbered.code_number::text, 3, '0')
from numbered
where target.id = numbered.id;

with numbered as (
  select id, row_number() over (order by created_at, id) as code_number
  from public.matrizes_relacionais
  where codigo_operacional is null
)
update public.matrizes_relacionais target
set codigo_operacional = 'MAT-' || lpad(numbered.code_number::text, 3, '0')
from numbered
where target.id = numbered.id;

with numbered as (
  select id, row_number() over (order by created_at, id) as code_number
  from public.avaliacoes
  where codigo_operacional is null
)
update public.avaliacoes target
set codigo_operacional = 'AVL-' || lpad(numbered.code_number::text, 3, '0')
from numbered
where target.id = numbered.id;

select setval(
  'public.empresas_codigo_operacional_seq',
  greatest(coalesce((select max((substring(codigo_operacional from '[0-9]+$'))::bigint) from public.empresas), 0), 1),
  coalesce((select max((substring(codigo_operacional from '[0-9]+$'))::bigint) from public.empresas), 0) > 0
);

select setval(
  'public.processos_codigo_operacional_seq',
  greatest(coalesce((select max((substring(codigo_operacional from '[0-9]+$'))::bigint) from public.processos), 0), 1),
  coalesce((select max((substring(codigo_operacional from '[0-9]+$'))::bigint) from public.processos), 0) > 0
);

select setval(
  'public.matrizes_relacionais_codigo_operacional_seq',
  greatest(coalesce((select max((substring(codigo_operacional from '[0-9]+$'))::bigint) from public.matrizes_relacionais), 0), 1),
  coalesce((select max((substring(codigo_operacional from '[0-9]+$'))::bigint) from public.matrizes_relacionais), 0) > 0
);

select setval(
  'public.avaliacoes_codigo_operacional_seq',
  greatest(coalesce((select max((substring(codigo_operacional from '[0-9]+$'))::bigint) from public.avaliacoes), 0), 1),
  coalesce((select max((substring(codigo_operacional from '[0-9]+$'))::bigint) from public.avaliacoes), 0) > 0
);

alter table public.empresas
  alter column codigo_operacional set default public.next_operational_code('EMP', 'public.empresas_codigo_operacional_seq'),
  alter column codigo_operacional set not null;

alter table public.processos
  alter column codigo_operacional set default public.next_operational_code('PROC', 'public.processos_codigo_operacional_seq'),
  alter column codigo_operacional set not null;

alter table public.matrizes_relacionais
  alter column codigo_operacional set default public.next_operational_code('MAT', 'public.matrizes_relacionais_codigo_operacional_seq'),
  alter column codigo_operacional set not null;

alter table public.avaliacoes
  alter column codigo_operacional set default public.next_operational_code('AVL', 'public.avaliacoes_codigo_operacional_seq'),
  alter column codigo_operacional set not null;

create unique index if not exists empresas_codigo_operacional_key
  on public.empresas (codigo_operacional);

create unique index if not exists processos_codigo_operacional_key
  on public.processos (codigo_operacional);

create unique index if not exists matrizes_relacionais_codigo_operacional_key
  on public.matrizes_relacionais (codigo_operacional);

create unique index if not exists avaliacoes_codigo_operacional_key
  on public.avaliacoes (codigo_operacional);
