import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Target, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { requestPasswordReset } from '@/lib/auth'

export const Route = createFileRoute('/esqueci-senha')({
  component: EsqueciSenhaPage,
})

function EsqueciSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Informe seu e-mail')
      return
    }

    setLoading(true)
    const result = await requestPasswordReset(email)
    setLoading(false)

    if (result.success) {
      setSent(true)
    } else {
      setError(result.error || 'Erro ao enviar link de redefinição')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-600/30">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Compass Rose</h1>
          <p className="text-indigo-200/70 mt-1 text-sm">
            Plataforma de Feedback 360°
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {sent ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">
                E-mail enviado
              </h2>
              <p className="text-sm text-indigo-200/60 mb-6">
                Se o endereço <span className="text-indigo-300">{email}</span> estiver
                cadastrado, você receberá um link para redefinir sua senha.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white">
                  Esqueci minha senha
                </h2>
                <p className="text-sm text-indigo-200/60 mt-1">
                  Informe o e-mail associado à conta de administrador para
                  receber um link de redefinição.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 mb-4 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <p className="text-sm text-rose-300">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-indigo-200/80 mb-1.5">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@empresa.com"
                    autoComplete="email"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  {loading ? 'Enviando...' : 'Enviar link de redefinição'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar ao login
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-indigo-200/30 mt-6">
          Compass Rose — Feedback 360° &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
