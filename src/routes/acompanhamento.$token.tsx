import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight,
  Building2,
  CalendarCheck2,
  Check,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Compass,
  LoaderCircle,
  Network,
  ShieldCheck,
  UserRound,
  UsersRound,
} from 'lucide-react'
import type { CategoriaMatrizRelacional, StatusAvaliacao } from '@/types'
import { getStatusGeralAvaliacoes, type StatusGeralAvaliacao } from '@/lib/avaliacoes'

export const Route = createFileRoute('/acompanhamento/$token')({
  head: () => ({
    meta: [
      { title: 'Acompanhamento da Matriz — Feedback Compass Rose' },
      { name: 'description', content: 'Acompanhamento seguro do andamento das avaliações da Matriz Relacional.' },
      { name: 'robots', content: 'noindex, nofollow, noarchive' },
      { name: 'referrer', content: 'no-referrer' },
    ],
  }),
  component: AcompanhamentoMatriz,
})

type AvaliacaoPublica = {
  avaliador: string
  relacao: CategoriaMatrizRelacional
  status: StatusAvaliacao
  enviado_em: string | null
  respondido_em: string | null
}

type PortalData = {
  matriz: {
    codigo: string | null
    avaliado: string
    empresa: string
    processo: string
  }
  license: {
    consultor: string
  }
  avaliacoes: AvaliacaoPublica[]
}

type PageState =
  | { state: 'loading' }
  | { state: 'valid'; data: PortalData }
  | { state: 'invalid' }
  | { state: 'error' }

const relacoes: Record<CategoriaMatrizRelacional, string> = {
  autoavaliacao: 'Autoavaliação',
  superior: 'Superior',
  liderado: 'Liderado',
  par: 'Par',
  outro: 'Outro',
}

const statusLabels: Record<StatusAvaliacao, string> = {
  criada: 'Criada',
  enviada: 'Enviada',
  acessada: 'Acessada',
  em_andamento: 'Em andamento',
  respondida: 'Respondida',
  expirada: 'Expirada',
  cancelada: 'Cancelada',
}

const statusStyles: Record<StatusAvaliacao, string> = {
  criada: 'bg-stone-100 text-stone-700 ring-stone-200',
  enviada: 'bg-sky-50 text-sky-700 ring-sky-200',
  acessada: 'bg-violet-50 text-violet-700 ring-violet-200',
  em_andamento: 'bg-amber-50 text-amber-700 ring-amber-200',
  respondida: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  expirada: 'bg-amber-50 text-amber-700 ring-amber-200',
  cancelada: 'bg-rose-50 text-rose-700 ring-rose-200',
}

function isConcluida(avaliacao: AvaliacaoPublica) {
  return Boolean(avaliacao.respondido_em) || avaliacao.status === 'respondida'
}

function formatDate(value: string | null) {
  if (!value) return null
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

const statusGeralLabels: Record<StatusGeralAvaliacao, string> = {
  sem_avaliacoes: 'Sem avaliações',
  criada: 'Criada',
  enviada: 'Enviada',
  em_andamento: 'Em andamento',
  finalizada: 'Finalizada',
}

function AcompanhamentoMatriz() {
  const { token } = Route.useParams()
  const [page, setPage] = useState<PageState>({ state: 'loading' })

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const response = await fetch(`/api/acompanhamento/matriz/${encodeURIComponent(token)}`)
        if (!active) return
        if (response.status === 404) {
          setPage({ state: 'invalid' })
          return
        }
        if (!response.ok) {
          setPage({ state: 'error' })
          return
        }
        const result = await response.json() as PortalData & { valid: boolean }
        setPage(result.valid ? { state: 'valid', data: result } : { state: 'invalid' })
      } catch {
        if (active) setPage({ state: 'error' })
      }
    }

    load()
    return () => { active = false }
  }, [token])

  if (page.state !== 'valid') return <PortalState state={page.state} />

  return <PortalContent data={page.data} />
}

function PortalContent({ data }: { data: PortalData }) {
  const resumo = useMemo(() => {
    const total = data.avaliacoes.length
    const concluidas = data.avaliacoes.filter(isConcluida).length
    return {
      total,
      concluidas,
      pendentes: total - concluidas,
      percentual: total === 0 ? 0 : Math.round((concluidas / total) * 100),
      status: statusGeralLabels[getStatusGeralAvaliacoes(data.avaliacoes)],
    }
  }, [data.avaliacoes])

  return (
    <div className="min-h-screen bg-[#f4f2ea] text-[#173f3a]">
      <header className="border-b border-[#173f3a]/10 bg-[#f4f2ea]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[#173f3a] text-[#f4f2ea] shadow-sm">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <p className="font-serif text-lg font-semibold leading-none">Feedback Compass Rose</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#52706a]">Acompanhamento 360º</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-[#173f3a]/15 px-3 py-1.5 text-xs font-semibold text-[#52706a] sm:flex">
            <ShieldCheck className="h-4 w-4" />
            Visualização segura
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <section className="relative overflow-hidden rounded-[2rem] bg-[#173f3a] px-6 py-8 text-[#f8f5eb] shadow-[0_24px_70px_-35px_rgba(23,63,58,0.8)] sm:px-10 sm:py-11">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-[#d7b56d]/20" />
          <div className="absolute -right-6 -top-4 h-40 w-40 rounded-full border border-[#d7b56d]/20" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                {data.matriz.codigo && (
                  <span className="rounded-full bg-[#d7b56d] px-3 py-1 text-xs font-black tracking-[0.12em] text-[#173f3a]">
                    {data.matriz.codigo}
                  </span>
                )}
                <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80">{resumo.status}</span>
              </div>
              <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-[#a9c4bd]">Matriz relacional de</p>
              <h1 className="mt-2 max-w-3xl font-serif text-4xl font-semibold tracking-tight sm:text-5xl">{data.matriz.avaliado}</h1>
              <div className="mt-6 flex flex-col gap-3 text-sm text-white/75 sm:flex-row sm:flex-wrap sm:gap-x-7">
                <span className="flex items-center gap-2"><Building2 className="h-4 w-4 text-[#d7b56d]" />{data.matriz.empresa}</span>
                <span className="flex items-center gap-2"><Network className="h-4 w-4 text-[#d7b56d]" />{data.matriz.processo}</span>
              </div>
            </div>
            <div className="w-full rounded-2xl border border-white/15 bg-white/8 p-5 backdrop-blur-sm lg:w-64">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a9c4bd]">Conclusão</p>
                  <p className="mt-1 text-4xl font-bold">{resumo.percentual}%</p>
                </div>
                <CalendarCheck2 className="mb-1 h-7 w-7 text-[#d7b56d]" />
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-[#d7b56d] transition-all duration-700" style={{ width: `${resumo.percentual}%` }} />
              </div>
              <p className="mt-3 text-xs text-white/65">{resumo.concluidas} de {resumo.total} avaliações concluídas</p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-3 gap-3 sm:mt-6 sm:gap-5">
          <Metric icon={UsersRound} label="Total" value={resumo.total} />
          <Metric icon={CheckCircle2} label="Concluídas" value={resumo.concluidas} accent />
          <Metric icon={Clock3} label="Pendentes" value={resumo.pendentes} />
        </section>

        <section className="mt-8 sm:mt-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#a17b31]">Andamento individual</p>
              <h2 className="mt-1 font-serif text-2xl font-semibold sm:text-3xl">Avaliações da matriz</h2>
            </div>
            <p className="hidden max-w-sm text-right text-sm leading-relaxed text-[#60736f] sm:block">Os dados refletem o andamento atual e são atualizados a cada acesso.</p>
          </div>

          {data.avaliacoes.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-[#173f3a]/25 bg-white/55 px-6 py-14 text-center">
              <CircleDashed className="mx-auto h-10 w-10 text-[#a17b31]" />
              <h3 className="mt-4 font-serif text-2xl font-semibold">Sem avaliações</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#60736f]">Esta matriz ainda não possui avaliações vinculadas. O acompanhamento permanece disponível.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {data.avaliacoes.map((avaliacao, index) => (
                <article key={`${avaliacao.avaliador}-${avaliacao.relacao}-${index}`} className="group rounded-2xl border border-[#173f3a]/10 bg-white/75 p-4 shadow-[0_10px_35px_-28px_rgba(23,63,58,0.7)] transition hover:-translate-y-0.5 hover:bg-white sm:p-5">
                  <div className="flex items-start gap-4">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#e4e9df] text-[#173f3a]">
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="truncate font-semibold text-[#173f3a]">{avaliacao.avaliador}</h3>
                          <p className="mt-0.5 text-sm text-[#60736f]">{relacoes[avaliacao.relacao]}</p>
                        </div>
                        <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${statusStyles[avaliacao.status]}`}>
                          {statusLabels[avaliacao.status]}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#173f3a]/8 pt-3 text-xs text-[#60736f]">
                        <TimelineItem complete={Boolean(avaliacao.enviado_em)} label={avaliacao.enviado_em ? `Enviada em ${formatDate(avaliacao.enviado_em)}` : 'Aguardando envio'} />
                        <TimelineItem complete={isConcluida(avaliacao)} label={avaliacao.respondido_em ? `Concluída em ${formatDate(avaliacao.respondido_em)}` : isConcluida(avaliacao) ? 'Concluída' : 'Aguardando resposta'} />
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="mt-6 border-t border-[#173f3a]/10 px-5 py-7 text-center text-xs text-[#60736f]">
        <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Portal somente para acompanhamento. Nenhuma resposta ou dado sensível é exibido.</span>
        <p className="mt-3">
          Feedback Compass Rose · Ferramenta licenciada para uso de: {data.license.consultor}
        </p>
      </footer>
    </div>
  )
}

function Metric({ icon: Icon, label, value, accent = false }: { icon: typeof UsersRound; label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 sm:p-5 ${accent ? 'border-[#c7a351]/35 bg-[#f0e4c7]' : 'border-[#173f3a]/10 bg-white/65'}`}>
      <Icon className={`h-5 w-5 ${accent ? 'text-[#8b6725]' : 'text-[#52706a]'}`} />
      <p className="mt-4 text-2xl font-bold sm:text-3xl">{value}</p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#60736f] sm:text-xs">{label}</p>
    </div>
  )
}

function TimelineItem({ complete, label }: { complete: boolean; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      {complete ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <CircleDashed className="h-3.5 w-3.5 text-stone-400" />}
      {label}
    </span>
  )
}

function PortalState({ state }: { state: Exclude<PageState['state'], 'valid'> }) {
  const loading = state === 'loading'
  const error = state === 'error'

  return (
    <div className="grid min-h-screen place-items-center bg-[#f4f2ea] px-5 text-[#173f3a]">
      <div className="w-full max-w-lg rounded-[2rem] border border-[#173f3a]/10 bg-white/70 p-8 text-center shadow-[0_24px_70px_-45px_rgba(23,63,58,0.8)] sm:p-12">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#173f3a] text-[#f4f2ea]">
          {loading ? <LoaderCircle className="h-7 w-7 animate-spin" /> : error ? <ArrowUpRight className="h-7 w-7" /> : <Compass className="h-7 w-7" />}
        </div>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-[#a17b31]">Feedback Compass Rose</p>
        <h1 className="mt-3 font-serif text-3xl font-semibold">
          {loading ? 'Carregando acompanhamento' : error ? 'Acompanhamento indisponível' : 'Link de acompanhamento inválido ou indisponível.'}
        </h1>
        {!loading && <p className="mt-4 text-sm leading-relaxed text-[#60736f]">Verifique o endereço recebido ou tente novamente mais tarde.</p>}
      </div>
    </div>
  )
}
