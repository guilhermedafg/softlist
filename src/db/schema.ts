/**
 * Esquema de tipos do SoftList.
 * Define todas as entidades do sistema.
 */

/** Dia da semana para agendamento de itens */
export type DiaSemana = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom' | 'todos'

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
  ativo: boolean
  proprietarioId: string
  criadoEm: string
  atualizadoEm: string
}

/**
 * Item individual dentro de um checklist.
 * Contém agendamento (diasSemana + horario) e recorrência própria.
 */
export interface ItemChecklist {
  id: string
  checklistId: string
  titulo: string
  descricao?: string
  /** Dias da semana em que este item aparece. 'todos' = todos os dias */
  diasSemana: DiaSemana[]
  /** Horário no formato HH:MM (ex: "08:00") */
  horario: string
  recorrencia: TipoRecorrencia
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

/** Mapeamento do índice JS (getDay()) para DiaSemana */
export const MAPA_DIA_SEMANA: Record<number, DiaSemana> = {
  0: 'dom',
  1: 'seg',
  2: 'ter',
  3: 'qua',
  4: 'qui',
  5: 'sex',
  6: 'sab',
}

/** Labels em português para exibição */
export const LABEL_DIA: Record<DiaSemana, string> = {
  seg: 'Seg',
  ter: 'Ter',
  qua: 'Qua',
  qui: 'Qui',
  sex: 'Sex',
  sab: 'Sáb',
  dom: 'Dom',
  todos: 'Todos',
}

export const LABEL_RECORRENCIA: Record<TipoRecorrencia, string> = {
  nenhuma: 'Sem recorrência',
  diaria: 'Diária',
  semanal: 'Semanal',
  mensal: 'Mensal',
  anual: 'Anual',
  dias_uteis: 'Dias úteis',
}

/** Retorna o DiaSemana correspondente a hoje */
export const diaHoje = (): DiaSemana => MAPA_DIA_SEMANA[new Date().getDay()]

/** Verifica se um item está agendado para hoje */
export const itemEhHoje = (item: ItemChecklist): boolean => {
  if (item.diasSemana.includes('todos')) return true
  return item.diasSemana.includes(diaHoje())
}
