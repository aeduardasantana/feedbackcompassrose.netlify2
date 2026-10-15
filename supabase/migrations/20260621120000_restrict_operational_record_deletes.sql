alter table if exists public.matrizes_relacionais
  drop constraint if exists matrizes_relacionais_processo_id_fkey,
  add constraint matrizes_relacionais_processo_id_fkey
    foreign key (processo_id) references public.processos(id) on delete restrict;

alter table if exists public.matrizes_relacionais_avaliadores
  drop constraint if exists matrizes_relacionais_avaliadores_matriz_id_fkey,
  add constraint matrizes_relacionais_avaliadores_matriz_id_fkey
    foreign key (matriz_id) references public.matrizes_relacionais(id) on delete restrict;

alter table if exists public.avaliacoes
  drop constraint if exists avaliacoes_matriz_relacional_id_fkey,
  add constraint avaliacoes_matriz_relacional_id_fkey
    foreign key (matriz_relacional_id) references public.matrizes_relacionais(id) on delete restrict;

alter table if exists public.avaliacoes
  drop constraint if exists avaliacoes_matriz_relacional_avaliador_id_fkey,
  add constraint avaliacoes_matriz_relacional_avaliador_id_fkey
    foreign key (matriz_relacional_avaliador_id) references public.matrizes_relacionais_avaliadores(id) on delete restrict;
