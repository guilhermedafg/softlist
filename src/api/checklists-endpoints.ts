import type { Checklist, ItemChecklist } from '../db/schema'

const CHAVE_CHECKLISTS = 'softlist_checklists'
const CHAVE_ITENS = 'softlist_itens'

/** Helpers de persistência */
const db = {
  checklists(): Checklist[] {
    return JSON.parse(localStorage.getItem(CHAVE_CHECKLISTS) ?? '[]')
  },
  itens(): ItemChecklist[] {
    return JSON.parse(localStorage.getItem(CHAVE_ITENS) ?? '[]')
  },
  salvarChecklists(dados: Checklist[]) {
    localStorage.setItem(CHAVE_CHECKLISTS, JSON.stringify(dados))
  },
  salvarItens(dados: ItemChecklist[]) {
    localStorage.setItem(CHAVE_ITENS, JSON.stringify(dados))
  },
}

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms))

// ─── Checklists ─────────────────────────────────────────────────────────────

export const checklistsApi = {
  /** Lista todos os checklists do usuário */
  async listar(proprietarioId: string): Promise<Checklist[]> {
    await delay()
    return db.checklists().filter((c) => c.proprietarioId === proprietarioId)
  },

  /** Busca um checklist por ID */
  async buscarPorId(id: string): Promise<Checklist> {
    await delay(200)
    const encontrado = db.checklists().find((c) => c.id === id)
    if (!encontrado) throw new Error('Checklist não encontrado.')
    return encontrado
  },

  /** Cria novo checklist */
  async criar(dados: { titulo: string; descricao?: string; proprietarioId: string }): Promise<Checklist> {
    await delay()
    const novo: Checklist = {
      id: crypto.randomUUID(),
      titulo: dados.titulo.trim(),
      descricao: dados.descricao?.trim() || undefined,
      ativo: true,
      proprietarioId: dados.proprietarioId,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    }
    const todos = db.checklists()
    todos.push(novo)
    db.salvarChecklists(todos)
    return novo
  },

  /** Atualiza campos de um checklist */
  async atualizar(id: string, dados: Partial<Pick<Checklist, 'titulo' | 'descricao' | 'ativo'>>): Promise<Checklist> {
    await delay()
    const todos = db.checklists()
    const idx = todos.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error('Checklist não encontrado.')
    todos[idx] = {
      ...todos[idx],
      ...dados,
      titulo: dados.titulo?.trim() ?? todos[idx].titulo,
      atualizadoEm: new Date().toISOString(),
    }
    db.salvarChecklists(todos)
    return todos[idx]
  },

  /** Remove checklist e todos os seus itens */
  async deletar(id: string): Promise<void> {
    await delay()
    db.salvarChecklists(db.checklists().filter((c) => c.id !== id))
    db.salvarItens(db.itens().filter((i) => i.checklistId !== id))
  },

  /** Duplica um checklist e seus itens com novo ID */
  async duplicar(id: string): Promise<Checklist> {
    await delay(600)
    const original = db.checklists().find((c) => c.id === id)
    if (!original) throw new Error('Checklist não encontrado.')

    const novoId = crypto.randomUUID()
    const agora = new Date().toISOString()

    const copia: Checklist = {
      ...original,
      id: novoId,
      titulo: `${original.titulo} (cópia)`,
      criadoEm: agora,
      atualizadoEm: agora,
    }

    const itensOriginais = db.itens().filter((i) => i.checklistId === id)
    const itensCopia: ItemChecklist[] = itensOriginais.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
      checklistId: novoId,
      criadoEm: agora,
      atualizadoEm: agora,
    }))

    db.salvarChecklists([...db.checklists(), copia])
    db.salvarItens([...db.itens(), ...itensCopia])
    return copia
  },
}

// ─── Itens ───────────────────────────────────────────────────────────────────

export const itensApi = {
  /** Lista itens de um checklist */
  async listar(checklistId: string): Promise<ItemChecklist[]> {
    await delay(200)
    return db.itens()
      .filter((i) => i.checklistId === checklistId)
      .sort((a, b) => a.ordem - b.ordem)
  },

  /** Lista todos os itens de todos os checklists de um usuário (para "Itens de Hoje") */
  async listarTodosDoUsuario(proprietarioId: string): Promise<ItemChecklist[]> {
    await delay(200)
    const checklistsDoUsuario = db.checklists()
      .filter((c) => c.proprietarioId === proprietarioId && c.ativo)
      .map((c) => c.id)
    return db.itens().filter((i) => checklistsDoUsuario.includes(i.checklistId))
  },

  /** Adiciona item a um checklist */
  async criar(
    dados: Omit<ItemChecklist, 'id' | 'criadoEm' | 'atualizadoEm'>,
  ): Promise<ItemChecklist> {
    await delay()
    const itens = db.itens().filter((i) => i.checklistId === dados.checklistId)
    const proximaOrdem = itens.length > 0 ? Math.max(...itens.map((i) => i.ordem)) + 1 : 0

    const novo: ItemChecklist = {
      ...dados,
      id: crypto.randomUUID(),
      ordem: dados.ordem ?? proximaOrdem,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    }
    db.salvarItens([...db.itens(), novo])
    return novo
  },

  /** Atualiza um item */
  async atualizar(id: string, dados: Partial<Omit<ItemChecklist, 'id' | 'checklistId' | 'criadoEm'>>): Promise<ItemChecklist> {
    await delay()
    const todos = db.itens()
    const idx = todos.findIndex((i) => i.id === id)
    if (idx === -1) throw new Error('Item não encontrado.')
    todos[idx] = { ...todos[idx], ...dados, atualizadoEm: new Date().toISOString() }
    db.salvarItens(todos)
    return todos[idx]
  },

  /** Remove um item */
  async deletar(id: string): Promise<void> {
    await delay()
    db.salvarItens(db.itens().filter((i) => i.id !== id))
  },

  /** Reordena itens de um checklist */
  async reordenar(checklistId: string, idsOrdenados: string[]): Promise<void> {
    await delay(200)
    const todos = db.itens()
    idsOrdenados.forEach((id, idx) => {
      const item = todos.find((i) => i.id === id && i.checklistId === checklistId)
      if (item) {
        item.ordem = idx
        item.atualizadoEm = new Date().toISOString()
      }
    })
    db.salvarItens(todos)
  },
}
