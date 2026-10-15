import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
  type Plugin,
} from 'chart.js'
import { Bar, Radar } from 'react-chartjs-2'
import {
  AlertTriangle,
  BarChart3,
  BookOpenText,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Compass,
  Download,
  FileSearch,
  Layers3,
  Loader2,
  Network,
  RefreshCw,
  Target,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { getStatusGeralAvaliacoes, type StatusGeralAvaliacao } from '@/lib/avaliacoes'
import { getAuthHeaders } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { FeedbackReportPdf } from '@/components/report/FeedbackReportPdf'
import type {
  GrupoTabulacao,
  PercepcoesGrupo,
  ResultadoPilar,
  ResultadoTabulacao,
} from '@/lib/tabulacao'
import type {
  Avaliacao,
  CategoriaMatrizRelacional,
  Empresa,
  MatrizRelacional,
  Participante,
  Processo,
} from '@/types'

ChartJS.register(
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
)

export const Route = createFileRoute('/_admin/relatorios')({
  component: Relatorios,
})

type MatrizRelatorio = MatrizRelacional & {
  avaliado?: Participante
  processo?: Processo
  empresa?: Empresa
  avaliacoes: Avaliacao[]
}

interface QuestaoRelatorio {
  numero: number
  texto: string
}

interface ClassificacaoMetodologica {
  letra: string
  competencia: string
  perguntas: readonly [number, number]
}

const classificacoesPorPilar: Record<string, readonly ClassificacaoMetodologica[]> = {
  estrategia: [
    { letra: 'A', competencia: 'Planejamento', perguntas: [1, 2] },
    { letra: 'B', competencia: 'Execução', perguntas: [3, 4] },
    { letra: 'C', competencia: 'Conhecimento', perguntas: [5, 6] },
    { letra: 'D', competencia: 'Objetivos e Metas', perguntas: [7, 8] },
  ],
  comprometimento: [
    { letra: 'E', competencia: 'Dedicação', perguntas: [9, 10] },
    { letra: 'F', competencia: 'Paixão', perguntas: [11, 12] },
    { letra: 'G', competencia: 'Sacrifício', perguntas: [13, 14] },
    { letra: 'H', competencia: 'Resiliência', perguntas: [15, 16] },
  ],
  gestao: [
    { letra: 'I', competencia: 'Motivar', perguntas: [17, 18] },
    { letra: 'J', competencia: 'Desenvolver', perguntas: [19, 20] },
    { letra: 'K', competencia: 'Reconhecer', perguntas: [21, 22] },
    { letra: 'L', competencia: 'Inspirar', perguntas: [23, 24] },
  ],
  credibilidade: [
    { letra: 'M', competencia: 'Valores', perguntas: [25, 26] },
    { letra: 'N', competencia: 'Justiça', perguntas: [27, 28] },
    { letra: 'O', competencia: 'Integridade', perguntas: [29, 30] },
    { letra: 'P', competencia: 'Congruência', perguntas: [31, 32] },
  ],
}

const relacoes: readonly CategoriaMatrizRelacional[] = [
  'autoavaliacao',
  'superior',
  'liderado',
  'par',
  'outro',
]

const nomesRelacoes: Record<CategoriaMatrizRelacional, string> = {
  autoavaliacao: 'Autoavaliação',
  superior: 'Superior',
  liderado: 'Liderado',
  par: 'Par',
  outro: 'Outros',
}

const nomesGrupos: Record<GrupoTabulacao, string> = {
  autoavaliacao: 'Autoavaliação',
  stakeholders: 'Stakeholders',
  superior: 'Superior',
  liderado: 'Liderado',
  par: 'Par',
  outro: 'Outros',
}

const nomesSeriesPerguntas: Record<GrupoTabulacao, string> = {
  ...nomesGrupos,
}

const coresSemanticas: Record<GrupoTabulacao, string> = {
  autoavaliacao: '#2563eb',
  stakeholders: '#0F766E',
  superior: '#eab308',
  liderado: '#16a34a',
  par: '#f97316',
  outro: '#06b6d4',
}

const corRankingMenores = '#f97316'
const corRankingMaiores = '#16a34a'
const corCompetencias = '#52779d'

const statusLabels: Record<StatusGeralAvaliacao, string> = {
  sem_avaliacoes: 'Sem avaliações',
  criada: 'Criada',
  enviada: 'Enviada',
  em_andamento: 'Em andamento',
  finalizada: 'Finalizada',
}

const statusClasses: Record<StatusGeralAvaliacao, string> = {
  sem_avaliacoes: 'border-slate-200 bg-slate-100 text-slate-600',
  criada: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  enviada: 'border-sky-200 bg-sky-50 text-sky-700',
  em_andamento: 'border-amber-200 bg-amber-50 text-amber-700',
  finalizada: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

const secoes = [
  { id: 'resumo', label: 'Resumo' },
  { id: 'introducao', label: 'Introdução' },
  { id: 'pilares', label: 'Pilares' },
  { id: 'comparativo', label: 'Comparativo' },
  { id: 'medias-stakeholders', label: 'Médias' },
  { id: 'comparativo-percepcoes', label: 'Percepções por pilar' },
  { id: 'analise-pilares', label: 'Análise por pilar' },
  { id: 'avaliacao-geral', label: 'Avaliação geral' },
  { id: 'percepcoes', label: 'Percepções' },
  { id: 'perguntas-estrategicas', label: 'Perguntas estratégicas' },
]

const descricoesPilares: Record<string, string> = {
  estrategia: 'Na Estratégia, observa-se como a liderança elabora e executa planos, utiliza conhecimento técnico, aprende continuamente e define objetivos e metas.',
  comprometimento: 'No Comprometimento, observa-se a dedicação da liderança, sua paixão pelo trabalho, a disposição para realizar esforços e a capacidade de manter-se resiliente.',
  gestao: 'Na Gestão, observa-se como a liderança motiva, desenvolve, reconhece e inspira as pessoas para alcançar resultados sustentáveis.',
  credibilidade: 'Na Credibilidade, observa-se a coerência da liderança com seus valores, seu senso de justiça, sua integridade e a congruência entre discurso e prática.',
}

const perguntasEstrategicas = [
  {
    titulo: 'Reflita sobre suas descobertas.',
    texto: 'O que mais chamou sua atenção? Como isso pode impactar sua prática? Quais insights foram mais importantes?',
  },
  {
    titulo: 'Defina seu estado desejado e metas.',
    texto: 'Quais objetivos deseja alcançar? Quais passos práticos pode dar? Quais recursos estão disponíveis?',
  },
  {
    titulo: 'Elabore um plano de ação.',
    texto: 'Quais ações precisa realizar? Como distribuí-las no tempo? Quais passos específicos serão necessários?',
  },
  {
    titulo: 'Execute o plano.',
    texto: 'Quais serão os primeiros passos? Como garantir a execução? Quais obstáculos podem surgir?',
  },
  {
    titulo: 'Avalie o progresso.',
    texto: 'Como saberá se está avançando? Quais indicadores usará? Que ajustes poderão ser necessários?',
  },
]

const politicaConfidencialidade = [
  'Para preservar o anonimato dos participantes, o Feedback Compass Rose aplica uma regra de agrupamento às categorias Liderado, Par e Outros. Essas relações somente são apresentadas individualmente quando possuem, no mínimo, duas avaliações concluídas.',
  'Quando uma dessas categorias não atinge esse quantitativo, suas respostas são agrupadas a outra categoria elegível, conforme as regras metodológicas do sistema. Dessa forma, evita-se que uma avaliação isolada possa ser associada a uma pessoa específica.',
  'Quando Liderado, Par e Outros não atingem simultaneamente o número mínimo necessário para apresentação individual, essas avaliações permanecem consideradas exclusivamente no resultado consolidado de Stakeholders, sem identificação da relação de origem.',
  'A categoria Superior é tratada de forma independente e permanece sempre separada, não recebendo nem sendo incorporada a outros agrupamentos.',
  'O resultado de Stakeholders reúne todas as avaliações de terceiros — Superior, Liderado, Par e Outros — e é calculado diretamente a partir das respostas válidas individuais, independentemente dos agrupamentos utilizados para apresentação das categorias.',
  'Nas respostas abertas, a mesma lógica de confidencialidade é aplicada: os comentários são apresentados segundo a categoria permitida pela regra de agrupamento, sem identificação do avaliador. As respostas qualitativas da Autoavaliação não são exibidas no relatório.',
]

function formatMedia(media: number | null | undefined) {
  return media === null || media === undefined
    ? '—'
    : media.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatChartValue(media: number | null | undefined) {
  return media === null || media === undefined
    ? '—'
    : media.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

const radarValueLabels: Plugin<'radar'> = {
  id: 'radarValueLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart
    ctx.save()
    ctx.font = '600 9px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex)
      ctx.fillStyle = String(dataset.borderColor)
      meta.data.forEach((point, index) => {
        const value = dataset.data[index]
        if (typeof value !== 'number') return
        const offset = datasetIndex === 0 ? -9 : 9
        ctx.fillText(formatChartValue(value), point.x, point.y + offset)
      })
    })

    ctx.restore()
  },
}

const pillarDifferenceRulers: Plugin<'bar'> = {
  id: 'pillarDifferenceRulers',
  afterDatasetsDraw(chart) {
    const autoMeta = chart.getDatasetMeta(0)
    const stakeholderMeta = chart.getDatasetMeta(1)
    const autoData = chart.data.datasets[0]?.data ?? []
    const stakeholderData = chart.data.datasets[1]?.data ?? []
    const { ctx } = chart

    ctx.save()
    ctx.strokeStyle = '#111827'
    ctx.fillStyle = '#111827'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.font = '700 11px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'

    autoMeta.data.forEach((autoBar, index) => {
      const stakeholderBar = stakeholderMeta.data[index]
      const autoValue = autoData[index]
      const stakeholderValue = stakeholderData[index]
      if (!stakeholderBar || typeof autoValue !== 'number' || typeof stakeholderValue !== 'number') return

      const left = Math.min(autoBar.x, stakeholderBar.x) - 18
      const right = Math.max(autoBar.x, stakeholderBar.x) + 18
      const center = (autoBar.x + stakeholderBar.x) / 2
      const upperY = Math.min(autoBar.y, stakeholderBar.y)
      const lowerY = Math.max(autoBar.y, stakeholderBar.y)
      ctx.beginPath()
      ctx.moveTo(left, autoBar.y)
      ctx.lineTo(right, autoBar.y)
      ctx.moveTo(left, stakeholderBar.y)
      ctx.lineTo(right, stakeholderBar.y)
      ctx.moveTo(center, upperY)
      ctx.lineTo(center, lowerY)
      ctx.stroke()
      ctx.fillText(formatChartValue(Math.abs(stakeholderValue - autoValue)), center, upperY - 8)
    })

    ctx.restore()
  },
}

const pillarValueLabels: Plugin<'bar'> = {
  id: 'pillarValueLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart

    ctx.save()
    ctx.font = '700 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffffff'
    ctx.textBaseline = 'bottom'

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      chart.getDatasetMeta(datasetIndex).data.forEach((bar, index) => {
        const value = dataset.data[index]
        if (typeof value === 'number') ctx.fillText(formatChartValue(value), bar.x, chart.chartArea.bottom - 10)
      })
    })

    ctx.restore()
  },
}

const competencyValueLabels: Plugin<'bar'> = {
  id: 'competencyValueLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart
    const dataset = chart.data.datasets[0]
    const meta = chart.getDatasetMeta(0)

    ctx.save()
    ctx.fillStyle = '#334155'
    ctx.font = '700 11px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'

    meta.data.forEach((bar, index) => {
      const value = dataset?.data[index]
      if (typeof value !== 'number') return
      ctx.fillText(formatChartValue(value), bar.x, bar.y - 6)
    })

    ctx.restore()
  },
}

const rankingValueLabels: Plugin<'bar'> = {
  id: 'rankingValueLabels',
  afterDatasetsDraw(chart) {
    const { ctx, chartArea } = chart
    const dataset = chart.data.datasets[0]
    const meta = chart.getDatasetMeta(0)

    ctx.save()
    ctx.font = '700 11px sans-serif'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'

    meta.data.forEach((bar, index) => {
      const value = dataset?.data[index]
      if (typeof value !== 'number') return
      const label = formatChartValue(value)
      const labelWidth = ctx.measureText(label).width
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(chartArea.right - labelWidth - 10, bar.y - 8, labelWidth + 8, 16)
      ctx.fillStyle = String(dataset?.backgroundColor)
      ctx.fillText(label, chartArea.right - 6, bar.y)
    })

    ctx.restore()
  },
}

const questionValueLabels: Plugin<'bar'> = {
  id: 'questionValueLabels',
  afterDatasetsDraw(chart) {
    const { ctx, chartArea } = chart
    ctx.save()
    ctx.font = '700 8px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#334155'

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      chart.getDatasetMeta(datasetIndex).data.forEach((bar, index) => {
        const value = dataset.data[index]
        if (typeof value !== 'number') return
        const label = formatChartValue(value)
        const width = ctx.measureText(label).width
        const x = Math.min(bar.x + 3, chartArea.right - width - 2)
        ctx.fillText(label, x, bar.y)
      })
    })
    ctx.restore()
  },
}

function createQuestionPairMarkers(
  classifications: readonly ClassificacaoMetodologica[],
): Plugin<'bar'> {
  return {
    id: `questionPairMarkers-${classifications[0]?.letra ?? 'empty'}`,
    afterDraw(chart) {
      const yScale = chart.scales.y
      const { ctx, chartArea } = chart
      if (!yScale) return

      ctx.save()
      ctx.lineWidth = 1.5
      ctx.strokeStyle = '#0f766e'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = '700 11px sans-serif'

      classifications.forEach((classification, pairIndex) => {
        const firstIndex = pairIndex * 2
        const secondIndex = firstIndex + 1
        const firstY = yScale.getPixelForTick(firstIndex)
        const secondY = yScale.getPixelForTick(secondIndex)
        const markerX = chartArea.left - yScale.width - 8
        const letterX = markerX - 13
        const middleY = (firstY + secondY) / 2

        ctx.beginPath()
        ctx.moveTo(markerX, firstY)
        ctx.lineTo(markerX - 5, firstY)
        ctx.moveTo(markerX, firstY)
        ctx.lineTo(markerX, secondY)
        ctx.moveTo(markerX, secondY)
        ctx.lineTo(markerX - 5, secondY)
        ctx.stroke()

        ctx.beginPath()
        ctx.fillStyle = '#0f766e'
        ctx.arc(letterX, middleY, 10, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#ffffff'
        ctx.fillText(classification.letra, letterX, middleY + 0.5)
      })

      ctx.restore()
    },
  }
}

function formatDateTime(date: Date | null) {
  return date
    ? date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'
}

function formatDate(date: string | null | undefined) {
  if (!date) return '—'
  const parsed = new Date(`${date.slice(0, 10)}T12:00:00`)
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('pt-BR')
}

function formatPeriod(processo: Processo | undefined) {
  if (!processo?.data_inicio && !processo?.data_fim) return '—'
  return `${formatDate(processo.data_inicio)} a ${formatDate(processo.data_fim)}`
}

function formatFilenameDate(date: Date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replaceAll('/', '-')
}

function sanitizeFilenamePart(value: string) {
  return value.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '').replace(/\s+/g, ' ').trim()
}

function getQuestionText(questions: Map<number, string>, number: number) {
  return questions.get(number) || `Questão ${number}`
}

function getGroupColumns(tabulacao: ResultadoTabulacao) {
  const specificGroups = tabulacao.confidencialidade.relacoesExibidasSeparadamente.filter(
    (relation) => relation !== 'autoavaliacao',
  )
  return ['autoavaliacao', 'stakeholders', ...specificGroups] as GrupoTabulacao[]
}

function getGroup(tabulacao: ResultadoTabulacao, group: GrupoTabulacao) {
  return group === 'stakeholders' ? tabulacao.stakeholders : tabulacao.grupos[group]
}

function MediaValue({ value }: { value: number | null | undefined }) {
  return (
    <span className={value === null || value === undefined ? 'text-slate-400' : 'font-semibold text-slate-800'}>
      {formatMedia(value)}
    </span>
  )
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="mb-6 max-w-3xl">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  )
}

function Relatorios() {
  const [matrizes, setMatrizes] = useState<MatrizRelatorio[]>([])
  const [questoes, setQuestoes] = useState<QuestaoRelatorio[]>([])
  const [matrizSelecionadaId, setMatrizSelecionadaId] = useState('')
  const [tabulacao, setTabulacao] = useState<ResultadoTabulacao | null>(null)
  const [geradoEm, setGeradoEm] = useState<Date | null>(null)
  const [loadingIndex, setLoadingIndex] = useState(true)
  const [loadingReport, setLoadingReport] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void loadIndex()
  }, [])

  async function loadIndex() {
    if (!supabase) {
      setError('O Supabase não está configurado para esta aplicação.')
      setLoadingIndex(false)
      return
    }

    setLoadingIndex(true)
    setError('')

    const [
      matrizesResult,
      avaliacoesResult,
      participantesResult,
      processosResult,
      empresasResult,
    ] = await Promise.all([
      supabase.from('matrizes_relacionais').select('*').order('created_at', { ascending: false }),
      supabase.from('avaliacoes').select('*').order('created_at', { ascending: false }),
      supabase.from('participantes').select('*').order('nome', { ascending: true }),
      supabase.from('processos').select('*').order('created_at', { ascending: false }),
      supabase.from('empresas').select('*').order('nome', { ascending: true }),
    ])

    const firstError = [
      matrizesResult.error,
      avaliacoesResult.error,
      participantesResult.error,
      processosResult.error,
      empresasResult.error,
    ].find(Boolean)

    if (firstError) {
      setError('Não foi possível carregar os dados necessários para os relatórios.')
      setLoadingIndex(false)
      return
    }

    const participantes = (participantesResult.data ?? []) as Participante[]
    const processos = (processosResult.data ?? []) as Processo[]
    const empresas = (empresasResult.data ?? []) as Empresa[]
    const avaliacoes = (avaliacoesResult.data ?? []) as Avaliacao[]

    setMatrizes(
      ((matrizesResult.data ?? []) as MatrizRelacional[]).map((matriz) => {
        const processo = processos.find((item) => item.id === matriz.processo_id)
        return {
          ...matriz,
          avaliado: participantes.find((item) => item.id === matriz.avaliado_id),
          processo,
          empresa: empresas.find((item) => item.id === processo?.empresa_id),
          avaliacoes: avaliacoes.filter((item) => item.matriz_relacional_id === matriz.id),
        }
      }),
    )
    setLoadingIndex(false)
  }

  async function openReport(matrixId: string) {
    if (!supabase || !matrixId) return

    setMatrizSelecionadaId(matrixId)
    setLoadingReport(true)
    setError('')

    try {
      const response = await fetch(`/api/relatorios/matriz/${encodeURIComponent(matrixId)}`, {
        headers: await getAuthHeaders(),
      })
      const result = (await response.json()) as {
        tabulacao?: ResultadoTabulacao
        perguntas?: QuestaoRelatorio[]
      }

      if (!response.ok || !result.tabulacao) throw new Error('Falha ao carregar relatório')

      setTabulacao(result.tabulacao)
      setQuestoes(result.perguntas ?? [])
      setGeradoEm(new Date())
    } catch {
      setTabulacao(null)
      setError('Não foi possível tabular as respostas desta matriz.')
    } finally {
      setLoadingReport(false)
    }
  }

  const matrizSelecionada = useMemo(
    () => matrizes.find((matriz) => matriz.id === matrizSelecionadaId),
    [matrizSelecionadaId, matrizes],
  )
  const textosQuestoes = useMemo(() => {
    const texts = new Map<number, string>()
    for (const question of questoes) {
      if (!texts.has(question.numero)) texts.set(question.numero, question.texto)
    }
    return texts
  }, [questoes])

  async function downloadPdf() {
    if (!matrizSelecionada || !tabulacao) return
    setGeneratingPdf(true)
    setError('')
    try {
      const { pdf } = await import('@react-pdf/renderer')
      const questionTexts = Object.fromEntries(textosQuestoes.entries())
      const answeredByRelation = tabulacao.confidencialidade.avaliacoesRespondidasPorRelacao
      const participation = relacoes.map((group) => ({
        group,
        planned: matrizSelecionada.avaliacoes.filter((evaluation) => evaluation.relacao === group).length,
        answered: answeredByRelation[group],
      }))
      const blob = await pdf(
        <FeedbackReportPdf
          metadata={{
            avaliado: matrizSelecionada.avaliado?.nome || 'Avaliado não identificado',
            empresa: matrizSelecionada.empresa?.nome || matrizSelecionada.processo?.empresa || '—',
            processo: matrizSelecionada.processo?.nome || '—',
            codigoMatriz: matrizSelecionada.codigo_operacional || '—',
            periodo: formatPeriod(matrizSelecionada.processo),
            geradoEm: formatDateTime(geradoEm),
            consultor: matrizSelecionada.processo?.consultor_responsavel || '—',
          }}
          tabulacao={tabulacao}
          questionTexts={questionTexts}
          participation={participation}
        />,
      ).toBlob()
      const completionDates = matrizSelecionada.avaliacoes.flatMap((evaluation) => {
        if (!evaluation.respondido_em) return []
        const date = new Date(evaluation.respondido_em)
        return Number.isNaN(date.getTime()) ? [] : [date]
      })
      const completionDate = getStatusGeralAvaliacoes(matrizSelecionada.avaliacoes) === 'finalizada' && completionDates.length > 0
        ? new Date(Math.max(...completionDates.map((date) => date.getTime())))
        : geradoEm ?? new Date()
      const participantName = sanitizeFilenamePart(matrizSelecionada.avaliado?.nome || 'Avaliado')
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Feedback Compass Rose - ${participantName} - ${formatFilenameDate(completionDate)}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
    } catch {
      setError('Não foi possível gerar o PDF desta matriz.')
    } finally {
      setGeneratingPdf(false)
    }
  }

  if (loadingIndex) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-64 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-32 animate-pulse rounded-2xl bg-white" />
        <div className="grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-32 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-12">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <Compass className="h-4 w-4" />
            Inteligência de feedback 360º
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Relatórios</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Consulte a leitura consolidada de cada matriz relacional com as regras de confidencialidade aplicadas.
          </p>
        </div>

        <div className="report-toolbar flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          <label className="sr-only" htmlFor="matriz-relatorio">Matriz relacional</label>
          <select
            id="matriz-relatorio"
            value={matrizSelecionadaId}
            onChange={(event) => setMatrizSelecionadaId(event.target.value)}
            className="min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 sm:min-w-80"
          >
            <option value="">Selecione uma Matriz Relacional</option>
            {matrizes.map((matriz) => (
              <option key={matriz.id} value={matriz.id}>
                {matriz.codigo_operacional || 'Sem código'} · {matriz.avaliado?.nome || 'Avaliado não identificado'}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void openReport(matrizSelecionadaId)}
            disabled={!matrizSelecionadaId || loadingReport}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loadingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
            Abrir relatório
          </button>
          {tabulacao && matrizSelecionada && (
            <button
              type="button"
              onClick={() => void downloadPdf()}
              disabled={generatingPdf}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-100"
            >
              {generatingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {generatingPdf ? 'Gerando PDF…' : 'Baixar PDF'}
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</span>
          <button type="button" onClick={() => void loadIndex()} className="inline-flex items-center gap-2 font-semibold hover:text-rose-950">
            <RefreshCw className="h-4 w-4" /> Recarregar
          </button>
        </div>
      )}

      {!tabulacao || !matrizSelecionada ? (
        <EmptyReport matrices={matrizes} onOpen={openReport} />
      ) : (
        <ReportContent
          matriz={matrizSelecionada}
          tabulacao={tabulacao}
          geradoEm={geradoEm}
          textosQuestoes={textosQuestoes}
        />
      )}
    </div>
  )
}

function EmptyReport({
  matrices,
  onOpen,
}: {
  matrices: MatrizRelatorio[]
  onOpen: (matrixId: string) => Promise<void>
}) {
  if (matrices.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
        <Network className="mx-auto h-10 w-10 text-slate-300" />
        <h2 className="mt-4 text-lg font-semibold text-slate-900">Nenhuma matriz disponível</h2>
        <p className="mt-2 text-sm text-slate-500">Crie uma Matriz Relacional para disponibilizar o relatório interno.</p>
      </div>
    )
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 to-slate-800 px-6 py-7 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Biblioteca de matrizes</p>
        <h2 className="mt-2 text-xl font-semibold">Selecione uma leitura para começar</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">As médias são tabuladas no momento da consulta, usando as respostas já registradas.</p>
      </div>
      <div className="divide-y divide-slate-100">
        {matrices.slice(0, 8).map((matriz) => {
          const status = getStatusGeralAvaliacoes(matriz.avaliacoes)
          return (
            <button
              key={matriz.id}
              type="button"
              onClick={() => void onOpen(matriz.id)}
              className="grid w-full gap-3 px-6 py-4 text-left transition hover:bg-slate-50 sm:grid-cols-[1fr_1fr_auto] sm:items-center"
            >
              <div>
                <p className="font-semibold text-slate-900">{matriz.avaliado?.nome || 'Avaliado não identificado'}</p>
                <p className="mt-1 text-xs text-slate-500">{matriz.codigo_operacional || 'Sem código operacional'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-700">{matriz.processo?.nome || 'Processo não identificado'}</p>
                <p className="mt-1 text-xs text-slate-500">{matriz.empresa?.nome || matriz.processo?.empresa || 'Empresa não identificada'}</p>
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses[status]}`}>{statusLabels[status]}</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function ReportContent({
  matriz,
  tabulacao,
  geradoEm,
  textosQuestoes,
}: {
  matriz: MatrizRelatorio
  tabulacao: ResultadoTabulacao
  geradoEm: Date | null
  textosQuestoes: Map<number, string>
}) {
  const status = getStatusGeralAvaliacoes(matriz.avaliacoes)
  const groupColumns = getGroupColumns(tabulacao)
  const answeredByRelation = tabulacao.confidencialidade.avaliacoesRespondidasPorRelacao
  const answered = Object.values(answeredByRelation).reduce((total, quantity) => total + quantity, 0)
  const total = matriz.avaliacoes.length
  const pending = Math.max(total - answered, 0)
  const totalsByRelation = Object.fromEntries(
    relacoes.map((relation) => [
      relation,
      matriz.avaliacoes.filter((evaluation) => evaluation.relacao === relation).length,
    ]),
  ) as Record<CategoriaMatrizRelacional, number>

  return (
    <article className="report-document overflow-hidden rounded-2xl border border-slate-200 bg-[#f4f6f8] shadow-[0_18px_60px_-36px_rgba(15,23,42,0.45)]">
      <div className="report-cover relative overflow-hidden bg-[#102f2b] px-6 py-8 text-white sm:px-10 sm:py-10">
        <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full border border-white/10" />
        <div className="absolute -right-8 -top-12 h-48 w-48 rounded-full border border-emerald-300/20" />
        <div className="relative grid gap-8 xl:grid-cols-[1.35fr_1fr] xl:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              <BarChart3 className="h-4 w-4" /> Relatório interno
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{matriz.avaliado?.nome || 'Avaliado não identificado'}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/75">Leitura consolidada do processo de Feedback Compass Rose, com recortes protegidos pela política de confidencialidade.</p>
          </div>
          <dl className="grid gap-x-6 gap-y-4 border-t border-white/15 pt-6 sm:grid-cols-2 xl:border-l xl:border-t-0 xl:pl-8 xl:pt-0">
            <IdentityItem icon={ClipboardList} label="Processo" value={matriz.processo?.nome || '—'} />
            <IdentityItem icon={Building2} label="Empresa" value={matriz.empresa?.nome || matriz.processo?.empresa || '—'} />
            <IdentityItem icon={Network} label="Código da matriz" value={matriz.codigo_operacional || '—'} />
            <IdentityItem icon={CalendarClock} label="Período da avaliação" value={formatPeriod(matriz.processo)} />
            <IdentityItem icon={CalendarClock} label="Consulta" value={formatDateTime(geradoEm)} />
          </dl>
        </div>
      </div>

      <nav className="sticky top-0 z-10 overflow-x-auto border-b border-slate-200 bg-white/95 px-6 backdrop-blur sm:px-10" aria-label="Seções do relatório">
        <div className="flex min-w-max gap-6">
          {secoes.map((section) => (
            <a key={section.id} href={`#${section.id}`} className="border-b-2 border-transparent py-4 text-sm font-semibold text-slate-500 transition hover:border-emerald-600 hover:text-emerald-800">
              {section.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <ReportSection id="indice">
          <SectionHeading eyebrow="Navegação" title="Índice" description="Sequência metodológica do relatório Feedback Compass Rose." />
          <ol className="report-index grid gap-x-8 gap-y-2 text-sm text-slate-700 sm:grid-cols-2">
            {['Resumo da Avaliação', 'Introdução', 'Os Pilares da Liderança', 'Comparativo Autoavaliação × Stakeholders', 'Média Stakeholders', 'Comparativo de Percepções', 'Pilares e Perguntas de Estratégia', 'Pilares e Perguntas de Comprometimento', 'Pilares e Perguntas de Gestão', 'Pilares e Perguntas de Credibilidade', 'Avaliação Geral', 'Percepções', 'Perguntas Estratégicas'].map((item, index) => (
              <li key={item} className="flex gap-3 border-b border-slate-100 py-2"><span className="font-semibold text-emerald-700">{String(index + 1).padStart(2, '0')}</span><span>{item}</span></li>
            ))}
          </ol>
        </ReportSection>

        <ReportSection id="resumo">
          <SectionHeading eyebrow="01 · Contexto" title="Resumo da Avaliação" description="Cobertura da matriz e participação registrada em cada relação da avaliação." />
          <div className="grid overflow-hidden rounded-xl border border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
            <Metric icon={UsersRound} label="Total previsto" value={String(total)} />
            <Metric icon={CheckCircle2} label="Respondidas" value={String(answered)} tone="emerald" />
            <Metric icon={CalendarClock} label="Não respondidas" value={String(pending)} tone="amber" />
            <Metric icon={Target} label="Status geral" value={statusLabels[status]} compact />
          </div>
          <h3 className="mt-8 text-lg font-semibold text-slate-900">Participação por relação</h3>
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-4 py-3 font-semibold">Relação</th><th className="px-4 py-3 text-right font-semibold">Previstas</th><th className="px-4 py-3 text-right font-semibold">Respondidas</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {relacoes.map((relation) => (
                  <tr key={relation}>
                    <td className="px-4 py-3 font-medium text-slate-700">{nomesRelacoes[relation]}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{totalsByRelation[relation]}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{answeredByRelation[relation]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReportSection>

        <ReportSection id="introducao" tone="soft">
          <SectionHeading eyebrow="02 · Introdução" title="Sobre a Avaliação 360º" description="A Avaliação 360º reúne diferentes perspectivas sobre a atuação de uma liderança." />
          <div className="max-w-4xl space-y-4 text-[15px] leading-7 text-slate-600">
            <p>O objetivo é oferecer uma leitura estruturada de conhecimentos, habilidades, atitudes, pontos fortes e oportunidades de desenvolvimento.</p>
            <p>O Feedback Compass Rose organiza essa leitura em quatro pilares: <strong className="font-semibold text-slate-900">Estratégia, Comprometimento, Gestão e Credibilidade</strong>, desdobrados em 16 competências.</p>
            <p>As respostas são apresentadas de forma consolidada e seguem a política de confidencialidade definida para o sistema.</p>
          </div>
          <div className="confidentiality-copy mt-8 rounded-xl border border-emerald-200 bg-emerald-50/60 p-5">
            <h3 className="font-semibold text-slate-900">Confidencialidade e regra de agrupamento</h3>
            <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
              {politicaConfidencialidade.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </div>
        </ReportSection>

        <ReportSection id="pilares">
          <SectionHeading eyebrow="03 · Estrutura" title="Os Pilares da Liderança" description="Os quatro pilares organizam as 16 competências avaliadas pelo Feedback Compass Rose." />
          <div className="grid gap-4 md:grid-cols-2">
            {tabulacao.stakeholders.pilares.map((pillar) => (
              <div key={pillar.id} className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="text-lg font-semibold text-slate-900">{pillar.nome}</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(classificacoesPorPilar[pillar.id] ?? []).map((classification) => (
                    <span key={classification.letra} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">{classification.competencia}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ReportSection>

        <ReportSection id="comparativo" tone="soft">
          <SectionHeading eyebrow="04 · Comparativo" title="Autoavaliação × Stakeholders" description="Radar com 16 competências e duas séries sobrepostas, em escala de 0 a 10." />
          <SectionNote><strong>Séries fixas:</strong> Autoavaliação em azul e Stakeholders em vermelho. Os valores permanecem identificáveis no gráfico e no tooltip.</SectionNote>
          <CompetencyRadar tabulacao={tabulacao} />
        </ReportSection>

        <ReportSection id="medias-stakeholders">
          <SectionHeading eyebrow="05 · Destaques" title="Média Stakeholders" description="As cinco menores e as cinco maiores médias são apresentadas em gráficos separados, com questão, texto e valor." />
          <div className="grid gap-6 xl:grid-cols-2">
            <StakeholderRankingChart title="5 menores médias" tone="menores" items={tabulacao.menoresMediasStakeholders} texts={textosQuestoes} />
            <StakeholderRankingChart title="5 maiores médias" tone="maiores" items={tabulacao.maioresMediasStakeholders} texts={textosQuestoes} />
          </div>
        </ReportSection>

        <ReportSection id="comparativo-percepcoes" tone="soft">
          <SectionHeading eyebrow="06 · Comparativo de Percepções" title="Autoavaliação × Stakeholders por Pilar" description="Quatro comparativos mostram a distância absoluta entre as percepções, sem sinal positivo ou negativo." />
          <PillarComparisonChart tabulacao={tabulacao} />
        </ReportSection>

        <div id="analise-pilares" className="scroll-mt-20 space-y-6">
          {tabulacao.stakeholders.pilares.map((pillar, index) => (
            <ReportSection key={pillar.id} id={`pilar-${pillar.id}`} tone={index % 2 === 0 ? 'paper' : 'soft'}>
              <SectionHeading eyebrow={`07.${index + 1} · Análise por Pilar`} title={pillar.nome} description={descricoesPilares[pillar.id] ?? `Análise das competências e perguntas do pilar ${pillar.nome}.`} />
              <CompetencyPillarChart pillar={pillar} />
              <div className="mt-8">
                <QuestionPillarChart pillarId={pillar.id} pillarName={pillar.nome} questionNumbers={pillar.perguntas} groups={groupColumns} tabulacao={tabulacao} questionTexts={textosQuestoes} />
              </div>
            </ReportSection>
          ))}
        </div>

        <ReportSection id="avaliacao-geral">
          <SectionHeading eyebrow="08 · Avaliação Geral" title="Questões 1–32" description="Tabela comparativa com os textos reais. Relações protegidas permanecem ocultas e campos sem base válida são exibidos como travessão." />
          <div className="general-averages mb-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Média geral · Autoavaliação</p><p className="mt-2 text-2xl font-semibold text-slate-950">{formatMedia(tabulacao.grupos.autoavaliacao?.geral.media)}</p></div>
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Média geral · Stakeholders</p><p className="mt-2 text-2xl font-semibold text-slate-950">{formatMedia(tabulacao.stakeholders.geral.media)}</p></div>
          </div>
          <GeneralEvaluationTable columns={groupColumns} tabulacao={tabulacao} questionTexts={textosQuestoes} />
        </ReportSection>

        <ReportSection id="percepcoes" tone="soft">
          <SectionHeading eyebrow="09 · Percepções" title="Comentários qualitativos" description="Relações de terceiros seguem o mesmo agrupamento aplicado às notas; a Autoavaliação não é apresentada." />
          <SectionNote><strong>Confidencialidade:</strong> cada comentário aparece na categoria permitida pelo agrupamento, sem identificar o avaliador.</SectionNote>
          <div className="grid gap-6 xl:grid-cols-2">
            <PerceptionQuestion number={33} title="Pontos fortes" groups={groupColumns} tabulacao={tabulacao} />
            <PerceptionQuestion number={34} title="Pontos de melhoria" groups={groupColumns} tabulacao={tabulacao} />
          </div>
        </ReportSection>

        <ReportSection id="perguntas-estrategicas">
          <SectionHeading eyebrow="10 · Desenvolvimento" title="Perguntas Estratégicas" description="Questões orientadoras para transformar a leitura do relatório em desenvolvimento e ação." />
          <ol className="space-y-4">
            {perguntasEstrategicas.map((question, index) => (
              <li key={question.titulo} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-[2.5rem_1fr]">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#102f2b] text-sm font-bold text-white">{index + 1}</span>
                <p className="text-sm leading-6 text-slate-600"><strong className="font-semibold text-slate-900">{question.titulo}</strong> {question.texto}</p>
              </li>
            ))}
          </ol>
        </ReportSection>
      </div>
    </article>
  )
}

function CompetencyRadar({ tabulacao }: { tabulacao: ResultadoTabulacao }) {
  const stakeholderCompetencies = tabulacao.stakeholders.competencias
  const autoCompetencies = tabulacao.grupos.autoavaliacao?.competencias ?? []
  const data = {
    labels: stakeholderCompetencies.map((competency) => competency.nome),
    datasets: [
      {
        label: nomesGrupos.autoavaliacao,
        data: stakeholderCompetencies.map((competency) => autoCompetencies.find((item) => item.id === competency.id)?.media ?? null),
        borderColor: coresSemanticas.autoavaliacao,
        backgroundColor: 'rgba(37, 99, 235, 0.10)',
        pointBackgroundColor: coresSemanticas.autoavaliacao,
        pointBorderColor: '#ffffff',
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
      },
      {
        label: nomesGrupos.stakeholders,
        data: stakeholderCompetencies.map((competency) => competency.media),
        borderColor: coresSemanticas.stakeholders,
        backgroundColor: 'rgba(15, 118, 110, 0.08)',
        pointBackgroundColor: coresSemanticas.stakeholders,
        pointBorderColor: '#ffffff',
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
      },
    ],
  }

  return (
    <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-5">
        <h3 className="font-semibold text-slate-900">Comparativo Autoavaliação × Stakeholders</h3>
        <p className="mt-1 text-sm text-slate-500">Passe o cursor pelos pontos para consultar os valores; os rótulos permanecem visíveis para leitura estática.</p>
      </div>
      <div className="h-[520px]">
        <Radar
          data={data}
          plugins={[radarValueLabels]}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'nearest', intersect: false },
            layout: { padding: 22 },
            plugins: {
              legend: {
                labels: { color: '#334155', usePointStyle: true, pointStyle: 'circle' },
              },
              tooltip: {
                callbacks: {
                  label: (context) => `${context.dataset.label}: ${formatChartValue(context.parsed.r)}`,
                },
              },
            },
            scales: {
              r: {
                min: 0,
                max: 10,
                ticks: { stepSize: 2, color: '#64748b', backdropColor: 'transparent' },
                angleLines: { color: '#dbe3ec' },
                grid: { color: '#dbe3ec' },
                pointLabels: { color: '#475569', font: { size: 10, weight: 600 } },
              },
            },
          }}
        />
      </div>
    </div>
  )
}

function CompetencyPillarChart({ pillar }: { pillar: ResultadoPilar }) {
  const orderedCompetencies = pillar.competencias
    .map((competency, methodologicalIndex) => ({ competency, methodologicalIndex }))
    .sort((left, right) => {
      const leftAverage = left.competency.media ?? Number.POSITIVE_INFINITY
      const rightAverage = right.competency.media ?? Number.POSITIVE_INFINITY
      return leftAverage - rightAverage || left.methodologicalIndex - right.methodologicalIndex
    })
    .map(({ competency }) => competency)

  const data = {
    labels: orderedCompetencies.map((competency) => competency.nome),
    datasets: [
      {
        label: nomesGrupos.stakeholders,
        data: orderedCompetencies.map((competency) => competency.media),
        backgroundColor: corCompetencias,
        borderColor: corCompetencias,
        borderWidth: 1,
        borderRadius: 3,
        maxBarThickness: 64,
      },
    ],
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <Layers3 className="h-4 w-4" />
        </span>
        <div>
          <h3 className="font-semibold text-slate-900">Competências de {pillar.nome}</h3>
          <p className="mt-1 text-sm text-slate-500">Médias dos Stakeholders em ordem crescente; empates preservam a ordem metodológica.</p>
        </div>
      </div>
      <div className="h-80">
        <Bar
          data={data}
          plugins={[competencyValueLabels]}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            layout: { padding: { top: 22 } },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (context) => `${context.dataset.label}: ${formatChartValue(context.parsed.y)}`,
                },
              },
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: '#475569', font: { weight: 600 } },
              },
              y: {
                min: 0,
                max: 10,
                ticks: { stepSize: 2, color: '#64748b' },
                grid: { color: '#e2e8f0' },
              },
            },
          }}
        />
      </div>
    </div>
  )
}

function QuestionPillarChart({
  pillarId,
  pillarName,
  questionNumbers,
  groups,
  tabulacao,
  questionTexts,
}: {
  pillarId: string
  pillarName: string
  questionNumbers: readonly number[]
  groups: GrupoTabulacao[]
  tabulacao: ResultadoTabulacao
  questionTexts: Map<number, string>
}) {
  const classifications = classificacoesPorPilar[pillarId] ?? []
  const data = {
    labels: questionNumbers.map((questionNumber) => `Q${questionNumber}`),
    datasets: groups.map((group) => ({
      label: nomesSeriesPerguntas[group],
      data: questionNumbers.map(
        (questionNumber) =>
          getGroup(tabulacao, group)?.questoes.find(
            (question) => question.numeroPergunta === questionNumber,
          )?.media ?? null,
      ),
      backgroundColor: coresSemanticas[group],
      borderRadius: 2,
      barPercentage: 0.9,
      categoryPercentage: 0.82,
      maxBarThickness: 12,
    })),
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-5">
        <h3 className="font-semibold text-slate-900">Perguntas de {pillarName}</h3>
        <p className="mt-1 text-sm text-slate-500">Comparação por relação liberada, mantendo os pares de perguntas de cada competência.</p>
      </div>

      <div className="overflow-x-auto">
        <div className="h-[560px] min-w-[760px]">
          <Bar
            data={data}
            plugins={[createQuestionPairMarkers(classifications), questionValueLabels]}
            options={{
              indexAxis: 'y',
              responsive: true,
              maintainAspectRatio: false,
              interaction: { mode: 'index', intersect: false },
              layout: { padding: { left: 48, right: 12 } },
              plugins: {
                legend: {
                  position: 'top',
                  align: 'start',
                  labels: {
                    boxHeight: 10,
                    boxWidth: 10,
                    color: '#334155',
                    padding: 16,
                    usePointStyle: true,
                    pointStyle: 'rectRounded',
                  },
                },
                tooltip: {
                  callbacks: {
                    title: (items) => {
                      const questionNumber = questionNumbers[items[0]?.dataIndex ?? 0]
                      return `Q${questionNumber} · ${getQuestionText(questionTexts, questionNumber)}`
                    },
                    label: (context) => `${context.dataset.label}: ${formatChartValue(context.parsed.x)}`,
                  },
                },
              },
              scales: {
                x: {
                  min: 0,
                  max: 10,
                  ticks: { stepSize: 2, color: '#64748b' },
                  grid: { color: '#e2e8f0' },
                  border: { display: false },
                },
                y: {
                  grid: { display: false },
                  border: { display: false },
                  ticks: { color: '#334155', font: { weight: 700 } },
                },
              },
            }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-2 border-t border-slate-100 pt-4 sm:grid-cols-2 xl:grid-cols-4">
        {classifications.map((classification) => (
          <div key={classification.letra} className="flex items-center gap-2 text-xs text-slate-600">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-700 font-bold text-white">
              {classification.letra}
            </span>
            <span>
              <strong className="font-semibold text-slate-800">{classification.competencia}</strong>{' '}
              · Q{classification.perguntas[0]}–Q{classification.perguntas[1]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PillarComparisonChart({ tabulacao }: { tabulacao: ResultadoTabulacao }) {
  const stakeholderPillars = tabulacao.stakeholders.pilares
  const autoPillars = tabulacao.grupos.autoavaliacao?.pilares ?? []

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {stakeholderPillars.map((pillar) => {
        const autoAverage = autoPillars.find((item) => item.id === pillar.id)?.media ?? null
        const data = {
          labels: [pillar.nome],
          datasets: [
            {
              label: nomesGrupos.autoavaliacao,
              data: [autoAverage],
              backgroundColor: coresSemanticas.autoavaliacao,
              borderRadius: 3,
              maxBarThickness: 56,
            },
            {
              label: nomesGrupos.stakeholders,
              data: [pillar.media],
              backgroundColor: coresSemanticas.stakeholders,
              borderRadius: 3,
              maxBarThickness: 56,
            },
          ],
        }

        return (
          <div key={pillar.id} className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="mb-3 border-b border-slate-100 pb-4">
              <h3 className="font-semibold text-slate-900">{pillar.nome}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">A régua mostra a diferença absoluta entre as percepções.</p>
            </div>
            <div className="h-72">
              <Bar
                data={data}
                plugins={[pillarDifferenceRulers, pillarValueLabels]}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: { mode: 'index', intersect: false },
                  layout: { padding: { top: 38 } },
                  plugins: {
                    legend: {
                      labels: { color: '#334155', usePointStyle: true, pointStyle: 'rectRounded' },
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => `${context.dataset.label}: ${formatChartValue(context.parsed.y)}`,
                      },
                    },
                  },
                  scales: {
                    x: { grid: { display: false }, ticks: { display: false } },
                    y: {
                      min: 0,
                      max: 10,
                      ticks: { stepSize: 2, color: '#64748b' },
                      grid: { color: '#e2e8f0' },
                    },
                  },
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function IdentityItem({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) {
  return <div className="flex gap-3"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /><div><dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-100/55">{label}</dt><dd className="mt-1 text-sm font-medium text-white">{value}</dd></div></div>
}

function Metric({ icon: Icon, label, value, tone = 'slate', compact = false }: { icon: typeof UsersRound; label: string; value: string; tone?: 'slate' | 'emerald' | 'amber'; compact?: boolean }) {
  const tones = { slate: 'text-slate-600 bg-slate-100', emerald: 'text-emerald-700 bg-emerald-50', amber: 'text-amber-700 bg-amber-50' }
  return <div className="border-b border-slate-200 p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tones[tone]}`}><Icon className="h-4 w-4" /></span><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className={`mt-1 font-semibold text-slate-950 ${compact ? 'text-base' : 'text-2xl'}`}>{value}</p></div>
}

function ReportSection({ id, tone = 'paper', children }: { id: string; tone?: 'paper' | 'soft'; children: ReactNode }) {
  return (
    <section id={id} className={`scroll-mt-20 rounded-2xl border border-slate-200 px-5 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 ${tone === 'soft' ? 'bg-[#faf9f5]' : 'bg-white'}`}>
      {children}
    </section>
  )
}

function SectionNote({ children }: { children: ReactNode }) {
  return (
    <div className="mb-6 rounded-r-xl border-l-4 border-teal-700 bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-600">
      {children}
    </div>
  )
}

function StakeholderRankingChart({ title, tone, items, texts }: { title: string; tone: 'maiores' | 'menores'; items: ResultadoTabulacao['maioresMediasStakeholders']; texts: Map<number, string> }) {
  const color = tone === 'maiores' ? corRankingMaiores : corRankingMenores
  const data = {
    labels: items.map((item) => [`Q${item.numeroPergunta}`, getQuestionText(texts, item.numeroPergunta)]),
    datasets: [{
      label: title,
      data: items.map((item) => item.media),
      backgroundColor: color,
      borderRadius: 4,
      maxBarThickness: 24,
    }],
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">Sem respostas válidas para compor este gráfico.</p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <div className="h-[390px] min-w-[620px]">
            <Bar
              data={data}
              plugins={[rankingValueLabels]}
              options={{
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                layout: { padding: { right: 36 } },
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      title: (tooltipItems) => {
                        const item = items[tooltipItems[0]?.dataIndex ?? 0]
                        return `Q${item.numeroPergunta} · ${getQuestionText(texts, item.numeroPergunta)}`
                      },
                      label: (context) => `Média Stakeholders: ${formatChartValue(context.parsed.x)}`,
                    },
                  },
                },
                scales: {
                  x: {
                    min: 0,
                    max: 10,
                    ticks: { stepSize: 2, color: '#64748b' },
                    grid: { color: '#e2e8f0' },
                    border: { display: false },
                  },
                  y: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: { color: '#334155', font: { size: 10, weight: 600 } },
                  },
                },
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function GeneralEvaluationTable({ columns, tabulacao, questionTexts }: { columns: GrupoTabulacao[]; tabulacao: ResultadoTabulacao; questionTexts: Map<number, string> }) {
  const questionNumbers = Array.from({ length: 32 }, (_, index) => index + 1)

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-[980px] w-full text-left text-sm">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
          <tr>
            <th className="w-14 px-4 py-3 font-semibold">#</th>
            <th className="min-w-80 px-4 py-3 font-semibold">Questão</th>
            {columns.map((column) => (
              <th key={column} className="min-w-32 border-t-2 px-4 py-3 text-right font-semibold" style={{ borderTopColor: coresSemanticas[column], color: coresSemanticas[column] }}>{nomesGrupos[column]}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {questionNumbers.map((questionNumber) => (
            <tr key={questionNumber} className="align-top hover:bg-slate-50/70">
              <td className="px-4 py-3 font-semibold text-slate-500">Q{questionNumber}</td>
              <td className="px-4 py-3 leading-5 text-slate-700">{getQuestionText(questionTexts, questionNumber)}</td>
              {columns.map((column) => {
                const value = getGroup(tabulacao, column)?.questoes.find((question) => question.numeroPergunta === questionNumber)?.media
                return <td key={column} className="px-4 py-3 text-right"><MediaValue value={value} /></td>
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function getPerceptionGroup(tabulacao: ResultadoTabulacao, group: GrupoTabulacao): PercepcoesGrupo | undefined {
  return tabulacao.percepcoesQualitativas[group]
}

function PerceptionQuestion({ number, title, groups, tabulacao }: { number: 33 | 34; title: string; groups: GrupoTabulacao[]; tabulacao: ResultadoTabulacao }) {
  const groupsWithResponses = groups.flatMap((group) => {
    const responses = getPerceptionGroup(tabulacao, group)?.questoes.find((question) => question.numeroPergunta === number)?.respostas ?? []
    const validResponses = responses.map((response) => response.trim()).filter(Boolean)
    return validResponses.length > 0 ? [{ group, responses: validResponses }] : []
  })

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white"><BookOpenText className="h-4 w-4" /></span><div><p className="text-xs font-semibold text-emerald-700">Q{number}</p><h3 className="font-semibold text-slate-900">{title}</h3></div></div>
      <div className="divide-y divide-slate-100">
        {groupsWithResponses.map(({ group, responses }) => <div key={group} className="px-5 py-5"><div className="mb-3 flex items-center justify-between gap-4"><h4 className="text-sm font-semibold" style={{ color: coresSemanticas[group] }}>{nomesGrupos[group]}</h4><span className="text-xs text-slate-400">{responses.length} comentário(s)</span></div><ul className="space-y-3">{responses.map((response, index) => <li key={`${group}-${number}-${index}`} className="border-l-2 pl-3 text-sm leading-6 text-slate-600" style={{ borderLeftColor: coresSemanticas[group] }}>{response}</li>)}</ul></div>)}
      </div>
    </div>
  )
}
