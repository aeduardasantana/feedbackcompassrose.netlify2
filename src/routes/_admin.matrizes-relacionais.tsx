import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Copy,
  Filter,
  Loader2,
  Mail,
  MessageCircle,
  Network,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  UserCheck,
  UserCog,
  Users,
  X,
} from 'lucide-react'
import type {
  CategoriaMatrizRelacional,
  Avaliacao,
  Consultora,
  Empresa,
  MatrizRelacional,
  MatrizRelacionalAvaliador,
  Participante,
  Processo,
  StatusAvaliacao,
} from '@/types'
import { supabase } from '@/lib/supabase'
import { getStatusGeralAvaliacoes } from '@/lib/avaliacoes'
import {
  getMailtoUrl,
  getTrackingShareContent,
  getWhatsappUrl,
  isValidEmail,
  normalizeInternationalWhatsapp,
} from '@/lib/manual-sharing'

export const Route = createFileRoute('/_admin/matrizes-relacionais')({
  component: MatrizesRelacionais,
})

type MatrizComVinculos = MatrizRelacional & {
  avaliado?: Participante
  avaliadores: VinculoComContexto[]
  avaliacoes: Avaliacao[]
  processo?: Processo
  consultora?: Consultora
  statusMatriz: StatusMatriz
}

type AvaliadorForm = {
  participante_id: string
  categoria: Exclude<CategoriaMatrizRelacional, 'autoavaliacao'>
}

type StatusMatriz = 'nao_gerada' | 'criada' | 'enviada' | 'em_andamento' | 'finalizada'

type VinculoComContexto = MatrizRelacionalAvaliador & {
  participante?: Participante
  avaliacao?: Avaliacao
}

const categorias: Record<CategoriaMatrizRelacional, string> = {
  autoavaliacao: 'Autoavaliação',
  superior: 'Superior',
  liderado: 'Liderado',
  par: 'Par',
  outro: 'Outro',
}

const statusesAvaliacao: Record<StatusAvaliacao, string> = {
  criada: 'Criada',
  enviada: 'Enviada',
  acessada: 'Acessada',
  em_andamento: 'Em andamento',
  respondida: 'Respondida',
  expirada: 'Expirada',
  cancelada: 'Cancelada',
}

const statusesMatriz: Record<StatusMatriz, string> = {
  nao_gerada: 'Não gerada',
  criada: 'Criada',
  enviada: 'Enviada',
  em_andamento: 'Em andamento',
  finalizada: 'Finalizada',
}

const statusMatrizClasses: Record<StatusMatriz, string> = {
  nao_gerada: 'border-slate-200 bg-slate-100 text-slate-700',
  criada: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  enviada: 'border-sky-200 bg-sky-50 text-sky-700',
  em_andamento: 'border-amber-200 bg-amber-50 text-amber-700',
  finalizada: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

const categoriasAvaliador: AvaliadorForm['categoria'][] = [
  'superior',
  'liderado',
  'par',
  'outro',
]

function generateId() {
  return crypto.randomUUID()
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

function getEvaluationLink(token?: string | null) {
  if (!token || typeof window === 'undefined') return '-'
  return `${window.location.origin}/questionario/${token}`
}

function getStatusMatriz(avaliacoes: Avaliacao[]): StatusMatriz {
  const status = getStatusGeralAvaliacoes(avaliacoes)
  return status === 'sem_avaliacoes' ? 'nao_gerada' : status
}

function generateToken() {
  return crypto.randomUUID().replaceAll('-', '')
}

function MatrizesRelacionais() {
  const [processos, setProcessos] = useState<Processo[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [consultoras, setConsultoras] = useState<Consultora[]>([])
  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [matrizes, setMatrizes] = useState<MatrizComVinculos[]>([])
  const [empresaId, setEmpresaId] = useState('')
  const [processoId, setProcessoId] = useState('')
  const [avaliadoId, setAvaliadoId] = useState('')
  const [avaliadores, setAvaliadores] = useState<AvaliadorForm[]>([])
  const [editingMatriz, setEditingMatriz] = useState<MatrizComVinculos | null>(null)
  const [filters, setFilters] = useState({ codigo: '', processo: '', empresa: '', consultora: '' })
  const [search, setSearch] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [matrizParaExcluir, setMatrizParaExcluir] = useState<MatrizComVinculos | null>(null)
  const [deletingMatriz, setDeletingMatriz] = useState(false)
  const [deleteMatrizError, setDeleteMatrizError] = useState('')
  const [copyFeedback, setCopyFeedback] = useState<'acompanhamento' | 'questionario' | null>(null)

  function toggleGroup(key: string) {
    setExpandedGroups((current) => ({ ...current, [key]: !current[key] }))
  }

  async function writeClipboard(value: string) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return
    }

    const input = document.createElement('textarea')
    input.value = value
    input.setAttribute('readonly', '')
    input.style.position = 'fixed'
    input.style.opacity = '0'
    document.body.appendChild(input)
    input.select()
    const copied = document.execCommand('copy')
    input.remove()
    if (!copied) throw new Error('Clipboard indisponível')
  }

  async function copyTrackingLink(matriz: MatrizComVinculos) {
    if (!matriz.token_acompanhamento || typeof window === 'undefined') return

    const link = `${window.location.origin}/acompanhamento/${matriz.token_acompanhamento}`
    try {
      await writeClipboard(link)
      setError('')
      setCopyFeedback('acompanhamento')
      window.setTimeout(() => setCopyFeedback(null), 3000)
    } catch {
      setError('Não foi possível copiar o link de acompanhamento.')
    }
  }

  function getTrackingShareDetails(matriz: MatrizComVinculos) {
    if (!matriz.token_acompanhamento || typeof window === 'undefined' || !matriz.consultora || !matriz.avaliado || !matriz.processo) {
      return null
    }

    const link = `${window.location.origin}/acompanhamento/${matriz.token_acompanhamento}`
    const content = getTrackingShareContent({
      nomeAvaliado: matriz.avaliado.nome,
      nomeConsultor: matriz.consultora.nome,
      codigoMatriz: matriz.codigo_operacional || 'Não informado',
      nomeProcesso: matriz.processo.nome,
      nomeEmpresa: matriz.processo.empresa || 'Não informada',
      link,
    })

    return { consultora: matriz.consultora, content }
  }

  function shareTrackingByWhatsapp(matriz: MatrizComVinculos) {
    const details = getTrackingShareDetails(matriz)
    if (!details) return

    const url = getWhatsappUrl(details.consultora.whatsapp, details.content.whatsappBody)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  function shareTrackingByEmail(matriz: MatrizComVinculos) {
    const details = getTrackingShareDetails(matriz)
    if (!details) return

    const url = getMailtoUrl(details.consultora.email, details.content.subject, details.content.emailBody)
    if (url) window.location.href = url
  }

  async function copyQuestionnaireLink(token?: string | null) {
    if (!token || typeof window === 'undefined') return

    const link = getEvaluationLink(token)
    if (link === '-') return

    try {
      await writeClipboard(link)
      setError('')
      setCopyFeedback('questionario')
      window.setTimeout(() => setCopyFeedback(null), 3000)
    } catch {
      setError('Não foi possível copiar o questionário.')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    if (!supabase) return

    const [
      { data: processosData },
      { data: empresasData },
      { data: consultorasData },
      { data: participantesData },
      { data: matrizesData },
      { data: vinculosData },
      { data: avaliacoesData },
    ] = await Promise.all([
      supabase.from('processos').select('*').order('created_at', { ascending: false }),
      supabase.from('empresas').select('*').order('nome', { ascending: true }),
      supabase.from('consultoras').select('*').order('nome', { ascending: true }),
      supabase.from('participantes').select('*').order('nome', { ascending: true }),
      supabase.from('matrizes_relacionais').select('*').order('created_at', { ascending: false }),
      supabase.from('matrizes_relacionais_avaliadores').select('*').order('created_at', { ascending: true }),
      supabase.from('avaliacoes').select('*').order('created_at', { ascending: true }),
    ])

    const participantesList = (participantesData ?? []) as Participante[]
    const vinculos = (vinculosData ?? []) as MatrizRelacionalAvaliador[]
    const processosList = (processosData ?? []) as Processo[]
    const consultorasList = (consultorasData ?? []) as Consultora[]
    const avaliacoes = (avaliacoesData ?? []) as Avaliacao[]

    setProcessos(processosList)
    setEmpresas((empresasData ?? []) as Empresa[])
    setConsultoras(consultorasList)
    setParticipantes(participantesList)
    setMatrizes(
      ((matrizesData ?? []) as MatrizRelacional[]).map((matriz) => {
        const processo = processosList.find((item) => item.id === matriz.processo_id)
        const avaliacoesDaMatriz = avaliacoes.filter((avaliacao) => avaliacao.matriz_relacional_id === matriz.id)
        const matrizVinculos = vinculos
          .filter((vinculo) => vinculo.matriz_id === matriz.id)
          .map((vinculo) => ({
            ...vinculo,
            participante: participantesList.find((participante) => participante.id === vinculo.participante_id),
            avaliacao: avaliacoes.find((avaliacao) =>
              avaliacao.matriz_relacional_avaliador_id === vinculo.id ||
              (
                avaliacao.matriz_relacional_id === matriz.id &&
                avaliacao.participante_avaliador_id === vinculo.participante_id &&
                avaliacao.relacao === vinculo.categoria
              ),
            ),
          }))

        return {
          ...matriz,
          avaliado: participantesList.find((participante) => participante.id === matriz.avaliado_id),
          avaliadores: matrizVinculos,
          avaliacoes: avaliacoesDaMatriz,
          processo,
          consultora: consultorasList.find((item) => item.id === processo?.consultora_id),
          statusMatriz: getStatusMatriz(avaliacoesDaMatriz),
        }
      }),
    )
  }

  const selectedEmpresa = empresas.find((empresa) => empresa.id === empresaId)
  const selectedProcesso = processos.find((processo) => processo.id === processoId)
  const selectedConsultora = consultoras.find((consultora) => consultora.id === selectedProcesso?.consultora_id)
  const selectedEmpresaId = empresaId
  const processoSemEmpresaVinculada = Boolean(processoId && !selectedEmpresaId)
  const empresasFiltro = [...new Set(processos.map((processo) => processo.empresa).filter(Boolean))]
  const consultorasComProcessos = consultoras.filter((consultora) =>
    processos.some((processo) => processo.consultora_id === consultora.id),
  )

  const processosDaEmpresa = useMemo(() => {
    if (!empresaId) return []
    return processos.filter((processo) => processo.empresa_id === empresaId)
  }, [processos, empresaId])

  const participantesDaEmpresa = useMemo(() => {
    if (!selectedEmpresaId) return []
    return participantes.filter((participante) => participante.empresa_id === selectedEmpresaId)
  }, [participantes, selectedEmpresaId])

  const participantesDisponiveis = useMemo(() => {
    return participantesDaEmpresa.filter((participante) => participante.id !== avaliadoId)
  }, [participantesDaEmpresa, avaliadoId])

  const filteredMatrizes = matrizes.filter((matriz) => {
    const processo = matriz.processo
    const consultora = matriz.consultora
    const q = search.toLowerCase()

    if (filters.codigo && matriz.codigo_operacional !== filters.codigo) return false
    if (filters.processo && matriz.processo_id !== filters.processo) return false
    if (filters.empresa && processo?.empresa !== filters.empresa) return false
    if (filters.consultora && processo?.consultora_id !== filters.consultora) return false
    if (q && ![
      processo?.nome,
      processo?.codigo_operacional,
      processo?.empresa,
      consultora?.nome,
      matriz.codigo_operacional,
      matriz.avaliado?.nome,
      statusesMatriz[matriz.statusMatriz],
      ...matriz.avaliadores.flatMap((vinculo) => [
        vinculo.participante?.nome,
        vinculo.participante?.email,
        vinculo.participante?.cargo,
        categorias[vinculo.categoria],
        vinculo.avaliacao?.codigo_operacional,
        vinculo.avaliacao?.token,
        vinculo.avaliacao?.status ? statusesAvaliacao[vinculo.avaliacao.status] : undefined,
      ]),
    ].some((value) => value?.toLowerCase().includes(q))) {
      return false
    }

    return true
  })

  const stats = useMemo(() => {
    return {
      total: matrizes.length,
      geradas: matrizes.filter((matriz) => matriz.statusMatriz !== 'nao_gerada').length,
      emAndamento: matrizes.filter((matriz) => matriz.statusMatriz === 'em_andamento').length,
      finalizadas: matrizes.filter((matriz) => matriz.statusMatriz === 'finalizada').length,
    }
  }, [matrizes])

  function addAvaliador() {
    setAvaliadores([...avaliadores, { participante_id: '', categoria: 'par' }])
  }

  function updateAvaliador(index: number, patch: Partial<AvaliadorForm>) {
    setAvaliadores(avaliadores.map((avaliador, currentIndex) =>
      currentIndex === index ? { ...avaliador, ...patch } : avaliador,
    ))
  }

  function removeAvaliador(index: number) {
    setAvaliadores(avaliadores.filter((_, currentIndex) => currentIndex !== index))
  }

  function resetForm() {
    setEmpresaId('')
    setProcessoId('')
    setAvaliadoId('')
    setAvaliadores([])
    setEditingMatriz(null)
  }

  function openEditMatriz(matriz: MatrizComVinculos) {
    setEditingMatriz(matriz)
    setEmpresaId(matriz.processo?.empresa_id ?? '')
    setProcessoId(matriz.processo_id)
    setAvaliadoId(matriz.avaliado_id)
    setAvaliadores(
      matriz.avaliadores
        .filter((vinculo) => vinculo.categoria !== 'autoavaliacao')
        .map((vinculo) => ({
          participante_id: vinculo.participante_id,
          categoria: vinculo.categoria as AvaliadorForm['categoria'],
        })),
    )
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!supabase) return
    if (!empresaId || !processoId || !avaliadoId) {
      setError('Selecione a empresa, o processo e o participante avaliado.')
      return
    }

    if (selectedProcesso?.empresa_id !== empresaId) {
      setError('Selecione apenas processos vinculados à empresa escolhida.')
      return
    }

    const participantesPermitidos = new Set(participantesDaEmpresa.map((participante) => participante.id))
    const participantesSelecionados = avaliadores.map((avaliador) => avaliador.participante_id).filter(Boolean)
    const hasParticipanteOutraEmpresa =
      !participantesPermitidos.has(avaliadoId) ||
      participantesSelecionados.some((participanteId) => !participantesPermitidos.has(participanteId))

    if (hasParticipanteOutraEmpresa) {
      setError('Selecione apenas participantes vinculados à mesma empresa do processo.')
      return
    }

    const hasDuplicados = new Set(participantesSelecionados).size !== participantesSelecionados.length
    if (hasDuplicados || participantesSelecionados.includes(avaliadoId)) {
      setError('Cada participante deve aparecer apenas uma vez na matriz.')
      return
    }

    setSaving(true)
    const now = new Date().toISOString()

    if (editingMatriz) {
      const { error: updateError } = await supabase.rpc('update_matriz_relacional', {
        p_matriz_id: editingMatriz.id,
        p_avaliado_id: avaliadoId,
        p_avaliadores: avaliadores
          .filter((avaliador) => avaliador.participante_id)
          .map((avaliador) => ({
            participante_id: avaliador.participante_id,
            categoria: avaliador.categoria,
          })),
      })

      if (updateError) {
        console.error('Erro ao atualizar matriz relacional:', updateError)
        setError('Não foi possível atualizar a matriz relacional.')
        setSaving(false)
        return
      }

      resetForm()
      setSaving(false)
      await loadData()
      return
    }

    const { data: matrizCriada, error: matrizError } = await supabase
      .from('matrizes_relacionais')
      .insert({
        id: generateId(),
        processo_id: processoId,
        avaliado_id: avaliadoId,
        created_at: now,
        updated_at: now,
      })
      .select('id')
      .single()

    if (matrizError || !matrizCriada) {
      console.error('Erro ao salvar matriz relacional:', matrizError)
      setError('Não foi possível salvar a matriz relacional.')
      setSaving(false)
      return
    }

    const matrizId = matrizCriada.id
    const vinculos = [
      {
        id: generateId(),
        matriz_id: matrizId,
        participante_id: avaliadoId,
        categoria: 'autoavaliacao' as CategoriaMatrizRelacional,
        created_at: now,
        updated_at: now,
      },
      ...avaliadores
        .filter((avaliador) => avaliador.participante_id)
        .map((avaliador) => ({
          id: generateId(),
          matriz_id: matrizId,
          participante_id: avaliador.participante_id,
          categoria: avaliador.categoria,
          created_at: now,
          updated_at: now,
        })),
    ]

    const { error: vinculosError } = await supabase
      .from('matrizes_relacionais_avaliadores')
      .insert(vinculos)

    if (vinculosError) {
      console.error('Erro ao salvar vínculos da matriz relacional:', vinculosError)
      await supabase.from('matrizes_relacionais_avaliadores').delete().eq('matriz_id', matrizId)
      await supabase.from('matrizes_relacionais').delete().eq('id', matrizId)
      setError('Não foi possível salvar os avaliadores da matriz.')
      setSaving(false)
      return
    }

    const avaliacoesPayload = vinculos.map((vinculo) => ({
      id: generateId(),
      matriz_relacional_id: matrizId,
      matriz_relacional_avaliador_id: vinculo.id,
      processo_id: processoId,
      participante_avaliado_id: avaliadoId,
      participante_avaliador_id: vinculo.participante_id,
      relacao: vinculo.categoria,
      status: 'criada',
      token: generateToken(),
      enviado_em: null,
      respondido_em: null,
      created_at: now,
      updated_at: now,
    }))

    const { error: avaliacoesError } = await supabase
      .from('avaliacoes')
      .insert(avaliacoesPayload)

    if (avaliacoesError) {
      console.error('Erro ao gerar registros em avaliacoes:', avaliacoesError)
      await supabase.from('matrizes_relacionais_avaliadores').delete().eq('matriz_id', matrizId)
      await supabase.from('matrizes_relacionais').delete().eq('id', matrizId)
      setError('Não foi possível gerar as avaliações da matriz.')
      setSaving(false)
      return
    }

    resetForm()
    setSaving(false)
    await loadData()
  }

  async function deleteMatriz() {
    if (!supabase || !matrizParaExcluir) return

    setDeletingMatriz(true)
    setDeleteMatrizError('')

    const { count: avaliacoesVinculadas, error: avaliacoesError } = await supabase
      .from('avaliacoes')
      .select('id', { count: 'exact', head: true })
      .eq('matriz_relacional_id', matrizParaExcluir.id)

    if (avaliacoesError) {
      setDeletingMatriz(false)
      setDeleteMatrizError('Não foi possível verificar as avaliações vinculadas. A Matriz Relacional não foi excluída.')
      return
    }

    if ((avaliacoesVinculadas ?? 0) > 0) {
      setDeletingMatriz(false)
      setDeleteMatrizError('Esta matriz ainda possui avaliações vinculadas. Exclua primeiro as avaliações para liberar a exclusão da Matriz Relacional.')
      return
    }

    const { data: vinculosExcluidos, error: vinculosError } = await supabase
      .from('matrizes_relacionais_avaliadores')
      .delete()
      .eq('matriz_id', matrizParaExcluir.id)
      .select('*')

    if (vinculosError) {
      setDeletingMatriz(false)
      setDeleteMatrizError('Não foi possível excluir os vínculos da Matriz Relacional. Nenhum dado da matriz foi removido.')
      return
    }

    const { data: matrizExcluida, error: matrizError } = await supabase
      .from('matrizes_relacionais')
      .delete()
      .eq('id', matrizParaExcluir.id)
      .select('id')
      .maybeSingle()

    if (matrizError || !matrizExcluida) {
      let restoreError = null

      if (vinculosExcluidos?.length) {
        const { error } = await supabase
          .from('matrizes_relacionais_avaliadores')
          .upsert(vinculosExcluidos as MatrizRelacionalAvaliador[], { onConflict: 'id' })

        restoreError = error
      }

      if (restoreError) {
        console.error('Erro ao restaurar vínculos da matriz relacional:', restoreError)
      }

      setDeletingMatriz(false)
      setDeleteMatrizError(
        restoreError
          ? 'Não foi possível concluir a exclusão da Matriz Relacional. A matriz foi preservada, mas não foi possível restaurar todos os vínculos.'
          : 'Não foi possível excluir a Matriz Relacional. A matriz e seus vínculos foram preservados.',
      )
      return
    }

    setError('')
    if (editingMatriz?.id === matrizParaExcluir.id) resetForm()
    setMatrizes((current) => current.filter((matriz) => matriz.id !== matrizParaExcluir.id))
    setMatrizParaExcluir(null)
    setDeleteMatrizError('')
    setDeletingMatriz(false)
  }

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Matriz Relacional</h1>
          <p className="mt-1 text-slate-500">Monte e audite avaliados, autoavaliação e avaliadores por relação.</p>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          <Network className="h-5 w-5 text-indigo-600" />
          {matrizes.length} matrizes cadastradas
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Network} label="Total" value={stats.total.toString()} />
        <StatCard icon={ClipboardCheck} label="Geradas" value={stats.geradas.toString()} />
        <StatCard icon={UserCheck} label="Em andamento" value={stats.emAndamento.toString()} />
        <StatCard icon={CheckCircle2} label="Finalizadas" value={stats.finalizadas.toString()} />
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            {editingMatriz ? <Pencil className="h-4 w-4 text-indigo-600" /> : <Plus className="h-4 w-4 text-indigo-600" />}
            {editingMatriz ? `Editar matriz ${editingMatriz.codigo_operacional ?? ''}` : 'Nova matriz'}
            {editingMatriz && (
              <button
                type="button"
                onClick={resetForm}
                className="ml-auto text-xs font-medium text-slate-500 hover:text-slate-800"
              >
                Cancelar edição
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Empresa</span>
                <select
                  value={empresaId}
                  onChange={(event) => {
                    setEmpresaId(event.target.value)
                    setProcessoId('')
                    setAvaliadoId('')
                    setAvaliadores([])
                  }}
                  disabled={Boolean(editingMatriz)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm disabled:bg-slate-100 disabled:text-slate-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Selecione uma empresa</option>
                  {empresas.map((empresa) => (
                    <option key={empresa.id} value={empresa.id}>{empresa.codigo_operacional ? `${empresa.codigo_operacional} - ` : ''}{empresa.nome}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Processo</span>
                <select
                  value={processoId}
                  onChange={(event) => {
                    setProcessoId(event.target.value)
                    setAvaliadoId('')
                    setAvaliadores([])
                  }}
                  disabled={!empresaId || Boolean(editingMatriz)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm disabled:bg-slate-100 disabled:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Selecione um processo</option>
                  {processosDaEmpresa.map((processo) => (
                    <option key={processo.id} value={processo.id}>{processo.codigo_operacional ? `${processo.codigo_operacional} - ` : ''}{processo.nome}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Avaliado</span>
                <select
                  value={avaliadoId}
                  onChange={(event) => {
                    setAvaliadoId(event.target.value)
                    setAvaliadores(avaliadores.filter((avaliador) => avaliador.participante_id !== event.target.value))
                  }}
                  disabled={!empresaId || !processoId}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm disabled:bg-slate-100 disabled:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Selecione o participante avaliado</option>
                  {participantesDaEmpresa.map((participante) => (
                    <option key={participante.id} value={participante.id}>{participante.nome}</option>
                  ))}
                </select>
              </label>
            </div>

            {processoSemEmpresaVinculada && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                Selecione um processo com empresa vinculada.
              </div>
            )}

            <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-indigo-900">
                <UserCheck className="h-4 w-4" />
                Vínculo automático: Autoavaliação
              </div>
              <p className="mt-1 text-sm text-indigo-700">
                Ao salvar, o avaliado selecionado é registrado automaticamente como avaliador da própria matriz.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-900">Avaliadores</h2>
                <button
                  type="button"
                  onClick={addAvaliador}
                  disabled={!empresaId || !processoId}
                  className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar avaliador
                </button>
              </div>

              {avaliadores.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  Adicione quantos avaliadores forem necessários.
                </div>
              ) : (
                <div className="space-y-3">
                  {avaliadores.map((avaliador, index) => (
                    <div key={index} className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
                      <select
                        value={avaliador.participante_id}
                        onChange={(event) => updateAvaliador(index, { participante_id: event.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Selecione um participante</option>
                        {participantesDisponiveis.map((participante) => (
                          <option
                            key={participante.id}
                            value={participante.id}
                            disabled={avaliadores.some((item, itemIndex) => itemIndex !== index && item.participante_id === participante.id)}
                          >
                            {participante.nome}
                          </option>
                        ))}
                      </select>
                      <select
                        value={avaliador.categoria}
                        onChange={(event) => updateAvaliador(index, { categoria: event.target.value as AvaliadorForm['categoria'] })}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {categoriasAvaliador.map((categoria) => (
                          <option key={categoria} value={categoria}>{categorias[categoria]}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeAvaliador(index)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                        aria-label="Remover avaliador"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
          </div>

          <aside className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold text-slate-900">Dados do processo</h2>
            <div className="mt-4 space-y-3 text-sm">
              <InfoRow icon={UserCog} label="Consultor 360" value={selectedConsultora?.nome ?? 'Selecione um processo'} />
              <InfoRow icon={Building2} label="Empresa" value={selectedEmpresa?.nome ?? 'Selecione uma empresa'} />
              <InfoRow icon={Network} label="Código do processo" value={selectedProcesso?.codigo_operacional ?? 'Selecione um processo'} />
              <InfoRow icon={Users} label="Setor" value={selectedProcesso?.setor || 'Não informado'} />
              <InfoRow icon={Calendar} label="Data de criação da matriz" value={new Date().toLocaleDateString('pt-BR')} />
            </div>
            <button
              type="submit"
              disabled={saving || !empresaId || !processoId}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Salvando...' : editingMatriz ? 'Salvar alterações' : 'Salvar matriz'}
            </button>
          </aside>
        </div>
      </form>

      <section className="min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Filter className="h-4 w-4 text-indigo-600" />
              Matrizes cadastradas
            </div>
            <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
              <div className="relative min-w-0">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <select value={filters.processo} onChange={(event) => setFilters({ ...filters, processo: event.target.value })} className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">Todos os processos</option>
                {processos.map((processo) => <option key={processo.id} value={processo.id}>{processo.codigo_operacional ? `${processo.codigo_operacional} - ` : ''}{processo.nome}</option>)}
              </select>
              <select value={filters.codigo} onChange={(event) => setFilters({ ...filters, codigo: event.target.value })} className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">Todas as matrizes</option>
                {matrizes.map((matriz) => <option key={matriz.id} value={matriz.codigo_operacional ?? ''}>{matriz.codigo_operacional ?? 'Sem código'}</option>)}
              </select>
              <select value={filters.empresa} onChange={(event) => setFilters({ ...filters, empresa: event.target.value })} className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">Todas as empresas</option>
                {empresasFiltro.map((empresa) => <option key={empresa} value={empresa}>{empresa}</option>)}
              </select>
              <select value={filters.consultora} onChange={(event) => setFilters({ ...filters, consultora: event.target.value })} className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2 xl:col-span-1">
                <option value="">Todos os consultores</option>
                {consultorasComProcessos.map((consultora) => <option key={consultora.id} value={consultora.id}>{consultora.nome}</option>)}
              </select>
            </div>
          </div>
        </div>

        {filteredMatrizes.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center text-slate-400">
            <Network className="mb-4 h-14 w-14" />
            <p className="text-lg font-medium text-slate-700">Nenhuma matriz encontrada</p>
            <p className="mt-1 text-sm">Crie uma matriz ou ajuste os filtros da lista.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            <div className="hidden min-w-0 grid-cols-[minmax(76px,.65fr)_minmax(0,1.2fr)_minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(72px,.55fr)_minmax(86px,.7fr)_minmax(104px,.85fr)_144px] items-center gap-3 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 2xl:grid">
              <span>Código</span>
              <span>Avaliado</span>
              <span>Processo</span>
              <span>Empresa</span>
              <span>Consultor 360</span>
              <span>Total de vínculos</span>
              <span>Data de criação</span>
              <span>Status da matriz</span>
              <span />
            </div>

            {filteredMatrizes.map((matriz) => {
              const expanded = expandedGroups[matriz.id] ?? false
              const trackingContextAvailable = Boolean(matriz.token_acompanhamento && matriz.consultora && matriz.avaliado && matriz.processo)
              const whatsappValido = Boolean(trackingContextAvailable && normalizeInternationalWhatsapp(matriz.consultora?.whatsapp))
              const emailValido = Boolean(trackingContextAvailable && isValidEmail(matriz.consultora?.email))
              const whatsappTitle = !trackingContextAvailable
                ? 'Link de acompanhamento indisponível.'
                : whatsappValido
                  ? 'Enviar acompanhamento por WhatsApp'
                  : 'WhatsApp não cadastrado ou inválido.'
              const emailTitle = !trackingContextAvailable
                ? 'Link de acompanhamento indisponível.'
                : emailValido
                  ? 'Enviar acompanhamento por e-mail'
                  : 'E-mail não cadastrado ou inválido.'

              return (
                <div key={matriz.id}>
                  <div className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-2.5 px-4 py-3.5 hover:bg-slate-50 sm:px-5 md:grid-cols-4 lg:grid-cols-8 2xl:grid-cols-[minmax(76px,.65fr)_minmax(0,1.2fr)_minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(72px,.55fr)_minmax(86px,.7fr)_minmax(104px,.85fr)_144px] 2xl:items-center 2xl:gap-3">
                    <button type="button" onClick={() => toggleGroup(matriz.id)} className="min-w-0 text-left">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 2xl:hidden">Código</span>
                      <p className="break-words font-mono text-xs font-semibold text-indigo-600">{matriz.codigo_operacional || '—'}</p>
                    </button>
                    <button type="button" onClick={() => toggleGroup(matriz.id)} className="min-w-0 text-left md:col-span-2 lg:col-span-3 2xl:col-span-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 2xl:hidden">Avaliado</span>
                      <p className="break-words font-medium text-slate-900">{matriz.avaliado?.nome ?? 'Participante removido'}</p>
                    </button>
                    <button type="button" onClick={() => toggleGroup(matriz.id)} className="col-span-2 min-w-0 text-left md:col-span-2 lg:col-span-3 2xl:col-span-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 2xl:hidden">Processo</span>
                      <p className="break-words text-sm text-slate-600">{matriz.processo?.nome ?? 'Processo removido'}</p>
                    </button>
                    <button type="button" onClick={() => toggleGroup(matriz.id)} className="min-w-0 text-left">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 2xl:hidden">Empresa</span>
                      <p className="break-words text-sm text-slate-600">{matriz.processo?.empresa ?? '-'}</p>
                    </button>
                    <button type="button" onClick={() => toggleGroup(matriz.id)} className="min-w-0 text-left">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 2xl:hidden">Consultor 360</span>
                      <p className="break-words text-sm text-slate-600">{matriz.consultora?.nome ?? '-'}</p>
                    </button>
                    <button type="button" onClick={() => toggleGroup(matriz.id)} className="text-left">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 2xl:hidden">Total de vínculos</span>
                      <p className="text-sm font-medium text-slate-700">{matriz.avaliadores.length}</p>
                    </button>
                    <button type="button" onClick={() => toggleGroup(matriz.id)} className="text-left">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 2xl:hidden">Data de criação</span>
                      <p className="text-sm text-slate-600">{formatDate(matriz.created_at)}</p>
                    </button>
                    <button type="button" onClick={() => toggleGroup(matriz.id)} className="text-left">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 2xl:hidden">Status da matriz</span>
                      <span className={`inline-flex max-w-full whitespace-normal rounded-full border px-2.5 py-1 text-xs font-semibold ${statusMatrizClasses[matriz.statusMatriz]}`}>
                        {statusesMatriz[matriz.statusMatriz]}
                      </span>
                    </button>
                    <div className="col-span-2 flex items-center justify-end gap-1 border-t border-slate-100 pt-2 md:col-span-4 lg:col-span-2 lg:col-start-7 lg:border-0 lg:pt-0 2xl:col-span-1 2xl:col-start-auto 2xl:justify-end">
                      <button
                        type="button"
                        onClick={() => shareTrackingByWhatsapp(matriz)}
                        disabled={!whatsappValido}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
                        aria-label={whatsappTitle}
                        title={whatsappTitle}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => shareTrackingByEmail(matriz)}
                        disabled={!emailValido}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
                        aria-label={emailTitle}
                        title={emailTitle}
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => copyTrackingLink(matriz)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                        aria-label="Copiar acompanhamento"
                        title="Copiar acompanhamento"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditMatriz(matriz)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                        aria-label="Editar matriz"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteMatrizError('')
                          setMatrizParaExcluir(matriz)
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                        aria-label="Excluir matriz"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleGroup(matriz.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                        aria-label={expanded ? 'Recolher matriz' : 'Expandir matriz'}
                      >
                        {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {expanded && (
                    <div className="min-w-0 max-w-full bg-slate-50/60 px-3 pb-3 sm:px-4">
                      <table className="hidden w-full table-fixed 2xl:table">
                        <colgroup>
                          <col className="w-[24%]" />
                          <col className="w-[15%]" />
                          <col className="w-[12%]" />
                          <col className="w-[14%]" />
                          <col className="w-[12%]" />
                          <col className="w-[12%]" />
                          <col className="w-[11%]" />
                        </colgroup>
                        <thead className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="break-words py-2.5 pr-3">Avaliador</th>
                            <th className="break-words py-2.5 pr-3">Código avaliação</th>
                            <th className="break-words py-2.5 pr-3">Relação</th>
                            <th className="break-words py-2.5 pr-3">Status</th>
                            <th className="break-words py-2.5 pr-3">Data de envio</th>
                            <th className="break-words py-2.5 pr-3">Data de resposta</th>
                            <th className="break-words py-2.5 text-center">Questionário</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {matriz.avaliadores.map((vinculo) => {
                            const avaliacao = vinculo.avaliacao
                            const statusLabel = avaliacao?.token
                              ? statusesAvaliacao[avaliacao.status]
                              : 'Não gerada'

                            return (
                              <tr key={vinculo.id}>
                                <td className="break-words py-2.5 pr-3">
                                  <p className="font-medium text-slate-900">{vinculo.participante?.nome ?? 'Participante removido'}</p>
                                </td>
                                <td className="break-all py-2.5 pr-3 font-mono text-xs font-semibold text-indigo-600">{avaliacao?.codigo_operacional || '—'}</td>
                                <td className="break-words py-2.5 pr-3 text-sm text-slate-600">{categorias[vinculo.categoria]}</td>
                                <td className="py-2.5 pr-3">
                                  <span className="inline-flex max-w-full break-words rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                                    {statusLabel}
                                  </span>
                                </td>
                                <td className="break-words py-2.5 pr-3 text-sm text-slate-600">{formatDate(avaliacao?.enviado_em)}</td>
                                <td className="break-words py-2.5 pr-3 text-sm text-slate-600">{formatDate(avaliacao?.respondido_em)}</td>
                                <td className="py-1.5 text-center">
                                  <QuestionnaireCopyButton token={avaliacao?.token} onCopy={copyQuestionnaireLink} />
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>

                      <table className="hidden w-full table-fixed md:table 2xl:hidden">
                        <colgroup>
                          <col className="w-[34%]" />
                          <col className="w-[16%]" />
                          <col className="w-[16%]" />
                          <col className="w-[12%]" />
                          <col className="w-[12%]" />
                          <col className="w-[10%]" />
                        </colgroup>
                        <thead className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="break-words py-2.5 pr-2">Avaliador</th>
                            <th className="break-words py-2.5 pr-2">Relação</th>
                            <th className="break-words py-2.5 pr-2">Status</th>
                            <th className="break-words py-2.5 pr-2">Envio</th>
                            <th className="break-words py-2.5 pr-2">Resposta</th>
                            <th className="break-words py-2.5 text-center">Questionário</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {matriz.avaliadores.map((vinculo) => {
                            const avaliacao = vinculo.avaliacao
                            const statusLabel = avaliacao?.token
                              ? statusesAvaliacao[avaliacao.status]
                              : 'Não gerada'

                            return (
                              <tr key={vinculo.id}>
                                <td className="break-words py-2.5 pr-2">
                                  <p className="text-sm font-medium text-slate-900">{vinculo.participante?.nome ?? 'Participante removido'}</p>
                                  <p className="mt-0.5 break-all font-mono text-[11px] font-semibold text-indigo-600">{avaliacao?.codigo_operacional || '—'}</p>
                                </td>
                                <td className="break-words py-2.5 pr-2 text-xs text-slate-600">{categorias[vinculo.categoria]}</td>
                                <td className="py-2.5 pr-2">
                                  <span className="inline-flex max-w-full break-words rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200">
                                    {statusLabel}
                                  </span>
                                </td>
                                <td className="break-words py-2.5 pr-2 text-xs text-slate-600">{formatDate(avaliacao?.enviado_em)}</td>
                                <td className="break-words py-2.5 pr-2 text-xs text-slate-600">{formatDate(avaliacao?.respondido_em)}</td>
                                <td className="py-1.5 text-center">
                                  <QuestionnaireCopyButton token={avaliacao?.token} onCopy={copyQuestionnaireLink} compact />
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>

                      <div className="grid gap-2 pt-3 md:hidden">
                        {matriz.avaliadores.map((vinculo) => {
                          const avaliacao = vinculo.avaliacao
                          const statusLabel = avaliacao?.token
                            ? statusesAvaliacao[avaliacao.status]
                            : 'Não gerada'

                          return (
                            <article key={vinculo.id} className="min-w-0 rounded-lg border border-slate-200 bg-white p-3">
                              <div className="flex min-w-0 items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="break-words text-sm font-medium text-slate-900">{vinculo.participante?.nome ?? 'Participante removido'}</p>
                                  <p className="mt-0.5 break-all font-mono text-[11px] font-semibold text-indigo-600">{avaliacao?.codigo_operacional || '—'}</p>
                                </div>
                                <span className="inline-flex w-fit max-w-[45%] shrink-0 whitespace-normal rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200">
                                  {statusLabel}
                                </span>
                              </div>

                              <div className="mt-2 flex min-w-0 items-center justify-between gap-3 border-t border-slate-100 pt-2">
                                <p className="min-w-0 break-words text-xs text-slate-600">{categorias[vinculo.categoria]}</p>
                                <div className="flex shrink-0 items-center gap-1.5">
                                  <span className="text-[11px] font-medium text-slate-400">Questionário</span>
                                  <QuestionnaireCopyButton token={avaliacao?.token} onCopy={copyQuestionnaireLink} compact />
                                </div>
                              </div>

                              <dl className="mt-2 grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <dt className="font-medium text-slate-400">Envio</dt>
                                  <dd className="mt-0.5 text-slate-600">{formatDate(avaliacao?.enviado_em)}</dd>
                                </div>
                                <div>
                                  <dt className="font-medium text-slate-400">Resposta</dt>
                                  <dd className="mt-0.5 text-slate-600">{formatDate(avaliacao?.respondido_em)}</dd>
                                </div>
                              </dl>
                            </article>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {copyFeedback && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-xl" role="status">
          <CheckCircle2 className="h-4 w-4" />
          {copyFeedback === 'acompanhamento' ? 'Link de acompanhamento copiado.' : 'Questionário copiado.'}
        </div>
      )}

      {matrizParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="delete-matriz-title" className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-5">
              <div className="flex gap-3">
                <div className="rounded-xl bg-rose-100 p-2.5 text-rose-700"><Trash2 className="h-5 w-5" /></div>
                <div>
                  <h2 id="delete-matriz-title" className="text-lg font-bold text-slate-900">Excluir esta Matriz Relacional?</h2>
                  <p className="mt-1 text-sm text-slate-600">A exclusão só é permitida quando não existem avaliações vinculadas. Esta ação não pode ser desfeita.</p>
                </div>
              </div>
              <button type="button" onClick={() => {
                if (!deletingMatriz) {
                  setDeleteMatrizError('')
                  setMatrizParaExcluir(null)
                }
              }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Fechar confirmação">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-2 rounded-xl bg-slate-50 p-4 text-sm">
                <dt className="text-slate-500">Matriz</dt><dd className="font-mono font-semibold text-indigo-700">{matrizParaExcluir.codigo_operacional || '—'}</dd>
                <dt className="text-slate-500">Avaliado</dt><dd className="font-medium text-slate-800">{matrizParaExcluir.avaliado?.nome ?? 'Participante removido'}</dd>
                <dt className="text-slate-500">Processo</dt><dd className="font-medium text-slate-800">{matrizParaExcluir.processo?.nome ?? '-'}</dd>
              </dl>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <div className="flex gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">Impacto da exclusão</p>
                    <p className="mt-1">Somente a matriz e seus {matrizParaExcluir.avaliadores.length} vínculos de avaliadores serão removidos.</p>
                    <p className="mt-1">Avaliações, participantes, processo, empresa, consultor, créditos e histórico de créditos serão preservados.</p>
                  </div>
                </div>
              </div>

              {deleteMatrizError && (
                <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
                  {deleteMatrizError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 p-5">
              <button type="button" disabled={deletingMatriz} onClick={() => {
                setDeleteMatrizError('')
                setMatrizParaExcluir(null)
              }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">Cancelar</button>
              <button type="button" disabled={deletingMatriz} onClick={deleteMatriz} className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-wait disabled:opacity-70">
                {deletingMatriz && <Loader2 className="h-4 w-4 animate-spin" />}
                Excluir Matriz Relacional
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function QuestionnaireCopyButton({
  token,
  onCopy,
  compact = false,
}: {
  token?: string | null
  onCopy: (token?: string | null) => void
  compact?: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => onCopy(token)}
      disabled={!token}
      className={`${compact ? 'h-8 w-8' : 'h-9 w-9'} inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-slate-500`}
      aria-label="Copiar questionário"
      title="Copiar questionário"
    >
      <Copy className="h-4 w-4" />
    </button>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof UserCog; label: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-lg bg-white p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-0.5 font-medium text-slate-800">{value}</p>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Network; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <Icon className="h-5 w-5 text-indigo-600" />
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}
