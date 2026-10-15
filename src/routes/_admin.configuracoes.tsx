import { createFileRoute } from '@tanstack/react-router'
import { Settings, Database, Shield, Palette, CheckCircle, AlertCircle } from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/supabase'

export const Route = createFileRoute('/_admin/configuracoes')({
  component: Configuracoes,
})

const sections = [
  {
    title: 'Banco de Dados',
    description: 'Configurações de conexão com o Supabase',
    icon: Database,
    status: isSupabaseConfigured ? 'Conectado ao Supabase' : 'Configurar variáveis de ambiente',
  },
  {
    title: 'Segurança',
    description: 'Autenticação e permissões de acesso',
    icon: Shield,
    status: isSupabaseConfigured ? 'Supabase Auth ativo' : 'Aguardando Supabase',
  },
  {
    title: 'Aparência',
    description: 'Personalização visual da plataforma',
    icon: Palette,
    status: 'Em breve',
  },
]

function Configuracoes() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-slate-500 mt-1">
          Configurações gerais da plataforma
        </p>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <div
            key={section.title}
            className="bg-white rounded-xl border border-slate-200 p-6 flex items-center gap-6 hover:shadow-md transition-shadow"
          >
            <div className="bg-slate-100 p-3 rounded-lg">
              <section.icon className="w-6 h-6 text-slate-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-slate-900">
                {section.title}
              </h3>
              <p className="text-sm text-slate-500">{section.description}</p>
            </div>
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
              {section.status}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-indigo-50 rounded-xl border border-indigo-100 p-6">
        <div className="flex items-start gap-4">
          {isSupabaseConfigured ? (
            <CheckCircle className="w-6 h-6 text-emerald-600 mt-0.5" />
          ) : (
            <Settings className="w-6 h-6 text-indigo-600 mt-0.5" />
          )}
          <div>
            <h3 className="text-base font-semibold text-indigo-900">
              Configuração do Supabase
            </h3>
            <p className="text-sm text-indigo-700 mt-1">
              {isSupabaseConfigured
                ? 'A aplicação está usando Supabase Auth com sessão persistente no navegador.'
                : 'Para conectar autenticação e banco de dados, configure as variáveis de ambiente no Netlify e no ambiente local.'}
            </p>
            {!isSupabaseConfigured && (
              <div className="mt-3 bg-white rounded-lg p-4 text-sm text-slate-700 border border-indigo-100">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900">
                      Variáveis públicas obrigatórias
                    </p>
                    <p className="mt-2 font-mono">VITE_SUPABASE_URL</p>
                    <p className="font-mono">VITE_SUPABASE_ANON_KEY</p>
                    <p className="mt-2 text-slate-500">
                      Os valores reais devem ser cadastrados como variáveis de ambiente, nunca escritos na interface.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
