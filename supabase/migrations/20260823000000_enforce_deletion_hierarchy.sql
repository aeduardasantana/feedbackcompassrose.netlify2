create or replace function public.delete_matriz_relacional(p_matriz_id uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  delete from public.avaliacoes
  where matriz_relacional_id = p_matriz_id;

  delete from public.matrizes_relacionais_avaliadores
  where matriz_id = p_matriz_id;

  delete from public.matrizes_relacionais
  where id = p_matriz_id;

  if not found then
    raise exception 'Matriz relacional não encontrada.';
  end if;
end;
$$;

create or replace function public.update_matriz_relacional(
  p_matriz_id uuid,
  p_avaliado_id uuid,
  p_avaliadores jsonb
)
returns void
language plpgsql
set search_path = public
as $$
declare
  matriz_record public.matrizes_relacionais%rowtype;
  empresa_id uuid;
  autoavaliacao_id uuid;
  avaliador jsonb;
  v_participante_id uuid;
  v_categoria text;
  v_vinculo_id uuid;
  agora timestamptz := now();
begin
  select matriz.*
    into matriz_record
    from public.matrizes_relacionais matriz
    where matriz.id = p_matriz_id
    for update;

  if not found then
    raise exception 'Matriz relacional não encontrada.';
  end if;

  select processo.empresa_id
    into empresa_id
    from public.processos processo
    where processo.id = matriz_record.processo_id;

  if empresa_id is null then
    raise exception 'O processo precisa estar vinculado a uma empresa.';
  end if;

  if not exists (
    select 1
    from public.participantes participante
    where participante.id = p_avaliado_id
      and participante.empresa_id = empresa_id
  ) then
    raise exception 'O avaliado precisa pertencer à empresa do processo.';
  end if;

  if jsonb_typeof(coalesce(p_avaliadores, '[]'::jsonb)) <> 'array' then
    raise exception 'A lista de avaliadores é inválida.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_avaliadores, '[]'::jsonb)) item
    where nullif(item->>'participante_id', '')::uuid = p_avaliado_id
  ) then
    raise exception 'O avaliado não pode ser incluído novamente como avaliador.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_avaliadores, '[]'::jsonb)) item
    group by nullif(item->>'participante_id', '')::uuid
    having count(*) > 1
  ) then
    raise exception 'Cada participante deve aparecer apenas uma vez na matriz.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_avaliadores, '[]'::jsonb)) item
    left join public.participantes participante
      on participante.id = nullif(item->>'participante_id', '')::uuid
     and participante.empresa_id = empresa_id
    where participante.id is null
      or item->>'categoria' not in ('superior', 'liderado', 'par', 'outro')
  ) then
    raise exception 'Há avaliadores ou relações inválidas.';
  end if;

  delete from public.avaliacoes avaliacao
  using public.matrizes_relacionais_avaliadores vinculo
  where vinculo.id = avaliacao.matriz_relacional_avaliador_id
    and vinculo.matriz_id = p_matriz_id
    and vinculo.categoria <> 'autoavaliacao'
    and not exists (
      select 1
      from jsonb_array_elements(coalesce(p_avaliadores, '[]'::jsonb)) item
      where nullif(item->>'participante_id', '')::uuid = vinculo.participante_id
    );

  delete from public.matrizes_relacionais_avaliadores vinculo
  where vinculo.matriz_id = p_matriz_id
    and vinculo.categoria <> 'autoavaliacao'
    and not exists (
      select 1
      from jsonb_array_elements(coalesce(p_avaliadores, '[]'::jsonb)) item
      where nullif(item->>'participante_id', '')::uuid = vinculo.participante_id
    );

  select vinculo.id
    into autoavaliacao_id
    from public.matrizes_relacionais_avaliadores vinculo
    where vinculo.matriz_id = p_matriz_id
      and vinculo.categoria = 'autoavaliacao'
    limit 1;

  if autoavaliacao_id is null then
    autoavaliacao_id := gen_random_uuid();

    insert into public.matrizes_relacionais_avaliadores (
      id, matriz_id, participante_id, categoria, created_at, updated_at
    ) values (
      autoavaliacao_id, p_matriz_id, p_avaliado_id, 'autoavaliacao', agora, agora
    );
  else
    update public.matrizes_relacionais_avaliadores
    set participante_id = p_avaliado_id,
        updated_at = agora
    where id = autoavaliacao_id;
  end if;

  update public.matrizes_relacionais
  set avaliado_id = p_avaliado_id,
      updated_at = agora
  where id = p_matriz_id;

  update public.avaliacoes
  set participante_avaliado_id = p_avaliado_id,
      participante_avaliador_id = p_avaliado_id,
      relacao = 'autoavaliacao',
      updated_at = agora
  where matriz_relacional_avaliador_id = autoavaliacao_id;

  if not found then
    insert into public.avaliacoes (
      id,
      matriz_relacional_id,
      matriz_relacional_avaliador_id,
      processo_id,
      participante_avaliado_id,
      participante_avaliador_id,
      relacao,
      status,
      token,
      enviado_em,
      respondido_em,
      created_at,
      updated_at
    ) values (
      gen_random_uuid(),
      p_matriz_id,
      autoavaliacao_id,
      matriz_record.processo_id,
      p_avaliado_id,
      p_avaliado_id,
      'autoavaliacao',
      'criada',
      encode(gen_random_bytes(32), 'hex'),
      null,
      null,
      agora,
      agora
    );
  end if;

  for avaliador in
    select value
    from jsonb_array_elements(coalesce(p_avaliadores, '[]'::jsonb))
  loop
    v_participante_id := (avaliador->>'participante_id')::uuid;
    v_categoria := avaliador->>'categoria';

    select vinculo.id
      into v_vinculo_id
      from public.matrizes_relacionais_avaliadores vinculo
      where vinculo.matriz_id = p_matriz_id
        and vinculo.participante_id = v_participante_id
        and vinculo.categoria <> 'autoavaliacao'
      limit 1;

    if v_vinculo_id is null then
      v_vinculo_id := gen_random_uuid();

      insert into public.matrizes_relacionais_avaliadores (
        id, matriz_id, participante_id, categoria, created_at, updated_at
      ) values (
        v_vinculo_id, p_matriz_id, v_participante_id, v_categoria, agora, agora
      );

      insert into public.avaliacoes (
        id,
        matriz_relacional_id,
        matriz_relacional_avaliador_id,
        processo_id,
        participante_avaliado_id,
        participante_avaliador_id,
        relacao,
        status,
        token,
        enviado_em,
        respondido_em,
        created_at,
        updated_at
      ) values (
        gen_random_uuid(),
        p_matriz_id,
        v_vinculo_id,
        matriz_record.processo_id,
        p_avaliado_id,
        v_participante_id,
        v_categoria,
        'criada',
        encode(gen_random_bytes(32), 'hex'),
        null,
        null,
        agora,
        agora
      );
    else
      update public.matrizes_relacionais_avaliadores
      set categoria = v_categoria,
          updated_at = agora
      where id = v_vinculo_id;

      update public.avaliacoes
      set participante_avaliado_id = p_avaliado_id,
          participante_avaliador_id = v_participante_id,
          relacao = v_categoria,
          updated_at = agora
      where matriz_relacional_avaliador_id = v_vinculo_id;

      if not found then
        insert into public.avaliacoes (
          id,
          matriz_relacional_id,
          matriz_relacional_avaliador_id,
          processo_id,
          participante_avaliado_id,
          participante_avaliador_id,
          relacao,
          status,
          token,
          enviado_em,
          respondido_em,
          created_at,
          updated_at
        ) values (
          gen_random_uuid(),
          p_matriz_id,
          v_vinculo_id,
          matriz_record.processo_id,
          p_avaliado_id,
          v_participante_id,
          v_categoria,
          'criada',
          encode(gen_random_bytes(32), 'hex'),
          null,
          null,
          agora,
          agora
        );
      end if;
    end if;
  end loop;

  update public.avaliacoes
  set participante_avaliado_id = p_avaliado_id,
      updated_at = agora
  where matriz_relacional_id = p_matriz_id;
end;
$$;

create or replace function public.prevent_consultora_delete_with_dependencies()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.saldo_creditos > 0
    or exists (select 1 from public.empresas where consultora_id = old.id)
    or exists (select 1 from public.processos where consultora_id = old.id)
    or exists (select 1 from public.creditos_historico where consultora_id = old.id)
  then
    raise exception 'Exclua primeiro as Empresas vinculadas.';
  end if;

  return old;
end;
$$;

drop trigger if exists prevent_consultora_delete_with_dependencies on public.consultoras;

create trigger prevent_consultora_delete_with_dependencies
before delete on public.consultoras
for each row
execute function public.prevent_consultora_delete_with_dependencies();

revoke all on function public.delete_matriz_relacional(uuid) from public;
revoke all on function public.update_matriz_relacional(uuid, uuid, jsonb) from public;
grant execute on function public.delete_matriz_relacional(uuid) to authenticated;
grant execute on function public.update_matriz_relacional(uuid, uuid, jsonb) to authenticated;
