import { create } from 'zustand'
import { checklistsApi, itensApi } from '../api/checklists-endpoints'
import type { Checklist, ItemChecklist } from '../db/schema'

interface EstadoChecklists {
  checklists: Checklist[]
  itens: Record<string, ItemChecklist[]>       // checklistId → ItemChecklist[]
  itensHoje: ItemChecklist[]                   // todos os itens do usuário para "hoje"
  estaCarregando: boolean
  estaCarregandoItens: boolean
  erro: string | null
}

interface AcoesChecklists {
  // Checklists
  buscarChecklists: (proprietarioId: string) => Promise<void>
  criarChecklist: (dados: { titulo: string; descricao?: string; proprietarioId: string }) => Promise<Checklist>
  atualizarChecklist: (id: string, dados: Partial<Pick<Checklist, 'titulo' | 'descricao' | 'ativo'>>) => Promise<void>
  deletarChecklist: (id: string) => Promise<void>
  duplicarChecklist: (id: string) => Promise<Checklist>
  // Itens
  buscarItens: (checklistId: string) => Promise<void>
  buscarItensHoje: (proprietarioId: string) => Promise<void>
  criarItem: (dados: Omit<ItemChecklist, 'id' | 'criadoEm' | 'atualizadoEm'>) => Promise<ItemChecklist>
  atualizarItem: (id: string, checklistId: string, dados: Partial<Omit<ItemChecklist, 'id' | 'checklistId' | 'criadoEm'>>) => Promise<void>
  deletarItem: (id: string, checklistId: string) => Promise<void>
  // Utils
  limparErro: () => void
}

type StoreChecklists = EstadoChecklists & AcoesChecklists

const capturarErro = (erro: unknown): string => {
  if (erro instanceof Error) return erro.message
  return 'Ocorreu um erro inesperado. Tente novamente.'
}

const validarChecklist = (titulo: string): string | null => {
  if (!titulo.trim()) return 'O título é obrigatório.'
  if (titulo.trim().length < 3) return 'O título deve ter ao menos 3 caracteres.'
  if (titulo.trim().length > 100) return 'O título deve ter no máximo 100 caracteres.'
  return null
}

const validarItem = (titulo: string): string | null => {
  if (!titulo.trim()) return 'O título do item é obrigatório.'
  if (titulo.trim().length < 2) return 'O título do item deve ter ao menos 2 caracteres.'
  if (titulo.trim().length > 120) return 'O título do item deve ter no máximo 120 caracteres.'
  return null
}

const useChecklists = create<StoreChecklists>((set, _get) => ({
  checklists: [],
  itens: {},
  itensHoje: [],
  estaCarregando: false,
  estaCarregandoItens: false,
  erro: null,

  // ── Checklists ──────────────────────────────────────────────────────────────

  buscarChecklists: async (proprietarioId) => {
    set({ estaCarregando: true, erro: null })
    try {
      const dados = await checklistsApi.listar(proprietarioId)
      set({ checklists: dados, estaCarregando: false })
    } catch (erro) {
      set({ erro: capturarErro(erro), estaCarregando: false })
    }
  },

  criarChecklist: async (dados) => {
    const erroValidacao = validarChecklist(dados.titulo)
    if (erroValidacao) throw new Error(erroValidacao)

    set({ estaCarregando: true, erro: null })
    try {
      const novo = await checklistsApi.criar(dados)
      set((s) => ({ checklists: [novo, ...s.checklists], estaCarregando: false }))
      return novo
    } catch (erro) {
      set({ erro: capturarErro(erro), estaCarregando: false })
      throw erro
    }
  },

  atualizarChecklist: async (id, dados) => {
    if (dados.titulo !== undefined) {
      const erroValidacao = validarChecklist(dados.titulo)
      if (erroValidacao) throw new Error(erroValidacao)
    }

    set({ estaCarregando: true, erro: null })
    try {
      const atualizado = await checklistsApi.atualizar(id, dados)
      set((s) => ({
        checklists: s.checklists.map((c) => (c.id === id ? atualizado : c)),
        estaCarregando: false,
      }))
    } catch (erro) {
      set({ erro: capturarErro(erro), estaCarregando: false })
      throw erro
    }
  },

  deletarChecklist: async (id) => {
    set({ estaCarregando: true, erro: null })
    try {
      await checklistsApi.deletar(id)
      set((s) => {
        const novosItens = { ...s.itens }
        delete novosItens[id]
        return {
          checklists: s.checklists.filter((c) => c.id !== id),
          itens: novosItens,
          estaCarregando: false,
        }
      })
    } catch (erro) {
      set({ erro: capturarErro(erro), estaCarregando: false })
      throw erro
    }
  },

  duplicarChecklist: async (id) => {
    set({ estaCarregando: true, erro: null })
    try {
      const copia = await checklistsApi.duplicar(id)
      set((s) => ({ checklists: [...s.checklists, copia], estaCarregando: false }))
      return copia
    } catch (erro) {
      set({ erro: capturarErro(erro), estaCarregando: false })
      throw erro
    }
  },

  // ── Itens ────────────────────────────────────────────────────────────────────

  buscarItens: async (checklistId) => {
    set({ estaCarregandoItens: true, erro: null })
    try {
      const dados = await itensApi.listar(checklistId)
      set((s) => ({
        itens: { ...s.itens, [checklistId]: dados },
        estaCarregandoItens: false,
      }))
    } catch (erro) {
      set({ erro: capturarErro(erro), estaCarregandoItens: false })
    }
  },

  buscarItensHoje: async (proprietarioId) => {
    try {
      const todos = await itensApi.listarTodosDoUsuario(proprietarioId)
      set({ itensHoje: todos })
    } catch {
      // Silencioso — home não precisa travar por falha secundária
    }
  },

  criarItem: async (dados) => {
    const erroValidacao = validarItem(dados.titulo)
    if (erroValidacao) throw new Error(erroValidacao)

    set({ estaCarregandoItens: true, erro: null })
    try {
      const novo = await itensApi.criar(dados)
      set((s) => ({
        itens: {
          ...s.itens,
          [dados.checklistId]: [...(s.itens[dados.checklistId] ?? []), novo],
        },
        estaCarregandoItens: false,
      }))
      return novo
    } catch (erro) {
      set({ erro: capturarErro(erro), estaCarregandoItens: false })
      throw erro
    }
  },

  atualizarItem: async (id, checklistId, dados) => {
    if (dados.titulo !== undefined) {
      const erroValidacao = validarItem(dados.titulo)
      if (erroValidacao) throw new Error(erroValidacao)
    }

    set({ estaCarregandoItens: true, erro: null })
    try {
      const atualizado = await itensApi.atualizar(id, dados)
      set((s) => ({
        itens: {
          ...s.itens,
          [checklistId]: (s.itens[checklistId] ?? []).map((i) => (i.id === id ? atualizado : i)),
        },
        estaCarregandoItens: false,
      }))
    } catch (erro) {
      set({ erro: capturarErro(erro), estaCarregandoItens: false })
      throw erro
    }
  },

  deletarItem: async (id, checklistId) => {
    set({ estaCarregandoItens: true, erro: null })
    try {
      await itensApi.deletar(id)
      set((s) => ({
        itens: {
          ...s.itens,
          [checklistId]: (s.itens[checklistId] ?? []).filter((i) => i.id !== id),
        },
        estaCarregandoItens: false,
      }))
    } catch (erro) {
      set({ erro: capturarErro(erro), estaCarregandoItens: false })
      throw erro
    }
  },

  limparErro: () => set({ erro: null }),
}))

export default useChecklists
