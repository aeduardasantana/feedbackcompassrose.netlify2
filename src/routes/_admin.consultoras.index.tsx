import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  UserCircle,
  Plus,
  Search,
  Pencil,
  Eye,
  X,
  Coins,
  History,
  FolderKanban,
  Mail,
  Phone,
  Building2,
  MapPin,
  FileText,
  Power,
  PowerOff,
  ArrowUpCircle,
  ArrowDownCircle,
  MinusCircle,
  Trash2,
} from 'lucide-react'
import type { Consultora, CreditoHistorico, Processo } from '@/types'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/_admin/consultoras/')({
  component: ConsultorasIndex,
})

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
  email: '',
  whatsapp: '',
  empresa: '',
  cpf_cnpj: '',
  cidade: '',
  estado: '',
  observacoes: '',
}

function ConsultorasIndex() {
  const [consultoras, setConsultoras] = useState<Consultora[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 'ativa' | 'inativa'>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingConsultora, setEditingConsultora] = useState<Consultora | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewingConsultora, setViewingConsultora] = useState<Consultora | null>(null)
  const [creditModalOpen, setCreditModalOpen] = useState(false)
  const [creditConsultora, setCreditConsultora] = useState<Consultora | null>(null)
  const [historicoModalOpen, setHistoricoModalOpen] = useState(false)
  const [historicoConsultora, setHistoricoConsultora] = useState<Consultora | null>(null)
  const [processosModalOpen, setProcessosModalOpen] = useState(false)
  const [processosConsultora, setProcessosConsultora] = useState<Consultora | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [historico, setHistorico] = useState<CreditoHistorico[]>([])
  const [processos, setProcessos] = useState<Processo[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    if (!supabase) return

    const [{ data: consultorasData }, { data: historicoData }, { data: processosData }] = await Promise.all([
      supabase.from('consultoras').select('*').order('created_at', { ascending: false }),
      supabase.from('creditos_historico').select('*').order('created_at', { ascending: false }),
      supabase.from('processos').select('*').order('created_at', { ascending: false }),
    ])

    setConsultoras((consultorasData ?? []) as Consultora[])
    setHistorico((historicoData ?? []) as CreditoHistorico[])
    setProcessos((processosData ?? []) as Processo[])
  }

  const filtered = consultoras.filter((c) => {
    if (search) {
      const q = search.toLowerCase()
      const match =
        c.nome.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.empresa.toLowerCase().includes(q) ||
        (c.cpf_cnpj ?? '').toLowerCase().includes(q) ||
        (c.cidade ?? '').toLowerCase().includes(q) ||
        (c.estado ?? '').toLowerCase().includes(q) ||
        c.whatsapp.includes(q)
      if (!match) return false
    }
    if (statusFilter && c.status !== statusFilter) return false
    return true
  })

  function openCreate() {
    setError('')
    setEditingConsultora(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(consultora: Consultora) {
    setError('')
    setEditingConsultora(consultora)
    setForm({
      nome: consultora.nome,
      email: consultora.email,
      whatsapp: consultora.whatsapp,
      empresa: consultora.empresa,
      cpf_cnpj: consultora.cpf_cnpj ?? '',
      cidade: consultora.cidade ?? '',
      estado: consultora.estado ?? '',
      observacoes: consultora.observacoes ?? '',
    })
    setModalOpen(true)
  }

  function openView(consultora: Consultora) {
    setViewingConsultora(consultora)
    setViewModalOpen(true)
  }

  function openCredits(consultora: Consultora) {
    setCreditConsultora(consultora)
    setCreditModalOpen(true)
  }

  function openHistorico(consultora: Consultora) {
    setHistoricoConsultora(consultora)
    setHistoricoModalOpen(true)
  }

  function openProcessos(consultora: Consultora) {
    setProcessosConsultora(consultora)
    setProcessosModalOpen(true)
  }

  async function toggleStatus(consultora: Consultora) {
    if (!supabase) return

    const { data, error } = await supabase
      .from('consultoras')
      .update({
        status: (consultora.status === 'ativa' ? 'inativa' : 'ativa') as Consultora['status'],
        updated_at: new Date().toISOString(),
      })
      .eq('id', consultora.id)
      .select()
      .single()

    if (error) return
    setConsultoras(consultoras.map((c) => (c.id === consultora.id ? (data as Consultora) : c)))
  }

  async function deleteConsultora(consultora: Consultora) {
    if (!supabase) return

    const [{ count: empresasCount, error: empresasError }, { count: historicoCount, error: historicoError }, { count: processosCount, error: processosError }] =
      await Promise.all([
        supabase.from('empresas').select('id', { count: 'exact', head: true }).eq('consultora_id', consultora.id),
        supabase.from('creditos_historico').select('id', { count: 'exact', head: true }).eq('consultora_id', consultora.id),
        supabase.from('processos').select('id', { count: 'exact', head: true }).eq('consultora_id', consultora.id),
      ])

    if (empresasError || historicoError || processosError) {
      setError('Não foi possível verificar os vínculos do consultor.')
      return
    }

    if (
      (empresasCount ?? 0) > 0 ||
      consultora.saldo_creditos > 0 ||
      (historicoCount ?? 0) > 0 ||
      (processosCount ?? 0) > 0
    ) {
      setError('Exclua primeiro as Empresas vinculadas.')
      return
    }

    if (!window.confirm('Tem certeza que deseja excluir este consultor?')) return

    const { error: deleteError } = await supabase.from('consultoras').delete().eq('id', consultora.id)
    if (deleteError) {
      setError('Exclua primeiro as Empresas vinculadas.')
      return
    }

    setError('')
    setConsultoras(consultoras.filter((item) => item.id !== consultora.id))
  }

  async function handleSave() {
    if (!form.nome.trim() || !form.email.trim()) return
    if (!supabase) return

    const now = new Date().toISOString()

    if (editingConsultora) {
      const { data, error } = await supabase
        .from('consultoras')
        .update({
          nome: form.nome.trim(),
          email: form.email.trim(),
          whatsapp: form.whatsapp.trim(),
          empresa: form.empresa.trim(),
          cpf_cnpj: form.cpf_cnpj.trim() || null,
          cidade: form.cidade.trim() || null,
          estado: form.estado.trim() || null,
          observacoes: form.observacoes.trim() || null,
          updated_at: now,
        })
        .eq('id', editingConsultora.id)
        .select()
        .single()

      if (error) return
      setConsultoras(consultoras.map((c) => (c.id === editingConsultora.id ? (data as Consultora) : c)))
    } else {
      const { data, error } = await supabase
        .from('consultoras')
        .insert({
          id: generateId(),
          nome: form.nome.trim(),
          email: form.email.trim(),
          whatsapp: form.whatsapp.trim(),
          empresa: form.empresa.trim(),
          cpf_cnpj: form.cpf_cnpj.trim() || null,
          cidade: form.cidade.trim() || null,
          estado: form.estado.trim() || null,
          observacoes: form.observacoes.trim() || null,
          saldo_creditos: 0,
          status: 'ativa',
          created_at: now,
          updated_at: now,
        })
        .select()
        .single()

      if (error) return
      setConsultoras([data as Consultora, ...consultoras])
    }

    setModalOpen(false)
  }

  async function handleCreditUpdate(consultora: Consultora, tipo: 'adicao' | 'remocao', quantidade: number, descricao: string) {
    if (quantidade <= 0) return
    if (tipo === 'remocao' && quantidade > consultora.saldo_creditos) return
    if (!supabase) return

    const saldoAnterior = consultora.saldo_creditos
    const saldoPosterior = tipo === 'adicao' ? saldoAnterior + quantidade : saldoAnterior - quantidade
    const now = new Date().toISOString()

    const { data: updatedConsultora, error: consultoraError } = await supabase
      .from('consultoras')
      .update({ saldo_creditos: saldoPosterior, updated_at: now })
      .eq('id', consultora.id)
      .select()
      .single()

    if (consultoraError) return

    const { data: novoRegistro, error: historicoError } = await supabase
      .from('creditos_historico')
      .insert({
        id: generateId(),
        consultora_id: consultora.id,
        tipo,
        quantidade,
        saldo_anterior: saldoAnterior,
        saldo_posterior: saldoPosterior,
        descricao: descricao.trim() || (tipo === 'adicao' ? 'Adição de créditos' : 'Remoção de créditos'),
        processo_id: null,
        created_at: now,
      })
      .select()
      .single()

    if (historicoError) return

    const nextConsultora = updatedConsultora as Consultora
    setConsultoras(consultoras.map((c) => (c.id === consultora.id ? nextConsultora : c)))
    setHistorico([novoRegistro as CreditoHistorico, ...historico])
    setCreditConsultora(nextConsultora)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Consultor 360</h1>
          <p className="text-slate-500 mt-1">
            Gerencie os consultores e seus créditos
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Novo Consultor
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail, empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as '' | 'ativa' | 'inativa')}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">Todos os status</option>
          <option value="ativa">Ativos</option>
          <option value="inativa">Inativos</option>
        </select>
      </div>

      {consultoras.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <UserCircle className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium text-slate-600">
              Nenhum consultor cadastrado
            </p>
            <p className="text-sm mt-1">
              Cadastre o primeiro consultor para começar
            </p>
            <button
              onClick={openCreate}
              className="mt-6 flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Cadastrar Consultor
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
              Tente buscar com outros termos
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Consultor</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">E-mail</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">Empresa</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Créditos</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((consultora) => (
                  <tr
                    key={consultora.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-indigo-600">
                            {consultora.nome.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-slate-900">{consultora.nome}</span>
                          <p className="text-xs text-slate-400 md:hidden">{consultora.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{consultora.email}</td>
                    <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">{consultora.empresa || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        consultora.saldo_creditos > 0
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                        <Coins className="w-3 h-3" />
                        {consultora.saldo_creditos}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        consultora.status === 'ativa'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {consultora.status === 'ativa' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openView(consultora)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(consultora)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openCredits(consultora)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Gerenciar Créditos"
                        >
                          <Coins className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openHistorico(consultora)}
                          className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                          title="Histórico de Créditos"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openProcessos(consultora)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Processos Vinculados"
                        >
                          <FolderKanban className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleStatus(consultora)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            consultora.status === 'ativa'
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={consultora.status === 'ativa' ? 'Inativar' : 'Ativar'}
                        >
                          {consultora.status === 'ativa' ? (
                            <PowerOff className="w-4 h-4" />
                          ) : (
                            <Power className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteConsultora(consultora)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Excluir"
                          aria-label="Excluir consultor"
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
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
            {filtered.length} de {consultoras.length} consultor{consultoras.length !== 1 ? 'es' : ''}
          </div>
        </div>
      )}

      {modalOpen && (
        <Modal
          title={editingConsultora ? 'Editar Consultor' : 'Novo Consultor'}
          onClose={() => setModalOpen(false)}
        >
          <div className="space-y-4">
            <Field label="Nome" required>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Nome completo"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </Field>
            <Field label="E-mail" required>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@exemplo.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="WhatsApp">
                <input
                  type="text"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  placeholder="+5511999999999"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  Formato internacional com DDI. Exemplo: +5511999999999
                </p>
              </Field>
              <Field label="Empresa / Identificação Profissional">
                <input
                  type="text"
                  value={form.empresa}
                  onChange={(e) => setForm({ ...form, empresa: e.target.value })}
                  placeholder="Nome da empresa ou identificação"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="CPF ou CNPJ">
                <input
                  type="text"
                  value={form.cpf_cnpj}
                  onChange={(e) => setForm({ ...form, cpf_cnpj: e.target.value })}
                  placeholder="Opcional"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </Field>
              <Field label="Cidade">
                <input
                  type="text"
                  value={form.cidade}
                  onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                  placeholder="Opcional"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </Field>
            </div>
            <Field label="Estado">
              <input
                type="text"
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                placeholder="UF ou estado"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </Field>
            <Field label="Observações">
              <textarea
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Informações complementares"
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
              disabled={!form.nome.trim() || !form.email.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingConsultora ? 'Salvar Alterações' : 'Cadastrar'}
            </button>
          </div>
        </Modal>
      )}

      {viewModalOpen && viewingConsultora && (
        <Modal title="Detalhes do Consultor" onClose={() => setViewModalOpen(false)}>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-xl font-bold text-indigo-600">
                  {viewingConsultora.nome.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{viewingConsultora.nome}</h3>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                  viewingConsultora.status === 'ativa'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {viewingConsultora.status === 'ativa' ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DetailItem icon={Mail} label="E-mail" value={viewingConsultora.email} />
              <DetailItem icon={Phone} label="WhatsApp" value={viewingConsultora.whatsapp || '—'} />
              <DetailItem icon={Building2} label="Empresa" value={viewingConsultora.empresa || '—'} />
              <DetailItem icon={FileText} label="CPF/CNPJ" value={viewingConsultora.cpf_cnpj || '—'} />
              <DetailItem icon={MapPin} label="Cidade/Estado" value={[viewingConsultora.cidade, viewingConsultora.estado].filter(Boolean).join(' / ') || '—'} />
              <DetailItem icon={Coins} label="Saldo de Créditos" value={viewingConsultora.saldo_creditos.toString()} />
            </div>
            {viewingConsultora.observacoes && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Observações</p>
                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{viewingConsultora.observacoes}</p>
              </div>
            )}

            <div className="text-xs text-slate-400 pt-2 border-t border-slate-100">
              Cadastrado em {formatDate(viewingConsultora.created_at)}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                setViewModalOpen(false)
                openCredits(viewingConsultora)
              }}
              className="px-4 py-2 text-sm font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-2"
            >
              <Coins className="w-4 h-4" />
              Créditos
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
                openEdit(viewingConsultora)
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Editar
            </button>
          </div>
        </Modal>
      )}

      {creditModalOpen && creditConsultora && (
        <CreditManagementModal
          consultora={creditConsultora}
          onClose={() => setCreditModalOpen(false)}
          onUpdate={(tipo, quantidade, descricao) => {
            handleCreditUpdate(creditConsultora, tipo, quantidade, descricao)
          }}
        />
      )}

      {historicoModalOpen && historicoConsultora && (
        <HistoricoModal
          consultora={historicoConsultora}
          historico={historico}
          processos={processos}
          onClose={() => setHistoricoModalOpen(false)}
        />
      )}

      {processosModalOpen && processosConsultora && (
        <ProcessosVinculadosModal
          consultora={processosConsultora}
          processos={processos}
          onClose={() => setProcessosModalOpen(false)}
        />
      )}
    </div>
  )
}

function CreditManagementModal({
  consultora,
  onClose,
  onUpdate,
}: {
  consultora: Consultora
  onClose: () => void
  onUpdate: (tipo: 'adicao' | 'remocao', quantidade: number, descricao: string) => void
}) {
  const [tipo, setTipo] = useState<'adicao' | 'remocao'>('adicao')
  const [quantidade, setQuantidade] = useState('')
  const [descricao, setDescricao] = useState('')
  const [saldo, setSaldo] = useState(consultora.saldo_creditos)

  useEffect(() => {
    setSaldo(consultora.saldo_creditos)
  }, [consultora.saldo_creditos])

  const qtd = parseInt(quantidade) || 0
  const isValid = qtd > 0 && (tipo === 'adicao' || qtd <= saldo)

  function handleSubmit() {
    if (!isValid) return
    onUpdate(tipo, qtd, descricao)
    setSaldo(tipo === 'adicao' ? saldo + qtd : saldo - qtd)
    setQuantidade('')
    setDescricao('')
  }

  return (
    <Modal title="Gerenciar Créditos" onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-slate-50 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">{consultora.nome}</p>
            <p className="text-xs text-slate-500">{consultora.email}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">{saldo}</p>
            <p className="text-xs text-slate-500">créditos</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setTipo('adicao')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tipo === 'adicao'
                ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            Adicionar
          </button>
          <button
            onClick={() => setTipo('remocao')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tipo === 'remocao'
                ? 'bg-rose-100 text-rose-700 border-2 border-rose-300'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            Remover
          </button>
        </div>

        <Field label="Quantidade" required>
          <input
            type="number"
            min="1"
            max={tipo === 'remocao' ? saldo : undefined}
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            placeholder="Ex: 10"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {tipo === 'remocao' && qtd > saldo && (
            <p className="text-xs text-rose-500 mt-1">Saldo insuficiente</p>
          )}
        </Field>

        <Field label="Descrição">
          <input
            type="text"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder={tipo === 'adicao' ? 'Ex: Compra de pacote de créditos' : 'Ex: Ajuste administrativo'}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </Field>

        {isValid && (
          <div className={`rounded-lg p-3 text-sm ${
            tipo === 'adicao' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}>
            Novo saldo: <strong>{tipo === 'adicao' ? saldo + qtd : saldo - qtd}</strong> créditos
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Fechar
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            tipo === 'adicao'
              ? 'bg-emerald-600 hover:bg-emerald-700'
              : 'bg-rose-600 hover:bg-rose-700'
          }`}
        >
          {tipo === 'adicao' ? 'Adicionar Créditos' : 'Remover Créditos'}
        </button>
      </div>
    </Modal>
  )
}

function HistoricoModal({
  consultora,
  historico,
  processos,
  onClose,
}: {
  consultora: Consultora
  historico: CreditoHistorico[]
  processos: Processo[]
  onClose: () => void
}) {
  const historicoConsultora = historico.filter((h) => h.consultora_id === consultora.id)

  return (
    <Modal title="Histórico de Créditos" onClose={onClose} wide>
      <div className="space-y-4">
        <div className="bg-slate-50 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">{consultora.nome}</p>
            <p className="text-xs text-slate-500">{consultora.email}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">{consultora.saldo_creditos}</p>
            <p className="text-xs text-slate-500">saldo atual</p>
          </div>
        </div>

        {historicoConsultora.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <History className="w-10 h-10 mb-3" />
            <p className="text-sm font-medium text-slate-600">Nenhum registro encontrado</p>
            <p className="text-xs mt-1">O histórico aparecerá aqui conforme os créditos forem movimentados</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {historicoConsultora.map((h) => {
              const processo = h.processo_id ? processos.find((p) => p.id === h.processo_id) : null
              return (
                <div key={h.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100">
                  <div className={`p-1.5 rounded-lg shrink-0 ${
                    h.tipo === 'adicao' ? 'bg-emerald-50' : h.tipo === 'consumo' ? 'bg-amber-50' : 'bg-rose-50'
                  }`}>
                    {h.tipo === 'adicao' ? (
                      <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
                    ) : h.tipo === 'consumo' ? (
                      <MinusCircle className="w-4 h-4 text-amber-600" />
                    ) : (
                      <ArrowDownCircle className="w-4 h-4 text-rose-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{h.descricao}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">{formatDateTime(h.created_at)}</span>
                      {processo && (
                        <span className="text-xs text-indigo-500">• {processo.nome}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-semibold ${
                      h.tipo === 'adicao' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {h.tipo === 'adicao' ? '+' : '-'}{h.quantidade}
                    </p>
                    <p className="text-xs text-slate-400">Saldo: {h.saldo_posterior}</p>
                  </div>
                </div>
              )
            })}
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

function ProcessosVinculadosModal({
  consultora,
  processos,
  onClose,
}: {
  consultora: Consultora
  processos: Processo[]
  onClose: () => void
}) {
  const processosConsultora = processos.filter((p) => p.consultora_id === consultora.id)

  const statusLabels: Record<string, string> = {
    rascunho: 'Rascunho',
    ativo: 'Ativo',
    finalizado: 'Finalizado',
    arquivado: 'Arquivado',
  }

  const statusColors: Record<string, string> = {
    rascunho: 'bg-slate-100 text-slate-700',
    ativo: 'bg-emerald-100 text-emerald-700',
    finalizado: 'bg-indigo-100 text-indigo-700',
    arquivado: 'bg-amber-100 text-amber-700',
  }

  return (
    <Modal title="Processos Vinculados" onClose={onClose} wide>
      <div className="space-y-4">
        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-sm font-medium text-slate-900">{consultora.nome}</p>
          <p className="text-xs text-slate-500">{processosConsultora.length} processo{processosConsultora.length !== 1 ? 's' : ''} vinculado{processosConsultora.length !== 1 ? 's' : ''}</p>
        </div>

        {processosConsultora.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <FolderKanban className="w-10 h-10 mb-3" />
            <p className="text-sm font-medium text-slate-600">Nenhum processo vinculado</p>
            <p className="text-xs mt-1">Os processos vinculados a este consultor aparecerão aqui</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {processosConsultora.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{p.nome}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {p.empresa} {p.setor ? `· ${p.setor}` : ''}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDate(p.created_at)}</p>
                </div>
                <span className={`ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusColors[p.status] || 'bg-slate-100 text-slate-700'}`}>
                  {statusLabels[p.status] || p.status}
                </span>
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
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
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
