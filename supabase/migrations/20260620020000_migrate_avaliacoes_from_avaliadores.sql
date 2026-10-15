alter table public.avaliacoes
  add column if not exists processo_id uuid references public.processos(id) on delete cascade,
  add column if not exists participante_avaliado_id uuid references public.participantes(id) on delete restrict,
  add column if not exists relacao text;

alter table public.avaliacoes
  alter column status set default 'criada';

alter table public.avaliacoes
  alter column categoria drop not null;

update public.avaliacoes
set status = case status
  when 'pendente' then 'criada'
  when 'em_andamento' then 'enviada'
  when 'concluido' then 'respondida'
  else status
end
where status in ('pendente', 'em_andamento', 'concluido');

update public.avaliacoes a
set
  processo_id = coalesce(a.processo_id, m.processo_id),
  participante_avaliado_id = coalesce(a.participante_avaliado_id, m.avaliado_id),
  relacao = coalesce(a.relacao, ma.categoria)
from public.matrizes_relacionais m
join public.matrizes_relacionais_avaliadores ma
  on ma.matriz_id = m.id
where a.matriz_relacional_id = m.id
  and a.matriz_relacional_avaliador_id = ma.id;

alter table public.avaliacoes
  alter column processo_id set not null,
  alter column participante_avaliado_id set not null,
  alter column relacao set not null;

alter table public.avaliacoes
  drop constraint if exists avaliacoes_categoria_check,
  drop constraint if exists avaliacoes_status_check,
  add constraint avaliacoes_relacao_check
    check (relacao in ('autoavaliacao', 'superior', 'liderado', 'par', 'outro')),
  add constraint avaliacoes_status_check
    check (status in ('criada', 'enviada', 'respondida', 'expirada', 'cancelada'));

create index if not exists avaliacoes_processo_id_idx
  on public.avaliacoes (processo_id);

create index if not exists avaliacoes_participante_avaliado_id_idx
  on public.avaliacoes (participante_avaliado_id);
