import type { StatusItem, StatusExecucao } from '../db/schema'

const CHAVE_EXECUCOES = 'softlist_execucoes'

// ─── Tipos locais ────────────────────────────────────────────────────────────

export interface RespostaItemLocal {
  status: StatusItem
  observacao: string
  atualizadoEm: string
}

export interface ExecucaoLocal {
  id: string
  checklistId: string
  executorId: string
  status: StatusExecucao
  /** itemId → resposta */
  respostas: Record<string, RespostaItemLocal>
  iniciadaEm: string
  finalizadaEm?: string
  atualizadoEm: string
}

// ─── Persistência ─────────────────────────────────────────────────────────────

const db = {
  todas(): ExecucaoLocal[] {
    try {
      return JSON.parse(localStorage.getItem(CHAVE_EXECUCOES) ?? '[]')
    } catch {
      return []
    }
  },
  salvar(execucoes: ExecucaoLocal[]) {
    localStorage.setItem(CHAVE_EXECUCOES, JSON.stringify(execucoes))
  },
}

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms))

// ─── API ─────────────────────────────────────────────────────────────────────

export const execucoesApi = {
  /** Busca execução ativa (em_andamento) para um checklist + usuário */
  async buscarAtiva(checklistId: string, executorId: string): Promise<ExecucaoLocal | null> {
    await delay()
    return (
      db.todas().find(
        (e) =>
          e.checklistId === checklistId &&
          e.executorId === executorId &&
          e.status === 'em_andamento',
      ) ?? null
    )
  },

  /** Lista todas as execuções de um checklist (histórico) */
  async listarPorChecklist(checklistId: string): Promise<ExecucaoLocal[]> {
    await delay()
    return db
      .todas()
      .filter((e) => e.checklistId === checklistId)
      .sort((a, b) => b.iniciadaEm.localeCompare(a.iniciadaEm))
  },

  /** Inicia nova execução */
  async iniciar(checklistId: string, executorId: string): Promise<ExecucaoLocal> {
    await delay()
    const nova: ExecucaoLocal = {
      id: crypto.randomUUID(),
      checklistId,
      executorId,
      status: 'em_andamento',
      respostas: {},
      iniciadaEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    }
    db.salvar([...db.todas(), nova])
    return nova
  },

  /** Salva resposta de um item (cria ou atualiza) */
  async salvarResposta(
    execucaoId: string,
    itemId: string,
    status: StatusItem,
    observacao: string,
  ): Promise<ExecucaoLocal> {
    const todas = db.todas()
    const idx = todas.findIndex((e) => e.id === execucaoId)
    if (idx === -1) throw new Error('Execução não encontrada.')

    const agora = new Date().toISOString()
    todas[idx] = {
      ...todas[idx],
      respostas: {
        ...todas[idx].respostas,
        [itemId]: { status, observacao, atualizadoEm: agora },
      },
      atualizadoEm: agora,
    }
    db.salvar(todas)
    return todas[idx]
  },

  /** Finaliza a execução */
  async finalizar(execucaoId: string): Promise<ExecucaoLocal> {
    const todas = db.todas()
    const idx = todas.findIndex((e) => e.id === execucaoId)
    if (idx === -1) throw new Error('Execução não encontrada.')

    const agora = new Date().toISOString()
    todas[idx] = {
      ...todas[idx],
      status: 'concluida',
      finalizadaEm: agora,
      atualizadoEm: agora,
    }
    db.salvar(todas)
    return todas[idx]
  },

  /** Cancela a execução */
  async cancelar(execucaoId: string): Promise<void> {
    const todas = db.todas()
    const idx = todas.findIndex((e) => e.id === execucaoId)
    if (idx === -1) return
    const agora = new Date().toISOString()
    todas[idx] = { ...todas[idx], status: 'cancelada', atualizadoEm: agora }
    db.salvar(todas)
  },
}
