import type { CategoriaMatrizRelacional } from '@/types'

type EvaluationShareInput = {
  relacao: CategoriaMatrizRelacional
  nomeAvaliado: string
  nomeAvaliador: string
  nomeConsultor: string
  link: string
}

type TrackingShareInput = {
  nomeAvaliado: string
  nomeConsultor: string
  codigoMatriz: string
  nomeProcesso: string
  nomeEmpresa: string
  link: string
}

export type ShareContent = {
  subject: string
  emailBody: string
  whatsappBody: string
}

const relationLabels: Record<CategoriaMatrizRelacional, string> = {
  autoavaliacao: 'Autoavaliação',
  superior: 'Superior',
  liderado: 'Liderado',
  par: 'Par',
  outro: 'Outro',
}

export function getEvaluationShareContent({
  relacao,
  nomeAvaliado,
  nomeAvaliador,
  nomeConsultor,
  link,
}: EvaluationShareInput): ShareContent {
  if (relacao === 'autoavaliacao') {
    return {
      subject: `Autoavaliação - ${nomeAvaliado}`,
      emailBody: `Olá, ${nomeAvaliado}!

Você foi convidado(a) por ${nomeConsultor} para realizar sua Autoavaliação no Feedback Compass Rose.

A autoavaliação é uma etapa importante do processo de Avaliação 360º, pois permite registrar a sua própria percepção e posteriormente compará-la às percepções recebidas dos demais avaliadores.

Prazo para preenchimento: 10 dias corridos a partir do envio.

O processo é confidencial e estruturado para preservar a segurança das informações.

Acesse sua Autoavaliação pelo link abaixo:

${link}

Pedimos que responda a todas as questões com sinceridade e considerando sua atuação profissional.

Atenciosamente,
Feedback Compass Rose`,
      whatsappBody: `Olá, ${nomeAvaliado}!

Você foi convidado(a) por ${nomeConsultor} para realizar sua Autoavaliação no Feedback Compass Rose.

Prazo: 10 dias corridos.

Acesse pelo link seguro:

${link}

Pedimos que responda às questões com sinceridade, considerando sua atuação profissional.

Feedback Compass Rose`,
    }
  }

  const relationLabel = relationLabels[relacao]

  return {
    subject: `Avaliação 360º - ${nomeAvaliado}`,
    emailBody: `Olá, ${nomeAvaliador}!

Você foi convidado(a) por ${nomeConsultor} para participar da Avaliação 360º de ${nomeAvaliado}.

Sua participação está registrada na relação:

${relationLabel}

Sua percepção contribuirá para uma visão mais ampla sobre competências e comportamentos profissionais do(a) avaliado(a).

Prazo para preenchimento: 10 dias corridos a partir do envio.

O processo é confidencial. As avaliações são utilizadas de forma consolidada no processo de Feedback 360º.

Acesse sua avaliação pelo link seguro abaixo:

${link}

Pedimos que responda a todas as questões com sinceridade, considerando sua experiência profissional com ${nomeAvaliado}.

Atenciosamente,
Feedback Compass Rose`,
    whatsappBody: `Olá, ${nomeAvaliador}!

Você foi convidado(a) por ${nomeConsultor} para participar da Avaliação 360º de ${nomeAvaliado}.

Relação: ${relationLabel}

Prazo: 10 dias corridos.

Acesse sua avaliação pelo link seguro:

${link}

Sua participação é confidencial e muito importante para o processo.

Feedback Compass Rose`,
  }
}

export function getTrackingShareContent({
  nomeAvaliado,
  nomeConsultor,
  codigoMatriz,
  nomeProcesso,
  nomeEmpresa,
  link,
}: TrackingShareInput): ShareContent {
  return {
    subject: `Acompanhamento Feedback 360º - ${nomeAvaliado}`,
    emailBody: `Olá, ${nomeConsultor}!

O acompanhamento da Matriz Relacional de ${nomeAvaliado} está disponível no Feedback Compass Rose.

Matriz: ${codigoMatriz}
Processo: ${nomeProcesso}
Empresa: ${nomeEmpresa}

Acesse o acompanhamento pelo link seguro abaixo:

${link}

Por esse link é possível acompanhar o andamento das avaliações vinculadas à matriz.

Atenciosamente,
Feedback Compass Rose`,
    whatsappBody: `Olá, ${nomeConsultor}!

O acompanhamento da Matriz Relacional de ${nomeAvaliado} está disponível.

Matriz: ${codigoMatriz}
Processo: ${nomeProcesso}

Acompanhe pelo link seguro:

${link}

Feedback Compass Rose`,
  }
}

export function normalizeInternationalWhatsapp(value?: string | null) {
  const trimmedValue = value?.trim()
  if (!trimmedValue?.startsWith('+')) return null
  if (/[^\d\s()+.-]/.test(trimmedValue)) return null

  const digits = trimmedValue.slice(1).replace(/\D/g, '')
  if (!/^[1-9]\d{7,14}$/.test(digits)) return null

  return digits
}

export function isValidEmail(value?: string | null) {
  const email = value?.trim()
  if (!email || email.length > 254 || /\s/.test(email)) return false
  return /^[^@]+@[^@]+\.[^@]+$/.test(email)
}

export function getWhatsappUrl(whatsapp: string, message: string) {
  const normalizedWhatsapp = normalizeInternationalWhatsapp(whatsapp)
  if (!normalizedWhatsapp) return null
  return `https://wa.me/${normalizedWhatsapp}?text=${encodeURIComponent(message)}`
}

export function getMailtoUrl(email: string, subject: string, body: string) {
  if (!isValidEmail(email)) return null
  return `mailto:${email.trim()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
