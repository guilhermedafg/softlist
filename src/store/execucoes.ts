import { create } from 'zustand'
import { execucoesApi } from '../api/execucoes-endpoints'
import type { ExecucaoLocal, RespostaItemLocal } from '../api/execucoes-endpoints'
import { storage } from '../db/storage'
import type { FotoLocal } from '../hooks/usePhotoUpload'
import type { StatusItem } from '../db/schema'

// ─── Debounce ─────────────────────────────────────────────────────────────────

type TimerMap = Map<string, ReturnType<typeof setTimeout>>
const timersNota: TimerMap = new Map()

const debounceNota = (chave: string, fn: () => void, ms = 800) => {
  const anterior = timersNota.get(chave)
  if (anterior) clearTimeout(anterior)
  timersNota.set(chave, setTimeout(() => { fn(); timersNota.delete(chave) }, ms))
}

// ─── Tipos da store ───────────────────────────────────────────────────────────

interface EstadoExecucoes {
  execucaoAtiva: ExecucaoLocal | null
  /** Fotos em memória, segregadas por itemId — carregadas do IndexedDB */
  fotosPorItem: Record<string, FotoLocal[]>
  historico: ExecucaoLocal[]
  estaCarregando: boolean
  erro: string | null
}

interface AcoesExecucoes {
  iniciarOuRetomar: (checklistId: string, executorId: string) => Promise<ExecucaoLocal>
  marcarStatus: (itemId: string, novoStatus: StatusItem) => Promise<void>
  atualizarNota: (itemId: string, nota: string) => void
  /** Comprime + salva no IndexedDB + atualiza store */
  adicionarFoto: (itemId: string, foto: FotoLocal) => Promise<void>
  removerFoto: (itemId: string, fotoId: string) => Promise<void>
  /** Carrega fotos do IndexedDB para a execução ativa */
  carregarFotos: (execucaoId: string) => Promise<void>
  finalizar: () => Promise<void>
  cancelar: () => Promise<void>
  buscarHistorico: (checklistId: string) => Promise<void>
  limparAtiva: () => void
  limparErro: () => void
}

type StoreExecucoes = EstadoExecucoes & AcoesExecucoes

// ─── Helper: enfileira sync ───────────────────────────────────────────────────

async function enfileirarSync(execucaoId: string) {
  try {
    await storage.adicionarNaFila(execucaoId)
  } catch {
    // Silencioso — IndexedDB pode não estar disponível em todos os contextos
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

const useExecucoes = create<StoreExecucoes>((set, get) => ({
  execucaoAtiva: null,
  fotosPorItem: {},
  historico: [],
  estaCarregando: false,
  erro: null,

  iniciarOuRetomar: async (checklistId, executorId) => {
    set({ estaCarregando: true, erro: null, fotosPorItem: {} })
    try {
      let execucao = await execucoesApi.buscarAtiva(checklistId, executorId)
      if (!execucao) {
        execucao = await execucoesApi.iniciar(checklistId, executorId)
      }
      set({ execucaoAtiva: execucao, estaCarregando: false })
      // Carrega fotos do IndexedDB em background
      get().carregarFotos(execucao.id)
      return execucao
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao iniciar execução.'
      set({ erro: mensagem, estaCarregando: false })
      throw erro
    }
  },

  carregarFotos: async (execucaoId) => {
    try {
      const todasFotos = await storage.buscarFotosPorExecucao(execucaoId)
      const porItem: Record<string, FotoLocal[]> = {}
      for (const fotoArm of todasFotos) {
        if (!porItem[fotoArm.itemId]) porItem[fotoArm.itemId] = []
        porItem[fotoArm.itemId].push({
          id: fotoArm.id,
          dataUrl: fotoArm.dataUrl,
          tamanhoBytes: fotoArm.tamanhoBytes,
          capturadaEm: fotoArm.capturadaEm,
        })
      }
      set({ fotosPorItem: porItem })
    } catch {
      // IndexedDB indisponível — continua sem fotos
    }
  },

  marcarStatus: async (itemId, novoStatus) => {
    const { execucaoAtiva } = get()
    if (!execucaoAtiva) return

    const respostaAtual = execucaoAtiva.respostas[itemId]
    const observacaoAtual = respostaAtual?.observacao ?? ''
    const fotosIdsAtual = respostaAtual?.fotosIds ?? []

    // Optimistic update
    set((s) => ({
      execucaoAtiva: s.execucaoAtiva
        ? {
            ...s.execucaoAtiva,
            respostas: {
              ...s.execucaoAtiva.respostas,
              [itemId]: {
                status: novoStatus,
                observacao: observacaoAtual,
                fotosIds: fotosIdsAtual,
                atualizadoEm: new Date().toISOString(),
              },
            },
          }
        : null,
    }))

    try {
      const atualizada = await execucoesApi.salvarResposta(
        execucaoAtiva.id,
        itemId,
        novoStatus,
        observacaoAtual,
        fotosIdsAtual,
      )
      set({ execucaoAtiva: atualizada })
      enfileirarSync(execucaoAtiva.id)
    } catch {
      // Reverte
      set((s) => ({
        execucaoAtiva: s.execucaoAtiva
          ? {
              ...s.execucaoAtiva,
              respostas: {
                ...s.execucaoAtiva.respostas,
                [itemId]: respostaAtual ?? {
                  status: 'pendente',
                  observacao: '',
                  fotosIds: [],
                  atualizadoEm: '',
                },
              },
            }
          : null,
        erro: 'Erro ao salvar. Tente novamente.',
      }))
    }
  },

  atualizarNota: (itemId, nota) => {
    const { execucaoAtiva } = get()
    if (!execucaoAtiva) return

    const respostaAtual = execucaoAtiva.respostas[itemId]
    const statusAtual: StatusItem = respostaAtual?.status ?? 'pendente'
    const fotosIdsAtual: string[] = respostaAtual?.fotosIds ?? []

    // UI imediata
    set((s) => ({
      execucaoAtiva: s.execucaoAtiva
        ? {
            ...s.execucaoAtiva,
            respostas: {
              ...s.execucaoAtiva.respostas,
              [itemId]: {
                status: statusAtual,
                observacao: nota,
                fotosIds: fotosIdsAtual,
                atualizadoEm: new Date().toISOString(),
              } satisfies RespostaItemLocal,
            },
          }
        : null,
    }))

    const chaveDebounce = `${execucaoAtiva.id}:${itemId}:nota`
    debounceNota(chaveDebounce, async () => {
      const { execucaoAtiva: atual } = get()
      if (!atual) return
      await execucoesApi
        .salvarResposta(atual.id, itemId, statusAtual, nota, fotosIdsAtual)
        .catch(() => undefined)
      enfileirarSync(atual.id)
    })
  },

  adicionarFoto: async (itemId, foto) => {
    const { execucaoAtiva } = get()
    if (!execucaoAtiva) return

    // Salva no IndexedDB
    try {
      await storage.salvarFoto({
        id: foto.id,
        execucaoId: execucaoAtiva.id,
        itemId,
        dataUrl: foto.dataUrl,
        tamanhoBytes: foto.tamanhoBytes,
        capturadaEm: foto.capturadaEm,
      })
    } catch {
      set({ erro: 'Não foi possível salvar a foto localmente.' })
      return
    }

    // Atualiza fotosPorItem na memória
    set((s) => ({
      fotosPorItem: {
        ...s.fotosPorItem,
        [itemId]: [...(s.fotosPorItem[itemId] ?? []), foto],
      },
    }))

    // Atualiza fotosIds na execução (localStorage)
    const respostaAtual = execucaoAtiva.respostas[itemId]
    const fotosIdsAtualizados = [...(respostaAtual?.fotosIds ?? []), foto.id]
    try {
      const atualizada = await execucoesApi.atualizarFotosIds(
        execucaoAtiva.id,
        itemId,
        fotosIdsAtualizados,
      )
      set({ execucaoAtiva: atualizada })
      enfileirarSync(execucaoAtiva.id)
    } catch {
      set({ erro: 'Erro ao registrar foto. Tente novamente.' })
    }
  },

  removerFoto: async (itemId, fotoId) => {
    const { execucaoAtiva } = get()
    if (!execucaoAtiva) return

    // Remove do IndexedDB
    try {
      await storage.removerFoto(fotoId)
    } catch {
      // Continua mesmo se falhar no IndexedDB
    }

    // Remove da memória
    set((s) => ({
      fotosPorItem: {
        ...s.fotosPorItem,
        [itemId]: (s.fotosPorItem[itemId] ?? []).filter((f) => f.id !== fotoId),
      },
    }))

    // Atualiza fotosIds na execução
    const respostaAtual = execucaoAtiva.respostas[itemId]
    const fotosIdsAtualizados = (respostaAtual?.fotosIds ?? []).filter((id) => id !== fotoId)
    try {
      const atualizada = await execucoesApi.atualizarFotosIds(
        execucaoAtiva.id,
        itemId,
        fotosIdsAtualizados,
      )
      set({ execucaoAtiva: atualizada })
      enfileirarSync(execucaoAtiva.id)
    } catch {
      set({ erro: 'Erro ao remover foto.' })
    }
  },

  finalizar: async () => {
    const { execucaoAtiva } = get()
    if (!execucaoAtiva) return

    set({ estaCarregando: true })
    try {
      const finalizada = await execucoesApi.finalizar(execucaoAtiva.id)
      set({ execucaoAtiva: finalizada, estaCarregando: false })
      enfileirarSync(execucaoAtiva.id)
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao finalizar.'
      set({ erro: mensagem, estaCarregando: false })
    }
  },

  cancelar: async () => {
    const { execucaoAtiva } = get()
    if (!execucaoAtiva) return
    try {
      await execucoesApi.cancelar(execucaoAtiva.id)
    } finally {
      set({ execucaoAtiva: null, fotosPorItem: {} })
    }
  },

  buscarHistorico: async (checklistId) => {
    try {
      const historico = await execucoesApi.listarPorChecklist(checklistId)
      set({ historico })
    } catch {
      // Silencioso
    }
  },

  limparAtiva: () => set({ execucaoAtiva: null, fotosPorItem: {} }),
  limparErro: () => set({ erro: null }),
}))

export default useExecucoes
