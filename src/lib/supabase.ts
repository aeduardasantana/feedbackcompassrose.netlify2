import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

const placeholderValues = new Set([
  'https://seu-projeto.supabase.co',
  'sua-chave-anon-publica',
  'sua-chave-anonima',
])

function isValidSupabaseUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname.endsWith('.supabase.co')
  } catch {
    return false
  }
}

export const isSupabaseConfigured =
  isValidSupabaseUrl(supabaseUrl) &&
  !!supabaseAnonKey &&
  !placeholderValues.has(supabaseUrl) &&
  !placeholderValues.has(supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        persistSession: true,
        storageKey: 'compass_rose_admin_session',
      },
    })
  : null
