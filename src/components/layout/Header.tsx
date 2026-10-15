import { Bell, Search, User, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getCurrentUser, logout } from '@/lib/auth'

export function Header() {
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    async function loadUser() {
      const user = await getCurrentUser()
      setUserEmail(user?.email ?? null)
    }
    loadUser()
  }, [])

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-500 hover:text-slate-700 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-sm font-medium text-slate-700">
            {userEmail || 'Admin'}
          </span>
        </div>
        <button
          onClick={logout}
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          title="Sair"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
