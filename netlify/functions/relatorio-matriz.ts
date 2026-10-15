import type { Config } from '@netlify/functions'
import {
  carregarPerguntasMatriz,
  carregarTabulacaoMatriz,
} from '../../src/lib/tabulacao-supabase.js'
import {
  getSupabaseAdmin,
  requireAuthenticatedAdminSession,
} from './_supabase.js'

const PATH_PATTERN = /^\/api\/relatorios\/matriz\/([0-9a-f-]{36})\/?$/i
const RESPONSE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: RESPONSE_HEADERS })
}

export default async (req: Request) => {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', {
      status: 405,
      headers: { ...RESPONSE_HEADERS, Allow: 'GET' },
    })
  }

  const authError = await requireAuthenticatedAdminSession(req)
  if (authError) {
    console.error('[relatorio-matriz] Autenticação administrativa recusada', {
      status: authError.status,
    })
    return authError
  }

  const pathMatch = new URL(req.url).pathname.match(PATH_PATTERN)
  if (!pathMatch) return json({ error: 'Matriz inválida' }, 400)

  try {
    const supabase = getSupabaseAdmin()
    const [tabulacao, perguntas] = await Promise.all([
      carregarTabulacaoMatriz(supabase, pathMatch[1]),
      carregarPerguntasMatriz(supabase, pathMatch[1]),
    ])

    return json({ tabulacao, perguntas })
  } catch (error) {
    console.error(
      '[relatorio-matriz] Falha técnica ao gerar relatório:',
      error instanceof Error ? error.message : String(error),
    )
    return json({ error: 'Não foi possível carregar o relatório' }, 500)
  }
}

export const config: Config = {
  path: '/api/relatorios/matriz/*',
}
