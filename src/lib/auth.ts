import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js"

const SUPABASE_NOT_CONFIGURED_ERROR =
  "A conexão com o Supabase ainda não foi configurada. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Netlify e no ambiente local."

export type AuthResult = { success: boolean; error?: string }
export type AuthStateHandler = (
  event: AuthChangeEvent,
  session: Session | null
) => void

function notConfigured(): AuthResult {
  return { success: false, error: SUPABASE_NOT_CONFIGURED_ERROR }
}

function getSupabaseClient() {
  if (!isSupabaseConfigured || !supabase) return null
  return supabase
}

export async function getCurrentSession(): Promise<Session | null> {
  const client = getSupabaseClient()
  if (!client) return null

  const { data, error } = await client.auth.getSession()
  if (error) return null

  return data.session
}

export async function getCurrentUser(): Promise<User | null> {
  const client = getSupabaseClient()
  if (!client) return null

  const { data, error } = await client.auth.getUser()
  if (error) return null

  return data.user
}

export async function login(
  email: string,
  password: string
): Promise<AuthResult> {
  const client = getSupabaseClient()
  if (!client) return notConfigured()

  try {
    const { error } = await client.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: "E-mail ou senha inválidos" }
    }

    return { success: true }
  } catch {
    return { success: false, error: "Erro de conexão com o servidor" }
  }
}

export async function isAuthenticated(): Promise<boolean> {
  return !!(await getCurrentSession())
}

export async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await getCurrentSession()
  const token = session?.access_token

  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function onAuthStateChange(handler: AuthStateHandler) {
  const client = getSupabaseClient()
  if (!client) return { unsubscribe: () => {} }

  const {
    data: { subscription },
  } = client.auth.onAuthStateChange(handler)

  return subscription
}

export async function logout(): Promise<void> {
  const client = getSupabaseClient()
  if (client) {
    await client.auth.signOut()
  }
  window.location.href = "/login"
}

export async function requestPasswordReset(
  email: string
): Promise<AuthResult> {
  const client = getSupabaseClient()
  if (!client) return notConfigured()

  try {
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch {
    return { success: false, error: "Erro de conexão com o servidor" }
  }
}

export async function updatePassword(
  newPassword: string
): Promise<AuthResult> {
  const client = getSupabaseClient()
  if (!client) return notConfigured()

  try {
    const session = await getCurrentSession()
    if (!session) {
      return {
        success: false,
        error: "Link de redefinição inválido ou expirado. Solicite um novo link.",
      }
    }

    const { error } = await client.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch {
    return { success: false, error: "Erro de conexão com o servidor" }
  }
}
