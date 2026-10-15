import { Link, useRouterState } from '@tanstack/react-router'
import {
  LayoutDashboard,
  ClipboardCheck,
  BarChart3,
  FolderKanban,
  Users,
  Network,
  UserCircle,
  Settings,
  Building2,
  ChevronLeft,
  ChevronRight,
  Target,
} from 'lucide-react'
import { useState } from 'react'

const menuSections = [
  {
    label: 'Visão Geral',
    items: [
      { to: '/painel' as const, label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      { to: '/consultoras' as const, label: 'Consultores 360', icon: UserCircle },
      { to: '/empresas' as const, label: 'Empresas', icon: Building2 },
      { to: '/participantes' as const, label: 'Participantes', icon: Users },
    ],
  },
  {
    label: 'Processos',
    items: [
      { to: '/processos' as const, label: 'Processos', icon: FolderKanban },
      { to: '/matrizes-relacionais' as const, label: 'Matriz Relacional', icon: Network },
      { to: '/avaliacoes' as const, label: 'Avaliações', icon: ClipboardCheck },
      { to: '/relatorios' as const, label: 'Relatórios', icon: BarChart3 },
    ],
  },
  {
    label: 'Administração',
    items: [
      { to: '/configuracoes' as const, label: 'Configurações', icon: Settings },
    ],
  },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  return (
    <aside
      className={`${collapsed ? 'w-20' : 'w-64'} min-h-screen bg-slate-900 text-white flex flex-col transition-all duration-300`}
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-700">
        <div className="flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-lg shrink-0">
          <Target className="w-6 h-6" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold leading-tight">Compass Rose</h1>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-5 px-3">
          {menuSections.map((section, sectionIndex) => (
            <section
              key={section.label}
              aria-label={collapsed ? section.label : undefined}
              aria-labelledby={collapsed ? undefined : `menu-section-${sectionIndex}`}
              className={collapsed && sectionIndex > 0 ? 'border-t border-slate-700 pt-4' : ''}
            >
              {!collapsed && (
                <h2
                  id={`menu-section-${sectionIndex}`}
                  className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500"
                >
                  {section.label}
                </h2>
              )}

              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive =
                    item.to === '/painel'
                      ? currentPath === '/painel'
                      : currentPath.startsWith(item.to)

                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        title={collapsed ? item.label : undefined}
                        aria-label={collapsed ? item.label : undefined}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <item.icon className="w-5 h-5 shrink-0" />
                        {!collapsed && (
                          <span className="text-sm font-medium">{item.label}</span>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      </nav>

      <div className="p-3 border-t border-slate-700">
        <button
          onClick={() => setCollapsed(!collapsed)}
          type="button"
          aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          className="flex items-center justify-center w-full p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>
    </aside>
  )
}
