export interface Processo {
  id: string
  codigo_operacional?: string | null
  nome: string
  descricao: string
  empresa: string
  empresa_id?: string | null
  setor: string
  consultor_responsavel: string
  consultora_id: string
  status: 'rascunho' | 'ativo' | 'finalizado' | 'arquivado'
  prazo: string | null
  observacoes: string
  data_inicio: string | null
  data_fim: string | null
  created_at: string
  updated_at: string
  token?: string | null
}

export interface Consultora {
  id: string
  nome: string
  email: string
  whatsapp: string
  empresa: string
  cpf_cnpj: string | null
  cidade: string | null
  estado: string | null
  observacoes: string | null
  saldo_creditos: number
  status: 'ativa' | 'inativa'
  created_at: string
  updated_at: string
}

export interface Empresa {
  id: string
  codigo_operacional?: string | null
  nome: string
  cnpj: string | null
  setor: string | null
  responsavel: string | null
  email: string | null
  telefone: string | null
  endereco: string | null
  consultora_id: string
  created_at: string
  updated_at: string
}

export interface CreditoHistorico {
  id: string
  consultora_id: string
  tipo: 'adicao' | 'remocao' | 'consumo'
  quantidade: number
  saldo_anterior: number
  saldo_posterior: number
  descricao: string
  processo_id: string | null
  created_at: string
}

export interface Participante {
  id: string
  nome: string
  email: string
  whatsapp: string
  cargo: string
  empresa_id?: string | null
  processo_id?: string | null
  created_at: string
  updated_at: string
}

export type CategoriaMatrizRelacional =
  | 'autoavaliacao'
  | 'superior'
  | 'liderado'
  | 'par'
  | 'outro'

export interface MatrizRelacional {
  id: string
  codigo_operacional?: string | null
  token_acompanhamento: string
  processo_id: string
  avaliado_id: string
  created_at: string
  updated_at: string
}

export interface MatrizRelacionalAvaliador {
  id: string
  matriz_id: string
  participante_id: string
  categoria: CategoriaMatrizRelacional
  created_at: string
  updated_at: string
}

export type StatusAvaliacao =
  | 'criada'
  | 'enviada'
  | 'acessada'
  | 'em_andamento'
  | 'respondida'
  | 'expirada'
  | 'cancelada'

export interface Avaliacao {
  id: string
  codigo_operacional?: string | null
  matriz_relacional_id: string
  matriz_relacional_avaliador_id: string
  processo_id: string
  participante_avaliado_id: string
  participante_avaliador_id: string
  relacao: CategoriaMatrizRelacional
  status: StatusAvaliacao
  token: string
  enviado_em: string | null
  respondido_em: string | null
  created_at: string
  updated_at: string
}

export interface Questionario {
  id: string
  processo_id: string
  titulo: string
  descricao: string
  created_at: string
  updated_at: string
}

export interface Pergunta {
  id: string
  questionario_id: string
  texto: string
  tipo: 'escala' | 'texto' | 'multipla_escolha'
  categoria: string
  ordem: number
  obrigatoria: boolean
}

export interface Resposta {
  id: string
  avaliador_id: string
  pergunta_id: string
  valor_numerico: number | null
  valor_texto: string | null
  created_at: string
}

export interface ProcessoToken {
  id: string
  processo_id: string
  descricao: string | null
  expires_at: string | null
  ativo: boolean
  created_at: string
  token?: string
}

export interface QuestionarioToken {
  id: number
  questionario_id: string
  avaliador_nome: string
  avaliador_email: string | null
  descricao: string | null
  respondido: boolean
  respondido_at: string | null
  expires_at: string | null
  ativo: boolean
  created_at: string
  token?: string
}
