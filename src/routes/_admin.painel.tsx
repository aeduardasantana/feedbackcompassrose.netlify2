import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  FolderKanban,
  ClipboardCheck,
  FileBarChart,
  Coins,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Activity,
  BarChart3,
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import type { Processo } from '@/types'
import { supabase } from '@/lib/supabase'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

export const Route = createFileRoute('/_admin/painel')({
  component: Dashboard,
})

function Dashboard() {
  const [processos, setProcessos] = useState<Processo[]>([])

  useEffect(() => {
    loadProcessos()
  }, [])

  async function loadProcessos() {
    if (!supabase) return

    const { data } = await supabase
      .from('processos')
      .select('*')
      .order('created_at', { ascending: false })

    setProcessos((data ?? []) as Processo[])
  }

  const totalProcessos = processos.length
  const processosAtivos = processos.filter((p) => p.status === 'ativo').length
  const processosFinalizados = processos.filter((p) => p.status === 'finalizado').length
  const totalAvaliacoes = processos.filter(
    (p) => p.status === 'ativo' || p.status === 'finalizado',
  ).length
  const totalRelatorios = processosFinalizados
  const creditosUtilizados = totalProcessos * 3

  const statusCounts = {
    rascunho: processos.filter((p) => p.status === 'rascunho').length,
    ativo: processosAtivos,
    finalizado: processosFinalizados,
    arquivado: processos.filter((p) => p.status === 'arquivado').length,
  }

  const empresas = [...new Set(processos.map((p) => p.empresa).filter(Boolean))]
  const empresaCountMap = empresas.map((emp) => ({
    name: emp,
    count: processos.filter((p) => p.empresa === emp).length,
  }))
  empresaCountMap.sort((a, b) => b.count - a.count)
  const topEmpresas = empresaCountMap.slice(0, 6)

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']
  const monthlyData = months.map((_, i) => {
    return processos.filter((p) => {
      const d = new Date(p.created_at)
      return d.getMonth() === i
    }).length
  })

  const stats = [
    {
      title: 'Total de Processos',
      value: totalProcessos.toString(),
      change: processosAtivos > 0 ? `${processosAtivos} ativos` : 'Nenhum ativo',
      trend: processosAtivos > 0 ? 'up' : 'neutral',
      icon: FolderKanban,
      color: 'bg-indigo-500',
      lightColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
    },
    {
      title: 'Total de Avaliações',
      value: totalAvaliacoes.toString(),
      change: totalAvaliacoes > 0 ? 'Em andamento' : 'Nenhuma avaliação',
      trend: totalAvaliacoes > 0 ? 'up' : 'neutral',
      icon: ClipboardCheck,
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      title: 'Total de Relatórios',
      value: totalRelatorios.toString(),
      change: totalRelatorios > 0 ? 'Finalizados' : 'Nenhum relatório',
      trend: totalRelatorios > 0 ? 'up' : 'neutral',
      icon: FileBarChart,
      color: 'bg-amber-500',
      lightColor: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
    {
      title: 'Créditos Utilizados',
      value: creditosUtilizados.toString(),
      change: `de ${Math.max(creditosUtilizados * 3, 100)} disponíveis`,
      trend: 'neutral' as const,
      icon: Coins,
      color: 'bg-violet-500',
      lightColor: 'bg-violet-50',
      textColor: 'text-violet-600',
    },
  ]

  const statusChartData = {
    labels: ['Rascunho', 'Ativo', 'Finalizado', 'Arquivado'],
    datasets: [
      {
        data: [
          statusCounts.rascunho,
          statusCounts.ativo,
          statusCounts.finalizado,
          statusCounts.arquivado,
        ],
        backgroundColor: ['#94a3b8', '#6366f1', '#10b981', '#f59e0b'],
        borderColor: ['#e2e8f0', '#e2e8f0', '#e2e8f0', '#e2e8f0'],
        borderWidth: 2,
      },
    ],
  }

  const barChartData = {
    labels: topEmpresas.length > 0 ? topEmpresas.map((e) => e.name) : ['Sem dados'],
    datasets: [
      {
        label: 'Processos',
        data: topEmpresas.length > 0 ? topEmpresas.map((e) => e.count) : [0],
        backgroundColor: '#6366f1',
        borderRadius: 6,
        barThickness: 32,
      },
    ],
  }

  const lineChartData = {
    labels: months,
    datasets: [
      {
        label: 'Processos Criados',
        data: monthlyData,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  }

  const recentProcessos = [...processos]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

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
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Dashboard
        </h1>
        <p className="text-slate-500 mt-1">
          Visão geral da plataforma Compass Rose
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.lightColor} p-3 rounded-lg`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
              {stat.trend === 'up' && (
                <div className="flex items-center gap-1 text-emerald-600">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              )}
            </div>
            <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-sm font-medium text-slate-700 mt-1">
              {stat.title}
            </p>
            <p className="text-xs text-slate-400 mt-1">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Evolução Mensal */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Evolução Mensal
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Processos criados por mês
              </p>
            </div>
            <div className="p-2 bg-indigo-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="h-64">
            <Line
              data={lineChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 },
                    grid: { color: 'rgba(0,0,0,0.05)' },
                  },
                  x: {
                    grid: { display: false },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Status dos Processos
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribuição por status
              </p>
            </div>
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Activity className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="h-48 flex items-center justify-center">
            {totalProcessos > 0 ? (
              <Doughnut
                data={statusChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { usePointStyle: true, padding: 12, font: { size: 11 } },
                    },
                  },
                  cutout: '65%',
                }}
              />
            ) : (
              <div className="text-center text-slate-400">
                <BarChart3 className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm">Sem dados para exibir</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Processos por Empresa */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Processos por Empresa
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribuição por empresa
              </p>
            </div>
            <div className="p-2 bg-indigo-50 rounded-lg">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          {topEmpresas.length > 0 ? (
            <div className="h-56">
              <Bar
                data={barChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { stepSize: 1 },
                      grid: { color: 'rgba(0,0,0,0.05)' },
                    },
                    x: {
                      grid: { display: false },
                    },
                  },
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <FolderKanban className="w-12 h-12 mb-3" />
              <p className="text-sm">Nenhum processo criado ainda</p>
              <p className="text-xs mt-1">
                Crie processos para ver as estatísticas por empresa
              </p>
            </div>
          )}
        </div>

        {/* Processos Recentes */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Processos Recentes
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Últimos processos criados
              </p>
            </div>
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Clock className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          {recentProcessos.length > 0 ? (
            <div className="space-y-3">
              {recentProcessos.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {p.nome}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {p.empresa} {p.setor ? `· ${p.setor}` : ''}
                    </p>
                  </div>
                  <span
                    className={`ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusColors[p.status] || 'bg-slate-100 text-slate-700'}`}
                  >
                    {statusLabels[p.status] || p.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Clock className="w-12 h-12 mb-3" />
              <p className="text-sm">Nenhum processo recente</p>
              <p className="text-xs mt-1">
                As atividades aparecerão aqui conforme o uso
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
