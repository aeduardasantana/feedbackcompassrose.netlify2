import type { SupabaseClient } from '@supabase/supabase-js'
import type { CategoriaMatrizRelacional } from '@/types'
import {
  tabularFeedback360,
  type AvaliacaoTabulacaoEntrada,
  type RespostaTabulacaoEntrada,
  type ResultadoTabulacao,
} from './tabulacao'

type DatabaseRow = Record<string, unknown>

interface AvaliacaoRow extends DatabaseRow {
  id: string
  relacao: CategoriaMatrizRelacional
  status: string
  respondido_em: string | null
}

interface AplicacaoRow extends DatabaseRow {
  id: string
  avaliacao_id: string
  questionario_id: string
}

interface RespostaRow extends DatabaseRow {
  aplicacao_id: string
  pergunta_id: string
  valor_numerico: number | null
  valor_texto: string | null
}

function numeroPergunta(row: DatabaseRow) {
  const numero = Number(row.numero)
  if (Number.isInteger(numero) && numero >= 1 && numero <= 34) return numero

  const ordem = Number(row.ordem)
  return Number.isInteger(ordem) && ordem >= 1 && ordem <= 34 ? ordem : null
}

function mensagemErro(contexto: string, erro: { message?: string } | null) {
  return new Error(`${contexto}: ${erro?.message || 'erro desconhecido do Supabase'}`)
}

export interface PerguntaTabulacao {
  numero: number
  texto: string
}

export async function carregarPerguntasMatriz(
  supabase: SupabaseClient,
  matrizRelacionalId: string,
): Promise<PerguntaTabulacao[]> {
  const { data: avaliacoesData, error: avaliacoesError } = await supabase
    .from('avaliacoes')
    .select('id')
    .eq('matriz_relacional_id', matrizRelacionalId)

  if (avaliacoesError) throw mensagemErro('Não foi possível carregar as avaliações', avaliacoesError)

  const idsAvaliacoes = ((avaliacoesData ?? []) as { id: string }[]).map(
    (avaliacao) => avaliacao.id,
  )
  if (idsAvaliacoes.length === 0) return []

  const { data: aplicacoesData, error: aplicacoesError } = await supabase
    .from('questionario_aplicacoes')
    .select('questionario_id')
    .in('avaliacao_id', idsAvaliacoes)

  if (aplicacoesError) throw mensagemErro('Não foi possível carregar as aplicações', aplicacoesError)

  const idsQuestionarios = Array.from(
    new Set(
      ((aplicacoesData ?? []) as { questionario_id: string }[]).map(
        (aplicacao) => aplicacao.questionario_id,
      ),
    ),
  )
  if (idsQuestionarios.length === 0) return []

  const { data: perguntasData, error: perguntasError } = await supabase
    .from('questionario_perguntas')
    .select('*')
    .in('questionario_id', idsQuestionarios)

  if (perguntasError) throw mensagemErro('Não foi possível carregar as perguntas', perguntasError)

  return ((perguntasData ?? []) as DatabaseRow[])
    .map((pergunta) => ({
      numero: numeroPergunta(pergunta),
      texto:
        typeof pergunta.texto === 'string'
          ? pergunta.texto.trim()
          : '',
    }))
    .filter(
      (pergunta): pergunta is PerguntaTabulacao =>
        pergunta.numero !== null && Boolean(pergunta.texto),
    )
    .sort((left, right) => left.numero - right.numero)
}

export async function carregarTabulacaoMatriz(
  supabase: SupabaseClient,
  matrizRelacionalId: string,
): Promise<ResultadoTabulacao> {
  const { data: avaliacoesData, error: avaliacoesError } = await supabase
    .from('avaliacoes')
    .select('id, relacao, status, respondido_em')
    .eq('matriz_relacional_id', matrizRelacionalId)

  if (avaliacoesError) throw mensagemErro('Não foi possível carregar as avaliações', avaliacoesError)

  const avaliacoes = (avaliacoesData ?? []) as AvaliacaoRow[]
  const idsAvaliacoes = avaliacoes.map((avaliacao) => avaliacao.id)
  if (idsAvaliacoes.length === 0) return tabularFeedback360([])

  const { data: aplicacoesData, error: aplicacoesError } = await supabase
    .from('questionario_aplicacoes')
    .select('id, avaliacao_id, questionario_id')
    .in('avaliacao_id', idsAvaliacoes)

  if (aplicacoesError) throw mensagemErro('Não foi possível carregar as aplicações', aplicacoesError)

  const aplicacoes = (aplicacoesData ?? []) as AplicacaoRow[]
  const idsAplicacoes = aplicacoes.map((aplicacao) => aplicacao.id)
  const respostas: RespostaRow[] = []

  if (idsAplicacoes.length > 0) {
    const { data: respostasData, error: respostasError } = await supabase
      .from('questionario_respostas')
      .select('aplicacao_id, pergunta_id, valor_numerico, valor_texto')
      .in('aplicacao_id', idsAplicacoes)

    if (respostasError) throw mensagemErro('Não foi possível carregar as respostas', respostasError)
    respostas.push(...((respostasData ?? []) as RespostaRow[]))
  }

  const idsPerguntas = Array.from(new Set(respostas.map((resposta) => resposta.pergunta_id)))
  const perguntasPorId = new Map<string, number>()

  if (idsPerguntas.length > 0) {
    const { data: perguntasData, error: perguntasError } = await supabase
      .from('questionario_perguntas')
      .select('*')
      .in('id', idsPerguntas)

    if (perguntasError) throw mensagemErro('Não foi possível carregar as perguntas', perguntasError)

    for (const pergunta of (perguntasData ?? []) as DatabaseRow[]) {
      const id = typeof pergunta.id === 'string' ? pergunta.id : null
      const numero = numeroPergunta(pergunta)
      if (id && numero) perguntasPorId.set(id, numero)
    }
  }

  const aplicacaoPorAvaliacao = new Map(
    aplicacoes.map((aplicacao) => [aplicacao.avaliacao_id, aplicacao.id]),
  )
  const respostasPorAplicacao = new Map<string, RespostaTabulacaoEntrada[]>()

  for (const resposta of respostas) {
    const numero = perguntasPorId.get(resposta.pergunta_id)
    if (!numero) continue

    const respostasAplicacao = respostasPorAplicacao.get(resposta.aplicacao_id) ?? []
    respostasAplicacao.push({
      numeroPergunta: numero,
      valorNumerico: resposta.valor_numerico,
      valorTexto: resposta.valor_texto,
    })
    respostasPorAplicacao.set(resposta.aplicacao_id, respostasAplicacao)
  }

  const entrada: AvaliacaoTabulacaoEntrada[] = avaliacoes.map((avaliacao) => {
    const aplicacaoId = aplicacaoPorAvaliacao.get(avaliacao.id)
    return {
      id: avaliacao.id,
      relacao: avaliacao.relacao,
      respondida: avaliacao.status === 'respondida' || Boolean(avaliacao.respondido_em),
      respostas: aplicacaoId ? (respostasPorAplicacao.get(aplicacaoId) ?? []) : [],
    }
  })

  return tabularFeedback360(entrada)
}
