import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Copy,
  Filter,
  Loader2,
  Mail,
  MessageCircle,
  Search,
  Send,
  Trash2,
  UserRoundCheck,
  X,
} from 'lucide-react'
import type {
  Avaliacao,
  CategoriaMatrizRelacional,
  Consultora,
  MatrizRelacional,
  Participante,
  Processo,
  StatusAvaliacao,
} from '@/types'
import { supabase } from '@/lib/supabase'
import {
  deletionSucceeded,
  getEvaluationLink,
  getStatusGeralAvaliacoes,
  isAvaliacaoRespondida,
  removeAvaliacoesByIds,
  type StatusGeralAvaliacao,
} from '@/lib/avaliacoes'
import {
  getEvaluationShareContent,
  getMailtoUrl,
  getWhatsappUrl,
  isValidEmail,
  normalizeInternationalWhatsapp,
} from '@/lib/manual-sharing'

export const Route = createFileRoute('/_admin/avaliacoes')({
  component: Avaliacoes,
})

type AvaliacaoComContexto = Avaliacao & {
  processo?: Processo
  matriz?: MatrizRelacional
  participanteAvaliador?: Participante
  participanteAvaliado?: Participante
  consultora?: Consultora
}

const relacoes: Record<CategoriaMatrizRelacional, string> = {
  autoavaliacao: 'Autoavaliação',
  superior: 'Superior',
  liderado: 'Liderado',
  par: 'Par',
  outro: 'Outro',
}

const statuses: Record<StatusAvaliacao, string> = {
  criada: 'Criada',
  enviada: 'Enviada',
  acessada: 'Acessada',
  em_andamento: 'Em andamento',
  respondida: 'Respondida',
  expirada: 'Expirada',
  cancelada: 'Cancelada',
}

const statusesGerais: Record<StatusGeralAvaliacao, string> = {
  sem_avaliacoes: 'Sem avaliações',
  criada: 'Criada',
  enviada: 'Enviada',
  em_andamento: 'Em andamento',
  finalizada: 'Finalizada',
}

const statusGeralClasses: Record<StatusGeralAvaliacao, string> = {
  sem_avaliacoes: 'border-slate-200 bg-white text-slate-500',
  criada: 'border-slate-200 bg-slate-100 text-slate-700',
  enviada: 'border-sky-200 bg-sky-50 text-sky-700',
  em_andamento: 'border-amber-200 bg-amber-50 text-amber-700',
  finalizada: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

type GrupoAvaliacao = {
  key: string
  matriz?: MatrizRelacional
  avaliado?: Participante
  processo?: Processo
  avaliacoes: AvaliacaoComContexto[]
  statusGeral: StatusGeralAvaliacao
}

type Feedback = { type: 'success' | 'error'; message: string }

type ExclusaoPendente = {
  matrizId: string
  avaliacoes: AvaliacaoComContexto[]
}

type ConfirmacaoEnvioPendente = {
  avaliacao: AvaliacaoComContexto
  canal: 'WhatsApp' | 'e-mail'
}

function Avaliacoes() {
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoComContexto[]>([])
  const [processos, setProcessos] = useState<Processo[]>([])
  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [matrizes, setMatrizes] = useState<MatrizRelacional[]>([])
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ codigo: '', processo: '', status: '', relacao: '' })
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [selectedByMatrix, setSelectedByMatrix] = useState<Record<string, string[]>>({})
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [exclusaoPendente, setExclusaoPendente] = useState<ExclusaoPendente | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [confirmacaoEnvioPendente, setConfirmacaoEnvioPendente] = useState<ConfirmacaoEnvioPendente | null>(null)
  const [registrandoEnvio, setRegistrandoEnvio] = useState(false)

  function toggleGroup(key: string) {
    setExpandedGroups((current) => ({ ...current, [key]: !current[key] }))
  }

  function toggleAvaliacaoSelecionada(matrizId: string, avaliacaoId: string) {
    setSelectedByMatrix((current) => {
      const selectedIds = current[matrizId] ?? []
      return {
        ...current,
        [matrizId]: selectedIds.includes(avaliacaoId)
          ? selectedIds.filter((id) => id !== avaliacaoId)
          : [...selectedIds, avaliacaoId],
      }
    })
  }

  function toggleTodasAvaliacoes(grupo: GrupoAvaliacao) {
    const visibleIds = grupo.avaliacoes.map((avaliacao) => avaliacao.id)
    const selectedIds = selectedByMatrix[grupo.key] ?? []
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id))

    setSelectedByMatrix((current) => ({
      ...current,
      [grupo.key]: allSelected
        ? selectedIds.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...selectedIds, ...visibleIds])),
    }))
  }

  function requestDeleteAvaliacoes(avaliacoesSelecionadas: AvaliacaoComContexto[]) {
    if (avaliacoesSelecionadas.length === 0) return
    const matrizId = avaliacoesSelecionadas[0].matriz_relacional_id
    if (avaliacoesSelecionadas.some((avaliacao) => avaliacao.matriz_relacional_id !== matrizId)) {
      setFeedback({ type: 'error', message: 'Selecione avaliações de uma única Matriz Relacional.' })
      return
    }
    setExclusaoPendente({
      matrizId,
      avaliacoes: avaliacoesSelecionadas,
    })
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!feedback) return
    const timeout = window.setTimeout(() => setFeedback(null), 3000)
    return () => window.clearTimeout(timeout)
  }, [feedback])

  async function loadData() {
    if (!supabase) return

    const [
      { data: avaliacoesData },
      { data: participantesData },
      { data: processosData },
      { data: matrizesData },
      { data: consultorasData },
    ] = await Promise.all([
      supabase.from('avaliacoes').select('*').order('created_at', { ascending: false }),
      supabase.from('participantes').select('*').order('nome', { ascending: true }),
      supabase.from('processos').select('*').order('created_at', { ascending: false }),
      supabase.from('matrizes_relacionais').select('*').order('created_at', { ascending: false }),
      supabase.from('consultoras').select('*').order('nome', { ascending: true }),
    ])

    const participantes = (participantesData ?? []) as Participante[]
    const processosList = (processosData ?? []) as Processo[]
    const matrizes = (matrizesData ?? []) as MatrizRelacional[]
    const consultoras = (consultorasData ?? []) as Consultora[]

    setProcessos(processosList)
    setParticipantes(participantes)
    setMatrizes(matrizes)
    setAvaliacoes(
      ((avaliacoesData ?? []) as Avaliacao[]).map((avaliacao) => ({
        ...avaliacao,
        processo: processosList.find((item) => item.id === avaliacao.processo_id),
        matriz: matrizes.find((item) => item.id === avaliacao.matriz_relacional_id),
        participanteAvaliador: participantes.find((item) => item.id === avaliacao.participante_avaliador_id),
        participanteAvaliado: participantes.find((item) => item.id === avaliacao.participante_avaliado_id),
        consultora: consultoras.find((item) => item.id === processosList.find((processo) => processo.id === avaliacao.processo_id)?.consultora_id),
      })),
    )
  }

  function getShareDetails(avaliacao: AvaliacaoComContexto) {
    const link = getEvaluationLink(avaliacao.token, window.location.origin)
    const destinatario = avaliacao.relacao === 'autoavaliacao'
      ? avaliacao.participanteAvaliado
      : avaliacao.participanteAvaliador

    if (!link || !destinatario || !avaliacao.participanteAvaliado) return null

    const content = getEvaluationShareContent({
      relacao: avaliacao.relacao,
      nomeAvaliado: avaliacao.participanteAvaliado.nome,
      nomeAvaliador: destinatario.nome,
      nomeConsultor: avaliacao.consultora?.nome || avaliacao.processo?.consultor_responsavel || 'Consultor 360',
      link,
    })

    return { destinatario, content }
  }

  function handleWhatsapp(avaliacao: AvaliacaoComContexto) {
    const details = getShareDetails(avaliacao)
    if (!details) return

    const url = getWhatsappUrl(details.destinatario.whatsapp, details.content.whatsappBody)
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
      setConfirmacaoEnvioPendente({ avaliacao, canal: 'WhatsApp' })
    }
  }

  function handleEmail(avaliacao: AvaliacaoComContexto) {
    const details = getShareDetails(avaliacao)
    if (!details) return

    const url = getMailtoUrl(details.destinatario.email, details.content.subject, details.content.emailBody)
    if (url) {
      window.location.href = url
      setConfirmacaoEnvioPendente({ avaliacao, canal: 'e-mail' })
    }
  }

  async function handleConfirmarEnvio() {
    if (!confirmacaoEnvioPendente || !supabase) {
      setFeedback({ type: 'error', message: 'Não foi possível registrar o envio.' })
      return
    }

    const { avaliacao } = confirmacaoEnvioPendente
    const enviadoEm = new Date().toISOString()
    setRegistrandoEnvio(true)

    let avaliacaoAtualizada: Pick<Avaliacao, 'id' | 'enviado_em' | 'status'> | null = null

    if (avaliacao.status === 'criada') {
      const { data, error } = await supabase
        .from('avaliacoes')
        .update({ enviado_em: enviadoEm, status: 'enviada' })
        .eq('id', avaliacao.id)
        .eq('status', 'criada')
        .select('id, enviado_em, status')

      if (error) {
        setRegistrandoEnvio(false)
        setFeedback({ type: 'error', message: 'Não foi possível registrar o envio.' })
        return
      }

      avaliacaoAtualizada = (data?.[0] as Pick<Avaliacao, 'id' | 'enviado_em' | 'status'> | undefined) ?? null
    }

    if (!avaliacaoAtualizada) {
      const { data, error } = await supabase
        .from('avaliacoes')
        .update({ enviado_em: enviadoEm })
        .eq('id', avaliacao.id)
        .select('id, enviado_em, status')
        .single()

      if (error || !data) {
        setRegistrandoEnvio(false)
        setFeedback({ type: 'error', message: 'Não foi possível registrar o envio.' })
        return
      }

      avaliacaoAtualizada = data as Pick<Avaliacao, 'id' | 'enviado_em' | 'status'>
    }

    setAvaliacoes((current) => current.map((item) => (
      item.id === avaliacaoAtualizada.id
        ? { ...item, enviado_em: avaliacaoAtualizada.enviado_em, status: avaliacaoAtualizada.status }
        : item
    )))
    setRegistrandoEnvio(false)
    setConfirmacaoEnvioPendente(null)
    setFeedback({ type: 'success', message: 'Envio registrado com sucesso.' })
  }

  async function handleCopyLink(avaliacao: AvaliacaoComContexto) {
    const link = getEvaluationLink(avaliacao.token, window.location.origin)
    if (!link) {
      setFeedback({ type: 'error', message: 'Link indisponível.' })
      return
    }

    try {
      await navigator.clipboard.writeText(link)
      setFeedback({ type: 'success', message: 'Link do questionário copiado.' })
    } catch {
      setFeedback({ type: 'error', message: 'Não foi possível copiar o link.' })
    }
  }

  async function handleDeleteAvaliacoes() {
    if (!exclusaoPendente || !supabase) {
      setFeedback({ type: 'error', message: 'Não foi possível excluir as avaliações.' })
      return
    }

    const ids = exclusaoPendente.avaliacoes.map((avaliacao) => avaliacao.id)
    setDeleting(true)
    const { error, count } = await supabase
      .from('avaliacoes')
      .delete({ count: 'exact' })
      .eq('matriz_relacional_id', exclusaoPendente.matrizId)
      .in('id', ids)

    if (!deletionSucceeded(error, count, ids.length)) {
      setDeleting(false)
      setFeedback({
        type: 'error',
        message: error?.code === '23503'
          ? 'Exclusão bloqueada por uma dependência vinculada a public.avaliacoes.id. Os dados foram preservados.'
          : 'Não foi possível excluir a avaliação. Nenhum dado foi alterado.',
      })
      return
    }

    setAvaliacoes((current) => removeAvaliacoesByIds(current, ids))
    setSelectedByMatrix((current) => ({
      ...current,
      [exclusaoPendente.matrizId]: (current[exclusaoPendente.matrizId] ?? []).filter((id) => !ids.includes(id)),
    }))
    setExclusaoPendente(null)
    setDeleting(false)
    setFeedback({
      type: 'success',
      message: ids.length === 1 ? 'Avaliação excluída.' : `${ids.length} avaliações excluídas.`,
    })
  }

  const stats = useMemo(() => {
    return {
      total: avaliacoes.length,
      pendentes: avaliacoes.filter((avaliacao) => avaliacao.status === 'criada').length,
      enviadas: avaliacoes.filter((avaliacao) => avaliacao.status === 'enviada').length,
      respondidas: avaliacoes.filter(isAvaliacaoRespondida).length,
    }
  }, [avaliacoes])

  const filteredAvaliacoes = avaliacoes.filter((avaliacao) => {
    const q = search.toLowerCase()

    if (filters.codigo && avaliacao.codigo_operacional !== filters.codigo) return false
    if (filters.processo && avaliacao.processo?.id !== filters.processo) return false
    if (filters.status && avaliacao.status !== filters.status) return false
    if (filters.relacao && avaliacao.relacao !== filters.relacao) return false
    if (
      q &&
      ![
        avaliacao.codigo_operacional,
        avaliacao.processo?.nome,
        avaliacao.processo?.codigo_operacional,
        avaliacao.processo?.empresa,
        avaliacao.participanteAvaliador?.nome,
        avaliacao.participanteAvaliado?.nome,
        relacoes[avaliacao.relacao],
        statuses[avaliacao.status],
      ].some((value) => value?.toLowerCase().includes(q))
    ) {
      return false
    }

    return true
  })

  const grupos = useMemo<GrupoAvaliacao[]>(() => {
    const hasEvaluationFilter = Boolean(filters.codigo || filters.status || filters.relacao)
    const normalizedSearch = search.trim().toLowerCase()

    return matrizes
      .filter((matriz) => !filters.processo || matriz.processo_id === filters.processo)
      .map((matriz) => {
        const processo = processos.find((item) => item.id === matriz.processo_id)
        const avaliado = participantes.find((item) => item.id === matriz.avaliado_id)
        const avaliacoesDaMatriz = filteredAvaliacoes.filter(
          (avaliacao) => avaliacao.matriz_relacional_id === matriz.id,
        )
        const matrizMatchesSearch = normalizedSearch && [
          matriz.codigo_operacional,
          avaliado?.nome,
          processo?.nome,
          processo?.codigo_operacional,
          processo?.empresa,
        ].some((value) => value?.toLowerCase().includes(normalizedSearch))

        return {
          key: matriz.id,
          matriz,
          avaliado,
          processo,
          avaliacoes: avaliacoesDaMatriz,
          statusGeral: getStatusGeralAvaliacoes(avaliacoesDaMatriz),
          visible: avaliacoesDaMatriz.length > 0 || (!hasEvaluationFilter && (!normalizedSearch || matrizMatchesSearch)),
        }
      })
      .filter((grupo) => grupo.visible)
      .sort((a, b) =>
        (a.avaliado?.nome ?? '').localeCompare(b.avaliado?.nome ?? '', 'pt-BR'),
      )
  }, [filteredAvaliacoes, filters.codigo, filters.processo, filters.relacao, filters.status, matrizes, participantes, processos, search])

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          role="status"
          className={`fixed right-5 top-5 z-50 flex max-w-sm items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
          {feedback.message}
          <button type="button" onClick={() => setFeedback(null)} className="ml-2 rounded p-1 hover:bg-black/5" aria-label="Fechar mensagem">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Avaliações</h1>
          <p className="mt-1 text-slate-500">Acompanhe as avaliações geradas a partir da Matriz Relacional.</p>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          <ClipboardCheck className="h-5 w-5 text-indigo-600" />
          {stats.total} avaliações geradas
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={ClipboardCheck} label="Total" value={stats.total.toString()} />
        <StatCard icon={Clock3} label="Pendentes" value={stats.pendentes.toString()} />
        <StatCard icon={Send} label="Enviadas" value={stats.enviadas.toString()} />
        <StatCard icon={CheckCircle2} label="Respondidas" value={stats.respondidas.toString()} />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Filter className="h-4 w-4 text-indigo-600" />
              Avaliações cadastradas
            </div>
            <div className="grid gap-3 md:grid-cols-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <select value={filters.processo} onChange={(event) => setFilters({ ...filters, processo: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">Todos os processos</option>
                {processos.map((processo) => <option key={processo.id} value={processo.id}>{processo.codigo_operacional ? `${processo.codigo_operacional} - ` : ''}{processo.nome}</option>)}
              </select>
              <select value={filters.codigo} onChange={(event) => setFilters({ ...filters, codigo: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">Todas as avaliações</option>
                {avaliacoes.map((avaliacao) => <option key={avaliacao.id} value={avaliacao.codigo_operacional ?? ''}>{avaliacao.codigo_operacional ?? 'Sem código'}</option>)}
              </select>
              <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">Todos os status</option>
                {Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <select value={filters.relacao} onChange={(event) => setFilters({ ...filters, relacao: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">Todas as relações</option>
                {Object.entries(relacoes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {grupos.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center text-slate-400">
            <ClipboardCheck className="mb-4 h-14 w-14" />
            <p className="text-lg font-medium text-slate-700">Nenhuma avaliação encontrada</p>
            <p className="mt-1 text-sm">Crie uma matriz relacional ou ajuste os filtros da lista.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            <div className="hidden grid-cols-[90px_minmax(180px,1.4fr)_minmax(150px,1fr)_minmax(130px,1fr)_90px_140px_32px] items-center gap-4 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:grid">
              <span>Matriz</span>
              <span>Avaliado</span>
              <span>Processo</span>
              <span>Empresa</span>
              <span>Total</span>
              <span>Status geral</span>
              <span />
            </div>
            {grupos.map((grupo) => {
              const expanded = expandedGroups[grupo.key] ?? false
              const selectedIds = selectedByMatrix[grupo.key] ?? []
              const selectedAvaliacoes = grupo.avaliacoes.filter((avaliacao) => selectedIds.includes(avaliacao.id))
              const allSelected = grupo.avaliacoes.length > 0 && grupo.avaliacoes.every((avaliacao) => selectedIds.includes(avaliacao.id))
              const someSelected = selectedAvaliacoes.length > 0 && !allSelected
              return (
                <div key={grupo.key}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(grupo.key)}
                    className="grid w-full gap-3 px-5 py-4 text-left hover:bg-slate-50 lg:grid-cols-[90px_minmax(180px,1.4fr)_minmax(150px,1fr)_minmax(130px,1fr)_90px_140px_32px] lg:items-center lg:gap-4"
                  >
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 lg:hidden">Matriz</span>
                      <p className="font-mono text-xs font-semibold text-indigo-600">{grupo.matriz?.codigo_operacional || '—'}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 lg:hidden">Avaliado</span>
                      <p className="truncate font-medium text-slate-900">{grupo.avaliado?.nome ?? 'Avaliado removido'}</p>
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 lg:hidden">Processo</span>
                      <p className="truncate text-sm text-slate-600">{grupo.processo?.nome ?? '-'}</p>
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 lg:hidden">Empresa</span>
                      <p className="truncate text-sm text-slate-600">{grupo.processo?.empresa || '-'}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 lg:hidden">Total</span>
                      <p className="text-sm font-medium text-slate-700">{grupo.avaliacoes.length}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 lg:hidden">Status geral</span>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusGeralClasses[grupo.statusGeral]}`}>
                        {statusesGerais[grupo.statusGeral]}
                      </span>
                    </div>
                    <div className="text-slate-400 lg:justify-self-end">
                      {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </div>
                  </button>

                  {expanded && (
                    <div className="bg-slate-50/60 px-5 pb-5">
                      <div className="flex flex-col gap-3 border-b border-slate-200 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(element) => {
                              if (element) element.indeterminate = someSelected
                            }}
                            onChange={() => toggleTodasAvaliacoes(grupo)}
                            disabled={grupo.avaliacoes.length === 0}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                          />
                          Selecionar todas
                          {selectedAvaliacoes.length > 0 && (
                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                              {selectedAvaliacoes.length} selecionada{selectedAvaliacoes.length === 1 ? '' : 's'}
                            </span>
                          )}
                        </label>
                        <button
                          type="button"
                          disabled={selectedAvaliacoes.length === 0}
                          onClick={() => requestDeleteAvaliacoes(selectedAvaliacoes)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir selecionadas
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                      <table className="w-full min-w-[1080px]">
                        <thead className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="w-10 py-3 pr-3"><span className="sr-only">Selecionar</span></th>
                            <th className="py-3 pr-5">Avaliador</th>
                            <th className="py-3 pr-5">Código</th>
                            <th className="py-3 pr-5">Relação</th>
                            <th className="py-3 pr-5">Status</th>
                            <th className="py-3 pr-5">Questionário</th>
                            <th className="py-3 pr-5">Envio</th>
                            <th className="py-3 pr-5">Resposta</th>
                            <th className="py-3">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {grupo.avaliacoes.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="py-8 text-center text-sm text-slate-500">
                                Esta matriz não possui avaliações individuais.
                              </td>
                            </tr>
                          ) : grupo.avaliacoes.map((avaliacao) => {
                            const evaluationLink = getEvaluationLink(avaliacao.token, typeof window === 'undefined' ? undefined : window.location.origin)
                            const destinatario = avaliacao.relacao === 'autoavaliacao'
                              ? avaliacao.participanteAvaliado
                              : avaliacao.participanteAvaliador
                            const whatsappValido = Boolean(evaluationLink && normalizeInternationalWhatsapp(destinatario?.whatsapp))
                            const emailValido = Boolean(evaluationLink && isValidEmail(destinatario?.email))
                            const whatsappTitle = !evaluationLink
                              ? 'Link indisponível.'
                              : whatsappValido
                                ? 'Enviar avaliação por WhatsApp'
                                : 'WhatsApp não cadastrado ou inválido.'
                            const emailTitle = !evaluationLink
                              ? 'Link indisponível.'
                              : emailValido
                                ? 'Enviar avaliação por e-mail'
                                : 'E-mail não cadastrado ou inválido.'

                            return (
                            <tr key={avaliacao.id} className="align-top">
                              <td className="py-3 pr-3">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(avaliacao.id)}
                                  onChange={() => toggleAvaliacaoSelecionada(grupo.key, avaliacao.id)}
                                  aria-label={`Selecionar avaliação ${avaliacao.codigo_operacional || avaliacao.id}`}
                                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                              </td>
                              <td className="py-3 pr-5">
                                <p className="font-medium text-slate-900">{avaliacao.participanteAvaliador?.nome ?? 'Participante removido'}</p>
                                <p className="text-sm text-slate-500">{avaliacao.participanteAvaliador?.email || '-'}</p>
                              </td>
                              <td className="py-3 pr-5 font-mono text-xs font-semibold text-indigo-600">{avaliacao.codigo_operacional || '—'}</td>
                              <td className="py-3 pr-5 text-sm text-slate-600">{relacoes[avaliacao.relacao]}</td>
                              <td className="py-3 pr-5">
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                  {statuses[avaliacao.status]}
                                </span>
                              </td>
                              <td className="py-3 pr-5">
                                <button
                                  type="button"
                                  onClick={() => handleCopyLink(avaliacao)}
                                  disabled={!evaluationLink}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                  aria-label="Copiar questionário"
                                  title="Copiar questionário"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                              </td>
                              <td className="py-3 pr-5 text-sm text-slate-600">{formatDateTime(avaliacao.enviado_em)}</td>
                              <td className="py-3 pr-5 text-sm text-slate-600">{formatDate(avaliacao.respondido_em)}</td>
                              <td className="py-3">
                                <div className="flex min-w-max items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleWhatsapp(avaliacao)}
                                    disabled={!whatsappValido}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                                    aria-label={whatsappTitle}
                                    title={whatsappTitle}
                                  >
                                    <MessageCircle className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleEmail(avaliacao)}
                                    disabled={!emailValido}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-white text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                                    aria-label={emailTitle}
                                    title={emailTitle}
                                  >
                                    <Mail className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => requestDeleteAvaliacoes([avaliacao])}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Excluir
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )})}
                        </tbody>
                      </table>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {confirmacaoEnvioPendente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmar-envio-title"
            aria-describedby="confirmar-envio-description"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl shadow-slate-950/25"
          >
            <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-6">
              <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-indigo-200/40 blur-2xl" />
              <div className="relative flex items-start gap-4">
                <div className="rounded-2xl bg-indigo-600 p-3 text-white shadow-lg shadow-indigo-200">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                    Confirmação manual
                  </p>
                  <h2 id="confirmar-envio-title" className="mt-2 text-xl font-bold text-slate-950">
                    {confirmacaoEnvioPendente.avaliacao.enviado_em
                      ? 'Reenvio concluído com sucesso?'
                      : 'Envio concluído com sucesso?'}
                  </h2>
                  <p id="confirmar-envio-description" className="mt-2 text-sm leading-6 text-slate-600">
                    Confirme somente após concluir o envio pelo {confirmacaoEnvioPendente.canal}.
                    A resposta “Não” preserva todos os dados atuais.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 p-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={registrandoEnvio}
                onClick={() => setConfirmacaoEnvioPendente(null)}
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Não
              </button>
              <button
                type="button"
                disabled={registrandoEnvio}
                onClick={handleConfirmarEnvio}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
              >
                {registrandoEnvio ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Sim
              </button>
            </div>
          </div>
        </div>
      )}

      {exclusaoPendente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="delete-avaliacao-title" className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-5">
              <div className="flex gap-3">
                <div className="rounded-xl bg-rose-100 p-2.5 text-rose-700"><Trash2 className="h-5 w-5" /></div>
                <div>
                  <h2 id="delete-avaliacao-title" className="text-lg font-bold text-slate-900">
                    {exclusaoPendente.avaliacoes.length === 1 ? 'Excluir esta avaliação?' : 'Excluir avaliações selecionadas?'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {exclusaoPendente.avaliacoes.length === 1
                      ? 'Esta ação excluirá somente esta avaliação individual.'
                      : `Esta ação excluirá somente as ${exclusaoPendente.avaliacoes.length} avaliações selecionadas.`}{' '}
                    A Matriz Relacional e seus participantes serão preservados.
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => !deleting && setExclusaoPendente(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Fechar confirmação">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <dl className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-2 rounded-xl bg-slate-50 p-4 text-sm">
                <dt className="text-slate-500">Quantidade</dt><dd className="font-semibold text-slate-900">{exclusaoPendente.avaliacoes.length}</dd>
                {exclusaoPendente.avaliacoes.length === 1 && (
                  <>
                    <dt className="text-slate-500">Avaliação</dt><dd className="font-mono font-semibold text-indigo-700">{exclusaoPendente.avaliacoes[0].codigo_operacional || '—'}</dd>
                    <dt className="text-slate-500">Avaliador</dt><dd className="font-medium text-slate-800">{exclusaoPendente.avaliacoes[0].participanteAvaliador?.nome ?? 'Participante removido'}</dd>
                    <dt className="text-slate-500">Relação</dt><dd className="text-slate-800">{relacoes[exclusaoPendente.avaliacoes[0].relacao]}</dd>
                  </>
                )}
                <dt className="text-slate-500">Avaliado</dt><dd className="font-medium text-slate-800">{exclusaoPendente.avaliacoes[0].participanteAvaliado?.nome ?? 'Participante removido'}</dd>
                <dt className="text-slate-500">Matriz</dt><dd className="font-mono font-semibold text-indigo-700">{exclusaoPendente.avaliacoes[0].matriz?.codigo_operacional || '—'}</dd>
              </dl>

              {exclusaoPendente.avaliacoes.some(isAvaliacaoRespondida) && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-semibold">
                    {exclusaoPendente.avaliacoes.filter(isAvaliacaoRespondida).length === 1
                      ? 'Há 1 avaliação respondida entre as selecionadas.'
                      : `Há ${exclusaoPendente.avaliacoes.filter(isAvaliacaoRespondida).length} avaliações respondidas entre as selecionadas.`}
                  </p>
                  <p className="mt-1">A exclusão removerá os registros selecionados. Deseja continuar?</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 p-5">
              <button type="button" disabled={deleting} onClick={() => setExclusaoPendente(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">Cancelar</button>
              <button type="button" disabled={deleting} onClick={handleDeleteAvaliacoes} className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-wait disabled:opacity-70">
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                {exclusaoPendente.avaliacoes.some(isAvaliacaoRespondida)
                  ? 'Confirmar exclusão reforçada'
                  : exclusaoPendente.avaliacoes.length === 1 ? 'Excluir avaliação' : 'Excluir selecionadas'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: typeof UserRoundCheck; label: string; value: string }) {
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
