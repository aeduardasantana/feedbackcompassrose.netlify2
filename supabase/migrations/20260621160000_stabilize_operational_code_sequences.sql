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

do $$
declare
  current_last_value bigint;
  current_is_called boolean;
  max_existing_code bigint;
begin
  select last_value, is_called
    into current_last_value, current_is_called
    from public.empresas_codigo_operacional_seq;
  select coalesce(max((substring(codigo_operacional from '[0-9]+$'))::bigint), 0)
    into max_existing_code
    from public.empresas
    where codigo_operacional ~ '^EMP-[0-9]+$';
  perform setval(
    'public.empresas_codigo_operacional_seq',
    greatest(max_existing_code, case when current_is_called then current_last_value else current_last_value - 1 end, 1),
    greatest(max_existing_code, case when current_is_called then current_last_value else current_last_value - 1 end, 0) > 0
  );

  select last_value, is_called
    into current_last_value, current_is_called
    from public.processos_codigo_operacional_seq;
  select coalesce(max((substring(codigo_operacional from '[0-9]+$'))::bigint), 0)
    into max_existing_code
    from public.processos
    where codigo_operacional ~ '^PROC-[0-9]+$';
  perform setval(
    'public.processos_codigo_operacional_seq',
    greatest(max_existing_code, case when current_is_called then current_last_value else current_last_value - 1 end, 1),
    greatest(max_existing_code, case when current_is_called then current_last_value else current_last_value - 1 end, 0) > 0
  );

  select last_value, is_called
    into current_last_value, current_is_called
    from public.matrizes_relacionais_codigo_operacional_seq;
  select coalesce(max((substring(codigo_operacional from '[0-9]+$'))::bigint), 0)
    into max_existing_code
    from public.matrizes_relacionais
    where codigo_operacional ~ '^MAT-[0-9]+$';
  perform setval(
    'public.matrizes_relacionais_codigo_operacional_seq',
    greatest(max_existing_code, case when current_is_called then current_last_value else current_last_value - 1 end, 1),
    greatest(max_existing_code, case when current_is_called then current_last_value else current_last_value - 1 end, 0) > 0
  );

  select last_value, is_called
    into current_last_value, current_is_called
    from public.avaliacoes_codigo_operacional_seq;
  select coalesce(max((substring(codigo_operacional from '[0-9]+$'))::bigint), 0)
    into max_existing_code
    from public.avaliacoes
    where codigo_operacional ~ '^AVL-[0-9]+$';
  perform setval(
    'public.avaliacoes_codigo_operacional_seq',
    greatest(max_existing_code, case when current_is_called then current_last_value else current_last_value - 1 end, 1),
    greatest(max_existing_code, case when current_is_called then current_last_value else current_last_value - 1 end, 0) > 0
  );
end;
$$;

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
