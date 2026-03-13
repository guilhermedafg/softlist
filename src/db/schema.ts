/**
 * Esquema de tipos do SoftList.
 * Define todas as entidades do sistema.
 */

/** Tipo de recorrência para execução de checklists */
export type TipoRecorrencia =
  | 'nenhuma'
  | 'diaria'
  | 'semanal'
  | 'mensal'
  | 'anual'
  | 'dias_uteis'

/** Status possíveis de um item */
export type StatusItem = 'pendente' | 'concluido' | 'nao_aplicavel'

/** Status possíveis de uma execução */
export type StatusExecucao = 'em_andamento' | 'concluida' | 'cancelada'

/**
 * Usuário do sistema.
 * Representa quem acessa e gerencia checklists.
 */
export interface Usuario {
  id: string
  nome: string
  email: string
  avatarUrl?: string
  criadoEm: string
  atualizadoEm: string
}

/**
 * Checklist — conjunto de itens a serem verificados.
 * Pode ter recorrência e pertence a um usuário.
 */
export interface Checklist {
  id: string
  titulo: string
  descricao?: string
  recorrencia: TipoRecorrencia
  ativo: boolean
  proprietarioId: string
  criadoEm: string
  atualizadoEm: string
  totalItens?: number
}

/**
 * Item individual dentro de um checklist.
 * Pode ter instrução detalhada e ser requerido.
 */
export interface ItemChecklist {
  id: string
  checklistId: string
  titulo: string
  descricao?: string
  requerEvidencia: boolean
  obrigatorio: boolean
  ordem: number
  criadoEm: string
  atualizadoEm: string
}

/**
 * Execução de um checklist — instância de uma rodada de verificação.
 */
export interface Execucao {
  id: string
  checklistId: string
  executorId: string
  status: StatusExecucao
  observacoes?: string
  iniciadaEm: string
  finalizadaEm?: string
  criadoEm: string
}

/**
 * Resposta a um item em uma execução específica.
 */
export interface RespostaItem {
  id: string
  execucaoId: string
  itemId: string
  status: StatusItem
  observacao?: string
  criadoEm: string
  atualizadoEm: string
}

/**
 * Evidência fotográfica ou arquivo anexado a uma resposta.
 */
export interface Evidencia {
  id: string
  respostaItemId: string
  url: string
  tipo: 'imagem' | 'pdf' | 'outro'
  nomeArquivo: string
  tamanhoBytes: number
  criadoEm: string
}

/** Resposta genérica paginada da API */
export interface RespostaPaginada<T> {
  dados: T[]
  pagina: number
  itensPorPagina: number
  totalItens: number
  totalPaginas: number
}

/** Resposta genérica da API */
export interface RespostaApi<T> {
  sucesso: boolean
  dados: T
  mensagem?: string
}
