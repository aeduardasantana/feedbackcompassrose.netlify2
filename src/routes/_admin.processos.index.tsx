import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  FolderKanban,
  Plus,
  Search,
  LayoutGrid,
  List,
  Pencil,
  Trash2,
  Eye,
  X,
  Building2,
  UserCog,
  Calendar,
  AlertTriangle,
  Link as LinkIcon,
  Copy,
  Clock,
  Shield,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { Processo, ProcessoToken, Consultora, Empresa } from '@/types'
import { getAuthHeaders } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/_admin/processos/')({
  component: ProcessosIndex,
})

type ViewMode = 'cards' | 'tabela'

const statusLabels: Record<Processo['status'], string> = {
  rascunho: 'Rascunho',
  ativo: 'Ativo',
  finalizado: 'Finalizado',
  arquivado: 'Arquivado',
}

const statusColors: Record<Processo['status'], string> = {
  rascunho: 'bg-slate-100 text-slate-700',
  ativo: 'bg-emerald-100 text-emerald-700',
  finalizado: 'bg-indigo-100 text-indigo-700',
  arquivado: 'bg-amber-100 text-amber-700',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('pt-BR')
}

function generateId() {
  return crypto.randomUUID()
}

const emptyForm = {
  nome: '',
  empresa: '',
  empresa_id: '',
  setor: '',
  consultora_id: '',
  status: 'rascunho' as Processo['status'],
  prazo: '',
  observacoes: '',
}

const emptyFilters = {
  codigo: '',
  consultora: '',
  empresa: '',
  setor: '',
  status: '' as '' | Processo['status'],
  dataInicio: '',
  dataFim: '',
}

function ProcessosIndex() {
  const [processos, setProcessos] = useState<Processo[]>([])
  const [consultoras, setConsultoras] = useState<Consultora[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState(emptyFilters)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [tokenModalOpen, setTokenModalOpen] = useState(false)
  const [editingProcesso, setEditingProcesso] = useState<Processo | null>(null)
  const [deletingProcesso, setDeletingProcesso] = useState<Processo | null>(null)
  const [viewingProcesso, setViewingProcesso] = useState<Processo | null>(null)
  const [tokenProcesso, setTokenProcesso] = useState<Processo | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    if (!supabase) return

    const [{ data: processosData }, { data: consultorasData }, { data: empresasData }] = await Promise.all([
      supabase.from('processos').select('*').order('created_at', { ascending: false }),
      supabase.from('consultoras').select('*').order('nome', { ascending: true }),
      supabase.from('empresas').select('*').order('nome', { ascending: true }),
    ])

    setProcessos((processosData ?? []) as Processo[])
    setConsultoras((consultorasData ?? []) as Consultora[])
    setEmpresas((empresasData ?? []) as Empresa[])
  }

  const uniqueEmpresas = empresas.filter((empresa) =>
    processos.some((processo) => processo.empresa_id === empresa.id || processo.empresa === empresa.nome),
  )
  const uniqueSetores = [
    ...new Set(
      empresas
        .map((empresa) => empresa.setor)
        .filter((setor): setor is string => Boolean(setor)),
    ),
  ]
  const activeConsultoras = consultoras.filter((c) => {
    return processos.some((p) => p.consultora_id === c.id)
  })

  const hasActiveFilters = filters.codigo || filters.consultora || filters.empresa || filters.setor || filters.status || filters.dataInicio || filters.dataFim
  const activeFilterCount = [filters.codigo, filters.consultora, filters.empresa, filters.setor, filters.status, filters.dataInicio, filters.dataFim].filter(Boolean).length

  const filtered = processos.filter((p) => {
    if (search) {
      const q = search.toLowerCase()
      const match =
        p.nome.toLowerCase().includes(q) ||
        (p.codigo_operacional ?? '').toLowerCase().includes(q) ||
        p.empresa.toLowerCase().includes(q) ||
        p.setor.toLowerCase().includes(q) ||
        (consultoras.find((c) => c.id === p.consultora_id)?.nome ?? '').toLowerCase().includes(q)
      if (!match) return false
    }

    if (filters.codigo && p.codigo_operacional !== filters.codigo) return false
    if (filters.consultora && p.consultora_id !== filters.consultora) return false
    if (filters.empresa && p.empresa_id !== filters.empresa && p.empresa !== empresas.find((empresa) => empresa.id === filters.empresa)?.nome) return false
    if (filters.setor && p.setor !== filters.setor) return false
    if (filters.status && p.status !== filters.status) return false
    if (filters.dataInicio && p.created_at < filters.dataInicio) return false
    if (filters.dataFim && p.created_at > filters.dataFim + 'T23:59:59') return false

    return true
  })
  const selectedConsultora = consultoras.find((consultora) => consultora.id === form.consultora_id)

  function openCreate() {
    setEditingProcesso(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(processo: Processo) {
    setEditingProcesso(processo)
    setForm({
      nome: processo.nome,
      empresa: processo.empresa,
      empresa_id: processo.empresa_id || empresas.find((empresa) => empresa.nome === processo.empresa)?.id || '',
      setor: processo.setor,
      consultora_id: processo.consultora_id || '',
      status: processo.status,
      prazo: processo.prazo ?? '',
      observacoes: processo.observacoes,
    })
    setModalOpen(true)
  }

  function openView(processo: Processo) {
    setViewingProcesso(processo)
    setViewModalOpen(true)
  }

  function openDelete(processo: Processo) {
    setDeletingProcesso(processo)
    setDeleteModalOpen(true)
  }

  function openTokens(processo: Processo) {
    setTokenProcesso(processo)
    setTokenModalOpen(true)
  }

  async function handleSave() {
    const selectedEmpresa = empresas.find((empresa) => empresa.id === form.empresa_id)
    if (!form.nome.trim() || !selectedEmpresa) return
    if (!supabase) return

    const now = new Date().toISOString()

    if (editingProcesso) {
      const { data, error } = await supabase
        .from('processos')
        .update({
          nome: form.nome.trim(),
          descricao: '',
          empresa: selectedEmpresa.nome,
          empresa_id: selectedEmpresa.id,
          setor: selectedEmpresa.setor ?? '',
          consultor_responsavel: consultoras.find((consultora) => consultora.id === selectedEmpresa.consultora_id)?.nome ?? '',
          consultora_id: selectedEmpresa.consultora_id,
          status: form.status,
          prazo: form.prazo || null,
          observacoes: form.observacoes.trim(),
          updated_at: now,
        })
        .eq('id', editingProcesso.id)
        .select()
        .single()

      if (error) return
      setProcessos(processos.map((p) => (p.id === editingProcesso.id ? (data as Processo) : p)))
    } else {
      const { data, error } = await supabase
        .from('processos')
        .insert({
          id: generateId(),
          nome: form.nome.trim(),
          descricao: '',
          empresa: selectedEmpresa.nome,
          empresa_id: selectedEmpresa.id,
          setor: selectedEmpresa.setor ?? '',
          consultor_responsavel: consultoras.find((consultora) => consultora.id === selectedEmpresa.consultora_id)?.nome ?? '',
          consultora_id: selectedEmpresa.consultora_id,
          status: form.status,
          prazo: form.prazo || null,
          observacoes: form.observacoes.trim(),
          data_inicio: null,
          data_fim: null,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single()

      if (error) return
      setProcessos([data as Processo, ...processos])
    }

    setModalOpen(false)
  }

  async function handleDelete() {
    if (!deletingProcesso) return
    if (!supabase) return

    const { count: matrizesCount } = await supabase
      .from('matrizes_relacionais')
      .select('id', { count: 'exact', head: true })
      .eq('processo_id', deletingProcesso.id)

    if ((matrizesCount ?? 0) > 0) {
      setError('Exclua primeiro as Matrizes Relacionais vinculadas.')
      setDeleteModalOpen(false)
      setDeletingProcesso(null)
      return
    }

    const { error } = await supabase.from('processos').delete().eq('id', deletingProcesso.id)
    if (error) {
      setError('Não foi possível excluir o processo. Exclua primeiro as Matrizes Relacionais vinculadas.')
      return
    }

    setError('')
    setProcessos(processos.filter((p) => p.id !== deletingProcesso.id))
    setDeleteModalOpen(false)
    setDeletingProcesso(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Processos</h1>
          <p className="text-slate-500 mt-1">
            Gerencie os processos de Feedback 360º
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Novo Processo
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar processos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
            hasActiveFilters
              ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filtros
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 bg-indigo-600 text-white text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
          {showFilters ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
        {processos.length > 0 && (
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded ${viewMode === 'cards' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('tabela')}
              className={`p-1.5 rounded ${viewMode === 'tabela' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Código operacional
              </label>
              <select
                value={filters.codigo}
                onChange={(e) => setFilters({ ...filters, codigo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Todos os códigos</option>
                {processos.map((processo) => (
                  <option key={processo.id} value={processo.codigo_operacional ?? ''}>
                    {processo.codigo_operacional ?? 'Sem código'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Consultor 360
              </label>
              <select
                value={filters.consultora}
                onChange={(e) => setFilters({ ...filters, consultora: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Todos os consultores</option>
                {activeConsultoras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Empresa
              </label>
              <select
                value={filters.empresa}
                onChange={(e) => setFilters({ ...filters, empresa: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Todas as empresas</option>
                {uniqueEmpresas.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.codigo_operacional ? `${e.codigo_operacional} - ` : ''}{e.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Setor
              </label>
              <select
                value={filters.setor}
                onChange={(e) => setFilters({ ...filters, setor: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Todos os setores</option>
                {uniqueSetores.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    status: e.target.value as '' | Processo['status'],
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Todos os status</option>
                <option value="rascunho">Rascunho</option>
                <option value="ativo">Ativo</option>
                <option value="finalizado">Finalizado</option>
                <option value="arquivado">Arquivado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Data Início
              </label>
              <input
                type="date"
                value={filters.dataInicio}
                onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Data Fim
              </label>
              <input
                type="date"
                value={filters.dataFim}
                onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              {filtered.length} de {processos.length} processos
            </p>
            {hasActiveFilters && (
              <button
                onClick={() => setFilters(emptyFilters)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
              >
                <X className="w-3 h-3" />
                Limpar Filtros
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {processos.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <FolderKanban className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium text-slate-600">
              Nenhum processo encontrado
            </p>
            <p className="text-sm mt-1">
              Crie seu primeiro processo de avaliação para começar
            </p>
            <button
              onClick={openCreate}
              className="mt-6 flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Criar Processo
            </button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Search className="w-12 h-12 mb-4" />
            <p className="text-lg font-medium text-slate-600">
              Nenhum resultado encontrado
            </p>
            <p className="text-sm mt-1">
              Tente buscar com outros termos ou ajustar os filtros
            </p>
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((processo) => (
            <ProcessoCard
              key={processo.id}
              processo={processo}
              consultoraName={consultoras.find((c) => c.id === processo.consultora_id)?.nome}
              onView={openView}
              onEdit={openEdit}
              onDelete={openDelete}
              onTokens={openTokens}
            />
          ))}
        </div>
      ) : (
        <ProcessoTable
          processos={filtered}
          consultoras={consultoras}
          onView={openView}
          onEdit={openEdit}
          onDelete={openDelete}
          onTokens={openTokens}
        />
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <Modal
          title={editingProcesso ? 'Editar Processo' : 'Novo Processo'}
          onClose={() => setModalOpen(false)}
        >
          <div className="space-y-4">
            <Field label="Nome do Processo" required>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Avaliação Anual 2026"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Empresa" required>
                <select
                  value={form.empresa_id}
                  onChange={(e) => {
                    const empresa = empresas.find((item) => item.id === e.target.value)
                    setForm({
                      ...form,
                      empresa_id: e.target.value,
                      empresa: empresa?.nome ?? '',
                      setor: empresa?.setor ?? '',
                      consultora_id: empresa?.consultora_id ?? '',
                    })
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Selecione uma empresa</option>
                  {empresas.map((empresa) => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.codigo_operacional ? `${empresa.codigo_operacional} - ` : ''}{empresa.nome}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Setor">
                <input
                  type="text"
                  value={form.setor}
                  placeholder="Ex: Tecnologia"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600"
                  readOnly
                />
              </Field>
            </div>
            <Field label="Consultor 360 Responsável">
              <input
                type="text"
                value={
                  selectedConsultora
                    ? `${selectedConsultora.nome}${selectedConsultora.empresa ? ` - ${selectedConsultora.empresa}` : ''}`
                    : 'Selecione uma empresa para carregar o consultor'
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600"
                readOnly
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Status">
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as Processo['status'],
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="rascunho">Rascunho</option>
                  <option value="ativo">Ativo</option>
                  <option value="finalizado">Finalizado</option>
                  <option value="arquivado">Arquivado</option>
                </select>
              </Field>
            </div>
            <Field label="Prazo">
              <input
                type="date"
                value={form.prazo}
                onChange={(e) => setForm({ ...form, prazo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </Field>
            <Field label="Observações">
              <textarea
                value={form.observacoes}
                onChange={(e) =>
                  setForm({ ...form, observacoes: e.target.value })
                }
                placeholder="Observações sobre o processo..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </Field>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!form.nome.trim() || !form.empresa_id}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingProcesso ? 'Salvar Alterações' : 'Criar Processo'}
            </button>
          </div>
        </Modal>
      )}

      {/* View Modal */}
      {viewModalOpen && viewingProcesso && (
        <Modal
          title="Detalhes do Processo"
          onClose={() => setViewModalOpen(false)}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {viewingProcesso.nome}
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[viewingProcesso.status]}`}
              >
                {statusLabels[viewingProcesso.status]}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DetailItem
                icon={Building2}
                label="Código"
                value={viewingProcesso.codigo_operacional || '—'}
              />
              <DetailItem
                icon={Building2}
                label="Empresa"
                value={viewingProcesso.empresa}
              />
              <DetailItem
                icon={FolderKanban}
                label="Setor"
                value={viewingProcesso.setor || '—'}
              />
              <DetailItem
                icon={UserCog}
                label="Consultor 360"
                value={consultoras.find((c) => c.id === viewingProcesso.consultora_id)?.nome || '—'}
              />
              <DetailItem
                icon={Calendar}
                label="Prazo"
                value={
                  viewingProcesso.prazo
                    ? formatDate(viewingProcesso.prazo)
                    : '—'
                }
              />
            </div>

            {viewingProcesso.observacoes && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">
                  Observações
                </p>
                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">
                  {viewingProcesso.observacoes}
                </p>
              </div>
            )}

            <div className="text-xs text-slate-400 pt-2 border-t border-slate-100">
              Criado em {formatDate(viewingProcesso.created_at)}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                setViewModalOpen(false)
                openTokens(viewingProcesso)
              }}
              className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-2"
            >
              <LinkIcon className="w-4 h-4" />
              Links de Acesso
            </button>
            <button
              onClick={() => setViewModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={() => {
                setViewModalOpen(false)
                openEdit(viewingProcesso)
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Editar
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && deletingProcesso && (
        <Modal title="Excluir Processo" onClose={() => setDeleteModalOpen(false)}>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-rose-100 rounded-lg shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-sm text-slate-700">
                Tem certeza que deseja excluir o processo{' '}
                <strong>{deletingProcesso.nome}</strong>? Esta ação não pode ser
                desfeita.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors"
            >
              Excluir
            </button>
          </div>
        </Modal>
      )}

      {/* Token Management Modal */}
      {tokenModalOpen && tokenProcesso && (
        <TokenManagementModal
          processo={tokenProcesso}
          onClose={() => setTokenModalOpen(false)}
        />
      )}
    </div>
  )
}

/* ---- Token Management ---- */

function TokenManagementModal({
  processo,
  onClose,
}: {
  processo: Processo
  onClose: () => void
}) {
  const [tokens, setTokens] = useState<ProcessoToken[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [newToken, setNewToken] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  async function loadTokens() {
    setLoading(true)
    try {
      const authHeaders = await getAuthHeaders()
      const res = await fetch(`/api/processo-tokens?processo_id=${processo.id}`, {
        headers: authHeaders,
      })
      if (res.ok) {
        const data = await res.json()
        setTokens(data)
      } else {
        setErrorMessage('Não foi possível carregar os links deste processo.')
      }
    } catch {
      setErrorMessage('Não foi possível carregar os links deste processo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerate() {
    setGenerating(true)
    setErrorMessage('')
    try {
      const authHeaders = await getAuthHeaders()
      const res = await fetch('/api/processo-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          processo_id: processo.id,
          processo: {
            nome: processo.nome,
            empresa: processo.empresa,
            setor: processo.setor,
            consultora_id: processo.consultora_id,
          },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setNewToken(data.token)
        setTokens((prev) => [
          {
            id: data.id,
            processo_id: data.processo_id,
            descricao: data.descricao,
            expires_at: data.expires_at,
            ativo: data.ativo,
            created_at: data.created_at,
          },
          ...prev,
        ])
      } else {
        const data = await res.json().catch(() => null)
        setErrorMessage(data?.error || 'Não foi possível gerar o link do processo.')
      }
    } catch {
      setErrorMessage('Não foi possível gerar o link do processo.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleRevoke(id: string) {
    try {
      const authHeaders = await getAuthHeaders()
      await fetch(`/api/processo-tokens?id=${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      setTokens((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ativo: false } : t)),
      )
    } catch {
      // API not available
    }
  }

  useEffect(() => {
    loadTokens()
  }, [])

  const publicBaseUrl = 'https://feedbackcompassrose.netlify.app'

  return (
    <Modal title="Links de Acesso" onClose={onClose} wide>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">{processo.nome}</p>
            <p className="text-xs text-slate-500">{processo.empresa}</p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs font-medium"
          >
            {generating ? (
              <Clock className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            {generating ? 'Gerando...' : 'Gerar Link'}
          </button>
        </div>

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        )}

        {newToken && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-emerald-900 mb-1">
                  Link gerado com sucesso!
                </p>
                <p className="text-xs text-emerald-700 mb-2">
                  Copie o link abaixo. O token não será exibido novamente.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white px-3 py-2 rounded border border-emerald-200 text-emerald-800 truncate">
                    {publicBaseUrl}/processo/{newToken}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${publicBaseUrl}/processo/${newToken}`,
                      )
                      setNewToken(null)
                    }}
                    className="px-3 py-2 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 transition-colors shrink-0 flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copiar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-start gap-2">
          <Shield className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
          <div className="text-xs text-indigo-700">
            <p className="font-medium mb-0.5">Acesso via link personalizado</p>
            <p>
              Cada link gerado dá acesso ao painel deste processo sem necessidade
              de login. Os tokens são criptografados e podem ter validade
              definida.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-slate-400">
            <Clock className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Carregando tokens...</span>
          </div>
        ) : tokens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <LinkIcon className="w-10 h-10 mb-3" />
            <p className="text-sm font-medium text-slate-600">
              Nenhum link gerado
            </p>
            <p className="text-xs mt-1">
              Gere um link para compartilhar o acesso a este processo
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {tokens.map((tk) => (
              <div
                key={tk.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  tk.ativo
                    ? 'bg-white border-slate-200'
                    : 'bg-slate-50 border-slate-100 opacity-60'
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg shrink-0 ${
                    tk.ativo ? 'bg-emerald-50' : 'bg-slate-100'
                  }`}
                >
                  <LinkIcon
                    className={`w-4 h-4 ${
                      tk.ativo ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {tk.descricao || 'Link de acesso'}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-slate-400">
                      Criado em {formatDateTime(tk.created_at)}
                    </span>
                    {tk.expires_at && (
                      <span className="text-xs text-amber-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expira em {formatDateTime(tk.expires_at)}
                      </span>
                    )}
                    {!tk.ativo && (
                      <span className="text-xs text-rose-600 font-medium">
                        Revogado
                      </span>
                    )}
                  </div>
                </div>
                {tk.ativo && (
                  <button
                    onClick={() => handleRevoke(tk.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                    title="Revogar token"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Fechar
        </button>
      </div>
    </Modal>
  )
}

/* ---- Sub-components ---- */

function Modal({
  title,
  children,
  onClose,
  wide,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
  wide?: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        className={`relative bg-white rounded-2xl shadow-xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto ${
          wide ? 'max-w-2xl' : 'max-w-lg'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-sm text-slate-900">{value}</p>
      </div>
    </div>
  )
}

function ProcessoCard({
  processo,
  consultoraName,
  onView,
  onEdit,
  onDelete,
  onTokens,
}: {
  processo: Processo
  consultoraName?: string
  onView: (p: Processo) => void
  onEdit: (p: Processo) => void
  onDelete: (p: Processo) => void
  onTokens: (p: Processo) => void
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-slate-900 truncate">
            {processo.nome}
          </h3>
          <p className="mt-1 font-mono text-xs font-semibold text-indigo-600">
            {processo.codigo_operacional || '—'}
          </p>
          <p className="text-sm text-slate-500 mt-0.5 truncate">
            {processo.empresa}
          </p>
        </div>
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ml-3 ${statusColors[processo.status]}`}
        >
          {statusLabels[processo.status]}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {processo.setor && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <FolderKanban className="w-3.5 h-3.5" />
            <span className="truncate">{processo.setor}</span>
          </div>
        )}
        {consultoraName && (
          <div className="flex items-center gap-2 text-sm text-indigo-500">
            <UserCog className="w-3.5 h-3.5" />
            <span className="truncate">{consultoraName}</span>
          </div>
        )}
        {processo.prazo && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(processo.prazo)}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <span className="text-xs text-slate-400">
          {formatDate(processo.created_at)}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onTokens(processo)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Links de Acesso"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onView(processo)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Visualizar"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(processo)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(processo)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Excluir"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function ProcessoTable({
  processos,
  consultoras,
  onView,
  onEdit,
  onDelete,
  onTokens,
}: {
  processos: Processo[]
  consultoras: Consultora[]
  onView: (p: Processo) => void
  onEdit: (p: Processo) => void
  onDelete: (p: Processo) => void
  onTokens: (p: Processo) => void
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                Código
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                Processo
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                Empresa
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">
                Setor
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 hidden xl:table-cell">
                Consultor 360
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">
                Prazo
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">
                Status
              </th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {processos.map((processo) => (
              <tr
                key={processo.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
              >
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-semibold text-indigo-600">
                    {processo.codigo_operacional || '—'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-slate-900">
                    {processo.nome}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {processo.empresa}
                </td>
                <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                  {processo.setor || '—'}
                </td>
                <td className="px-4 py-3 text-indigo-600 hidden xl:table-cell">
                  {consultoras.find((c) => c.id === processo.consultora_id)?.nome || '—'}
                </td>
                <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">
                  {processo.prazo ? formatDate(processo.prazo) : '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[processo.status]}`}
                  >
                    {statusLabels[processo.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onTokens(processo)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Links de Acesso"
                    >
                      <LinkIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onView(processo)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Visualizar"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(processo)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(processo)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
