import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  Target,
  ShieldCheck,
  ShieldX,
  Clock,
  Loader2,
  Building2,
  FolderKanban,
  AlertTriangle,
} from 'lucide-react'

export const Route = createFileRoute('/processo/$token')({
  component: ProcessoPublico,
})

type TokenStatus =
  | { state: 'loading' }
  | { state: 'valid'; processo_id: string; descricao: string | null }
  | { state: 'expired' }
  | { state: 'invalid' }
  | { state: 'error' }

function ProcessoPublico() {
  const { token } = Route.useParams()
  const [status, setStatus] = useState<TokenStatus>({ state: 'loading' })

  useEffect(() => {
    async function validate() {
      try {
        const res = await fetch(`/api/acesso/processo/${token}`)
        if (res.ok) {
          const data = await res.json()
          setStatus({
            state: 'valid',
            processo_id: data.processo_id,
            descricao: data.descricao,
          })
        } else if (res.status === 403) {
          setStatus({ state: 'expired' })
        } else {
          setStatus({ state: 'invalid' })
        }
      } catch {
        setStatus({ state: 'error' })
      }
    }
    validate()
  }, [token])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 bg-indigo-600 rounded-lg">
            <Target className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">
            Compass Rose
          </h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {status.state === 'loading' && (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
            <p className="text-slate-600 text-sm">Validando acesso...</p>
          </div>
        )}

        {status.state === 'valid' && (
          <div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <ShieldCheck className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Acesso Autorizado
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Você está acessando o painel do processo via link autorizado
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FolderKanban className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-medium text-slate-500">
                      ID do Processo
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {status.processo_id}
                  </p>
                </div>
                {status.descricao && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-medium text-slate-500">
                        Descrição
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                      {status.descricao}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Painel do Processo
              </h3>
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <FolderKanban className="w-12 h-12 mb-3" />
                <p className="text-sm">
                  O conteúdo do processo será exibido aqui
                </p>
                <p className="text-xs mt-1 text-slate-400">
                  Dados do processo, avaliações e progresso
                </p>
              </div>
            </div>
          </div>
        )}

        {status.state === 'expired' && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="p-4 bg-amber-50 rounded-2xl mb-6">
              <Clock className="w-12 h-12 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Link Expirado
            </h2>
            <p className="text-slate-500 text-sm text-center max-w-md">
              O prazo de validade deste link de acesso expirou. Solicite um novo
              link ao administrador do processo.
            </p>
          </div>
        )}

        {status.state === 'invalid' && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="p-4 bg-rose-50 rounded-2xl mb-6">
              <ShieldX className="w-12 h-12 text-rose-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Acesso Negado
            </h2>
            <p className="text-slate-500 text-sm text-center max-w-md">
              Este link de acesso é inválido ou foi revogado. Verifique o link
              ou entre em contato com o administrador.
            </p>
          </div>
        )}

        {status.state === 'error' && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="p-4 bg-slate-100 rounded-2xl mb-6">
              <AlertTriangle className="w-12 h-12 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Erro de Conexão
            </h2>
            <p className="text-slate-500 text-sm text-center max-w-md">
              Não foi possível verificar o acesso. Tente novamente em instantes.
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 py-4 mt-auto">
        <p className="text-center text-xs text-slate-400">
          Compass Rose — Feedback 360º
        </p>
      </footer>
    </div>
  )
}
