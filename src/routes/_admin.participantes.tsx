import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  BriefcaseBusiness,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import type { Empresa, Participante } from '@/types'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/_admin/participantes')({
  component: Participantes,
})

const emptyForm = {
  nome: '',
  email: '',
  whatsapp: '',
  cargo: '',
  empresa_id: '',
}

function generateId() {
  return crypto.randomUUID()
}

function Participantes() {
  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingParticipante, setEditingParticipante] =
    useState<Participante | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    if (!supabase) return

    const [{ data: participantesData }, { data: empresasData }] = await Promise.all([
      supabase.from('participantes').select('*').order('created_at', { ascending: false }),
      supabase.from('empresas').select('*').order('nome', { ascending: true }),
    ])

    setParticipantes((participantesData ?? []) as Participante[])
    setEmpresas((empresasData ?? []) as Empresa[])
  }

  const filteredParticipantes = participantes.filter((participante) => {
    const q = search.toLowerCase()

    return (
      participante.nome.toLowerCase().includes(q) ||
      participante.email.toLowerCase().includes(q) ||
      participante.whatsapp.toLowerCase().includes(q) ||
      participante.cargo.toLowerCase().includes(q) ||
      (empresas.find((empresa) => empresa.id === participante.empresa_id)?.codigo_operacional ?? '').toLowerCase().includes(q) ||
      (empresas.find((empresa) => empresa.id === participante.empresa_id)?.nome ?? '').toLowerCase().includes(q)
    )
  })

  function openCreate() {
    setEditingParticipante(null)
    setForm(emptyForm)
    setError('')
    setModalOpen(true)
  }

  function openEdit(participante: Participante) {
    setEditingParticipante(participante)
    setForm({
      nome: participante.nome,
      email: participante.email,
      whatsapp: participante.whatsapp,
      cargo: participante.cargo,
      empresa_id: participante.empresa_id ?? '',
    })
    setError('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingParticipante(null)
    setForm(emptyForm)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.nome.trim() || !form.empresa_id) {
      setError('Preencha o nome e selecione uma empresa para salvar o participante.')
      return
    }
    if (!supabase) return

    const now = new Date().toISOString()
    const participantePayload = {
      nome: form.nome.trim(),
      email: form.email.trim(),
      whatsapp: form.whatsapp.trim(),
      cargo: form.cargo.trim(),
      empresa_id: form.empresa_id,
    }

    if (editingParticipante) {
      const { data, error: updateError } = await supabase
        .from('participantes')
        .update({
          ...participantePayload,
          updated_at: now,
        })
        .eq('id', editingParticipante.id)
        .select()
        .single()

      if (updateError) {
        setError('Não foi possível salvar o participante.')
        return
      }

      setParticipantes(
        participantes.map((participante) =>
          participante.id === editingParticipante.id ? (data as Participante) : participante,
        ),
      )
      closeModal()
      return
    }

    const { data, error: insertError } = await supabase
      .from('participantes')
      .insert({
        id: generateId(),
        ...participantePayload,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    if (insertError) {
      setError('Não foi possível salvar o participante.')
      return
    }

    setParticipantes([data as Participante, ...participantes])
    closeModal()
  }

  async function deleteParticipante(id: string) {
    if (!supabase) return

    const [{ count: matrizesComoAvaliado }, { count: vinculosComoAvaliador }, { count: avaliacoesComoAvaliado }, { count: avaliacoesComoAvaliador }] =
      await Promise.all([
        supabase.from('matrizes_relacionais').select('id', { count: 'exact', head: true }).eq('avaliado_id', id),
        supabase.from('matrizes_relacionais_avaliadores').select('id', { count: 'exact', head: true }).eq('participante_id', id),
        supabase.from('avaliacoes').select('id', { count: 'exact', head: true }).eq('participante_avaliado_id', id),
        supabase.from('avaliacoes').select('id', { count: 'exact', head: true }).eq('participante_avaliador_id', id),
      ])

    if (
      (matrizesComoAvaliado ?? 0) > 0 ||
      (vinculosComoAvaliador ?? 0) > 0 ||
      (avaliacoesComoAvaliado ?? 0) > 0 ||
      (avaliacoesComoAvaliador ?? 0) > 0
    ) {
      setError('Exclua primeiro as Matrizes Relacionais relacionadas a este participante.')
      return
    }

    if (!window.confirm('Tem certeza que deseja excluir este participante?')) return

    const { error: deleteError } = await supabase.from('participantes').delete().eq('id', id)
    if (deleteError) {
      setError('Exclua primeiro as Matrizes Relacionais relacionadas a este participante.')
      return
    }

    setError('')
    setParticipantes(participantes.filter((participante) => participante.id !== id))
  }

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Participantes</h1>
          <p className="text-slate-500 mt-1">
            Gerencie o banco geral de pessoas
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Novo Participante
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
              placeholder="Buscar por nome, e-mail, WhatsApp, cargo ou código da empresa"
              className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {filteredParticipantes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center text-slate-400">
            <Users className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium text-slate-600">
              Nenhum participante cadastrado
            </p>
            <p className="text-sm mt-1">
              Adicione pessoas ao cadastro geral de participantes.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Participante</th>
                  <th className="px-5 py-3">Contato</th>
                  <th className="px-5 py-3">Cargo</th>
                  <th className="px-5 py-3">Empresa</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredParticipantes.map((participante) => (
                  <tr key={participante.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                          <UserRound className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {participante.nome}
                          </p>
                          <p className="text-sm text-slate-500">
                            {participante.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-400" />
                        {participante.whatsapp}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <BriefcaseBusiness className="h-4 w-4 text-slate-400" />
                        {participante.cargo}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {(() => {
                        const empresa = empresas.find((item) => item.id === participante.empresa_id)
                        return empresa ? (
                          <div>
                            <p className="font-medium text-slate-900">{empresa.nome}</p>
                            <p className="font-mono text-xs font-semibold text-indigo-600">{empresa.codigo_operacional || '—'}</p>
                          </div>
                        ) : '—'
                      })()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(participante)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                          aria-label="Editar participante"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteParticipante(participante.id)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                          aria-label="Remover participante"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                  {editingParticipante ? 'Editar participante' : 'Novo participante'}
                </h2>
                <p className="text-sm text-slate-500">
                  Cadastre os dados básicos da pessoa.
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
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
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
                  <span className="text-sm font-medium text-slate-700">E-mail</span>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">WhatsApp</span>
                  <input
                    value={form.whatsapp}
                    onChange={(e) =>
                      setForm({ ...form, whatsapp: e.target.value })
                    }
                    placeholder="+5511999999999"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <span className="mt-1.5 block text-xs text-slate-500">
                    Formato internacional com DDI. Exemplo: +5511999999999
                  </span>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Cargo</span>
                  <input
                    value={form.cargo}
                    onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Empresa</span>
                  <select
                    value={form.empresa_id}
                    onChange={(e) => setForm({ ...form, empresa_id: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecione uma empresa</option>
                      {empresas.map((empresa) => (
                        <option key={empresa.id} value={empresa.id}>
                          {empresa.codigo_operacional ? `${empresa.codigo_operacional} - ` : ''}{empresa.nome}
                        </option>
                      ))}
                  </select>
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
                  Salvar participante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
