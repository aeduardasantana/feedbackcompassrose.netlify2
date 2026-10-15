import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { Header } from '../components/layout/Header'
import { getCurrentSession, onAuthStateChange } from '@/lib/auth'

export const Route = createFileRoute('/_admin')({
  component: AdminLayout,
})

function AdminLayout() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    let active = true

    async function checkAuth() {
      const session = await getCurrentSession()
      if (!active) return

      if (!session) {
        setAuthenticated(false)
        setChecking(false)
        navigate({ to: '/login' })
        return
      }

      setAuthenticated(true)
      setChecking(false)
    }

    const subscription = onAuthStateChange((_event, session) => {
      if (!session) {
        setAuthenticated(false)
        setChecking(false)
        navigate({ to: '/login' })
        return
      }

      setAuthenticated(true)
      setChecking(false)
    })

    checkAuth()

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [navigate])

  if (checking && !authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Verificando sessão...</p>
        </div>
      </div>
    )
  }

  if (!authenticated) return null

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
