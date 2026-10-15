import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  Building2,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  UserCog,
  X,
} from 'lucide-react'
import type { Consultora, Empresa } from '@/types'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/_admin/empresas')({
  component: Empresas,
})

const emptyForm = {
  nome: '',
  cnpj: '',
  setor: '',
  responsavel: '',
  email: '',
  telefone: '',
  endereco: '',
  consultora_id: '',
}

function generateId() {
  return crypto.randomUUID()
}

function Empresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [consultoras, setConsultoras] = useState<Consultora[]>([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    if (!supabase) return

    const [{ data: empresasData }, { data: consultorasData }] = await Promise.all([
      supabase.from('empresas').select('*').order('nome', { ascending: true }),
      supabase.from('consultoras').select('*').order('nome', { ascending: true }),
    ])

    setEmpresas((empresasData ?? []) as Empresa[])
    setConsultoras((consultorasData ?? []) as Consultora[])
  }

  const filteredEmpresas = empresas.filter((empresa) => {
    const consultoraNome =
      consultoras.find((consultora) => consultora.id === empresa.consultora_id)?.nome ?? ''
    const q = search.toLowerCase()

    return (
      empresa.nome.toLowerCase().includes(q) ||
      (empresa.codigo_operacional ?? '').toLowerCase().includes(q) ||
      (empresa.cnpj ?? '').toLowerCase().includes(q) ||
      (empresa.setor ?? '').toLowerCase().includes(q) ||
      (empresa.responsavel ?? '').toLowerCase().includes(q) ||
      consultoraNome.toLowerCase().includes(q)
    )
  })

  function openCreate() {
    setEditingEmpresa(null)
    setForm(emptyForm)
    setError('')
    setModalOpen(true)
  }

  function openEdit(empresa: Empresa) {
    setEditingEmpresa(empresa)
    setForm({
      nome: empresa.nome,
      cnpj: empresa.cnpj ?? '',
      setor: empresa.setor ?? '',
      responsavel: empresa.responsavel ?? '',
      email: empresa.email ?? '',
      telefone: empresa.telefone ?? '',
      endereco: empresa.endereco ?? '',
      consultora_id: empresa.consultora_id,
    })
    setError('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingEmpresa(null)
    setForm(emptyForm)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.nome.trim() || !form.consultora_id) {
      setError('Preencha o nome e selecione um Consultor 360.')
      return
    }
    if (!supabase) return

    const now = new Date().toISOString()
    const empresaPayload = {
      nome: form.nome.trim(),
      cnpj: form.cnpj.trim() || null,
      setor: form.setor.trim() || null,
      responsavel: form.responsavel.trim() || null,
      email: form.email.trim() || null,
      telefone: form.telefone.trim() || null,
      endereco: form.endereco.trim() || null,
      consultora_id: form.consultora_id,
    }

    if (editingEmpresa) {
      const { data, error: updateError } = await supabase
        .from('empresas')
        .update({ ...empresaPayload, updated_at: now })
        .eq('id', editingEmpresa.id)
        .select()
        .single()

      if (updateError) {
        setError('Não foi possível salvar a empresa.')
        return
      }

      setEmpresas(empresas.map((empresa) => (empresa.id === editingEmpresa.id ? (data as Empresa) : empresa)))
      closeModal()
      return
    }

    const { data, error: insertError } = await supabase
      .from('empresas')
      .insert({
        id: generateId(),
        ...empresaPayload,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    if (insertError) {
      setError('Não foi possível salvar a empresa.')
      return
    }

    setEmpresas([data as Empresa, ...empresas])
    closeModal()
  }

  async function deleteEmpresa(id: string) {
    if (!supabase) return

    const [{ count: processosCount }, { count: participantesCount }] = await Promise.all([
      supabase.from('processos').select('id', { count: 'exact', head: true }).eq('empresa_id', id),
      supabase.from('participantes').select('id', { count: 'exact', head: true }).eq('empresa_id', id),
    ])

    if ((processosCount ?? 0) > 0 || (participantesCount ?? 0) > 0) {
      setError('Exclua primeiro os Processos e Participantes vinculados.')
      return
    }

    if (!window.confirm('Tem certeza que deseja excluir esta empresa?')) return

    const { error: deleteError } = await supabase.from('empresas').delete().eq('id', id)
    if (deleteError) {
      setError('Exclua primeiro os Processos e Participantes vinculados.')
      return
    }

    setError('')
    setEmpresas(empresas.filter((empresa) => empresa.id !== id))
  }

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Empresas</h1>
          <p className="text-slate-500 mt-1">Gerencie as empresas atendidas pelos Consultores 360</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nova Empresa
        </button>
      </div>

      {error && !modalOpen && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código, nome, CNPJ, setor ou consultor"
              className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {filteredEmpresas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center text-slate-400">
            <Building2 className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium text-slate-600">Nenhuma empresa cadastrada</p>
            <p className="text-sm mt-1">Adicione empresas para vinculá-las a processos e participantes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Empresa</th>
                  <th className="px-5 py-3">Código</th>
                  <th className="px-5 py-3">Contato</th>
                  <th className="px-5 py-3">Consultor 360</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredEmpresas.map((empresa) => {
                  const consultora = consultoras.find((item) => item.id === empresa.consultora_id)

                  return (
                    <tr key={empresa.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{empresa.nome}</p>
                            <p className="text-sm text-slate-500">{empresa.setor || empresa.cnpj || 'Sem segmento informado'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-sm font-medium text-slate-700">
                        {empresa.codigo_operacional || '—'}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-slate-400" />
                            {empresa.email || '—'}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-slate-400" />
                            {empresa.telefone || '—'}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <UserCog className="h-4 w-4 text-indigo-500" />
                          {consultora?.nome || '—'}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(empresa)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                            aria-label="Editar empresa"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteEmpresa(empresa.id)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                            aria-label="Remover empresa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {editingEmpresa ? 'Editar empresa' : 'Nova empresa'}
                </h2>
                <p className="text-sm text-slate-500">
                  {editingEmpresa?.codigo_operacional
                    ? `Código operacional: ${editingEmpresa.codigo_operacional}`
                    : 'Cadastre a empresa e o Consultor 360 responsável.'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Nome</span>
                  <input
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Consultor 360</span>
                  <select
                    value={form.consultora_id}
                    onChange={(e) => setForm({ ...form, consultora_id: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecione um consultor</option>
                    {consultoras.filter((consultora) => consultora.status === 'ativa').map((consultora) => (
                      <option key={consultora.id} value={consultora.id}>
                        {consultora.nome} — {consultora.email}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">CNPJ</span>
                  <input
                    value={form.cnpj}
                    onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Setor/segmento</span>
                  <input
                    value={form.setor}
                    onChange={(e) => setForm({ ...form, setor: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Responsável</span>
                  <input
                    value={form.responsavel}
                    onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">E-mail</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Telefone</span>
                  <input
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Endereço</span>
                  <input
                    value={form.endereco}
                    onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                >
                  Salvar empresa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
