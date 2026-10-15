import type { CategoriaMatrizRelacional } from '@/types'

export const NUMEROS_PERGUNTAS_QUANTITATIVAS = Array.from(
  { length: 32 },
  (_, index) => index + 1,
)

export const NUMEROS_PERGUNTAS_QUALITATIVAS = [33, 34] as const

export type GrupoTabulacao = CategoriaMatrizRelacional | 'stakeholders'

export interface RespostaTabulacaoEntrada {
  numeroPergunta: number
  valorNumerico: number | null
  valorTexto: string | null
}

export interface AvaliacaoTabulacaoEntrada {
  id: string
  relacao: CategoriaMatrizRelacional
  respondida: boolean
  respostas: RespostaTabulacaoEntrada[]
}

export interface AmostraMedia {
  media: number | null
  quantidadeValidas: number
  quantidadeNA: number
  quantidadeAusentes: number
}

export interface ResultadoQuestao extends AmostraMedia {
  numeroPergunta: number
}

export interface ResultadoCompetencia extends AmostraMedia {
  id: string
  nome: string
  perguntas: readonly number[]
}

export interface ResultadoPilar extends AmostraMedia {
  id: string
  nome: string
  perguntas: readonly number[]
  competencias: ResultadoCompetencia[]
}

export interface ResultadoGrupo {
  grupo: GrupoTabulacao
  nome: string
  quantidadeAvaliacoesRespondidas: number
  questoes: ResultadoQuestao[]
  competencias: ResultadoCompetencia[]
  pilares: ResultadoPilar[]
  geral: AmostraMedia
}

export interface RespostaQualitativa {
  numeroPergunta: (typeof NUMEROS_PERGUNTAS_QUALITATIVAS)[number]
  respostas: string[]
}

export interface PercepcoesGrupo {
  grupo: GrupoTabulacao
  nome: string
  quantidadeAvaliacoesRespondidas: number
  questoes: RespostaQualitativa[]
}

export interface ItemRankingStakeholders {
  numeroPergunta: number
  media: number
  quantidadeValidas: number
}

export interface PoliticaConfidencialidade {
  avaliacoesRespondidasPorRelacao: Record<CategoriaMatrizRelacional, number>
  relacoesExibidasSeparadamente: CategoriaMatrizRelacional[]
  relacoesProtegidas: CategoriaMatrizRelacional[]
}

export interface ResultadoTabulacao {
  grupos: Partial<Record<GrupoTabulacao, ResultadoGrupo>>
  stakeholders: ResultadoGrupo
  maioresMediasStakeholders: ItemRankingStakeholders[]
  menoresMediasStakeholders: ItemRankingStakeholders[]
  percepcoesQualitativas: Partial<Record<GrupoTabulacao, PercepcoesGrupo>>
  confidencialidade: PoliticaConfidencialidade
}

interface DefinicaoCompetencia {
  id: string
  nome: string
  perguntas: readonly number[]
}

interface DefinicaoPilar {
  id: string
  nome: string
  competencias: readonly DefinicaoCompetencia[]
}

interface ContagemAmostra {
  soma: number
  quantidadeValidas: number
  quantidadeNA: number
  quantidadeAusentes: number
}

const DEFINICOES_PILARES: readonly DefinicaoPilar[] = [
  {
    id: 'estrategia',
    nome: 'Estratégia',
    competencias: [
      { id: 'planejamento', nome: 'Planejamento', perguntas: [1, 2] },
      { id: 'execucao', nome: 'Execução', perguntas: [3, 4] },
      { id: 'conhecimento', nome: 'Conhecimento', perguntas: [5, 6] },
      { id: 'objetivos-e-metas', nome: 'Objetivos e Metas', perguntas: [7, 8] },
    ],
  },
  {
    id: 'comprometimento',
    nome: 'Comprometimento',
    competencias: [
      { id: 'dedicacao', nome: 'Dedicação', perguntas: [9, 10] },
      { id: 'paixao', nome: 'Paixão', perguntas: [11, 12] },
      { id: 'sacrificio', nome: 'Sacrifício', perguntas: [13, 14] },
      { id: 'resiliencia', nome: 'Resiliência', perguntas: [15, 16] },
    ],
  },
  {
    id: 'gestao',
    nome: 'Gestão',
    competencias: [
      { id: 'motivar', nome: 'Motivar', perguntas: [17, 18] },
      { id: 'desenvolver', nome: 'Desenvolver', perguntas: [19, 20] },
      { id: 'reconhecer', nome: 'Reconhecer', perguntas: [21, 22] },
      { id: 'inspirar', nome: 'Inspirar', perguntas: [23, 24] },
    ],
  },
  {
    id: 'credibilidade',
    nome: 'Credibilidade',
    competencias: [
      { id: 'valores', nome: 'Valores', perguntas: [25, 26] },
      { id: 'justica', nome: 'Justiça', perguntas: [27, 28] },
      { id: 'integridade', nome: 'Integridade', perguntas: [29, 30] },
      { id: 'congruencia', nome: 'Congruência', perguntas: [31, 32] },
    ],
  },
]

const NOMES_GRUPOS: Record<GrupoTabulacao, string> = {
  autoavaliacao: 'Autoavaliação',
  stakeholders: 'Stakeholders',
  superior: 'Superior',
  liderado: 'Subordinado/Liderado',
  par: 'Par',
  outro: 'Outros',
}

const RELACOES: readonly CategoriaMatrizRelacional[] = [
  'autoavaliacao',
  'superior',
  'liderado',
  'par',
  'outro',
]

function criarContagem(): ContagemAmostra {
  return {
    soma: 0,
    quantidadeValidas: 0,
    quantidadeNA: 0,
    quantidadeAusentes: 0,
  }
}

function adicionarContagem(destino: ContagemAmostra, origem: ContagemAmostra) {
  destino.soma += origem.soma
  destino.quantidadeValidas += origem.quantidadeValidas
  destino.quantidadeNA += origem.quantidadeNA
  destino.quantidadeAusentes += origem.quantidadeAusentes
}

function finalizarContagem(contagem: ContagemAmostra): AmostraMedia {
  return {
    media:
      contagem.quantidadeValidas > 0
        ? contagem.soma / contagem.quantidadeValidas
        : null,
    quantidadeValidas: contagem.quantidadeValidas,
    quantidadeNA: contagem.quantidadeNA,
    quantidadeAusentes: contagem.quantidadeAusentes,
  }
}

function indexarRespostas(avaliacao: AvaliacaoTabulacaoEntrada) {
  const respostas = new Map<number, RespostaTabulacaoEntrada>()

  for (const resposta of avaliacao.respostas) {
    respostas.set(resposta.numeroPergunta, resposta)
  }

  return respostas
}

function contarQuestao(
  numeroPergunta: number,
  respostasPorAvaliacao: Map<number, RespostaTabulacaoEntrada>[],
) {
  const contagem = criarContagem()

  for (const respostas of respostasPorAvaliacao) {
    const valor = respostas.get(numeroPergunta)?.valorNumerico

    if (valor === 0) {
      contagem.quantidadeNA += 1
    } else if (typeof valor === 'number' && Number.isFinite(valor) && valor >= 1 && valor <= 10) {
      contagem.soma += valor
      contagem.quantidadeValidas += 1
    } else {
      contagem.quantidadeAusentes += 1
    }
  }

  return contagem
}

function agregarQuestoes(
  numerosPerguntas: readonly number[],
  contagensPorQuestao: Map<number, ContagemAmostra>,
) {
  const total = criarContagem()

  for (const numeroPergunta of numerosPerguntas) {
    const contagem = contagensPorQuestao.get(numeroPergunta)
    if (contagem) adicionarContagem(total, contagem)
  }

  return finalizarContagem(total)
}

function calcularGrupo(
  grupo: GrupoTabulacao,
  avaliacoes: AvaliacaoTabulacaoEntrada[],
): ResultadoGrupo {
  const respostasPorAvaliacao = avaliacoes.map(indexarRespostas)
  const contagensPorQuestao = new Map<number, ContagemAmostra>()
  const questoes = NUMEROS_PERGUNTAS_QUANTITATIVAS.map((numeroPergunta) => {
    const contagem = contarQuestao(numeroPergunta, respostasPorAvaliacao)
    contagensPorQuestao.set(numeroPergunta, contagem)
    return { numeroPergunta, ...finalizarContagem(contagem) }
  })
  const competencias = DEFINICOES_PILARES.flatMap((pilar) =>
    pilar.competencias.map((competencia) => ({
      id: competencia.id,
      nome: competencia.nome,
      perguntas: competencia.perguntas,
      ...agregarQuestoes(competencia.perguntas, contagensPorQuestao),
    })),
  )
  const pilares = DEFINICOES_PILARES.map((pilar) => {
    const perguntas = pilar.competencias.flatMap((competencia) => competencia.perguntas)
    return {
      id: pilar.id,
      nome: pilar.nome,
      perguntas,
      competencias: competencias.filter((competencia) =>
        pilar.competencias.some((definicao) => definicao.id === competencia.id),
      ),
      ...agregarQuestoes(perguntas, contagensPorQuestao),
    }
  })

  return {
    grupo,
    nome: NOMES_GRUPOS[grupo],
    quantidadeAvaliacoesRespondidas: avaliacoes.length,
    questoes,
    competencias,
    pilares,
    geral: agregarQuestoes(NUMEROS_PERGUNTAS_QUANTITATIVAS, contagensPorQuestao),
  }
}

function calcularPercepcoes(
  grupo: GrupoTabulacao,
  avaliacoes: AvaliacaoTabulacaoEntrada[],
): PercepcoesGrupo {
  return {
    grupo,
    nome: NOMES_GRUPOS[grupo],
    quantidadeAvaliacoesRespondidas: avaliacoes.length,
    questoes: NUMEROS_PERGUNTAS_QUALITATIVAS.map((numeroPergunta) => ({
      numeroPergunta,
      respostas: avaliacoes.flatMap((avaliacao) => {
        const texto = avaliacao.respostas
          .find((resposta) => resposta.numeroPergunta === numeroPergunta)
          ?.valorTexto?.trim()
        return texto ? [texto] : []
      }),
    })),
  }
}

function podeExibirRelacao(
  relacao: CategoriaMatrizRelacional,
  quantidadeAvaliacoesRespondidas: number,
) {
  if (relacao === 'autoavaliacao') return true
  if (relacao === 'superior') return quantidadeAvaliacoesRespondidas >= 1
  return quantidadeAvaliacoesRespondidas >= 2
}

type RelacaoAgrupavel = Exclude<
  CategoriaMatrizRelacional,
  'autoavaliacao' | 'superior'
>

interface AgrupamentoRelacoes {
  grupos: Partial<Record<RelacaoAgrupavel, AvaliacaoTabulacaoEntrada[]>>
  protegidas: RelacaoAgrupavel[]
  consolidarProtegidasEmStakeholders: boolean
}

function agruparRelacoes(
  porRelacao: Record<CategoriaMatrizRelacional, AvaliacaoTabulacaoEntrada[]>,
): AgrupamentoRelacoes {
  const liderado = porRelacao.liderado
  const par = porRelacao.par
  const outro = porRelacao.outro
  const lideradoProtegido = liderado.length < 2
  const parProtegido = par.length < 2
  const outroProtegido = outro.length < 2
  const protegidas = (
    [
      ['liderado', lideradoProtegido],
      ['par', parProtegido],
      ['outro', outroProtegido],
    ] as const
  ).flatMap(([relacao, protegida]) => (protegida ? [relacao] : []))

  if (lideradoProtegido && parProtegido && outroProtegido) {
    return { grupos: {}, protegidas, consolidarProtegidasEmStakeholders: true }
  }
  if (parProtegido && outroProtegido) {
    return {
      grupos: { liderado: [...liderado, ...par, ...outro] },
      protegidas,
      consolidarProtegidasEmStakeholders: false,
    }
  }
  if (lideradoProtegido && outroProtegido) {
    return {
      grupos: { par: [...par, ...liderado, ...outro] },
      protegidas,
      consolidarProtegidasEmStakeholders: false,
    }
  }
  if (lideradoProtegido && parProtegido) {
    return {
      grupos: { outro: [...outro, ...liderado, ...par] },
      protegidas,
      consolidarProtegidasEmStakeholders: false,
    }
  }
  if (lideradoProtegido) {
    return {
      grupos: { par: [...par, ...liderado], outro },
      protegidas,
      consolidarProtegidasEmStakeholders: false,
    }
  }
  if (parProtegido) {
    return {
      grupos: { liderado: [...liderado, ...par], outro },
      protegidas,
      consolidarProtegidasEmStakeholders: false,
    }
  }
  if (outroProtegido) {
    return {
      grupos: { liderado: [...liderado, ...outro], par },
      protegidas,
      consolidarProtegidasEmStakeholders: false,
    }
  }

  return {
    grupos: { liderado, par, outro },
    protegidas,
    consolidarProtegidasEmStakeholders: false,
  }
}

function criarRanking(stakeholders: ResultadoGrupo, ordem: 'maiores' | 'menores') {
  return stakeholders.questoes
    .filter(
      (questao): questao is ResultadoQuestao & { media: number } => questao.media !== null,
    )
    .sort((left, right) => {
      const diferenca = ordem === 'maiores' ? right.media - left.media : left.media - right.media
      return diferenca || left.numeroPergunta - right.numeroPergunta
    })
    .slice(0, 5)
    .map(({ numeroPergunta, media, quantidadeValidas }) => ({
      numeroPergunta,
      media,
      quantidadeValidas,
    }))
}

export function tabularFeedback360(
  avaliacoesEntrada: AvaliacaoTabulacaoEntrada[],
): ResultadoTabulacao {
  const avaliacoesRespondidas = avaliacoesEntrada.filter((avaliacao) => avaliacao.respondida)
  const porRelacao = Object.fromEntries(
    RELACOES.map((relacao) => [
      relacao,
      avaliacoesRespondidas.filter((avaliacao) => avaliacao.relacao === relacao),
    ]),
  ) as Record<CategoriaMatrizRelacional, AvaliacaoTabulacaoEntrada[]>
  const stakeholdersAvaliacoes = avaliacoesRespondidas.filter(
    (avaliacao) => avaliacao.relacao !== 'autoavaliacao',
  )
  const stakeholders = calcularGrupo('stakeholders', stakeholdersAvaliacoes)
  const grupos: ResultadoTabulacao['grupos'] = {
    autoavaliacao: calcularGrupo('autoavaliacao', porRelacao.autoavaliacao),
    stakeholders,
  }
  const percepcoesQualitativas: ResultadoTabulacao['percepcoesQualitativas'] = {}
  const relacoesExibidasSeparadamente: CategoriaMatrizRelacional[] = ['autoavaliacao']
  const relacoesProtegidas: CategoriaMatrizRelacional[] = []

  if (podeExibirRelacao('superior', porRelacao.superior.length)) {
    grupos.superior = calcularGrupo('superior', porRelacao.superior)
    percepcoesQualitativas.superior = calcularPercepcoes('superior', porRelacao.superior)
    relacoesExibidasSeparadamente.push('superior')
  }

  const agrupamento = agruparRelacoes(porRelacao)
  relacoesProtegidas.push(...agrupamento.protegidas)

  for (const relacao of ['liderado', 'par', 'outro'] as const) {
    const avaliacoes = agrupamento.grupos[relacao]
    if (!avaliacoes || avaliacoes.length === 0) continue
    grupos[relacao] = calcularGrupo(relacao, avaliacoes)
    percepcoesQualitativas[relacao] = calcularPercepcoes(relacao, avaliacoes)
    relacoesExibidasSeparadamente.push(relacao)
  }

  if (agrupamento.consolidarProtegidasEmStakeholders) {
    percepcoesQualitativas.stakeholders = calcularPercepcoes('stakeholders', [
      ...porRelacao.liderado,
      ...porRelacao.par,
      ...porRelacao.outro,
    ])
  }

  return {
    grupos,
    stakeholders,
    maioresMediasStakeholders: criarRanking(stakeholders, 'maiores'),
    menoresMediasStakeholders: criarRanking(stakeholders, 'menores'),
    percepcoesQualitativas,
    confidencialidade: {
      avaliacoesRespondidasPorRelacao: Object.fromEntries(
        RELACOES.map((relacao) => [relacao, porRelacao[relacao].length]),
      ) as Record<CategoriaMatrizRelacional, number>,
      relacoesExibidasSeparadamente,
      relacoesProtegidas,
    },
  }
}
