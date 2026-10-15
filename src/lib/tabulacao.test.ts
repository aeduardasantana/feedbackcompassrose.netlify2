import assert from 'node:assert/strict'
import test from 'node:test'
import type { CategoriaMatrizRelacional } from '@/types'
import {
  tabularFeedback360,
  type AvaliacaoTabulacaoEntrada,
  type RespostaTabulacaoEntrada,
} from './tabulacao.ts'

function resposta(
  numeroPergunta: number,
  valorNumerico: number | null = null,
  valorTexto: string | null = null,
): RespostaTabulacaoEntrada {
  return { numeroPergunta, valorNumerico, valorTexto }
}

function avaliacao(
  id: string,
  relacao: CategoriaMatrizRelacional,
  respostas: RespostaTabulacaoEntrada[],
  respondida = true,
): AvaliacaoTabulacaoEntrada {
  return { id, relacao, respondida, respostas }
}

test('calcula agregados pelas respostas válidas subjacentes', () => {
  const resultado = tabularFeedback360([
    avaliacao('liderado-1', 'liderado', [resposta(1, 10), resposta(2, 1)]),
    avaliacao('liderado-2', 'liderado', [resposta(1, 10), resposta(2, 0)]),
  ])

  const stakeholders = resultado.stakeholders
  const questao2 = stakeholders.questoes.find((questao) => questao.numeroPergunta === 2)
  const planejamento = stakeholders.competencias.find(
    (competencia) => competencia.id === 'planejamento',
  )

  assert.equal(questao2?.media, 1)
  assert.equal(questao2?.quantidadeValidas, 1)
  assert.equal(questao2?.quantidadeNA, 1)
  assert.equal(questao2?.quantidadeAusentes, 0)
  assert.equal(planejamento?.media, 7)
  assert.equal(stakeholders.geral.media, 7)
  assert.equal(stakeholders.geral.quantidadeValidas, 3)
  assert.equal(stakeholders.geral.quantidadeNA, 1)
  assert.equal(stakeholders.geral.quantidadeAusentes, 60)
})

test('mantém N/A distinto de ausência e ignora avaliações não respondidas', () => {
  const resultado = tabularFeedback360([
    avaliacao('par-1', 'par', [resposta(1, 0)]),
    avaliacao('par-2', 'par', []),
    avaliacao('par-pendente', 'par', [resposta(1, 10)], false),
  ])
  const questao1 = resultado.stakeholders.questoes[0]

  assert.equal(resultado.stakeholders.quantidadeAvaliacoesRespondidas, 2)
  assert.equal(questao1.media, null)
  assert.equal(questao1.quantidadeValidas, 0)
  assert.equal(questao1.quantidadeNA, 1)
  assert.equal(questao1.quantidadeAusentes, 1)
})

test('mantém Superior puro e visível com uma avaliação', () => {
  const resultado = tabularFeedback360([
    avaliacao('superior', 'superior', [resposta(1, 10)]),
    avaliacao('liderado', 'liderado', [resposta(1, 1)]),
    avaliacao('par', 'par', [resposta(1, 2)]),
    avaliacao('outro', 'outro', [resposta(1, 3)]),
  ])

  assert.equal(resultado.grupos.superior?.quantidadeAvaliacoesRespondidas, 1)
  assert.equal(resultado.grupos.superior?.questoes[0].media, 10)
  assert.equal(resultado.grupos.liderado, undefined)
  assert.equal(resultado.grupos.par, undefined)
  assert.equal(resultado.grupos.outro, undefined)
  assert.equal(resultado.stakeholders.questoes[0].media, 4)
})

test('mantém múltiplas avaliações de Superior separadas e puras', () => {
  const resultado = tabularFeedback360([
    avaliacao('superior-1', 'superior', [resposta(1, 8)]),
    avaliacao('superior-2', 'superior', [resposta(1, 10)]),
    avaliacao('liderado-1', 'liderado', [resposta(1, 2)]),
    avaliacao('liderado-2', 'liderado', [resposta(1, 4)]),
  ])

  assert.equal(resultado.grupos.superior?.quantidadeAvaliacoesRespondidas, 2)
  assert.equal(resultado.grupos.superior?.questoes[0].media, 9)
  assert.equal(resultado.grupos.liderado?.questoes[0].media, 3)
})

function avaliacoesPorRelacao(
  quantidades: { liderado: number; par: number; outro: number },
) {
  const notas = { liderado: 3, par: 6, outro: 9 } as const
  return (Object.keys(quantidades) as Array<keyof typeof quantidades>).flatMap((relacao) =>
    Array.from({ length: quantidades[relacao] }, (_, index) =>
      avaliacao(`${relacao}-${index}`, relacao, [resposta(1, notas[relacao])]),
    ),
  )
}

test('agrupa somente Liderado menor que 2 em Par', () => {
  const resultado = tabularFeedback360(avaliacoesPorRelacao({ liderado: 1, par: 2, outro: 2 }))
  assert.equal(resultado.grupos.liderado, undefined)
  assert.equal(resultado.grupos.par?.quantidadeAvaliacoesRespondidas, 3)
  assert.equal(resultado.grupos.par?.questoes[0].media, 5)
  assert.equal(resultado.grupos.outro?.questoes[0].media, 9)
})

test('agrupa somente Par menor que 2 em Liderado', () => {
  const resultado = tabularFeedback360(avaliacoesPorRelacao({ liderado: 2, par: 1, outro: 2 }))
  assert.equal(resultado.grupos.par, undefined)
  assert.equal(resultado.grupos.liderado?.quantidadeAvaliacoesRespondidas, 3)
  assert.equal(resultado.grupos.liderado?.questoes[0].media, 4)
})

test('agrupa somente Outros menor que 2 em Liderado', () => {
  const resultado = tabularFeedback360(avaliacoesPorRelacao({ liderado: 2, par: 2, outro: 1 }))
  assert.equal(resultado.grupos.outro, undefined)
  assert.equal(resultado.grupos.liderado?.quantidadeAvaliacoesRespondidas, 3)
  assert.equal(resultado.grupos.liderado?.questoes[0].media, 5)
})

test('agrupa Par e Outros protegidos em Liderado', () => {
  const resultado = tabularFeedback360(avaliacoesPorRelacao({ liderado: 2, par: 1, outro: 1 }))
  assert.equal(resultado.grupos.liderado?.quantidadeAvaliacoesRespondidas, 4)
  assert.equal(resultado.grupos.liderado?.questoes[0].media, 5.25)
  assert.equal(resultado.grupos.par, undefined)
  assert.equal(resultado.grupos.outro, undefined)
})

test('agrupa Liderado e Outros protegidos em Par', () => {
  const resultado = tabularFeedback360(avaliacoesPorRelacao({ liderado: 1, par: 2, outro: 1 }))
  assert.equal(resultado.grupos.par?.quantidadeAvaliacoesRespondidas, 4)
  assert.equal(resultado.grupos.par?.questoes[0].media, 6)
  assert.equal(resultado.grupos.liderado, undefined)
  assert.equal(resultado.grupos.outro, undefined)
})

test('agrupa Liderado e Par protegidos em Outros', () => {
  const resultado = tabularFeedback360(avaliacoesPorRelacao({ liderado: 1, par: 1, outro: 2 }))
  assert.equal(resultado.grupos.outro?.quantidadeAvaliacoesRespondidas, 4)
  assert.equal(resultado.grupos.outro?.questoes[0].media, 6.75)
  assert.equal(resultado.grupos.liderado, undefined)
  assert.equal(resultado.grupos.par, undefined)
})

test('não exibe Liderado, Par ou Outros quando todos estão protegidos', () => {
  const resultado = tabularFeedback360(avaliacoesPorRelacao({ liderado: 1, par: 1, outro: 1 }))
  assert.equal(resultado.grupos.liderado, undefined)
  assert.equal(resultado.grupos.par, undefined)
  assert.equal(resultado.grupos.outro, undefined)
  assert.deepEqual(resultado.confidencialidade.relacoesProtegidas, ['liderado', 'par', 'outro'])
  assert.equal(resultado.stakeholders.quantidadeAvaliacoesRespondidas, 3)
  assert.equal(resultado.stakeholders.questoes[0].media, 6)
})

test('mantém puras relações com exatamente duas avaliações', () => {
  const resultado = tabularFeedback360(avaliacoesPorRelacao({ liderado: 2, par: 2, outro: 2 }))
  assert.equal(resultado.grupos.liderado?.quantidadeAvaliacoesRespondidas, 2)
  assert.equal(resultado.grupos.par?.quantidadeAvaliacoesRespondidas, 2)
  assert.equal(resultado.grupos.outro?.quantidadeAvaliacoesRespondidas, 2)
  assert.equal(resultado.grupos.liderado?.questoes[0].media, 3)
  assert.equal(resultado.grupos.par?.questoes[0].media, 6)
  assert.equal(resultado.grupos.outro?.questoes[0].media, 9)
})

test('usa avaliações respondidas no limiar mesmo com N/A ou resposta ausente', () => {
  const resultado = tabularFeedback360([
    avaliacao('par-na', 'par', [resposta(1, 0)]),
    avaliacao('par-ausente', 'par', []),
  ])
  assert.equal(resultado.grupos.par?.quantidadeAvaliacoesRespondidas, 2)
  assert.equal(resultado.grupos.par?.questoes[0].quantidadeNA, 1)
  assert.equal(resultado.grupos.par?.questoes[0].quantidadeAusentes, 1)
})

test('aplica o agrupamento a Q33 e Q34, preserva duplicados e omite Autoavaliação', () => {
  const resultado = tabularFeedback360([
    avaliacao('auto', 'autoavaliacao', [resposta(33, null, 'Não exibir')]),
    avaliacao('liderado-1', 'liderado', [resposta(33, null, 'Repetido'), resposta(34, null, 'L 34')]),
    avaliacao('liderado-2', 'liderado', [resposta(33, null, 'L 2')]),
    avaliacao('par', 'par', [resposta(33, null, 'Repetido'), resposta(34, null, 'P 34')]),
    avaliacao('outro', 'outro', [resposta(33, null, 'O 33')]),
  ])

  assert.equal(resultado.percepcoesQualitativas.autoavaliacao, undefined)
  assert.equal(resultado.percepcoesQualitativas.par, undefined)
  assert.equal(resultado.percepcoesQualitativas.outro, undefined)
  assert.deepEqual(resultado.percepcoesQualitativas.liderado?.questoes[0].respostas, [
    'Repetido',
    'L 2',
    'Repetido',
    'O 33',
  ])
  assert.deepEqual(resultado.percepcoesQualitativas.liderado?.questoes[1].respostas, [
    'L 34',
    'P 34',
  ])
})

test('consolida comentários em Stakeholders quando as três relações estão protegidas', () => {
  const resultado = tabularFeedback360([
    avaliacao('liderado', 'liderado', [resposta(33, null, 'L')]),
    avaliacao('par', 'par', [resposta(33, null, 'P')]),
    avaliacao('outro', 'outro', [resposta(33, null, 'O')]),
  ])
  assert.deepEqual(resultado.percepcoesQualitativas.stakeholders?.questoes[0].respostas, [
    'L',
    'P',
    'O',
  ])
})

test('preserva a composição de Stakeholders após os agrupamentos', () => {
  const resultado = tabularFeedback360([
    avaliacao('superior', 'superior', [resposta(1, 10)]),
    ...avaliacoesPorRelacao({ liderado: 2, par: 1, outro: 1 }),
  ])
  assert.equal(resultado.stakeholders.quantidadeAvaliacoesRespondidas, 5)
  assert.equal(resultado.stakeholders.questoes[0].media, 6.2)
})

test('ordena rankings por média e desempata pelo número da pergunta', () => {
  const resultado = tabularFeedback360([
    avaliacao('par-1', 'par', [
      resposta(1, 10),
      resposta(2, 10),
      resposta(3, 8),
      resposta(4, 7),
      resposta(5, 6),
      resposta(6, 5),
      resposta(7, 4),
    ]),
    avaliacao('par-2', 'par', [
      resposta(1, 10),
      resposta(2, 10),
      resposta(3, 8),
      resposta(4, 7),
      resposta(5, 6),
      resposta(6, 5),
      resposta(7, 4),
    ]),
  ])

  assert.deepEqual(
    resultado.maioresMediasStakeholders.map((item) => item.numeroPergunta),
    [1, 2, 3, 4, 5],
  )
  assert.deepEqual(
    resultado.menoresMediasStakeholders.map((item) => item.numeroPergunta),
    [7, 6, 5, 4, 3],
  )
})
