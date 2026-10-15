import type { Avaliacao } from '@/types'

export type StatusGeralAvaliacao =
  | 'sem_avaliacoes'
  | 'criada'
  | 'enviada'
  | 'em_andamento'
  | 'finalizada'

export function isAvaliacaoRespondida(avaliacao: Avaliacao) {
  return Boolean(avaliacao.respondido_em) || avaliacao.status === 'respondida'
}

export function getStatusGeralAvaliacoes(
  avaliacoes: Array<Pick<Avaliacao, 'status'>>,
): StatusGeralAvaliacao {
  if (avaliacoes.length === 0) return 'sem_avaliacoes'
  if (avaliacoes.every((avaliacao) => avaliacao.status === 'respondida')) return 'finalizada'
  if (avaliacoes.some((avaliacao) => ['acessada', 'em_andamento', 'respondida'].includes(avaliacao.status))) {
    return 'em_andamento'
  }
  if (avaliacoes.some((avaliacao) => ['enviada', 'acessada'].includes(avaliacao.status))) {
    return 'enviada'
  }

  return 'criada'
}

export function getEvaluationLink(token?: string | null, origin?: string) {
  const normalizedToken = token?.trim()
  if (!normalizedToken || !origin) return null
  if (!/^[A-Za-z0-9_-]{16,}$/.test(normalizedToken)) return null
  if (/^(AVL|MAT|PROC|EMP)(?:[-_]|\d)/i.test(normalizedToken) || /^\d+$/.test(normalizedToken)) return null

  return `${origin.replace(/\/$/, '')}/questionario/${normalizedToken}`
}

export function removeAvaliacaoById<T extends Pick<Avaliacao, 'id'>>(avaliacoes: T[], id: string) {
  return avaliacoes.filter((avaliacao) => avaliacao.id !== id)
}

export function removeAvaliacoesByIds<T extends Pick<Avaliacao, 'id'>>(avaliacoes: T[], ids: string[]) {
  const selectedIds = new Set(ids)
  return avaliacoes.filter((avaliacao) => !selectedIds.has(avaliacao.id))
}

export function deletionSucceeded(error: unknown, count: number | null, expectedCount = 1) {
  return !error && count === expectedCount
}
